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

        // ✅ Ensure ID is a number
        const userId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(userId)) throw new Error('Invalid user ID');

        const res = await api.get<MedicineLogResponse>(`/medicine-logs/${userId}/time/${days}`);
        return res.data;
    } catch (error: any) {
        handleApiError(error);
        throw error?.response?.data || error.message || 'An error occurred while fetching logs';
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
export const getTodayLogs = async (): Promise<MedicineLogResponse> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('User data not found');

        const { id } = JSON.parse(userData);

        // ✅ Ensure ID is a number
        const userId = typeof id === 'string' ? parseInt(id, 10) : id;
        if (isNaN(userId)) throw new Error('Invalid user ID');

        const res = await api.get<MedicineLogResponse>(`/medicine-logs/${userId}/today`);
        return res.data;
    } catch (error: any) {
        handleApiError(error);
        throw error?.response?.data || error.message || 'An error occurred while fetching today\'s logs';
    }
};