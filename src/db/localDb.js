const DB_NAME = 'earth-movers-local';
const DB_VERSION = 6;
const DATA_STORE_NAMES = [
  'customers',
  'transactions',
  'payments',
  'expenses',
  'dieselLogs',
  'suppliers',
  'financeLoans',
  'staff',
  'drivingHours',
  'jcbFleet',
  'maintenanceRecords',
  'jcbDocuments',
  'stockEntries',
  'syncQueue',
  'meta'
];
const KEY_STORE_NAME = 'cryptoKeys';
const STORE_NAMES = [...DATA_STORE_NAMES, KEY_STORE_NAME];
const KEY_ID = 'local-encryption-key';

const openDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    DATA_STORE_NAMES.forEach((name) => {
      if (!database.objectStoreNames.contains(name)) database.createObjectStore(name, { keyPath: 'id' });
    });
    if (!database.objectStoreNames.contains(KEY_STORE_NAME)) {
      database.createObjectStore(KEY_STORE_NAME, { keyPath: 'id' });
    }

    // Existing v5 records were plaintext. Drop them once so only encrypted records remain.
    if (request.transaction && request.oldVersion < DB_VERSION) {
      DATA_STORE_NAMES.forEach((name) => request.transaction.objectStore(name).clear());
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

let encryptionKeyPromise;

const getEncryptionKey = async () => {
  if (encryptionKeyPromise) return encryptionKeyPromise;
  encryptionKeyPromise = (async () => {
    const database = await openDb();
    const existingKey = await new Promise((resolve, reject) => {
      const transaction = database.transaction(KEY_STORE_NAME, 'readonly');
      const request = transaction.objectStore(KEY_STORE_NAME).get(KEY_ID);
      request.onsuccess = () => resolve(request.result?.key || null);
      request.onerror = () => reject(request.error);
    });
    database.close();
    if (existingKey) return existingKey;

    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    const writeDatabase = await openDb();
    await new Promise((resolve, reject) => {
      const transaction = writeDatabase.transaction(KEY_STORE_NAME, 'readwrite');
      transaction.objectStore(KEY_STORE_NAME).put({ id: KEY_ID, key });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    writeDatabase.close();
    return key;
  })().catch((error) => {
    encryptionKeyPromise = null;
    throw error;
  });
  return encryptionKeyPromise;
};

const encryptValue = async (value) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getEncryptionKey(), plaintext);
  return { id: value.id, iv, ciphertext };
};

const decryptValue = async (record) => {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: record.iv },
    await getEncryptionKey(),
    record.ciphertext
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
};

const withStore = async (storeName, mode, action) => {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllLocal = async (storeName) => {
  const records = await withStore(storeName, 'readonly', (store) => store.getAll());
  return Promise.all(records.map(decryptValue));
};

export const putLocal = async (storeName, value) => {
  const encryptedValue = await encryptValue(value);
  return withStore(storeName, 'readwrite', (store) => store.put(encryptedValue));
};

export const deleteLocal = (storeName, id) => withStore(storeName, 'readwrite', (store) => store.delete(id));

export const putManyLocal = async (storeName, values) => {
  const encryptedValues = await Promise.all(values.map(encryptValue));
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    encryptedValues.forEach((value) => store.put(value));
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
};

export const getMeta = async (id) => getAllLocal('meta').then((items) => items.find((item) => item.id === id));

export const clearLocalData = async () => {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAMES, 'readwrite');
    STORE_NAMES.forEach((name) => transaction.objectStore(name).clear());
    transaction.oncomplete = () => {
      database.close();
      encryptionKeyPromise = null;
      resolve();
    };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
};
