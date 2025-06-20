export interface HealthProductRequestDto {
    userId: number; // Changed from string to number to match backend
    healthProductName: string;
    totalQuantity: number;
    availableQuantity?: number; // Optional for create
    thresholdQuantity: number;
    doseQuantity: number;
    unit: string;
    expiryDate: string; // ISO date string (YYYY-MM-DD)
    reminderTimes: string[]; // Array of time strings (HH:mm)
}

export interface HealthProductResponseDto {
    healthProductId: number; // Changed from string to number
    healthProductName: string;
    totalQuantity: number;
    availableQuantity: number;
    thresholdQuantity: number;
    doseQuantity: number;
    unit: string;
    expiryDate: string; // ISO date string
    reminderTimes: string[];
    createdAt?: string; // Optional, added for consistency
}

// Additional helper types for better type safety
export interface CreateHealthProductRequest {
    healthProductName: string;
    totalQuantity: number;
    thresholdQuantity: number;
    doseQuantity: number;
    unit: 'mg' | 'ml' | 'pills' | 'drops'; // Enum for units
    expiryDate: string;
    reminderTimes: string[];
}

export interface UpdateHealthProductRequest extends Partial<CreateHealthProductRequest> {
    availableQuantity?: number;
}

export interface HealthProductStats {
    totalProducts: number;
    activeProducts: number;
    expiredProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

// Stock status enum
export enum StockStatus {
    ACTIVE = 'active',
    LOW_STOCK = 'low_stock',
    OUT_OF_STOCK = 'out_of_stock',
    EXPIRED = 'expired'
}

// Helper type for medicine reminders
export interface MedicineReminder {
    id?: number;
    time: string; // HH:mm format
    isActive: boolean;
}