import * as SecureStore from "expo-secure-store";

const LAST_SYNC_KEY = "pending_readings_last_sync";

/**
 * Persists the current time as the last successful sync timestamp.
 */
export async function saveLastSyncTime(): Promise<void> {
  await SecureStore.setItemAsync(LAST_SYNC_KEY, String(Date.now()));
}

/**
 * Returns the Unix timestamp (ms) of the last successful sync, or null if never synced.
 */
export async function getLastSyncTime(): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(LAST_SYNC_KEY);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Clears the stored sync timestamp (e.g. on logout).
 */
export async function clearLastSyncTime(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_SYNC_KEY);
}
