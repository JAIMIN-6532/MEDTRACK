// services/api/userApi.ts
import api from '../utils/axiosInstance';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions
interface UserData {
    email: string;
    password: string;
    name?: string;
    [key: string]: any;
}

interface LoginResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name?: string;
        [key: string]: any;
    };
}

interface ApiError {
    message: string;
    response?: {
        data: any;
    };
}

interface UserProfile {
    id: string;
    email: string;
    name?: string;
    [key: string]: any;
}

interface RegisterResponse {
    message: string;
    user: UserProfile;
}

// Helper function for error handling
const handleApiError = (error: unknown): never => {
    const apiError = error as ApiError;
    throw apiError.response?.data || apiError.message;
};

export const registerUser = async (userData: UserData): Promise<RegisterResponse | undefined> => {
    try {
        console.log('User data:', userData);
        const res = await api.post<RegisterResponse>('/user/signup', userData);
        console.log('Response:', res.data);
        return res.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse | undefined> => {
    try {
        const res = await api.post<LoginResponse>('/user/signin', { email, password });
        const { token, user } = res.data;
        console.log('Login response:', res.data);
        await SecureStore.setItemAsync('accessToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        return res.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getUserProfile = async (): Promise<UserProfile | undefined> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('No user data found');
        
        const { id } = JSON.parse(userData);
        const res = await api.get<UserProfile>(`/user/getUser/${id}`);
        return res.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const logoutUser = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync('accessToken');
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear storage even if there's an error
        await SecureStore.deleteItemAsync('accessToken');
        await AsyncStorage.clear();
    }
}; 