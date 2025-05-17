export interface LogData {
    userId: string;
    healthProductId: string;
    isTaken: boolean;
    createdAt: string;
}

export interface MedicineUsageSummaryDto {
    healthProductId: string;
    healthProductName: string;
    takenCount: number;
    missedCount: number;
}

export type MedicineLogResponse = MedicineUsageSummaryDto[];
