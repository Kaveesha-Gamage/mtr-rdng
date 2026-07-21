import db from "./db";
import { PendingReading } from "../types/PendingReading";

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
      numberOfDays, meterSequence, bfBalance, vatApplicable, totalMeters
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      meterSequence = excluded.meterSequence,
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
      currentReading, remarks, syncStatus
    FROM pending_readings
    ORDER BY CAST(walkOrder AS INTEGER) ASC, accountNumber ASC
  `);
};

/**
 * Gets stats of pending readings for dashboard display.
 */
export const getPendingReadingsCount = () => {
  try {
    const result = db.getFirstSync<{ total: number; taken: number }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN currentReading IS NOT NULL THEN 1 ELSE 0 END) as taken
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
 */
export const updatePendingReading = (
  accountNumber: string,
  installationId: string,
  currentReading: number,
  remarks: string
): void => {
  db.runSync(
    `UPDATE pending_readings 
     SET currentReading = ?, remarks = ?, syncStatus = 'PENDING' 
     WHERE accountNumber = ? AND installationId = ?`,
    [currentReading, remarks, accountNumber, installationId]
  );
};

/**
 * Clears the pending readings table.
 */
export const clearPendingReadings = (): void => {
  db.execSync(`DELETE FROM pending_readings`);
};
