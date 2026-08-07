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

  // 2. Detect legacy or stale schema for pending_readings and drop table to apply clean structure
  try {
    // Validate that current table contains all required columns
    db.execSync(`SELECT accountNumber, customerName, addressL1, areaCode, billCycle, tariff, mobileNo, telNbr, custType, netType, netTypeName, hasReading, currentReading, r1, r2, r3, kva, kvah, readingDate, remarks, syncStatus FROM pending_readings LIMIT 0;`);
  } catch (error) {
    console.log("Stale pending_readings table structure detected, dropping to apply fresh schema:", error);
    try {
      // Check for obsolete legacy columns
      db.execSync(`SELECT r1, installationId FROM pending_readings LIMIT 0;`);
      console.log("Legacy pending_readings table detected with obsolete columns. Dropping table...");
      db.execSync(`DROP TABLE IF EXISTS pending_readings;`);
    } catch (error) {
      // Expected if legacy columns do not exist; now validate current table structure
      try {
        db.execSync(`SELECT accountNumber, customerName, addressL1, areaCode, billCycle, tariff, mobileNo, telNbr, custType, netType, netTypeName, hasReading, currentReading, remarks, syncStatus FROM pending_readings LIMIT 0;`);
      } catch (schemaError) {
        console.log("Stale pending_readings table structure detected, dropping to apply fresh schema.");
        db.execSync(`DROP TABLE IF EXISTS pending_readings;`);
      }
    }
  }

  // 3. Create pending_readings table (matches /reading-status/area/{code}/pending API response + app status fields)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_readings (
      accountNumber  TEXT NOT NULL PRIMARY KEY,
      customerName   TEXT,
      addressL1      TEXT,
      areaCode       TEXT,
      billCycle      INTEGER,
      tariff         TEXT,
      mobileNo       TEXT,
      telNbr         TEXT,
      custType       TEXT,
      netType        TEXT,
      netTypeName    TEXT,
      hasReading     INTEGER DEFAULT 0,
      currentReading REAL,
      r1             REAL,
      r2             REAL,
      r3             REAL,
      kva            REAL,
      kvah           REAL,
      readingDate    TEXT,
      remarks        TEXT,
      syncStatus     TEXT DEFAULT 'PENDING'
    );
  `);

  // 4. Create tmp_rmt_rdngs table (stores user-inserted meter readings)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS tmp_rmt_rdngs (
      accountNumber  TEXT NOT NULL PRIMARY KEY,
      installationId TEXT,
      readingDate    TEXT,
      currentReading REAL,
      r1             REAL,
      r2             REAL,
      r3             REAL,
      kva            REAL,
      kvah           REAL,
      imp_r1         REAL,
      imp_r2         REAL,
      imp_r3         REAL,
      imp_kva        REAL,
      imp_kvah       REAL,
      exp_r1         REAL,
      exp_r2         REAL,
      exp_r3         REAL,
      exp_kva        REAL,
      exp_kvah       REAL,
      imp_exp_r1     REAL,
      imp_exp_r2     REAL,
      imp_exp_r3     REAL,
      imp_exp_kva    REAL,
      imp_exp_kvah   REAL,
      remarks        TEXT,
      syncStatus     TEXT DEFAULT 'PENDING',
      createdAt      TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export default db;