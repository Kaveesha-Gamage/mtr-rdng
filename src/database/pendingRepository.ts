import { PendingReading } from "../types/PendingReading";
import db from "./db";

/**
 * Saves a list of pending readings downloaded from the API into SQLite.
 * Uses a transaction and prepared statement for optimal performance.
 * If conflict occurs on (accountNumber, installationId), it merges the record
 * without overwriting any user-entered fields (currentReading, remarks, syncStatus).
 */
export const savePendingReadings = (readings: PendingReading[]): void => {
  const insertStmt = db.prepareSync(`
    INSERT INTO pending_readings (
      accountNumber, installationId, customerName, tariff, readerCode, dailyPack, walkOrder,
      currentBillCycle, billCycleDate, areaCode, areaName, customerCategory,
      customerType, netType, netTypeName, readingDate, previousReadingDate,
      numberOfDays, meterSequence, bfBalance, vatApplicable, totalMeters,
      r1, r2, r3, kva, kvah
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(accountNumber, installationId) DO UPDATE SET
      customerName = excluded.customerName,
      tariff = excluded.tariff,
      readerCode = excluded.readerCode,
      dailyPack = excluded.dailyPack,
      walkOrder = excluded.walkOrder,
      currentBillCycle = excluded.currentBillCycle,
      billCycleDate = excluded.billCycleDate,
      areaCode = excluded.areaCode,
      areaName = excluded.areaName,
      customerCategory = excluded.customerCategory,
      customerType = excluded.customerType,
      netType = excluded.netType,
      netTypeName = excluded.netTypeName,
      readingDate = COALESCE(pending_readings.readingDate, excluded.readingDate),
      previousReadingDate = excluded.previousReadingDate,
      numberOfDays = excluded.numberOfDays,
      meterSequence = COALESCE(pending_readings.meterSequence, excluded.meterSequence),
      bfBalance = excluded.bfBalance,
      vatApplicable = excluded.vatApplicable,
      totalMeters = excluded.totalMeters
  `);

  try {
    db.withTransactionSync(() => {
      for (const reading of readings) {
        insertStmt.executeSync([
          reading.accountNumber,
          reading.installationId,
          reading.customerName ?? "",
          reading.tariff,
          reading.readerCode,
          reading.dailyPack,
          reading.walkOrder,
          reading.currentBillCycle,
          reading.billCycleDate,
          reading.areaCode,
          reading.areaName,
          reading.customerCategory,
          reading.customerType,
          reading.netType,
          reading.netTypeName,
          reading.readingDate,
          reading.previousReadingDate,
          reading.numberOfDays,
          reading.meterSequence,
          reading.bfBalance,
          reading.vatApplicable,
          reading.totalMeters,
          reading.r1 ?? null,
          reading.r2 ?? null,
          reading.r3 ?? null,
          reading.kva ?? null,
          reading.kvah ?? null,
        ]);
      }
    });
  } finally {
    insertStmt.finalizeSync();
  }
};

/**
 * Retrieves all pending readings from the local database.
 * Sorted by walkOrder (as integer if numeric) then accountNumber.
 */
export const getPendingReadingsFromDB = (): PendingReading[] => {
  return db.getAllSync<PendingReading>(`
    SELECT 
      accountNumber, installationId, customerName, tariff, readerCode, dailyPack, walkOrder,
      currentBillCycle, billCycleDate, areaCode, areaName, customerCategory,
      customerType, netType, netTypeName, readingDate, previousReadingDate,
      numberOfDays, meterSequence, bfBalance, vatApplicable, totalMeters,
      currentReading, remarks, syncStatus, r1, r2, r3, kva, kvah,
      imp_r1, imp_r2, imp_r3, imp_kva, imp_kvah,
      exp_r1, exp_r2, exp_r3, exp_kva, exp_kvah,
      imp_exp_r1, imp_exp_r2, imp_exp_r3, imp_exp_kva, imp_exp_kvah
    FROM pending_readings
    ORDER BY CAST(walkOrder AS INTEGER) ASC, accountNumber ASC
  `);
};

/**
 * Gets stats of pending readings for dashboard display.
 * A reading is considered "taken" if any primary reading field is filled.
 */
