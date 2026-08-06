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
      db.execSync(`DROP TABLE IF EXISTS pending_readings;`);
    } catch (dropError) {
      console.error("Failed to drop stale table:", dropError);
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
};

export default db;