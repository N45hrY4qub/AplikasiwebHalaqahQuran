/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb, saveSharedState, getSharedState } from '../lib/firebaseShare';
import { SystemSnapshotData } from '../types';
import { 
  parseAndValidateSnapshot, 
  downloadSnapshotFile,
  CloudVaultSnapshotItem, 
  getLocalCloudCatalog, 
  saveLocalCloudCatalog,
  getAutoBackupConfig,
  saveAutoBackupConfig
} from './backupRestoreManager';

const CATALOG_DOC_PATH = 'cloud_vault_catalog';

/**
 * Saves a system snapshot into the Cloud Vault (Firestore compressed storage + catalog index)
 */
export async function saveSnapshotToCloudVault(
  snapshot: SystemSnapshotData, 
  notes?: string
): Promise<{ success: boolean; item?: CloudVaultSnapshotItem; error?: string }> {
  try {
    const rawJson = JSON.stringify(snapshot);
    const shareId = await saveSharedState(rawJson);

    const vaultItem: CloudVaultSnapshotItem = {
      id: shareId,
      dataDocId: shareId,
      version: snapshot.metadata.version,
      revision: snapshot.metadata.revision,
      timestamp: snapshot.metadata.timestamp || new Date().toISOString(),
      exportedBy: snapshot.metadata.exportedBy || 'Administrator Utama',
      notes: notes || snapshot.metadata.notes || 'Pencadangan Cloud Manual',
      totalRecords: snapshot.metadata.totalRecords,
      stats: snapshot.metadata.stats,
      compressedSize: rawJson.length,
      checksum: snapshot.metadata.checksum
    };

    // Update catalog in Firestore and localStorage
    let currentCatalog = await fetchCloudVaultCatalog();
    // Filter out if exists already
    currentCatalog = currentCatalog.filter(c => c.id !== shareId);
    // Keep max 15 snapshots
    const updatedCatalog = [vaultItem, ...currentCatalog].slice(0, 15);

    try {
      const db = getFirebaseDb();
      const catalogRef = doc(db, 'appSettings', CATALOG_DOC_PATH);
      await setDoc(catalogRef, {
        items: updatedCatalog,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Gagal menyimpan katalog cloud ke Firestore, menyimpan ke cache lokal:', e);
    }

    saveLocalCloudCatalog(updatedCatalog);

    // Update last auto backup timestamp
    const autoCfg = getAutoBackupConfig();
    autoCfg.lastBackupAt = new Date().toISOString();
    saveAutoBackupConfig(autoCfg);

    return { success: true, item: vaultItem };
  } catch (err: any) {
    console.error('Gagal mencadangkan snapshot ke Cloud Vault:', err);
    return { success: false, error: err?.message || 'Terjadi kesalahan saat menyimpan ke Cloud Firestore.' };
  }
}

/**
 * Retrieves the catalog of snapshots stored in Cloud Vault
 */
export async function fetchCloudVaultCatalog(): Promise<CloudVaultSnapshotItem[]> {
  try {
    const db = getFirebaseDb();
    const catalogRef = doc(db, 'appSettings', CATALOG_DOC_PATH);
    const snap = await getDoc(catalogRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items)) {
        saveLocalCloudCatalog(data.items);
        return data.items;
      }
    }
  } catch (e) {
    console.warn('Gagal mengambil katalog Cloud Vault dari server:', e);
  }

  // Fallback to local cache
  return getLocalCloudCatalog();
}

/**
 * Removes a snapshot from the Cloud Vault catalog
 */
export async function deleteSnapshotFromCloudVault(shareId: string): Promise<boolean> {
  try {
    let currentCatalog = await fetchCloudVaultCatalog();
    currentCatalog = currentCatalog.filter(item => item.id !== shareId);
    saveLocalCloudCatalog(currentCatalog);

    try {
      const db = getFirebaseDb();
      const catalogRef = doc(db, 'appSettings', CATALOG_DOC_PATH);
      await setDoc(catalogRef, {
        items: currentCatalog,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Gagal menghapus katalog di Firestore:', e);
    }
    return true;
  } catch (err) {
    console.error('Gagal menghapus snapshot dari Cloud Vault:', err);
    return false;
  }
}

/**
 * Downloads a snapshot from Cloud Vault directly to user's PC as .json file
 */
export async function downloadSnapshotFromCloudVault(shareId: string, versionString?: string): Promise<boolean> {
  try {
    const rawJson = await getSharedState(shareId);
    if (!rawJson) throw new Error('Data snapshot tidak ditemukan di cloud.');

    const parsed = parseAndValidateSnapshot(rawJson);
    if (!parsed.isValid) throw new Error(parsed.error || 'Data snapshot cloud tidak valid.');

    downloadSnapshotFile(parsed.data, `Backup_Tahfidz_${versionString || parsed.metadata?.version || 'Cloud'}_${Date.now()}.json`);
    return true;
  } catch (e) {
    console.error('Gagal mengunduh snapshot dari Cloud:', e);
    return false;
  }
}

/**
 * Checks whether an automated backup is due based on interval
 */
export function isAutoBackupDue(): boolean {
  const config = getAutoBackupConfig();
  if (!config.enabled) return false;
  if (!config.lastBackupAt) return true;

  const lastTime = new Date(config.lastBackupAt).getTime();
  const now = Date.now();
  const elapsedHours = (now - lastTime) / (1000 * 60 * 60);

  return elapsedHours >= config.intervalHours;
}
