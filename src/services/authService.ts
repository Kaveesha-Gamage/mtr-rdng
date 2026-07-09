import {loginApi} from "../api/authApi";
import {LoginRequest} from "../types/Auth";
import {saveSecureData} from "../storage/secureStore";

export const loginService = async(data:LoginRequest)=>{
    const response =
        await loginApi(data);

    if(response.success){

        await saveSecureData(
            "session_id",
            response.session_id
        );

        await saveSecureData(
            "user_info",
            JSON.stringify(
                response.user_info
            )
        );

        await saveSecureData(
            "bill_cycle",
            JSON.stringify(
                response.bill_cycles[0]
            )
        );
    }
    return response;
};