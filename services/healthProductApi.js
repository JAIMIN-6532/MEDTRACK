import api from '../utils/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a health product
export const createHealthProduct = async (healthProductDto) => {
    try {
        const res = await api.post('/health-product/createHealthProduct', healthProductDto);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Update a health product
export const updateHealthProduct = async (id, dto) => {
    try {
        const res = await api.put(`/health-product/${id}`, dto);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Delete a health product
export const deleteHealthProduct = async (id) => {
    try {
        const res = await api.delete(`/health-product/${id}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get a single health product by ID
export const getHealthProductById = async (id) => {
    try {
        const res = await api.get(`/health-product/${id}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get active health products for a user
export const getActiveHealthProducts = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id: userId } = JSON.parse(userData);
        const res = await api.get(`/health-product/user/${userId}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get all health products for a user
export const getAllHealthProducts = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id: userId } = JSON.parse(userData);
        const res = await api.get(`/health-product/user/${userId}/all`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get low stock health products for a user
export const getLowStockHealthProducts = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id: userId } = JSON.parse(userData);
        const res = await api.get(`/health-product/user/${userId}/low-stock`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Record medicine usage for a product
export const recordMedicineUsage = async (id) => {
    try {
        const res = await api.post(`/health-product/${id}/record-usage`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
