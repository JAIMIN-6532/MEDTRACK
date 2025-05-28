// Add this to your existing types file (types/medicineUsageLogTypes.ts)
// Keep all your existing types exactly as they are:

export interface LogData {
    userId: string;
    healthProductId: string;
    isTaken: boolean;
    createdAt: string;
}

export interface NotificationData extends Omit<LogData, 'isTaken'> {
    notificationId: string;
    // Add the missing properties here:
    medicineName?: string;
    doseQuantity?: number;
    unit?: string;
}

export interface MedicineUsageSummaryDto {
    healthProductId: string;
    healthProductName: string;
    takenCount: number;
    missedCount: number;
}

export type MedicineLogResponse = MedicineUsageSummaryDto[];