export const getPendingReadingsCount = () => {
  try {
    const result = db.getFirstSync<{ total: number; taken: number }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE 
          WHEN r1 IS NOT NULL OR currentReading IS NOT NULL OR imp_r1 IS NOT NULL 
          THEN 1 ELSE 0 
        END) as taken
      FROM pending_readings
    `);

    const total = result?.total || 0;
    const taken = result?.taken || 0;

    return {
      totalCustomers: total,
      receivedCount: taken,
      pendingCount: total - taken,
    };
  } catch (error) {
    console.error("Error fetching pending readings counts from SQLite:", error);
    return {
      totalCustomers: 0,
      receivedCount: 0,
      pendingCount: 0,
    };
  }
};

/**
 * Updates a pending reading locally when a meter reading is captured.
 * Used for Normal (single-reading) meter types.
 */
export const updatePendingReading = (
  accountNumber: string,
  installationId: string,
  currentReading: number | null,
  remarks: string | null,
  readingDate: string | null
): void => {
  db.runSync(
    `UPDATE pending_readings 
     SET currentReading = ?, remarks = ?, readingDate = ?, syncStatus = 'PENDING' 
     WHERE accountNumber = ? AND installationId = ?`,
    [currentReading, remarks, readingDate, accountNumber, installationId]
  );
};

/**
 * Retrieves a single pending reading by Account Number and Installation ID.
 */
export const getPendingReading = (
  accountNumber: string,
  installationId: string
): PendingReading | null => {
  try {
    return db.getFirstSync<PendingReading>(
      `SELECT 
        accountNumber, installationId, customerName, tariff, readerCode, dailyPack, walkOrder,
        currentBillCycle, billCycleDate, areaCode, areaName, customerCategory,
        customerType, netType, netTypeName, readingDate, previousReadingDate,
        numberOfDays, meterSequence, bfBalance, vatApplicable, totalMeters,
        currentReading, remarks, syncStatus, r1, r2, r3, kva, kvah,
        imp_r1, imp_r2, imp_r3, imp_kva, imp_kvah,
        exp_r1, exp_r2, exp_r3, exp_kva, exp_kvah,
        imp_exp_r1, imp_exp_r2, imp_exp_r3, imp_exp_kva, imp_exp_kvah
      FROM pending_readings 
      WHERE accountNumber = ? AND installationId = ?`,
      [accountNumber, installationId]
    );
  } catch (error) {
    console.error("Failed to query single pending reading:", error);
    return null;
  }
};

/**
 * Persists the manual meter readings for a customer (legacy single-sequence).
 * Kept for backward compatibility with Normal meter types.
 */
export const saveMeterReading = (
  accountNumber: string,
  installationId: string,
  readings: {
    r1: number | null;
    r2: number | null;
    r3: number | null;
    kva: number | null;
    kvah: number | null;
    readingDate: string | null;
    meterSequence: number | null;
  }
): void => {
  db.runSync(
    `UPDATE pending_readings 
     SET r1 = ?, r2 = ?, r3 = ?, kva = ?, kvah = ?, readingDate = ?, meterSequence = ?, syncStatus = 'PENDING' 
     WHERE accountNumber = ? AND installationId = ?`,
    [
      readings.r1,
      readings.r2,
      readings.r3,
      readings.kva,
      readings.kvah,
      readings.readingDate,
      readings.meterSequence,
      accountNumber,
      installationId,
    ]
  );
};

/**
 * Persists multi-sequence meter readings for net-type customers.
 * Saves import (seq=1), export (seq=2), and optionally import-in-export (seq=3) readings
 * as separate flat column groups on the same row.
 */
export const saveMultiSequenceReadings = (
  accountNumber: string,
  installationId: string,
  data: {
    readingDate: string | null;
    // Import (mtr_seq = 1)
    imp_r1: number | null;
    imp_r2: number | null;
    imp_r3: number | null;
    imp_kva: number | null;
    imp_kvah: number | null;
    // Export (mtr_seq = 2)
    exp_r1: number | null;
    exp_r2: number | null;
    exp_r3: number | null;
    exp_kva: number | null;
    exp_kvah: number | null;
    // Import-in-Export (mtr_seq = 3) — null for types that don't need it
    imp_exp_r1?: number | null;
    imp_exp_r2?: number | null;
    imp_exp_r3?: number | null;
    imp_exp_kva?: number | null;
    imp_exp_kvah?: number | null;
  }
): void => {
  db.runSync(
    `UPDATE pending_readings 
     SET 
       imp_r1 = ?, imp_r2 = ?, imp_r3 = ?, imp_kva = ?, imp_kvah = ?,
       exp_r1 = ?, exp_r2 = ?, exp_r3 = ?, exp_kva = ?, exp_kvah = ?,
       imp_exp_r1 = ?, imp_exp_r2 = ?, imp_exp_r3 = ?, imp_exp_kva = ?, imp_exp_kvah = ?,
       readingDate = ?, syncStatus = 'PENDING'
     WHERE accountNumber = ? AND installationId = ?`,
    [
      data.imp_r1, data.imp_r2, data.imp_r3, data.imp_kva, data.imp_kvah,
      data.exp_r1, data.exp_r2, data.exp_r3, data.exp_kva, data.exp_kvah,
      data.imp_exp_r1 ?? null, data.imp_exp_r2 ?? null, data.imp_exp_r3 ?? null,
      data.imp_exp_kva ?? null, data.imp_exp_kvah ?? null,
      data.readingDate,
      accountNumber,
      installationId,
    ]
  );
};

/**
 * Clears the pending readings table.
 */
export const clearPendingReadings = (): void => {
  db.execSync(`DELETE FROM pending_readings`);
};
