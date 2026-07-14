import apiClient from "./apiClient";
import { PendingReadingResponse } from "../types/PendingReadingResponse";
import { PendingReadingRequest } from "../types/PendingReadingRequest";


export const getPendingReadings = async (
    request: PendingReadingRequest
) => {

    const response =
        await apiClient.post<PendingReadingResponse>(
            "/pending-meter-readings/area/active",
            request
        );


    return response.data;
};