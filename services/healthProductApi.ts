import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    HealthProductRequestDto,
    HealthProductResponseDto,
    CreateHealthProductRequest,
} from '../types/healthProductTypes';
import api from '../utils/axiosInstance';
import { handleApiError } from '../utils/handleApiError';

// Helper to get user ID with proper type conversion
const getUserId = async (): Promise<number> => {
    const userData = await AsyncStorage.getItem('userData');
    const parsed = JSON.parse(userData || '{}');

    if (!parsed.id && !parsed.userId) {
        throw new Error('User not found in storage');
    }

    // Handle both id and userId fields for backward compatibility
    const userId = parsed.userId || parsed.id;
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    if (isNaN(numericUserId)) {
        throw new Error('Invalid user ID format');
    }

    return numericUserId;
};

// Create a new health product
export const createHealthProduct = async (
    dto: CreateHealthProductRequest
): Promise<HealthProductResponseDto> => {
    try {
        const userId = await getUserId();

        const requestDto: HealthProductRequestDto = {
            userId,
            healthProductName: dto.healthProductName,
            totalQuantity: dto.totalQuantity,
            availableQuantity: dto.totalQuantity, // Initially equal to total
            thresholdQuantity: dto.thresholdQuantity,
            doseQuantity: dto.doseQuantity,
            unit: dto.unit,
            expiryDate: dto.expiryDate,
            reminderTimes: dto.reminderTimes,
        };

        console.log('📦 Creating health product:', requestDto);
        const response = await api.post<HealthProductResponseDto>('/health-product/createHealthProduct', requestDto);

        console.log('✅ Health product created successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Failed to create health product:', error);
        handleApiError(error);
        throw error;
    }
};

// Update an existing health product
export const updateHealthProduct = async (
    id: string | number,
    dto: Partial<HealthProductRequestDto>
): Promise<HealthProductResponseDto> => {
    try {
        const userId = await getUserId();
        const healthProductId = typeof id === 'string' ? parseInt(id, 10) : id;

        if (isNaN(healthProductId)) {
            throw new Error('Invalid health product ID');
        }

        const updateDto = {
            userId,
            ...dto,
        };

        console.log('📝 Updating health product:', healthProductId, updateDto);
        const response = await api.put<HealthProductResponseDto>(`/health-product/${healthProductId}`, updateDto);

        console.log('✅ Health product updated successfully');
        return response.data;
    } catch (error: any) {
        console.error('❌ Failed to update health product:', error);
        handleApiError(error);
        throw error;
    }
};

// Delete a health product
export const deleteHealthProduct = async (id: string | number): Promise<void> => {
    try {
        const healthProductId = typeof id === 'string' ? parseInt(id, 10) : id;

        if (isNaN(healthProductId)) {
            throw new Error('Invalid health product ID');
        }

        console.log('🗑️ Deleting health product:', healthProductId);
        await api.delete(`/health-product/${healthProductId}`);

        console.log('✅ Health product deleted successfully');
    } catch (error: any) {
        console.error('❌ Failed to delete health product:', error);
        handleApiError(error);
        throw error;
    }
};

// Get a single health product by ID
export const getHealthProductById = async (id: string | number): Promise<HealthProductResponseDto> => {
    try {
        const healthProductId = typeof id === 'string' ? parseInt(id, 10) : id;

        if (isNaN(healthProductId)) {
            throw new Error('Invalid health product ID');
        }

        console.log('📋 Fetching health product:', healthProductId);
        const response = await api.get<HealthProductResponseDto>(`/health-product/${healthProductId}`);

        return response.data;
    } catch (error: any) {
        console.error('❌ Failed to fetch health product:', error);
        handleApiError(error);
        throw error;
    }
};

// Get active health products (with quantity > 0 and not expired)
export const getActiveHealthProducts = async (): Promise<HealthProductResponseDto[]> => {
    try {
        const userId = await getUserId();

        console.log('📋 Fetching active health products for user:', userId);
        const response = await api.get<HealthProductResponseDto[]>(`/health-product/user/${userId}`);

        const products = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Found ${products.length} active health products`);

        return products;
    } catch (error: any) {
        console.error('❌ Failed to fetch active health products:', error);
        handleApiError(error);
        throw error;
    }
};

// Get all health products (including expired and zero-quantity)
export const getAllHealthProducts = async (): Promise<HealthProductResponseDto[]> => {
    try {
        const userId = await getUserId();

        console.log('📋 Fetching all health products for user:', userId);
        const response = await api.get<HealthProductResponseDto[]>(`/health-product/user/${userId}/all`);

        const products = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Found ${products.length} total health products`);

        return products;
    } catch (error: any) {
        console.error('❌ Failed to fetch all health products:', error);
        handleApiError(error);
        throw error;
    }
};

