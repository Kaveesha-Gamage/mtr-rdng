import { PendingReading } from "./PendingReading";

export interface PendingReadingResponse {
  success: boolean;
  pending_count?: number;
  area_code?: string;
  pending_readings:
    | PendingReading[]
    | {
        area_code?: string;
        area_name?: string;
        active_bill_cycle?: number;
        pending_customers?: PendingReading[];
      };
}