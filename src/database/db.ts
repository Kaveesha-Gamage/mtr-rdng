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
    db.execSync(`SELECT accountNumber, customerName FROM pending_readings LIMIT 0;`);
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
      PRIMARY KEY (accountNumber, installationId)
    );
  `);
};

export default db;