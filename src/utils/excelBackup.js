import writeExcelFile from 'write-excel-file/browser';
import readExcelFile from 'read-excel-file/browser';
import { getAllLocal, putLocal } from '../db/localDb';
import { queueEntity } from '../db/syncQueue';

const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
const MAX_ROWS_PER_SHEET = 10000;
const BACKUP_MAGIC = new TextEncoder().encode('EMBKP1');
const BACKUP_SALT_BYTES = 16;
const BACKUP_IV_BYTES = 12;
const BACKUP_KDF_ITERATIONS = 600000;
const MIN_BACKUP_PASSWORD_LENGTH = 10;

const BACKUP_TABLES = [
  { store: 'customers', sheet: 'Customers', entityType: 'customer' },
  { store: 'transactions', sheet: 'Transactions', entityType: 'transaction' },
  { store: 'payments', sheet: 'Payments', entityType: 'payment' },
  { store: 'expenses', sheet: 'Expenses', entityType: 'expense' },
  { store: 'dieselLogs', sheet: 'Diesel Logs', entityType: 'dieselLog' },
  { store: 'suppliers', sheet: 'Suppliers', entityType: 'supplier' },
  { store: 'financeLoans', sheet: 'Finance Loans', entityType: 'financeLoan', ownerOnly: true },
  { store: 'staff', sheet: 'Staff', entityType: 'staff' },
  { store: 'drivingHours', sheet: 'Driving Hours', entityType: 'drivingHour' },
  { store: 'jcbFleet', sheet: 'JCB Fleet', entityType: 'jcbFleet' },
  { store: 'maintenanceRecords', sheet: 'Maintenance Records', entityType: 'maintenanceRecord' },
  { store: 'jcbDocuments', sheet: 'JCB Documents', entityType: 'jcbDocument' },
  { store: 'stockEntries', sheet: 'Stock Entries', entityType: 'stockEntry' }
];

const nestedFields = new Set(['paymentHistory', 'serviceHistory', 'documents', 'advances']);

const cellValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

const workbookValue = (value) => {
  const converted = cellValue(value);
  if (typeof converted === 'string') return { value: converted, type: String };
  return converted;
};

const columnsFor = (records) => {
  const keys = [];
  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (!keys.includes(key)) keys.push(key);
    });
  });
  return keys.length ? keys : ['id'];
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const validateBackupPassword = (password) => {
  if (typeof password !== 'string' || password.length < MIN_BACKUP_PASSWORD_LENGTH) {
    throw new Error(`Backup password must be at least ${MIN_BACKUP_PASSWORD_LENGTH} characters.`);
  }
};

const deriveBackupKey = async (password, salt) => {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: BACKUP_KDF_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encryptWorkbook = async (workbookBlob, password) => {
  validateBackupPassword(password);
  const salt = crypto.getRandomValues(new Uint8Array(BACKUP_SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(BACKUP_IV_BYTES));
  const key = await deriveBackupKey(password, salt);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    await workbookBlob.arrayBuffer()
  ));
  const output = new Uint8Array(BACKUP_MAGIC.length + salt.length + iv.length + ciphertext.length);
  output.set(BACKUP_MAGIC, 0);
  output.set(salt, BACKUP_MAGIC.length);
  output.set(iv, BACKUP_MAGIC.length + salt.length);
  output.set(ciphertext, BACKUP_MAGIC.length + salt.length + iv.length);
  return new Blob([output], { type: 'application/octet-stream' });
};

