// services/api/userApi.js
import api from '../utils/axiosInstance';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const registerUser = async (userData) => {
    try {
        console.log('User data:', userData); // Log the user data
        const res = await api.post('/user/signup', userData);
        console.log('Response:', res.data); // Log the response data
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const loginUser = async (email, password) => {
    try {
        const res = await api.post('/user/signin', { email, password });
        const { token, user } = res.data;

        await SecureStore.setItemAsync('accessToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getUserProfile = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        const { id } = JSON.parse(userData);
        const res = await api.get(`/user/getUser/${id}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const logoutUser = async () => {
    try {
        await SecureStore.deleteItemAsync('accessToken');
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Logout error:', error);
    }
};
