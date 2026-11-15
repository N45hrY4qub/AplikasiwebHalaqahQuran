import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocFromServer, 
  memoryLocalCache,
  setLogLevel 
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Silence non-critical Firestore internal transport warnings (such as 10s initial connection delay warning in sandbox)
try {
  setLogLevel('silent');
} catch {
  // Ignored if unsupported
}

export const isFirebaseConfigured = (): boolean => {
  const config = getActiveFirebaseConfig();
  return !!(
    config &&
    typeof config.apiKey === 'string' &&
    config.apiKey.trim().length > 10 &&
    typeof config.projectId === 'string' &&
    config.projectId.trim().length > 2 &&
    !config.apiKey.includes('YOUR_') &&
    !config.projectId.includes('YOUR_')
  );
};

export const parseFirebaseConfigInput = (input: string): any => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Try direct JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      const apiKey = parsed.apiKey || parsed.api_key;
      const projectId = parsed.projectId || parsed.project_id;
      if (apiKey && projectId) {
        return {
          apiKey: String(apiKey).trim(),
          projectId: String(projectId).trim(),
          authDomain: String(parsed.authDomain || parsed.auth_domain || `${projectId}.firebaseapp.com`).trim(),
          storageBucket: String(parsed.storageBucket || parsed.storage_bucket || `${projectId}.firebasestorage.app`).trim(),
          messagingSenderId: String(parsed.messagingSenderId || parsed.messaging_sender_id || '').trim(),
          appId: String(parsed.appId || parsed.app_id || '').trim(),
          measurementId: String(parsed.measurementId || parsed.measurement_id || '').trim(),
          firestoreDatabaseId: String(parsed.firestoreDatabaseId || '').trim()
        };
      }
    }
  } catch {}

  // 2. Try regex extraction from JavaScript code (e.g. const firebaseConfig = { ... })
  const apiKeyMatch = trimmed.match(/apiKey["']?\s*:\s*["']([^"']+)["']/i);
  const projectIdMatch = trimmed.match(/projectId["']?\s*:\s*["']([^"']+)["']/i);
  const authDomainMatch = trimmed.match(/authDomain["']?\s*:\s*["']([^"']+)["']/i);
  const appIdMatch = trimmed.match(/appId["']?\s*:\s*["']([^"']+)["']/i);
  const storageBucketMatch = trimmed.match(/storageBucket["']?\s*:\s*["']([^"']+)["']/i);
  const messagingSenderIdMatch = trimmed.match(/messagingSenderId["']?\s*:\s*["']([^"']+)["']/i);
  const measurementIdMatch = trimmed.match(/measurementId["']?\s*:\s*["']([^"']+)["']/i);

  if (apiKeyMatch && projectIdMatch) {
    const projId = projectIdMatch[1].trim();
    return {
      apiKey: apiKeyMatch[1].trim(),
      projectId: projId,
      authDomain: authDomainMatch ? authDomainMatch[1].trim() : `${projId}.firebaseapp.com`,
      storageBucket: storageBucketMatch ? storageBucketMatch[1].trim() : `${projId}.firebasestorage.app`,
      messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1].trim() : '',
      appId: appIdMatch ? appIdMatch[1].trim() : '',
      measurementId: measurementIdMatch ? measurementIdMatch[1].trim() : '',
      firestoreDatabaseId: ''
    };
  }

  return null;
};

const SAFE_FALLBACK_CONFIG = {
  projectId: 'demo-local-app',
  appId: '1:000000000000:web:0000000000000000000000',
  apiKey: 'AIzaSyFakeKeyForLocalOfflineOnlyDemo0000',
  authDomain: 'demo-local-app.firebaseapp.com'
};

export const getActiveFirebaseConfig = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('mh_custom_firebase_config');
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse custom firebase config:', e);
      }
    }
  }
  return defaultFirebaseConfig;
};

export const getFirebaseApp = () => {
  let config = getActiveFirebaseConfig();
  if (!isFirebaseConfigured()) {
    config = SAFE_FALLBACK_CONFIG;
  }
  const apps = getApps();
  
  if (apps.length > 0) {
    const app = apps[0];
    // Check if the current app needs to be recreated to reflect custom configs
    if (app.options.projectId !== config.projectId) {
      try {
        for (const existingApp of apps) {
          deleteApp(existingApp);
        }
      } catch (e) {
        console.error('Error resetting Firebase apps:', e);
      }
      return initializeApp(config);
    }
    return app;
  }
  
  return initializeApp(config);
};

let cachedDb: any = null;
let cachedConfigId = '';
const initializedKeys = new Set<string>();

export const clearCachedFirebaseDb = () => {
  cachedDb = null;
  cachedConfigId = '';
};

export const getFirebaseDb = () => {
  const app = getFirebaseApp();
  const config = getActiveFirebaseConfig();
  
  let dbId = config.firestoreDatabaseId;
  if (dbId && dbId.includes("ai-studio-monitoringhalaqa-")) {
    dbId = dbId.replace("ai-studio-monitoringhalaqa-", "ai-studio-");
  }
  const isCustom = typeof window !== 'undefined' && !!localStorage.getItem('mh_custom_firebase_config');
  const isFallback = typeof window !== 'undefined' && localStorage.getItem('mh_use_default_db_fallback') === 'true';

  if (isCustom || (isFallback && !defaultFirebaseConfig.firestoreDatabaseId)) {
    console.log("Custom firebase or auto-fallback detected. Connecting to (default) database.");
    dbId = undefined;
  }

  if (!dbId || dbId === '(default)' || (typeof dbId === 'string' && !dbId.trim())) {
    dbId = undefined;
  }

  const cacheKey = `${config.projectId}_${dbId || 'default'}`;

  if (cachedDb && cachedConfigId === cacheKey) {
    return cachedDb;
  }

  if (initializedKeys.has(cacheKey)) {
    try {
      if (dbId) {
        cachedDb = getFirestore(app, dbId);
      } else {
        cachedDb = getFirestore(app);
      }
      cachedConfigId = cacheKey;
      return cachedDb;
    } catch (e) {
      console.error('Failed to get already initialized Firestore instance:', e);
    }
  }

  // Initialize Firestore instance with forced long polling for robust connection in sandbox/iframe environments
  try {
    const settings = {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
      localCache: memoryLocalCache()
    };
    if (dbId) {
      cachedDb = initializeFirestore(app, settings, dbId);
    } else {
      cachedDb = initializeFirestore(app, settings);
    }
    initializedKeys.add(cacheKey);
    cachedConfigId = cacheKey;
  } catch (error) {
    // If already initialized or settings cannot be updated, fallback to existing getFirestore instance
    try {
      if (dbId) {
        cachedDb = getFirestore(app, dbId);
      } else {
        cachedDb = getFirestore(app);
      }
      initializedKeys.add(cacheKey);
      cachedConfigId = cacheKey;
    } catch (e2) {
      console.error('Failed to get Firestore instance:', e2);
    }
  }

  return cachedDb;
};

// Save a database JSON string to Firestore and return an 8-character short key
export const saveSharedState = async (dataJson: string): Promise<string> => {
  try {
    const db = getFirebaseDb();
    // Compress data using gzip CompressionStream to fit comfortably in Firestore's 1MB limit
    let finalData = dataJson;
    let isCompressed = false;

    if (typeof window !== 'undefined' && 'CompressionStream' in window) {
      try {
        const stream = new Response(dataJson).body?.pipeThrough(new (window as any).CompressionStream("gzip"));
        if (stream) {
          const blob = await new Response(stream).blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          finalData = base64;
          isCompressed = true;
        }
      } catch (e) {
        console.warn('Gagal melakukan kompresi data, menggunakan data mentah...', e);
      }
    }

    // Create a random 8-character string for key
    const shareId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const shareDocRef = doc(collection(db, 'shared_states'), shareId);
    
    const CHUNK_SIZE = 600000; // 600KB chunks
    if (finalData.length > CHUNK_SIZE) {
      const chunks: string[] = [];
      for (let i = 0; i < finalData.length; i += CHUNK_SIZE) {
        chunks.push(finalData.substring(i, i + CHUNK_SIZE));
      }

      // Save metadata doc
      await setDoc(shareDocRef, {
        isChunked: true,
        chunkCount: chunks.length,
        isCompressed,
        createdAt: new Date().toISOString(),
      });

      // Save each chunk in a subcollection
      for (let index = 0; index < chunks.length; index++) {
        const chunkDocRef = doc(db, 'shared_states', shareId, 'chunks', `chunk_${index}`);
        await setDoc(chunkDocRef, {
          chunk: chunks[index]
        });
      }
    } else {
      // Normal single doc
      await setDoc(shareDocRef, {
        isChunked: false,
        dataJson: finalData,
        isCompressed,
        createdAt: new Date().toISOString(),
      });
    }
    
    return shareId;
  } catch (error) {
    console.error('Gagal menyimpan database ke Firestore:', error);
    throw error;
  }
};

// Retrieve a database JSON string from Firestore by its short key
export const getSharedState = async (shareId: string): Promise<string | null> => {
  try {
    const db = getFirebaseDb();
    const shareDocRef = doc(collection(db, 'shared_states'), shareId);
    const snap = await getDoc(shareDocRef);
    if (snap.exists()) {
      const docData = snap.data();
      let rawData = '';

      if (docData.isChunked) {
        const chunkCount = docData.chunkCount || 0;
        const chunks: string[] = [];
        for (let i = 0; i < chunkCount; i++) {
          const chunkDocRef = doc(db, 'shared_states', shareId, 'chunks', `chunk_${i}`);
          const chunkSnap = await getDoc(chunkDocRef);
          if (chunkSnap.exists()) {
            chunks.push(chunkSnap.data().chunk || '');
          } else {
            console.error(`Chunk data ke-${i} tidak ditemukan.`);
            return null;
          }
        }
        rawData = chunks.join('');
      } else {
        rawData = docData.dataJson || null;
      }

      if (!rawData) return null;

      if (docData.isCompressed) {
        try {
          const binaryString = atob(rawData);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const stream = new Response(bytes).body?.pipeThrough(new (window as any).DecompressionStream("gzip"));
          if (stream) {
            const blob = await new Response(stream).blob();
            return await blob.text();
          }
        } catch (e) {
          console.error('Gagal mendekompresi data bimbingan:', e);
          return null;
        }
      }
      return rawData;
    }
    return null;
  } catch (error) {
    console.error('Gagal memuat database dari Firestore:', error);
    throw error;
  }
};

// Validate Connection to Firestore on boot-up or module initialization as per guidelines
export const testFirestoreConnection = async () => {
  if (!isFirebaseConfigured()) {
    console.log("Firestore validation skipped: Firebase is running in local offline demo mode.");
    return;
  }
  try {
    const db = getFirebaseDb();
    await getDocFromServer(doc(db, 'test_connection_ping', 'ping_doc'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('Could not reach Cloud Firestore backend') || error.message.includes('unavailable'))) {
      console.warn("Firestore status: Client is operating in offline-cached mode or Cloud Firestore is currently unreachable.");
    } else {
      console.warn("Firestore connection validation check returned status:", error);
    }
  }
};

// Check connection asynchronously so as not to block app loading
// testFirestoreConnection();
