import { MaterialOption, CatalogueProduct } from '../types';

const DB_NAME = 'StoneStudioDB';
const DB_VERSION = 1;
const STORES = {
  MATERIALS: 'materials',
  CATALOGUE: 'catalogue'
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.MATERIALS)) {
        db.createObjectStore(STORES.MATERIALS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CATALOGUE)) {
        db.createObjectStore(STORES.CATALOGUE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

const getAll = async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const put = async <T>(storeName: string, item: T): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

const remove = async (storeName: string, id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getStoredMaterials = () => getAll<MaterialOption>(STORES.MATERIALS);
export const saveStoredMaterial = (material: MaterialOption) => put(STORES.MATERIALS, material);
export const deleteStoredMaterial = (id: string) => remove(STORES.MATERIALS, id);

export const getStoredProducts = () => getAll<CatalogueProduct>(STORES.CATALOGUE);
export const saveStoredProduct = (product: CatalogueProduct) => put(STORES.CATALOGUE, product);
export const deleteStoredProduct = (id: string) => remove(STORES.CATALOGUE, id);
