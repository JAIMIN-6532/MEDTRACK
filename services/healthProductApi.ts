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

// Helper to get user ID from AsyncStorage
const getUserId = async (): Promise<string> => {
    const userData = await AsyncStorage.getItem('userData');
    const parsed = JSON.parse(userData || '{}');
    if (!parsed.id) throw new Error('User not found in storage');
    return parsed.id;
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

// Record usage
export const recordMedicineUsage = async (id: string): Promise<void> => {
    try {
        await api.post(`/health-product/${id}/record-usage`);
    } catch (error) {
        handleApiError(error);
    }
};
