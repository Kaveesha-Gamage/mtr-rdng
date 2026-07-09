import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('bill.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accNumber TEXT,
      dueBill REAL,
      previousReading INTEGER,
      currentReading INTEGER
    );
  `);
};

export default db;