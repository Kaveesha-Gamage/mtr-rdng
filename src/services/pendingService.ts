import { getPendingReadings } from "../api/pendingApi";
import { getSession } from "../storage/secureStore";
import {
  savePendingReadings,
  clearPendingReadings,
  getPendingReadingsFromDB,
} from "../database/pendingRepository";
import { PendingReadingResponse } from "../types/PendingReadingResponse";
import { PendingReading } from "../types/PendingReading";
import { saveLastSyncTime, getLastSyncTime } from "../storage/syncStore";

/**
 * How old the local data can be before a background sync is triggered (15 minutes).
 */
const SYNC_THRESHOLD_MS = 15 * 60 * 1000;

const extractAccountNumber = (item: any): string => {
  if (!item || typeof item !== "object") return "";

  const keys = Object.keys(item);
  for (const key of keys) {
    const lower = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      lower.includes("accnbr") ||
      lower.includes("accountnbr") ||
      lower === "accno" ||
      lower === "accountno" ||
      lower === "accountnumber" ||
      lower === "accnumber" ||
      lower === "acctno" ||
      lower === "acctnumber" ||
      lower === "accountid" ||
      lower === "accnum" ||
      lower === "account" ||
      lower === "contractno" ||
      lower === "custaccno" ||
      lower === "customeraccno"
    ) {
      const val = item[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
  }

  for (const key of keys) {
    if (typeof item[key] === "object" && item[key] !== null) {
      const nestedAcc = extractAccountNumber(item[key]);
      if (nestedAcc) return nestedAcc;
    }
  }

  return "";
};

const extractInstallationId = (item: any, fallbackIndex: number): string => {
  if (!item || typeof item !== "object") return String(fallbackIndex + 1);

  const keys = Object.keys(item);
  for (const key of keys) {
    const lower = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      lower === "installationid" ||
      lower === "instid" ||
      lower === "installationno" ||
      lower === "instno" ||
      lower === "installation"
    ) {
      const val = item[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
  }
  return String(fallbackIndex + 1);
};

const mapToPendingReading = (
  item: any,
  index: number,
  parentAreaCode?: string,
  parentAreaName?: string
): PendingReading => {
  const accNo = extractAccountNumber(item);
  const instId = extractInstallationId(item, index);

  if (!accNo) {
    console.warn(
      `[pendingService] Record ${index} missing account number! Available keys:`,
      Object.keys(item),
      "Item:",
      JSON.stringify(item)
    );
  }

  return {
    accountNumber: accNo,
    installationId: instId,
    customerName: String(
      item.customerName ??
        item.customer_name ??
        item.cust_name ??
        item.name ??
        item.cust_nam ??
        ""
    ).trim(),
    tariff: String(item.tariff ?? "").trim(),
    readerCode: String(item.readerCode ?? item.reader_code ?? item.reader_cd ?? "").trim(),
    dailyPack: String(item.dailyPack ?? item.daily_pack ?? item.daily_pk ?? "").trim(),
    walkOrder: String(item.walkOrder ?? item.walk_order ?? item.walk_seq ?? item.walk_ord ?? index + 1).trim(),
    currentBillCycle: String(
      item.currentBillCycle ??
        item.current_bill_cycle ??
        item.active_bill_cycle ??
        item.bill_cycle ??
        ""
    ).trim(),
    billCycleDate: String(item.billCycleDate ?? item.bill_cycle_date ?? item.bill_date ?? "").trim(),
    areaCode: String(item.areaCode ?? item.area_code ?? parentAreaCode ?? "").trim(),
    areaName: String(item.areaName ?? item.area_name ?? parentAreaName ?? "").trim(),
    customerCategory: String(item.customerCategory ?? item.customer_category ?? item.cust_cat ?? "").trim(),
    customerType: String(item.customerType ?? item.customer_type ?? item.cust_type ?? "").trim(),
    netType: String(item.netType ?? item.net_type ?? "").trim(),
    netTypeName: String(item.netTypeName ?? item.net_type_name ?? item.net_type_desc ?? "").trim(),
    readingDate:
      item.readingDate !== undefined
        ? item.readingDate
        : (item.reading_date ?? item.rdg_date ?? null),
    previousReadingDate: String(
      item.previousReadingDate ?? item.previous_reading_date ?? item.prev_rdg_date ?? ""
    ).trim(),
    numberOfDays: Number(item.numberOfDays ?? item.number_of_days ?? item.no_of_days ?? 0),
    meterSequence: Number(item.meterSequence ?? item.meter_sequence ?? item.meter_seq ?? 0),
    bfBalance: Number(item.bfBalance ?? item.bf_balance ?? item.bf_bal ?? 0),
    vatApplicable: String(item.vatApplicable ?? item.vat_applicable ?? item.vat_app ?? "").trim(),
    totalMeters: Number(item.totalMeters ?? item.total_meters ?? item.tot_meters ?? 0),
    currentReading: item.currentReading,
    remarks: item.remarks,
    syncStatus: item.syncStatus,
    r1: item.r1 ?? item.r_1 ?? null,
    r2: item.r2 ?? item.r_2 ?? null,
    r3: item.r3 ?? item.r_3 ?? null,
    kva: item.kva ?? item.kva_val ?? null,
    kvah: item.kvah ?? item.kvah_val ?? null,
  };
};

/**
 * Full sync cycle:
 *  1. Fetch fresh data from the API.
 *  2. Clear the existing local records.
 *  3. Persist the new records to SQLite.
 *  4. Read everything back from SQLite and return it.
 *
 * On network failure, returns whatever is already cached in SQLite.
 */
export const downloadPendingReadings = async (): Promise<{
  success: boolean;
  pending_readings: PendingReading[];
}> => {
  try {
    const session = await getSession();

    if (!session) {
      throw new Error("User is not logged in.");
    }

    const request = {
      session_id:     session.sessionId,
      user_id:        session.userId,
      area_code:      session.areaCode,
      bill_cycle:     session.activeBillCycle,
      account_number: null,
    };

    console.log("[pendingService] Initiating download with request:", request);

    // Step 1: Download from the API.
    const response = await getPendingReadings(request);

    if (!response || !response.success || !response.pending_readings) {
      throw new Error(
        `API returned an unsuccessful response: ${JSON.stringify(response)}`
      );
    }

    // Step 2: Normalise API keys to camelCase.
    const parentAreaCode = Array.isArray(response.pending_readings)
      ? response.area_code
      : response.pending_readings?.area_code ?? response.area_code;
    const parentAreaName = Array.isArray(response.pending_readings)
      ? undefined
      : response.pending_readings?.area_name;

    const rawReadings = Array.isArray(response.pending_readings)
      ? response.pending_readings
      : response.pending_readings?.pending_customers ?? [];

    console.log(`[pendingService] Downloaded ${rawReadings.length} pending records.`);
    if (rawReadings.length > 0) {
      console.log("[pendingService] Sample raw record 0:", JSON.stringify(rawReadings[0]));
    }

    const mappedReadings = rawReadings.map((item: any, index: number) =>
      mapToPendingReading(item, index, parentAreaCode, parentAreaName)
    );

    // Step 3: Clear old local records so the SQLite table always reflects the
    //         latest server state for this session.
    clearPendingReadings();

    // Step 4: Persist the fresh records.
    savePendingReadings(mappedReadings);

    // Step 5: Record the successful sync timestamp.
    await saveLastSyncTime();

    // Step 6: Read back from SQLite — the UI always renders SQLite data.
    const localReadings = getPendingReadingsFromDB();
    console.log(`[pendingService] Successfully persisted to SQLite. DB count: ${localReadings.length}`);

    return {
      success: true,
      pending_readings: localReadings,
    };
  } catch (error) {
    console.warn(
      "Download Pending Readings failed — falling back to local cache:",
      error
    );

    // Offline fallback: return whatever is already stored in SQLite.
    try {
      const localReadings = getPendingReadingsFromDB();
      return {
        success: localReadings.length > 0,
        pending_readings: localReadings,
      };
    } catch (dbError) {
      console.error("Local database fallback also failed:", dbError);
      throw error;
    }
  }
};

/**
 * Fetches fresh data from the API and **merges** it into the local SQLite database
 * without clearing existing records. User-entered readings (currentReading, r1, etc.)
 * are preserved because savePendingReadings uses ON CONFLICT DO UPDATE and only
 * updates server-owned columns.
 *
 * @returns The updated list of pending readings from SQLite, or null on failure.
 */
const mergeFromApi = async (): Promise<PendingReading[] | null> => {
  try {
    const session = await getSession();
    if (!session) return null;

    const request = {
      session_id:     session.sessionId,
      user_id:        session.userId,
      area_code:      session.areaCode,
      bill_cycle:     session.activeBillCycle,
      account_number: null,
    };

    console.log("[pendingService] Background sync: fetching from API...");
    const response = await getPendingReadings(request);

    if (!response || !response.success || !response.pending_readings) {
      console.warn("[pendingService] Background sync: API returned unsuccessful response.");
      return null;
    }

    const parentAreaCode = Array.isArray(response.pending_readings)
      ? response.area_code
      : response.pending_readings?.area_code ?? response.area_code;
    const parentAreaName = Array.isArray(response.pending_readings)
      ? undefined
      : response.pending_readings?.area_name;

    const rawReadings = Array.isArray(response.pending_readings)
      ? response.pending_readings
      : response.pending_readings?.pending_customers ?? [];

    const mappedReadings = rawReadings.map((item: any, index: number) =>
      mapToPendingReading(item, index, parentAreaCode, parentAreaName)
    );

    // Merge (UPSERT) — does NOT wipe user readings.
    savePendingReadings(mappedReadings);

    // Save the new sync timestamp.
    await saveLastSyncTime();

    const localReadings = getPendingReadingsFromDB();
    console.log(`[pendingService] Background sync complete. DB count: ${localReadings.length}`);
    return localReadings;
  } catch (error) {
    console.warn("[pendingService] Background sync failed (network issue?):", error);
    return null;
  }
};

/**
 * Triggers a background re-sync only when the local data is older than
 * SYNC_THRESHOLD_MS. Safe to call on every screen focus — it is a no-op
 * when the cache is still fresh.
 *
 * @param onSynced  Callback invoked with the refreshed readings if the sync ran.
 *                  Not called when the cache is still fresh or on failure.
 */
export const syncIfStale = async (
  onSynced: (readings: PendingReading[]) => void
): Promise<void> => {
  const lastSync = await getLastSyncTime();
  const now = Date.now();

  if (lastSync !== null && now - lastSync < SYNC_THRESHOLD_MS) {
    const ageMinutes = ((now - lastSync) / 60000).toFixed(1);
    console.log(`[pendingService] Cache is fresh (${ageMinutes} min old). Skipping sync.`);
    return;
  }

  const ageLabel = lastSync === null ? "never synced" : `${((now - lastSync) / 60000).toFixed(1)} min old`;
  console.log(`[pendingService] Cache is stale (${ageLabel}). Starting background sync...`);

  const freshReadings = await mergeFromApi();
  if (freshReadings !== null) {
    onSynced(freshReadings);
  }
};
