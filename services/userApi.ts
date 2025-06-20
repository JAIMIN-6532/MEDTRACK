import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
    AuthResponse,
    UserRegistrationRequest,
    UserLoginRequest,
    UserProfile,
    CompleteUserProfile,
} from '../types/userTypes';
import api from '../utils/axiosInstance';
import { handleApiError } from '../utils/handleApiError';

// Register a new user
export const registerUser = async (userData: UserRegistrationRequest): Promise<{ user: UserProfile }> => {
    try {
        console.log('👤 Registering new user:', { email: userData.email, fullName: userData.fullName });

        const response = await api.post<{ user: UserProfile }>('/user/signup', userData);

        console.log('✅ User registered successfully:', response.data.user.email);
        return response.data;
    } catch (error: any) {
        console.error('❌ Registration failed:', error);

        // Enhanced error handling for registration
        if (error?.response?.data?.errors?.error) {
            const errorMessage = error.response.data.errors.error;

            if (errorMessage.includes('already exists')) {
                throw new Error('An account with this email already exists. Please sign in instead.');
            } else if (errorMessage.includes('invalid email')) {
                throw new Error('Please enter a valid email address.');
            } else if (errorMessage.includes('password')) {
                throw new Error('Password must be at least 6 characters long.');
            } else {
                throw new Error(errorMessage);
            }
        }

        handleApiError(error);
        throw error;
    }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        console.log('🔐 Logging in user:', email);

        const loginData: UserLoginRequest = { email, password };
        const response = await api.post<AuthResponse>('/user/signin', loginData);

        const { token, user } = response.data;

        // Store authentication data
        await SecureStore.setItemAsync('accessToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        console.log('✅ User logged in successfully:', user.email);
        return response.data;
    } catch (error: any) {
        console.error('❌ Login failed:', error);

        // Enhanced error handling for login
        if (error?.response?.data?.errors?.error) {
            const errorMessage = error.response.data.errors.error;

            if (errorMessage.includes('not found')) {
                throw new Error('No account found with this email address.');
            } else if (errorMessage.includes('Invalid Password')) {
                throw new Error('Incorrect password. Please try again.');
            } else if (errorMessage.includes('invalid email')) {
                throw new Error('Please enter a valid email address.');
            } else {
                throw new Error(errorMessage);
            }
        }

        handleApiError(error);
        throw error;
    }
};

// Get user profile by ID
export const getUserProfile = async (userId?: number): Promise<UserProfile> => {
    try {
        let targetUserId = userId;

        // If no userId provided, get from storage
        if (!targetUserId) {
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) throw new Error('No user data found in storage');

            const parsed = JSON.parse(userData);
            targetUserId = parsed.userId || parsed.id;
        }

        if (!targetUserId) throw new Error('User ID not found');

        // Convert to number if it's a string
        const numericUserId = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId;
        if (isNaN(numericUserId)) throw new Error('Invalid user ID format');

        console.log('👤 Fetching user profile for ID:', numericUserId);
        const response = await api.get<UserProfile>(`/user/${numericUserId}`);

        console.log('✅ User profile fetched successfully');
        return response.data;
    } catch (error: any) {
        console.error('❌ Failed to fetch user profile:', error);

        if (error?.response?.status === 404) {
            throw new Error('User profile not found. Please log in again.');
        }

        handleApiError(error);
        throw error;
    }
};

// Update user profile
export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('No user data found');

        const parsed = JSON.parse(userData);
        const userId = parsed.userId || parsed.id;

        console.log('📝 Updating user profile for ID:', userId);
        const response = await api.put<UserProfile>(`/user/${userId}`, updates);

        // Update local storage with new data
        await AsyncStorage.setItem('userData', JSON.stringify(response.data));

        console.log('✅ User profile updated successfully');
        return response.data;
    } catch (error: any) {
        console.error('❌ Failed to update user profile:', error);
        handleApiError(error);
        throw error;
    }
};

