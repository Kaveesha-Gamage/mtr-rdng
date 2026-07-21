import apiClient from "./apiClient";
import { PendingReadingResponse } from "../types/PendingReadingResponse";
import { PendingReadingRequest } from "../types/PendingReadingRequest";

export const getPendingReadings = async (
    request: PendingReadingRequest
) => {
    console.log("[pendingApi] GET request to /reading-status/area/" + request.area_code + "/pending", request);
    const response = await apiClient.get<PendingReadingResponse>(
        `/reading-status/area/${request.area_code}/pending`,
        {
            params: {
                session_id: request.session_id,
                user_id: request.user_id,
            },
        }
    );

    console.log("[pendingApi] GET response status:", response.status, response.data);
    return response.data;
};