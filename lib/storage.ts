'use client';

import { MemberRecord } from './types';

// IndexedDB database configuration
const DB_NAME = 'CppPartyMembersDB';
const DB_VERSION = 1;
const STORE_MEMBERS = 'members';
const STORE_PHOTOS = 'photos';

// Open IndexedDB safely
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MEMBERS)) {
          db.createObjectStore(STORE_MEMBERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
          db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Compress an image data URL or File to standard 3x4 ID size (e.g. 180x240)
 * keeping base64 under 20KB.
 */
export async function compressPhoto(source: string | File, targetWidth = 180, targetHeight = 240, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(typeof source === 'string' ? source : '');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        // Draw with cover aspect ratio
        const srcRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (srcRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (e) {
        console.warn('Canvas compression error:', e);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    img.onerror = () => resolve(typeof source === 'string' ? source : '');

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source);
    } else {
      img.src = source;
      if (img.complete) {
        handleLoad();
      } else {
        img.onload = handleLoad;
      }
    }
  });
}

// LocalStorage chunking constants
const CHUNK_SIZE = 40;
const STORAGE_PREFIX = 'cpp_members_chunk_';
const STORAGE_META_KEY = 'cpp_members_chunks_meta';
const STORAGE_KEY_LEGACY = 'cpp_member_records_v1';

/**
 * Save records safely using chunking + IndexedDB backup.
 * Never throws QuotaExceededError.
 */
export async function saveRecordsSafely(records: MemberRecord[]): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Save to IndexedDB (asynchronous, essentially unlimited capacity)
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction([STORE_MEMBERS], 'readwrite');
      const store = tx.objectStore(STORE_MEMBERS);
      store.clear();
      for (const record of records) {
        store.put(record);
      }
    }
  } catch (e) {
    console.warn('IndexedDB save skipped:', e);
  }

  // 2. Clear old legacy monolithic key to immediately free up to 5MB in localStorage
  try {
    localStorage.removeItem(STORAGE_KEY_LEGACY);
  } catch {
    // ignore
  }

  // 3. Save into chunks in localStorage
  try {
    const totalChunks = Math.ceil(records.length / CHUNK_SIZE);
    
    // Save each chunk
    for (let i = 0; i < totalChunks; i++) {
      const slice = records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkKey = `${STORAGE_PREFIX}${i}`;
      localStorage.setItem(chunkKey, JSON.stringify(slice));
    }

    // Remove any leftover old chunks if records shrank
    let oldIdx = totalChunks;
    while (localStorage.getItem(`${STORAGE_PREFIX}${oldIdx}`) !== null) {
      localStorage.removeItem(`${STORAGE_PREFIX}${oldIdx}`);
      oldIdx++;
    }

    // Save meta
    localStorage.setItem(
      STORAGE_META_KEY,
      JSON.stringify({
        totalRecords: records.length,
        totalChunks,
        updatedAt: Date.now(),
      })
    );
    return true;
  } catch (e) {
    console.warn('LocalStorage chunk save quota hit, saving lightweight records without photos in localStorage:', e);
    
    // Fallback: If localStorage is still full, store records without photoUrl in localStorage
    // (the full photos are safely in IndexedDB!)
    try {
      const lightweight = records.map(({ photoUrl, ...rest }) => ({
        ...rest,
        hasPhoto: Boolean(photoUrl),
      }));
      const totalChunks = Math.ceil(lightweight.length / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const slice = lightweight.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        localStorage.setItem(`${STORAGE_PREFIX}${i}`, JSON.stringify(slice));
      }
      localStorage.setItem(
        STORAGE_META_KEY,
        JSON.stringify({
          totalRecords: lightweight.length,
          totalChunks,
          lightweight: true,
          updatedAt: Date.now(),
        })
      );
      return true;
    } catch {
      // Storage fully saturated, indexedDB handled it
      return false;
    }
  }
}

/**
 * Load records safely: Checks IndexedDB first for full fidelity, then fallback to chunked localStorage.
 */
export async function loadRecordsSafely(fallbackDefault: MemberRecord[]): Promise<MemberRecord[]> {
  if (typeof window === 'undefined') return fallbackDefault;

  // 1. Try IndexedDB first
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction([STORE_MEMBERS], 'readonly');
      const store = tx.objectStore(STORE_MEMBERS);
      const req = store.getAll();
      const dbRecords = await new Promise<MemberRecord[]>((resolve) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
      if (Array.isArray(dbRecords) && dbRecords.length > 0) {
        return dbRecords;
      }
    }
  } catch (e) {
    console.warn('IndexedDB load fallback to localStorage:', e);
  }

  // 2. Try chunked localStorage
  try {
    const metaRaw = localStorage.getItem(STORAGE_META_KEY);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      const totalChunks = meta.totalChunks || 0;
      const combined: MemberRecord[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkRaw = localStorage.getItem(`${STORAGE_PREFIX}${i}`);
        if (chunkRaw) {
          const chunkData = JSON.parse(chunkRaw);
          if (Array.isArray(chunkData)) {
            combined.push(...chunkData);
          }
        }
      }
      if (combined.length > 0) {
        return combined;
      }
    }
  } catch (e) {
    console.warn('Failed loading chunked localStorage:', e);
  }

  // 3. Try legacy monolithic key if available (migrating it)
  try {
    const legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Save to new format and remove legacy
        saveRecordsSafely(parsed);
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return fallbackDefault;
}
