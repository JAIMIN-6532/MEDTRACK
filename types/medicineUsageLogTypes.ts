// Add this to your existing types file (types/medicineUsageLogTypes.ts)
// Keep all your existing types exactly as they are:

export interface LogData {
    userId: number;
    healthProductId: number;
    isTaken: boolean;
    createdAt: string;
}

export interface NotificationData {
    userId: number | string;  // ✅ Allow both types for flexibility
    healthProductId: number | string;  // ✅ Allow both types for flexibility
    createdAt: string;
    notificationId: string;
    // Add the missing properties here:
    medicineName?: string;
    doseQuantity?: number;
    unit?: string;
}


// export interface NotificationData extends Omit<LogData, 'isTaken'> {
//     notificationId: string;
//     // Add the missing properties here:
//     medicineName?: string;
//     doseQuantity?: number;
//     unit?: string;
// }

export interface MedicineUsageSummaryDto {
    healthProductId: string;
    healthProductName: string;
    takenCount: number;
    missedCount: number;
}

export type MedicineLogResponse = MedicineUsageSummaryDto[];