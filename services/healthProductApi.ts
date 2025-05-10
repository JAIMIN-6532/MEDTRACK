import { AxiosError } from 'axios';
import api from '../utils/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a health product
export const createHealthProduct = async (healthProductDto: any) => {
    try {
        const res = await api.post('/health-product/createHealthProduct', healthProductDto);
        return res.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw error.response?.data || error.message;
        }
        throw new Error('An unexpected error occurred while creating the health product');
    }
};

// Update a health product
export const updateHealthProduct = async (id: string, dto: any) => {
    try {
        const res = await api.put(`/health-product/${id}`, dto);
        return res.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw error.response?.data || error.message;
        }
        throw new Error('An unexpected error occurred while updating the health product');
    }
};

// Delete a health product
export const deleteHealthProduct = async (id: string) => {
    try {
        const res = await api.delete(`/health-product/${id}`);
        return res.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw error.response?.data || error.message;
        }
        throw new Error('An unexpected error occurred while deleting the health product');
    }
};

// Get a single health product by ID
export const getHealthProductById = async (id: string) => {
    try {
        const res = await api.get(`/health-product/${id}`);
        return res.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw error.response?.data || error.message;
        }
        throw new Error('An unexpected error occurred while fetching the health product');
    }
};

// Get active health products for a user
export const getActiveHealthProducts = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id: userId } = JSON.parse(userData || '{}');
        const res = await api.get(`/health-product/user/${userId}`);
        return res.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw error.response?.data || error.message;
        }
        throw new Error('An unexpected error occurred while fetching active health products');
    }
};

// Get all health products for a user
export const getAllHealthProducts = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id: userId } = JSON.parse(userData || '{}');
        const res = await api.get(`/health-product/user/${userId}/all`);
        return res.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw error.response?.data || error.message;
        }
        throw new Error('An unexpected error occurred while fetching all health products');
    }
};

// Get low stock health products for a user
export const getLowStockHealthProducts = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id: userId } = JSON.parse(userData || '{}');
        const res = await api.get(`/health-product/user/${userId}/low-stock`);
        return res.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw error.response?.data || error.message;
        }
        throw new Error('An unexpected error occurred while fetching low stock health products');
    }
};

// Record medicine usage for a product
export const recordMedicineUsage = async (id: string) => {
    try {
        const res = await api.post(`/health-product/${id}/record-usage`);
        return res.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw error.response?.data || error.message;
        }
        throw new Error('An unexpected error occurred while recording medicine usage');
    }
};
