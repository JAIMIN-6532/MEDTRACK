// Improved services/medicineUsageLogApi.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogData, MedicineLogResponse } from '../types/medicineUsageLogTypes';
import api from '../utils/axiosInstance';
import { handleApiError } from '../utils/handleApiError';

// Fetch logs for past days
export const getLogsForPastDays = async (days: number): Promise<MedicineLogResponse> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('User data not found');

        const { id } = JSON.parse(userData);
        const userId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(userId)) throw new Error('Invalid user ID');

        console.log(`📊 Fetching ${days} days of logs for user:`, userId);
        const response = await api.get<MedicineLogResponse>(`/medicine-logs/${userId}/time/${days}`);

        const data = response.data;

        if (!Array.isArray(data)) {
            console.warn(`⚠️ Backend returned non-array data for ${days} days logs:`, data);
            return [];
        }

        const validatedData = data.map(item => ({
            healthProductId: item.healthProductId || 0,
            healthProductName: item.healthProductName || 'Unknown Medicine',
            takenCount: item.takenCount || 0,
            missedCount: item.missedCount || 0,
        }));

        console.log(`✅ ${days} days logs fetched successfully:`, validatedData.length);
        return validatedData;
    } catch (error: any) {
        console.error(`❌ Error fetching ${days} days logs:`, error);

        if (error?.response?.status === 404) {
            console.log(`ℹ️ No logs found for ${days} days, returning empty array`);
            return [];
        }

        handleApiError(error);
        throw error?.response?.data || error.message || `An error occurred while fetching ${days} days logs`;
    }
};

// Add a new medicine usage log
export const addMedicineUsageLog = async (logData: LogData): Promise<boolean> => {
    try {
        console.log('📝 Adding log data:', logData);

        // ✅ Validate data before sending
        if (!logData.userId || !logData.healthProductId) {
            throw new Error('Missing required fields: userId or healthProductId');
        }

        // ✅ Ensure IDs are numbers
        const sanitizedLogData: LogData = {
            ...logData,
            userId: typeof logData.userId === 'string' ? parseInt(logData.userId, 10) : logData.userId,
            healthProductId: typeof logData.healthProductId === 'string' ? parseInt(logData.healthProductId, 10) : logData.healthProductId,
        };

        // Validate conversion
        if (isNaN(sanitizedLogData.userId) || isNaN(sanitizedLogData.healthProductId)) {
            throw new Error('Invalid user ID or health product ID format');
        }

        console.log('📝 Sending sanitized log data:', sanitizedLogData);

        const res = await api.post('/medicine-logs/log', sanitizedLogData);
        console.log('✅ Response from adding log:', res.status);

        return res.status === 201;
    } catch (error: any) {
        console.error('❌ Error adding medicine log:', error);
        handleApiError(error);
        throw error?.response?.data || error.message || 'An error occurred while adding the log';
    }
};

// Fetch today's medicine usage logs
// Update getTodayLogs method to handle backend response properly:
export const getTodayLogs = async (): Promise<MedicineLogResponse> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('User data not found');

        const { id } = JSON.parse(userData);

        // ✅ Ensure ID is a number
        const userId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(userId)) throw new Error('Invalid user ID');

        console.log('📊 Fetching today\'s logs for user:', userId);
        const response = await api.get<MedicineLogResponse>(`/medicine-logs/${userId}/today`);

        // ✅ FIX: Handle case where backend returns empty or different format
        const data = response.data;

        // Ensure data is array and has proper structure
        if (!Array.isArray(data)) {
            console.warn('⚠️ Backend returned non-array data for today logs:', data);
            return [];
        }

        // ✅ FIX: Validate and transform data structure if needed
        const validatedData = data.map(item => ({
            healthProductId: item.healthProductId || 0,
            healthProductName: item.healthProductName || 'Unknown Medicine',
            takenCount: item.takenCount || 0,
            missedCount: item.missedCount || 0,
        }));

        console.log('✅ Today logs fetched successfully:', validatedData.length);
        return validatedData;
    } catch (error: any) {
        console.error('❌ Error fetching today\'s logs:', error);

        if (error?.response?.status === 404) {
            console.log('ℹ️ No logs found for today, returning empty array');
            return [];
        }

        handleApiError(error);
        throw error?.response?.data || error.message || 'An error occurred while fetching today\'s logs';
    }
};