import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.7:8888/api/v1/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
        // If needed, attach user ID or email for identification
        config.headers['X-User-Id'] = user.id; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/users/signIn', { email, password });
    // console.log("response", response);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};



export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getMedicineSchedule = async () => {
  try {
    const response = await api.get('/medicines/schedule');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logMedicine = async(logData)=>{

  try{
    const response = await api.post('/logs/create', logData);
    console.log("response", response);
    return response.data;
  }catch(error){
    throw error.response?.data || error.message;
  }

}

export const updateMedicineStatus = async (medicineId, status) => {
  try {
    // const response = await api.post(`/medicines/${medicineId}/status`, { status });
    return true;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getOrders = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    const user = JSON.parse(userData);
    const userId = user.id;
    const response = await api.get(`/healthproduct/orders/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getMedicineStats = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    const user = JSON.parse(userData);
    const userId = user.id;
    console.log("userId", userId);
    const response = await api.get(`/logs/${userId}/time/30`); 
    console.log("response", response.data);
    return response.data;
    
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logoutUser = async () => {
  try {
    // await api.post('/auth/logout');
    await AsyncStorage.clear();
    router.replace('auth/SignIn');
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage even if API call fails
    await AsyncStorage.clear();
  }
};

export default api;