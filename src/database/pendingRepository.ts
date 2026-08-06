import { PendingReading } from "../types/PendingReading";
import db from "./db";

/**
 * Saves a list of pending readings downloaded from the API into SQLite.
 * Uses a transaction and prepared statement for optimal performance.
 * If conflict occurs on accountNumber, it merges the record
 * without overwriting any user-entered fields (currentReading, remarks, syncStatus).
 */
export const savePendingReadings = (readings: PendingReading[]): void => {
  const insertStmt = db.prepareSync(`
    INSERT INTO pending_readings (
      accountNumber, customerName, addressL1, areaCode, billCycle,
      tariff, mobileNo, telNbr, custType, netType, netTypeName, hasReading
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(accountNumber) DO UPDATE SET
      customerName = excluded.customerName,
      addressL1    = excluded.addressL1,
      areaCode     = excluded.areaCode,
      billCycle    = excluded.billCycle,
      tariff       = excluded.tariff,
      mobileNo     = excluded.mobileNo,
      telNbr       = excluded.telNbr,
      custType     = excluded.custType,
      netType      = excluded.netType,
      netTypeName  = excluded.netTypeName,
      hasReading   = excluded.hasReading
  `);

  try {
    db.withTransactionSync(() => {
      for (const reading of readings) {
        insertStmt.executeSync([
          reading.accountNumber,
          reading.customerName ?? "",
          reading.addressL1 ?? null,
          reading.areaCode ?? null,
          reading.billCycle ?? null,
          reading.tariff ?? null,
          reading.mobileNo ?? null,
          reading.telNbr ?? null,
          reading.custType ?? null,
          reading.netType ?? null,
          reading.netTypeName ?? null,
          reading.hasReading ? 1 : 0,
        ]);
      }
    });
  } finally {
    insertStmt.finalizeSync();
  }
};

/**
 * Retrieves all pending readings from the local database.
 * Sorted by accountNumber.
 */
export const getPendingReadingsFromDB = (): PendingReading[] => {
  return db.getAllSync<PendingReading>(`
    SELECT
      accountNumber, customerName, addressL1, areaCode, billCycle,
      tariff, mobileNo, telNbr, custType, netType, netTypeName, hasReading,
      currentReading, remarks, syncStatus
    FROM pending_readings
    ORDER BY accountNumber ASC
  `);
};

/**
 * Gets stats of pending readings for dashboard display.
 * A reading is considered "taken" if currentReading is filled or hasReading is true.
 */
export const getPendingReadingsCount = () => {
  try {
    const result = db.getFirstSync<{ total: number; taken: number }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE
          WHEN currentReading IS NOT NULL OR hasReading = 1
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
     SET currentReading = ?, remarks = ?, syncStatus = 'PENDING'
     WHERE accountNumber = ?`,
    [currentReading, remarks, accountNumber]
  );
};

/**
 * Retrieves a single pending reading by Account Number.
 */
export const getPendingReading = (
  accountNumber: string,
  installationId: string
): PendingReading | null => {
  try {
    return db.getFirstSync<PendingReading>(
      `SELECT
        accountNumber, customerName, addressL1, areaCode, billCycle,
        tariff, mobileNo, telNbr, custType, netType, netTypeName, hasReading,
        currentReading, remarks, syncStatus
      FROM pending_readings
      WHERE accountNumber = ?`,
      [accountNumber]
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
     SET currentReading = ?, syncStatus = 'PENDING' 
     WHERE accountNumber = ?`,
    [readings.r1, accountNumber]
  );
};

/**
 * Persists multi-sequence meter readings for net-type customers.
 * Updates currentReading and syncStatus on the customer's row.
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
  const currentReading = data.imp_r1 ?? data.exp_r1 ?? data.imp_exp_r1 ?? null;
  db.runSync(
    `UPDATE pending_readings 
     SET currentReading = ?, syncStatus = 'PENDING'
     WHERE accountNumber = ?`,
    [currentReading, accountNumber]
  );
};

/**
 * Clears the pending readings table.
 */
export const clearPendingReadings = (): void => {
  db.execSync(`DELETE FROM pending_readings`);
};
