import { getPendingReadings } from "../api/pendingApi";
import { getSession } from "../storage/secureStore";
import {
  savePendingReadings,
  clearPendingReadings,
  getPendingReadingsFromDB,
} from "../database/pendingRepository";
import { PendingReadingResponse } from "../types/PendingReadingResponse";
import { PendingReading } from "../types/PendingReading";

/**
 * Defensive mapper that normalises snake_case API keys into the camelCase
 * properties expected by the TypeScript models and SQLite schema.
 */
const mapToPendingReading = (item: any): PendingReading => {
  return {
    accountNumber:      item.accountNumber     ?? item.account_number      ?? "",
    tariff:             item.tariff             ?? "",
    readerCode:         item.readerCode         ?? item.reader_code         ?? "",
    dailyPack:          item.dailyPack           ?? item.daily_pack          ?? "",
    walkOrder:          item.walkOrder           ?? item.walk_order          ?? "",
    currentBillCycle:   item.currentBillCycle    ?? item.current_bill_cycle  ?? "",
    billCycleDate:      item.billCycleDate       ?? item.bill_cycle_date     ?? "",
    areaCode:           item.areaCode            ?? item.area_code           ?? "",
    areaName:           item.areaName            ?? item.area_name           ?? "",
    installationId:     item.installationId      ?? item.installation_id     ?? "",
    customerCategory:   item.customerCategory    ?? item.customer_category   ?? "",
    customerType:       item.customerType        ?? item.customer_type       ?? "",
    netType:            item.netType             ?? item.net_type            ?? "",
    netTypeName:        item.netTypeName         ?? item.net_type_name       ?? "",
    readingDate:        item.readingDate !== undefined
                          ? item.readingDate
                          : (item.reading_date ?? null),
    previousReadingDate: item.previousReadingDate ?? item.previous_reading_date ?? "",
    numberOfDays:       Number(item.numberOfDays   ?? item.number_of_days   ?? 0),
    meterSequence:      Number(item.meterSequence  ?? item.meter_sequence   ?? 0),
    bfBalance:          Number(item.bfBalance      ?? item.bf_balance       ?? 0),
    vatApplicable:      item.vatApplicable      ?? item.vat_applicable      ?? "",
    totalMeters:        Number(item.totalMeters    ?? item.total_meters     ?? 0),
    currentReading:     item.currentReading,
    remarks:            item.remarks,
    syncStatus:         item.syncStatus,
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
export const downloadPendingReadings = async (): Promise<PendingReadingResponse> => {
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

    // Step 1: Download from the API.
    const response = await getPendingReadings(request);

    if (!response || !response.success || !response.pending_readings) {
      throw new Error(
        `API returned an unsuccessful response: ${JSON.stringify(response)}`
      );
    }

    // Step 2: Normalise API keys to camelCase.
    const mappedReadings = response.pending_readings.map(mapToPendingReading);

    // Step 3: Clear old local records so the SQLite table always reflects the
    //         latest server state for this session.
    clearPendingReadings();

    // Step 4: Persist the fresh records.
    savePendingReadings(mappedReadings);

    // Step 5: Read back from SQLite — the UI always renders SQLite data.
    const localReadings = getPendingReadingsFromDB();

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