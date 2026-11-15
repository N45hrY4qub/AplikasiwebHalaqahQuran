/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemSnapshotData } from '../types';
import { generateSnapshotFilename } from './backupRestoreManager';

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  parents?: string[];
  modifiedTime?: string;
}

export interface GoogleDriveBackupTargetFolder {
  id: string; // 'root' or Google Drive folder ID
  name: string; // Name of folder, e.g. "Cadangan M-Halaqah" or "Drive Saya (Root)"
  fullPath?: string; // e.g. "Drive Saya > Arsip > Cadangan M-Halaqah"
}

const LOCAL_STORAGE_DEFAULT_FOLDER_KEY = 'mh_gdrive_default_backup_folder';

/**
 * Get previously saved default Google Drive backup folder
 */
export function getDefaultDriveBackupFolder(): GoogleDriveBackupTargetFolder | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DEFAULT_FOLDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading default Google Drive backup folder:', e);
  }
  return null;
}

/**
 * Save default Google Drive backup folder
 */
export function setDefaultDriveBackupFolder(folder: GoogleDriveBackupTargetFolder | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (folder) {
      localStorage.setItem(LOCAL_STORAGE_DEFAULT_FOLDER_KEY, JSON.stringify(folder));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_DEFAULT_FOLDER_KEY);
    }
  } catch (e) {
    console.error('Error saving default Google Drive backup folder:', e);
  }
}

/**
 * List accessible folders in user's Google Drive.
 * If parentFolderId is provided:
 * - 'root': only folders in the root of My Drive
 * - folderId: only folders inside that specific folder
 * - undefined or 'all': all folders in Drive
 */
export async function listGoogleDriveFolders(
  token: string, 
  parentFolderId?: string
): Promise<GoogleDriveFolder[]> {
  try {
    let q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    if (parentFolderId) {
      if (parentFolderId === 'root') {
        q = `'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      } else if (parentFolderId !== 'all') {
        q = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      }
    }
    const query = encodeURIComponent(q);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,parents,modifiedTime)&orderBy=name asc&pageSize=100`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil daftar folder dari Google Drive.');
    }

    const data = await response.json();
    return data.files || [];
  } catch (err: any) {
    console.error('Error listing Google Drive folders:', err);
    return [];
  }
}

/**
 * Creates a new folder in Google Drive inside an optional parent folder
 */
export async function createGoogleDriveFolder(
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ success: boolean; folder?: GoogleDriveFolder; error?: string }> {
  try {
    const trimmedName = folderName.trim();
    if (!trimmedName) {
      throw new Error('Nama folder tidak boleh kosong.');
    }

    const bodyObj: any = {
      name: trimmedName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder Penyimpanan Cadangan Otomatis M-Halaqah'
    };

    if (parentFolderId && parentFolderId !== 'root') {
      bodyObj.parents = [parentFolderId];
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyObj)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal membuat folder di Google Drive.');
    }

    const data = await response.json();
    return {
      success: true,
      folder: {
        id: data.id,
        name: data.name,
        parents: data.parents,
        modifiedTime: data.modifiedTime
      }
    };
  } catch (err: any) {
    console.error('Error creating folder in Google Drive:', err);
    return { success: false, error: err.message || 'Gagal membuat folder baru.' };
  }
}

/**
 * Uploads a master system snapshot to user's Google Drive, optionally in a specified folder
 */
export async function uploadSnapshotToGoogleDrive(
  snapshot: SystemSnapshotData,
  token: string,
  targetFolderId?: string,
  targetFolderName?: string
): Promise<{ success: boolean; filename: string; fileId?: string; folderName?: string; error?: string }> {
  try {
    const filename = generateSnapshotFilename(snapshot.metadata.version);
    const jsonStr = JSON.stringify(snapshot, null, 2);

    const boundary = 'tahfidz_disaster_recovery_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata: any = {
      name: filename,
      mimeType: 'application/json',
      description: `Disaster Recovery Snapshot Tahfidz Quran ${snapshot.metadata.version} - Pembuat: ${snapshot.metadata.exportedBy}`
    };

    if (targetFolderId && targetFolderId !== 'root') {
      metadata.parents = [targetFolderId];
    }

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonStr +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal mengunggah berkas ke Google Drive.');
    }

    const data = await response.json();
    return { 
      success: true, 
      filename, 
      fileId: data.id, 
      folderName: targetFolderName || (targetFolderId === 'root' ? 'Drive Saya (Root)' : undefined) 
    };
  } catch (err: any) {
    console.error('Error uploading snapshot to Google Drive:', err);
    return { success: false, filename: '', error: err.message || 'Kesalahan koneksi Google Drive.' };
  }
}

/**
 * Lists Tahfidz system backup files available in Google Drive
 */
export async function listGoogleDriveBackups(token: string): Promise<GoogleDriveBackupFile[]> {
  try {
    const query = encodeURIComponent("(name contains 'Backup_Tahfidz' or name contains 'halaqah_backup') and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,createdTime,modifiedTime,webViewLink,parents)&orderBy=createdTime desc&pageSize=50`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil daftar cadangan dari Google Drive.');
    }

    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing Google Drive backups:', err);
    return [];
  }
}

/**
 * Downloads the raw JSON content of a backup file from Google Drive
 */
export async function fetchGoogleDriveBackupContent(fileId: string, token: string): Promise<string> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Gagal mengunduh isi file dari Google Drive.');
  }

  return await response.text();
}
