export interface PendingReading {
  // API fields (from /reading-status/area/{code}/pending → pending_customers)
  accountNumber: string;
  customerName?: string;
  addressL1?: string;
  areaCode?: string;
  billCycle?: number;
  tariff?: string;
  mobileNo?: string;
  telNbr?: string | null;
  custType?: string;
  netType?: string;
  netTypeName?: string;
  hasReading?: boolean | number;

  // Mobile App fields (not returned by API — entered/managed locally)
  currentReading?: number | null;
  remarks?: string | null;
  syncStatus?: "PENDING" | "SYNCED";
}