import { loginApi } from "../api/authApi";
import { LoginRequest } from "../types/Auth";
import { Session } from "../types/Session";
import { saveSession, clearSession } from "../storage/secureStore";

export const loginService = async (
  data: LoginRequest
) => {
  const response = await loginApi(data);

  if (response.success) {

    const session: Session = {
      sessionId: response.session_id,
      userId: response.user_info.user_id,
      userName: response.user_info.user_name,
      areaCode: response.user_info.area_code,
      provinceCode: response.user_info.province_code,
      regionCode: response.user_info.region_code,
      activeBillCycle: response.bill_cycles[0].active_bill_cycle,
      expiresAt: response.expires_at,
      loginTime: response.login_time,
    };

    await saveSession(session);
  }

  return response;
};

export const logout = async () => {
  await clearSession();
};