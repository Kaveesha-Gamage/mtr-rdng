export interface PendingReadingRequest {

    session_id: string;

    user_id: string;

    area_code: string;

    bill_cycle: number;

    account_number: string | null;

}