const decryptWorkbook = async (file, password) => {
  validateBackupPassword(password);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const headerLength = BACKUP_MAGIC.length + BACKUP_SALT_BYTES + BACKUP_IV_BYTES;
  if (bytes.length <= headerLength || !BACKUP_MAGIC.every((byte, index) => bytes[index] === byte)) {
    throw new Error('This is not a valid encrypted Earth Movers backup.');
  }
  const saltStart = BACKUP_MAGIC.length;
  const ivStart = saltStart + BACKUP_SALT_BYTES;
  const salt = bytes.slice(saltStart, ivStart);
  const iv = bytes.slice(ivStart, headerLength);
  const ciphertext = bytes.slice(headerLength);
  try {
    const key = await deriveBackupKey(password, salt);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new File([plaintext], 'earth-movers-backup.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  } catch {
    throw new Error('Incorrect backup password or damaged backup file.');
  }
};

export const exportBusinessWorkbook = async ({ role, password }) => {
  validateBackupPassword(password);
  const sheets = [];
  for (const table of BACKUP_TABLES) {
    if (table.ownerOnly && role !== 'owner') continue;
    const records = await getAllLocal(table.store);
    const columns = columnsFor(records);
    const rows = [
      columns.map((column) => ({ value: column, type: String, fontWeight: 'bold' })),
      ...records.map((record) => columns.map((column) => workbookValue(record[column])))
    ];
    sheets.push({
      data: rows,
      sheet: table.sheet,
      stickyRowsCount: 1,
      orientation: 'landscape'
    });
  }

  const workbook = await writeExcelFile(sheets, { fontFamily: 'Arial', fontSize: 10 }).toBlob();
  const blob = await encryptWorkbook(workbook, password);
  downloadBlob(blob, `earth-movers-backup-${new Date().toISOString().slice(0, 10)}.embackup`);
  return sheets.reduce((total, sheet) => total + Math.max(sheet.data.length - 1, 0), 0);
};

const parseImportedValue = (value, key) => {
  if (typeof value !== 'string') return value ?? '';
  const trimmed = value.trim();
  if (!trimmed || !nestedFields.has(key) || !['{', '['].includes(trimmed[0])) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`Invalid JSON in ${key}`);
  }
};

const parseSheet = (table, data) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (data.length - 1 > MAX_ROWS_PER_SHEET) throw new Error(`${table.sheet} has more than ${MAX_ROWS_PER_SHEET} data rows`);
  const headers = data[0].map((header) => String(header || '').trim());
  if (!headers.includes('id')) throw new Error(`${table.sheet} must contain an id column`);

  const ids = new Set();
  return data.slice(1).filter((row) => row.some((value) => value !== null && value !== '')).map((row, index) => {
    const entity = {};
    headers.forEach((header, columnIndex) => {
      if (!header) return;
      entity[header] = parseImportedValue(row[columnIndex], header);
    });
    if (!entity.id || typeof entity.id !== 'string') throw new Error(`${table.sheet} row ${index + 2} has an invalid id`);
    if (ids.has(entity.id)) throw new Error(`${table.sheet} contains duplicate id ${entity.id}`);
    ids.add(entity.id);
    return entity;
  });
};

export const importBusinessWorkbook = async (file, { role, syncNow, password }) => {
  if (!file || !file.name.toLowerCase().endsWith('.embackup')) throw new Error('Please select an encrypted .embackup file.');
  if (file.size > MAX_IMPORT_BYTES) throw new Error('Excel backup must be smaller than 20 MB.');
  const decryptedWorkbook = await decryptWorkbook(file, password);

  const availableTables = new Map(BACKUP_TABLES.map((table) => [table.sheet, table]));
  const sheets = await readExcelFile(decryptedWorkbook);
  const importedTables = [];
  const preparedTables = [];
  let importedRows = 0;

  for (const sheet of sheets) {
    const table = availableTables.get(sheet.sheet);
    if (!table) continue;
    if (table.ownerOnly && role !== 'owner') throw new Error('Only the owner can import Finance Loans.');
    const records = parseSheet(table, sheet.data);
    preparedTables.push({ table, records });
  }

  for (const { table, records } of preparedTables) {
    for (const record of records) {
      await putLocal(table.store, record);
      await queueEntity(table.entityType, record, 'update');
    }
    importedTables.push(`${table.sheet}: ${records.length}`);
    importedRows += records.length;
  }

  if (!importedTables.length) throw new Error('No recognized backup sheets were found.');
  await syncNow();
  return { importedRows, importedTables };
};
