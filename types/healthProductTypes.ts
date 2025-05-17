export interface HealthProductRequestDto {
    userId: string;
    healthProductName: string;
    totalQuantity: number;
    availableQuantity: number;
    thresholdQuantity: number;
    doseQuantity: number;
    unit: string;
    expiryDate: string;
    reminderTimes: string[];
}

export interface HealthProductResponseDto {
    healthProductId: string;
    healthProductName: string;
    totalQuantity: number;
    availableQuantity: number;
    thresholdQuantity: number;
    doseQuantity: number;
    unit: string;
    expiryDate: string;
    reminderTimes: string[];
    createdAt: string;
}
