export interface PendingReading {
  accountNumber: string;
  tariff: string;
  readerCode: string;
  dailyPack: string;
  walkOrder: string;
  currentBillCycle: string;
  billCycleDate: string;
  areaCode: string;
  areaName: string;
  installationId: string;
  customerCategory: string;
  customerType: string;
  netType: string;
  netTypeName: string;
  readingDate: string | null;
  previousReadingDate: string;
  numberOfDays: number;
  meterSequence: number;
  bfBalance: number;
  vatApplicable: string;
  totalMeters: number;
  customerName?: string;

  // Mobile App fields (not returned by API)
  currentReading?: number;
  remarks?: string;
  syncStatus?: "PENDING" | "SYNCED";

  // Legacy single-sequence fields (kept for backward compatibility)
  r1?: number;
  r2?: number;
  r3?: number;
  kva?: number;
  kvah?: number;

  // Import meter readings (mtr_seq = 1) — Net Metering / Net Accounting / Net++ / Net+
  imp_r1?: number | null;
  imp_r2?: number | null;
  imp_r3?: number | null;
  imp_kva?: number | null;
  imp_kvah?: number | null;

  // Export meter readings (mtr_seq = 2) — Net Metering / Net Accounting / Net++ / Net+
  exp_r1?: number | null;
  exp_r2?: number | null;
  exp_r3?: number | null;
  exp_kva?: number | null;
  exp_kvah?: number | null;

  // Import-in-Export meter readings (mtr_seq = 3) — Net+ only
  imp_exp_r1?: number | null;
  imp_exp_r2?: number | null;
  imp_exp_r3?: number | null;
  imp_exp_kva?: number | null;
  imp_exp_kvah?: number | null;
}