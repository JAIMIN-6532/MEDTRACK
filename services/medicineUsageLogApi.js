import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/axiosInstance'; // Assuming axiosInstance is already set up

// Fetch logs for past days
export const getLogsForPastDays = async (days) => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id } = JSON.parse(userData);
        const res = await api.get(`/medicine-logs/${id}/time/${days}`);
        return res.data; // Returns the logs data for the specified number of past days
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Add a new medicine usage log
export const addMedicineUsageLog = async (logData) => {
    try {
        const res = await api.post('/medicine-logs/log', logData);
        return res.status === 201; // Check if the response status is 201 (created)
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Fetch today's medicine usage logs
export const getTodayLogs = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id } = JSON.parse(userData);
        const res = await api.get(`/medicine-logs/${id}/today`);
        return res.data; // Returns today's logs for the logged-in user
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
