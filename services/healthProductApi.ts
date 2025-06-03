// Improved services/healthProductApi.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    HealthProductRequestDto,
    HealthProductResponseDto,
} from '../types/healthProductTypes';
import api from '../utils/axiosInstance';
import { handleApiError } from '../utils/handleApiError';

// Create
export const createHealthProduct = async (
    dto: HealthProductRequestDto
): Promise<HealthProductResponseDto> => {
    try {
        const res = await api.post<HealthProductResponseDto>('/health-product/createHealthProduct', dto);
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// Update
export const updateHealthProduct = async (
    id: string,
    dto: HealthProductRequestDto
): Promise<HealthProductResponseDto> => {
    try {
        const res = await api.put<HealthProductResponseDto>(`/health-product/${id}`, dto);
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// Delete
export const deleteHealthProduct = async (id: string): Promise<void> => {
    try {
        await api.delete(`/health-product/${id}`);
    } catch (error) {
        handleApiError(error);
    }
};

// Get HealthProduct by ID
export const getHealthProductById = async (id: string): Promise<HealthProductResponseDto> => {
    try {
        const res = await api.get<HealthProductResponseDto>(`/health-product/${id}`);
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// Helper to get user ID from AsyncStorage with proper type conversion
const getUserId = async (): Promise<number> => {
    const userData = await AsyncStorage.getItem('userData');
    const parsed = JSON.parse(userData || '{}');

    if (!parsed.id) throw new Error('User not found in storage');

    // ✅ Convert to number if it's a string
    const userId = typeof parsed.id === 'string' ? parseInt(parsed.id, 10) : parsed.id;
    if (isNaN(userId)) throw new Error('Invalid user ID format');

    return userId;
};

// Get active
export const getActiveHealthProducts = async (): Promise<HealthProductResponseDto[]> => {
    try {
        const userId = await getUserId();
        const res = await api.get<HealthProductResponseDto[]>(`/health-product/user/${userId}`);
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// Get all
export const getAllHealthProducts = async (): Promise<HealthProductResponseDto[]> => {
    try {
        const userId = await getUserId();
        const res = await api.get<HealthProductResponseDto[]>(`/health-product/user/${userId}/all`);
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// Get low stock
export const getLowStockHealthProducts = async (): Promise<HealthProductResponseDto[]> => {
    try {
        const userId = await getUserId();
        const res = await api.get<HealthProductResponseDto[]>(`/health-product/user/${userId}/low-stock`);
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

// ✅ Improved record usage with better error handling
export const recordMedicineUsage = async (id: string): Promise<void> => {
    try {
        console.log(`📦 Recording medicine usage for health product ID: ${id}`);

        // ✅ Ensure ID is properly formatted
        const healthProductId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(healthProductId)) {
            throw new Error('Invalid health product ID format');
        }

        const response = await api.post(`/health-product/${healthProductId}/record-usage`);
        console.log('✅ Medicine usage recorded successfully:', response.status);

    } catch (error: any) {
        console.error('❌ Failed to record medicine usage:', error);

        // ✅ Improve error handling with specific error types
        if (error?.response?.data?.errors?.error) {
            const errorMessage = error.response.data.errors.error;

            if (errorMessage.includes('Insufficient quantity')) {
                throw new Error('Insufficient quantity available for dose');
            } else if (errorMessage.includes('not found')) {
                throw new Error('Medicine not found');
            } else {
                throw new Error(errorMessage);
            }
        }

        handleApiError(error);
        throw error;
    }
};