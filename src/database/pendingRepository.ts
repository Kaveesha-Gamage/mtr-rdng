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
      currentReading, r1, r2, r3, kva, kvah, readingDate, remarks, syncStatus
    FROM pending_readings
    ORDER BY accountNumber ASC
  `);
};

export interface TmpRmtReading {
  accountNumber: string;
  installationId?: string | null;
  readingDate?: string | null;
  currentReading?: number | null;
  r1?: number | null;
  r2?: number | null;
  r3?: number | null;
  kva?: number | null;
  kvah?: number | null;
  imp_r1?: number | null;
  imp_r2?: number | null;
  imp_r3?: number | null;
  imp_kva?: number | null;
  imp_kvah?: number | null;
  exp_r1?: number | null;
  exp_r2?: number | null;
  exp_r3?: number | null;
  exp_kva?: number | null;
  exp_kvah?: number | null;
  imp_exp_r1?: number | null;
  imp_exp_r2?: number | null;
  imp_exp_r3?: number | null;
  imp_exp_kva?: number | null;
  imp_exp_kvah?: number | null;
  remarks?: string | null;
  syncStatus?: string;
  createdAt?: string;
}

/**
 * Gets stats of pending readings for dashboard display.
 * Total customers comes from pending_readings.
 * Taken count comes from distinct accountNumbers in tmp_rmt_rdngs.
 */
export const getPendingReadingsCount = () => {
  try {
    const result = db.getFirstSync<{ total: number; taken: number }>(`
      SELECT
        (SELECT COUNT(*) FROM pending_readings) as total,
        (SELECT COUNT(DISTINCT accountNumber) FROM tmp_rmt_rdngs) as taken
    `);

    const total = result?.total || 0;
    const taken = result?.taken || 0;

    return {
      totalCustomers: total,
      receivedCount: taken,
      pendingCount: Math.max(0, total - taken),
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
 * Updates/Saves a meter reading locally into tmp_rmt_rdngs table when captured.
 * Used for Normal meter types. Keeps pending_readings table unchanged.
 */
export const updatePendingReading = (
  accountNumber: string,
  installationId: string,
  readings: {
    r1: number | null;
    r2: number | null;
    r3: number | null;
    kva: number | null;
    kvah: number | null;
    remarks: string | null;
    readingDate: string | null;
  }
): void => {
  const currentReading =
    readings.r1 ?? readings.r2 ?? readings.r3 ?? readings.kva ?? readings.kvah ?? null;

  db.runSync(
    `INSERT INTO tmp_rmt_rdngs (
      accountNumber, installationId, readingDate, currentReading,
      r1, r2, r3, kva, kvah, remarks, syncStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    ON CONFLICT(accountNumber) DO UPDATE SET
      installationId = excluded.installationId,
      readingDate    = excluded.readingDate,
      currentReading = excluded.currentReading,
      r1             = excluded.r1,
      r2             = excluded.r2,
      r3             = excluded.r3,
      kva            = excluded.kva,
      kvah           = excluded.kvah,
      remarks        = excluded.remarks,
      syncStatus     = 'PENDING'`,
    [
      accountNumber,
      installationId || null,
      readings.readingDate,
      currentReading,
      readings.r1,
      readings.r2,
      readings.r3,
      readings.kva,
      readings.kvah,
      readings.remarks,
    ]
  );
};

/**
 * Retrieves a single pending reading by Account Number, merging base customer info
 * from pending_readings with any reading stored in tmp_rmt_rdngs.
 */
export const getPendingReading = (
  accountNumber: string,
  installationId: string
): PendingReading | null => {
  try {
    const baseRecord = db.getFirstSync<PendingReading>(
      `SELECT
        accountNumber, customerName, addressL1, areaCode, billCycle,
        tariff, mobileNo, telNbr, custType, netType, netTypeName, hasReading,
        currentReading, r1, r2, r3, kva, kvah, readingDate, remarks, syncStatus
      FROM pending_readings
      WHERE accountNumber = ?`,
      [accountNumber]
    );

    if (!baseRecord) return null;

    const tmpRecord = db.getFirstSync<{
      currentReading: number | null;
      r1: number | null;
      r2: number | null;
      r3: number | null;
      kva: number | null;
      kvah: number | null;
      readingDate: string | null;
      remarks: string | null;
      syncStatus: "PENDING" | "SYNCED";
    }>(
      `SELECT currentReading, r1, r2, r3, kva, kvah, readingDate, remarks, syncStatus
       FROM tmp_rmt_rdngs
       WHERE accountNumber = ?`,
      [accountNumber]
    );

    if (tmpRecord) {
      return {
        ...baseRecord,
        currentReading: tmpRecord.currentReading ?? baseRecord.currentReading,
        r1: tmpRecord.r1 ?? baseRecord.r1,
        r2: tmpRecord.r2 ?? baseRecord.r2,
        r3: tmpRecord.r3 ?? baseRecord.r3,
        kva: tmpRecord.kva ?? baseRecord.kva,
        kvah: tmpRecord.kvah ?? baseRecord.kvah,
        readingDate: tmpRecord.readingDate ?? baseRecord.readingDate,
        remarks: tmpRecord.remarks ?? baseRecord.remarks,
        syncStatus: tmpRecord.syncStatus ?? baseRecord.syncStatus,
      };
    }

    return baseRecord;
  } catch (error) {
    console.error("Failed to query single pending reading:", error);
    return null;
  }
};

/**
 * Retrieves temporary meter reading record from tmp_rmt_rdngs by Account Number.
 */
export const getTmpReading = (accountNumber: string): TmpRmtReading | null => {
  try {
    return db.getFirstSync<TmpRmtReading>(
      `SELECT * FROM tmp_rmt_rdngs WHERE accountNumber = ?`,
      [accountNumber]
    );
  } catch (error) {
    console.error("Failed to query tmp_rmt_rdngs record:", error);
    return null;
  }
};

/**
 * Retrieves all saved records from tmp_rmt_rdngs.
 */
export const getAllTmpReadingsFromDB = (): TmpRmtReading[] => {
  try {
    return db.getAllSync<TmpRmtReading>(
      `SELECT * FROM tmp_rmt_rdngs ORDER BY createdAt DESC`
    );
  } catch (error) {
    console.error("Failed to fetch tmp_rmt_rdngs:", error);
    return [];
  }
};

/**
 * Persists the manual meter readings for a customer (legacy single-sequence).
 * Saves to tmp_rmt_rdngs instead of pending_readings.
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
  updatePendingReading(accountNumber, installationId, {
    r1: readings.r1,
    r2: readings.r2,
    r3: readings.r3,
    kva: readings.kva,
    kvah: readings.kvah,
    remarks: null,
    readingDate: readings.readingDate,
  });
};

/**
 * Persists multi-sequence meter readings for net-type customers into tmp_rmt_rdngs.
 * Keeps pending_readings table unchanged.
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
    `INSERT INTO tmp_rmt_rdngs (
      accountNumber, installationId, readingDate, currentReading,
      imp_r1, imp_r2, imp_r3, imp_kva, imp_kvah,
      exp_r1, exp_r2, exp_r3, exp_kva, exp_kvah,
      imp_exp_r1, imp_exp_r2, imp_exp_r3, imp_exp_kva, imp_exp_kvah,
      syncStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    ON CONFLICT(accountNumber) DO UPDATE SET
      installationId = excluded.installationId,
      readingDate    = excluded.readingDate,
      currentReading = excluded.currentReading,
      imp_r1         = excluded.imp_r1,
      imp_r2         = excluded.imp_r2,
      imp_r3         = excluded.imp_r3,
      imp_kva        = excluded.imp_kva,
      imp_kvah       = excluded.imp_kvah,
      exp_r1         = excluded.exp_r1,
      exp_r2         = excluded.exp_r2,
      exp_r3         = excluded.exp_r3,
      exp_kva        = excluded.exp_kva,
      exp_kvah       = excluded.exp_kvah,
      imp_exp_r1     = excluded.imp_exp_r1,
      imp_exp_r2     = excluded.imp_exp_r2,
      imp_exp_r3     = excluded.imp_exp_r3,
      imp_exp_kva    = excluded.imp_exp_kva,
      imp_exp_kvah   = excluded.imp_exp_kvah,
      syncStatus     = 'PENDING'`,
    [
      accountNumber,
      installationId || null,
      data.readingDate,
      currentReading,
      data.imp_r1 ?? null,
      data.imp_r2 ?? null,
      data.imp_r3 ?? null,
      data.imp_kva ?? null,
      data.imp_kvah ?? null,
      data.exp_r1 ?? null,
      data.exp_r2 ?? null,
      data.exp_r3 ?? null,
      data.exp_kva ?? null,
      data.exp_kvah ?? null,
      data.imp_exp_r1 ?? null,
      data.imp_exp_r2 ?? null,
      data.imp_exp_r3 ?? null,
      data.imp_exp_kva ?? null,
      data.imp_exp_kvah ?? null,
    ]
  );
};

/**
 * Clears the pending readings and tmp_rmt_rdngs tables.
 */
export const clearPendingReadings = (): void => {
  db.execSync(`DELETE FROM pending_readings`);
  db.execSync(`DELETE FROM tmp_rmt_rdngs`);
};

