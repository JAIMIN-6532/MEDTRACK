import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/axiosInstance';

interface LogData {
    userId: string;
    healthProductId: string;
    isTaken: boolean;
    medicationScheduleIds: string;
}

interface MedicineLogResponse {
    data: any;
}

// Fetch logs for past days
export const getLogsForPastDays = async (days: number): Promise<MedicineLogResponse> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('User data not found');
        const { id } = JSON.parse(userData);
        const res = await api.get(`/medicine-logs/${id}/time/${days}`);
        return res.data; // Returns the logs data for the specified number of past days
    } catch (error: any) {
        // Handle any errors here
        console.error('Error fetching logs for past days:', error.message || error);
        throw error?.response?.data || error.message || 'An error occurred while fetching logs';
    }
};

// Add a new medicine usage log
export const addMedicineUsageLog = async (logData: LogData): Promise<boolean> => {
    try {
        const res = await api.post('/medicine-logs/log', logData);
        return res.status === 201; // Check if the response status is 201 (created)
    } catch (error: any) {
        // Handle any errors here
        console.error('Error adding medicine usage log:', error.message || error);
        throw error?.response?.data || error.message || 'An error occurred while adding the log';
    }
};

// Fetch today's medicine usage logs
export const getTodayLogs = async (): Promise<MedicineLogResponse> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('User data not found');
        const { id } = JSON.parse(userData);
        const res = await api.get(`/medicine-logs/${id}/today`);
        return res.data; // Returns today's logs for the logged-in user
    } catch (error: any) {
        // Handle any errors here
        console.error('Error fetching today\'s logs:', error.message || error);
        throw error?.response?.data || error.message || 'An error occurred while fetching today\'s logs';
    }
};
