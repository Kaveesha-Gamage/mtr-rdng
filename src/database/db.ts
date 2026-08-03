import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('bill.db');

export const initDatabase = () => {
  // 1. Create bills table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accNumber TEXT,
      dueBill REAL,
      previousReading INTEGER,
      currentReading INTEGER
    );
  `);

  // 2. Detect stale schema for pending_readings (drop if column structure is outdated)
  try {
    db.execSync(`SELECT accountNumber, customerName, r1 FROM pending_readings LIMIT 0;`);
  } catch (error) {
    console.log("Stale pending_readings table detected, dropping to apply update:", error);
    try {
      db.execSync(`DROP TABLE IF EXISTS pending_readings;`);
    } catch (dropError) {
      console.error("Failed to drop stale table:", dropError);
    }
  }

  // 3. Create pending_readings table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_readings (
      accountNumber TEXT NOT NULL,
      installationId TEXT NOT NULL,
      customerName TEXT,
      tariff TEXT,
      readerCode TEXT,
      dailyPack TEXT,
      walkOrder TEXT,
      currentBillCycle TEXT,
      billCycleDate TEXT,
      areaCode TEXT,
      areaName TEXT,
      customerCategory TEXT,
      customerType TEXT,
      netType TEXT,
      netTypeName TEXT,
      readingDate TEXT,
      previousReadingDate TEXT,
      numberOfDays INTEGER,
      meterSequence INTEGER,
      bfBalance REAL,
      vatApplicable TEXT,
      totalMeters INTEGER,
      currentReading INTEGER,
      remarks TEXT,
      syncStatus TEXT DEFAULT 'PENDING',
      r1 REAL,
      r2 REAL,
      r3 REAL,
      kva REAL,
      kvah REAL,
      PRIMARY KEY (accountNumber, installationId)
    );
  `);

  // 4. Migrate existing schema: add multi-sequence reading columns if they don't exist yet.
  //    SQLite does not support "ADD COLUMN IF NOT EXISTS", so we use try/catch per column.
  const multiSeqColumns = [
    // Import (mtr_seq = 1)
    "imp_r1 REAL",
    "imp_r2 REAL",
    "imp_r3 REAL",
    "imp_kva REAL",
    "imp_kvah REAL",
    // Export (mtr_seq = 2)
    "exp_r1 REAL",
    "exp_r2 REAL",
    "exp_r3 REAL",
    "exp_kva REAL",
    "exp_kvah REAL",
    // Import-in-Export (mtr_seq = 3) — Net+ only
    "imp_exp_r1 REAL",
    "imp_exp_r2 REAL",
    "imp_exp_r3 REAL",
    "imp_exp_kva REAL",
    "imp_exp_kvah REAL",
  ];

  for (const colDef of multiSeqColumns) {
    try {
      db.execSync(`ALTER TABLE pending_readings ADD COLUMN ${colDef};`);
    } catch (_) {
      // Column already exists — safe to ignore
    }
  }
};

export default db;