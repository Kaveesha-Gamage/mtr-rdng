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

  // 2. Detect legacy or stale schema for pending_readings and drop table to apply clean structure if needed
  const tableCheck = db.getFirstSync<{ count: number }>(
    `SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='pending_readings';`
  );

  if (tableCheck && tableCheck.count > 0) {
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
      currentReading INTEGER,
      remarks        TEXT,
      syncStatus     TEXT DEFAULT 'PENDING'
    );
  `);
};

export default db;