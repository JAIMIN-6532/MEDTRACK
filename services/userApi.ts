import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
    LoginResponse,
    RegisterResponse,
    UserData,
    UserProfile
} from '../types/userTypes';
import api from '../utils/axiosInstance';
import { handleApiError } from '../utils/handleApiError';

export const registerUser = async (userData: UserData): Promise<RegisterResponse> => {
    try {
        const res = await api.post<RegisterResponse>('/user/signup', userData);
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        const res = await api.post<LoginResponse>('/user/signin', { email, password });
        const { token, user } = res.data;
        await SecureStore.setItemAsync('accessToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

export const getUserProfile = async (): Promise<UserProfile> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('No user data found');
        console.log("userData : ", userData);
        const { id: userId } = JSON.parse(userData);
        const res = await api.get<UserProfile>(`/user/${userId}`);
        return res.data;
    } catch (error) {
        handleApiError(error);
        throw error;
    }
};

export const logoutUser = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync('accessToken');
        await AsyncStorage.clear();
    } catch (error) {
        await SecureStore.deleteItemAsync('accessToken');
        await AsyncStorage.clear();
    }
};
