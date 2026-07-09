export interface LoginRequest {
  user_id: string;
  password: string;
}

export interface UserInfo {
  user_category: string;
  user_id: string;
  user_name: string;
  area_code: string;
  province_code: string;
  region_code: string;
}

export interface BillCycle {
  area_code: string;
  area_name: string;
  province_code: string;
  province_name: string;
  region_code: string;
  active_bill_cycle: number;
  has_bill_cycle: boolean;
}

export interface LoginResponse {
  expires_at: string;
  bill_cycles: BillCycle[];
  user_info: UserInfo;
  success: boolean;
  login_time: string;
  session_id: string;
  message: string;
}