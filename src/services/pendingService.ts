import { getPendingReadings } from "../api/pendingApi";
import { getSession } from "../storage/secureStore";


export const downloadPendingReadings = async () => {

  try {

    const session = await getSession();


    if (!session) {
      throw new Error(
        "User is not logged in."
      );
    }


    const request = {
      session_id: session.sessionId,
      user_id: session.userId,
      area_code: session.areaCode,
      account_number: null,
    };


    const response =
      await getPendingReadings(request);


    return response;


  } catch(error){

    console.log(
      "Download Pending Readings Error:",
      error
    );

    throw error;
  }

};