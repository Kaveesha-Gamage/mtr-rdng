export interface Session {
  sessionId: string;
  userId: string;
  userName: string;
  areaCode: string;
  provinceCode: string;
  regionCode: string;
  activeBillCycle: number;
  expiresAt: string;
  loginTime: string;
}