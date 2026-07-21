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
}