// Delete user account
export const deleteUserAccount = async (): Promise<void> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('No user data found');

        const parsed = JSON.parse(userData);
        const userId = parsed.userId || parsed.id;

        console.log('🗑️ Deleting user account for ID:', userId);
        await api.delete(`/user/${userId}`);

        // Clear all local data
        await logoutUser();

        console.log('✅ User account deleted successfully');
    } catch (error: any) {
        console.error('❌ Failed to delete user account:', error);
        handleApiError(error);
        throw error;
    }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
    try {
        console.log('🚪 Logging out user...');

        // Clear all stored data
        await Promise.all([
            SecureStore.deleteItemAsync('accessToken').catch(() => { }),
            AsyncStorage.clear().catch(() => { }),
        ]);

        console.log('✅ User logged out successfully');
    } catch (error: any) {
        console.error('❌ Logout failed, but clearing local data anyway:', error);

        // Still try to clear local storage even if API call fails
        await Promise.all([
            SecureStore.deleteItemAsync('accessToken').catch(() => { }),
            AsyncStorage.clear().catch(() => { }),
        ]);
    }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const token = await SecureStore.getItemAsync('accessToken');
        const userData = await AsyncStorage.getItem('userData');

        return !!(token && userData);
    } catch (error) {
        console.error('❌ Failed to check authentication status:', error);
        return false;
    }
};

// Get current user data from storage
export const getCurrentUser = async (): Promise<UserProfile | null> => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) return null;

        return JSON.parse(userData) as UserProfile;
    } catch (error) {
        console.error('❌ Failed to get current user:', error);
        return null;
    }
};

// Refresh user token
export const refreshToken = async (): Promise<string> => {
    try {
        console.log('🔄 Refreshing user token...');

        const response = await api.post<{ token: string }>('/user/refresh-token');
        const { token } = response.data;

        await SecureStore.setItemAsync('accessToken', token);

        console.log('✅ Token refreshed successfully');
        return token;
    } catch (error: any) {
        console.error('❌ Failed to refresh token:', error);

        // If refresh fails, logout user
        await logoutUser();
        throw new Error('Session expired. Please log in again.');
    }
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
        console.log('🔐 Changing user password...');

        const response = await api.post('/user/change-password', {
            currentPassword,
            newPassword,
        });

        console.log('✅ Password changed successfully');
    } catch (error: any) {
        console.error('❌ Failed to change password:', error);

        if (error?.response?.data?.errors?.error) {
            const errorMessage = error.response.data.errors.error;

            if (errorMessage.includes('current password')) {
                throw new Error('Current password is incorrect.');
            } else if (errorMessage.includes('weak password')) {
                throw new Error('New password is too weak. Please choose a stronger password.');
            } else {
                throw new Error(errorMessage);
            }
        }

        handleApiError(error);
        throw error;
    }
};

// Reset password request
export const requestPasswordReset = async (email: string): Promise<void> => {
    try {
        console.log('📧 Requesting password reset for:', email);

        await api.post('/user/forgot-password', { email });

        console.log('✅ Password reset email sent');
    } catch (error: any) {
        console.error('❌ Failed to request password reset:', error);

        if (error?.response?.status === 404) {
            throw new Error('No account found with this email address.');
        }

        handleApiError(error);
        throw error;
    }
};

// Verify email
export const verifyEmail = async (verificationCode: string): Promise<void> => {
    try {
        console.log('✉️ Verifying email with code...');

        await api.post('/user/verify-email', { code: verificationCode });

        console.log('✅ Email verified successfully');
    } catch (error: any) {
        console.error('❌ Failed to verify email:', error);

        if (error?.response?.data?.errors?.error) {
            const errorMessage = error.response.data.errors.error;

            if (errorMessage.includes('invalid code')) {
                throw new Error('Invalid verification code. Please try again.');
            } else if (errorMessage.includes('expired')) {
                throw new Error('Verification code has expired. Please request a new one.');
            } else {
                throw new Error(errorMessage);
            }
        }

        handleApiError(error);
        throw error;
    }
};