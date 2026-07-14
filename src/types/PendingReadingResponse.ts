import { PendingReading } from "./PendingReading";

export interface PendingReadingResponse {
  success: boolean;
  pending_readings: PendingReading[];
}