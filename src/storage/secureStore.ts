import * as SecureStore from "expo-secure-store";
import { Session } from "../types/Session";

const SESSION_KEY = "session";

export async function saveSession(session: Session) {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify(session)
  );
}

export async function getSession(): Promise<Session | null> {
  const data = await SecureStore.getItemAsync(SESSION_KEY);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}