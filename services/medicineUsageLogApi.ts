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
        const res = await api.get<MedicineLogResponse>(`/medicine-logs/${id}/time/${days}`);
        return res.data;
    } catch (error: any) {
        handleApiError(error);
        throw error?.response?.data || error.message || 'An error occurred while fetching logs';
    }
};

// Add a new medicine usage log

export const addMedicineUsageLog = async (logData: LogData): Promise<boolean> => {
    try {
        console.log('Adding log data:', logData);
        const res = await api.post('/medicine-logs/log', logData);
        console.log('Response from adding log:', res);
        return res.status === 201;
    } catch (error: any) {
        handleApiError(error);
        throw error?.response?.data || error.message || 'An error occurred while adding the log';
    }
};
// ??????
// Fetch today's medicine usage logs
export const getTodayLogs = async (): Promise<MedicineLogResponse> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('User data not found');
        const { id } = JSON.parse(userData);
        const res = await api.get<MedicineLogResponse>(`/medicine-logs/${id}/today`);
        return res.data;
    } catch (error: any) {
        handleApiError(error);
        throw error?.response?.data || error.message || 'An error occurred while fetching today\'s logs';
    }
};
