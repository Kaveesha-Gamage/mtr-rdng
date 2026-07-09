import apiClient from "./apiClient";

import {
    LoginRequest,
    LoginResponse
} from "../types/Auth";


export const loginApi = async(
    data: LoginRequest
):Promise<LoginResponse> => {


    const response =
        await apiClient.post<LoginResponse>(
            "/secinfo/login",
            data
        );


    return response.data;

};