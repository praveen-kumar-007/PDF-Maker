const DB_NAME = 'IndocreonixPDFStore';
const DB_VERSION = 1;
const STORE_NAME = 'files';

/**
 * Promise wrapper to initialize IndexedDB natively.
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

/**
 * Saves a File or Blob binary directly into IndexedDB by ID.
 * @param {string} id 
 * @param {Blob|File} fileOrBlob 
 * @returns {Promise<boolean>}
 */
export const saveFileToDB = async (id, fileOrBlob) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileOrBlob, id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (e) {
    console.error('IndexedDB save failed:', e);
    return false;
  }
};

/**
 * Retrieves a File or Blob binary from IndexedDB by ID.
 * @param {string} id 
 * @returns {Promise<Blob|File|null>}
 */
export const getFileFromDB = async (id) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (e) {
    console.error('IndexedDB retrieve failed:', e);
    return null;
  }
};

/**
 * Deletes a file or Blob binary from IndexedDB by ID.
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export const deleteFileFromDB = async (id) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (e) {
    console.error('IndexedDB delete failed:', e);
    return false;
  }
};

/**
 * Purges the entire IndexedDB database.
 * @returns {Promise<boolean>}
 */
export const clearAllFilesFromDB = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (e) {
    console.error('IndexedDB clear failed:', e);
    return false;
  }
};