// Get low stock health products
export const getLowStockHealthProducts = async (): Promise<HealthProductResponseDto[]> => {
    try {
        const userId = await getUserId();

        console.log('📋 Fetching low stock health products for user:', userId);
        const response = await api.get<HealthProductResponseDto[]>(`/health-product/user/${userId}/low-stock`);

        const products = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Found ${products.length} low stock health products`);

        return products;
    } catch (error: any) {
        console.error('❌ Failed to fetch low stock health products:', error);
        handleApiError(error);
        throw error;
    }
};

// Record medicine usage (decrease stock by dose amount)
export const recordMedicineUsage = async (id: string | number): Promise<HealthProductResponseDto> => {
    try {
        const healthProductId = typeof id === 'string' ? parseInt(id, 10) : id;

        if (isNaN(healthProductId)) {
            throw new Error('Invalid health product ID format');
        }

        console.log(`📦 Recording medicine usage for health product ID: ${healthProductId}`);
        const response = await api.post<HealthProductResponseDto>(`/health-product/${healthProductId}/record-usage`);

        console.log('✅ Medicine usage recorded successfully');
        return response.data;
    } catch (error: any) {
        console.error('❌ Failed to record medicine usage:', error);

        // Enhanced error handling with specific error types
        if (error?.response?.data?.errors?.error) {
            const errorMessage = error.response.data.errors.error;

            if (errorMessage.includes('Insufficient quantity')) {
                throw new Error('Insufficient quantity available for dose. Please check your stock.');
            } else if (errorMessage.includes('not found')) {
                throw new Error('Medicine not found. It may have been deleted.');
            } else if (errorMessage.includes('expired')) {
                throw new Error('This medicine has expired and cannot be used.');
            } else {
                throw new Error(errorMessage);
            }
        }

        handleApiError(error);
        throw error;
    }
};

// Get health product statistics
export const getHealthProductStats = async (): Promise<{
    total: number;
    active: number;
    expired: number;
    lowStock: number;
    outOfStock: number;
}> => {
    try {
        const userId = await getUserId();

        console.log('📊 Fetching health product statistics for user:', userId);

        // Fetch all products to calculate stats
        const allProducts = await getAllHealthProducts();
        const lowStockProducts = await getLowStockHealthProducts();

        const currentDate = new Date();

        const stats = {
            total: allProducts.length,
            active: allProducts.filter(p =>
                new Date(p.expiryDate) > currentDate &&
                p.availableQuantity > p.thresholdQuantity
            ).length,
            expired: allProducts.filter(p =>
                new Date(p.expiryDate) <= currentDate
            ).length,
            lowStock: lowStockProducts.length,
            outOfStock: allProducts.filter(p =>
                p.availableQuantity <= 0
            ).length,
        };

        console.log('✅ Health product stats calculated:', stats);
        return stats;
    } catch (error: any) {
        console.error('❌ Failed to get health product stats:', error);
        handleApiError(error);
        throw error;
    }
};

// Batch update multiple health products
export const batchUpdateHealthProducts = async (
    updates: Array<{ id: number; data: Partial<HealthProductRequestDto> }>
): Promise<HealthProductResponseDto[]> => {
    try {
        console.log('📦 Batch updating health products:', updates.length);

        const promises = updates.map(update =>
            updateHealthProduct(update.id, update.data)
        );

        const results = await Promise.all(promises);
        console.log('✅ Batch update completed successfully');

        return results;
    } catch (error: any) {
        console.error('❌ Failed to batch update health products:', error);
        handleApiError(error);
        throw error;
    }
};

// Search health products by name
export const searchHealthProducts = async (query: string): Promise<HealthProductResponseDto[]> => {
    try {
        const allProducts = await getAllHealthProducts();

        const filteredProducts = allProducts.filter(product =>
            product.healthProductName.toLowerCase().includes(query.toLowerCase())
        );

        console.log(`🔍 Found ${filteredProducts.length} products matching "${query}"`);
        return filteredProducts;
    } catch (error: any) {
        console.error('❌ Failed to search health products:', error);
        handleApiError(error);
        throw error;
    }
};

// Get products expiring within specified days
export const getExpiringProducts = async (days: number = 7): Promise<HealthProductResponseDto[]> => {
    try {
        const allProducts = await getAllHealthProducts();
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);

        const expiringProducts = allProducts.filter(product => {
            const expiryDate = new Date(product.expiryDate);
            return expiryDate <= targetDate && expiryDate > new Date();
        });

        console.log(`⏰ Found ${expiringProducts.length} products expiring within ${days} days`);
        return expiringProducts;
    } catch (error: any) {
        console.error('❌ Failed to get expiring products:', error);
        handleApiError(error);
        throw error;
    }
};