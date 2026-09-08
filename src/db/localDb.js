const DB_NAME = 'earth-movers-local';
const DB_VERSION = 3;
const STORE_NAMES = [
  'customers',
  'transactions',
  'payments',
  'expenses',
  'dieselLogs',
  'suppliers',
  'financeLoans',
  'staff',
  'syncQueue',
  'meta'
];

const openDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    STORE_NAMES.forEach((name) => {
      if (!request.result.objectStoreNames.contains(name)) {
        request.result.createObjectStore(name, { keyPath: 'id' });
      }
      request.transaction.objectStore(name).clear();
    });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const withStore = async (storeName, mode, action) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllLocal = (storeName) => withStore(storeName, 'readonly', (store) => store.getAll());
export const putLocal = (storeName, value) => withStore(storeName, 'readwrite', (store) => store.put(value));
export const deleteLocal = (storeName, id) => withStore(storeName, 'readwrite', (store) => store.delete(id));

export const putManyLocal = async (storeName, values) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    values.forEach((value) => store.put(value));
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
};

export const getMeta = async (id) => getAllLocal('meta').then((items) => items.find((item) => item.id === id));
