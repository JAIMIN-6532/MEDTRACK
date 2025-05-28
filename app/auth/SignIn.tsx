import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons'; // ✅ New icon imports
import { userApi } from '../../services/api';

export default function SignIn() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');

    const validateInputs = (): boolean => {
        let isValid = true;

        if (!email) {
            setEmailError('Email is required');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Please enter a valid email');
            isValid = false;
        } else {
            setEmailError('');
        }

        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            isValid = false;
        } else {
            setPasswordError('');
        }

        return isValid;
    };

    interface LoginResponse {
        id: string;
        email: string;
    }

    const handleSignIn = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        try {
            const response = await userApi.loginUser(email, password);
            console.log("response", response);
            if (response && response.user && 'userId' in response.user && 'email' in response.user) {
                await AsyncStorage.setItem('userData', JSON.stringify({
                    id: response.user.userId,
                    email: response.user.email
                }));
                router.replace('/(tabs)/medicines' as any);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            console.log("error", error);
            Alert.alert('Sign In Failed', error.message || 'Please check your credentials and try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#1e293b', '#0f172a', '#020617']}
            className="flex-1"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    className="px-5"
                >
                    <View className="flex-1 justify-center py-10">
                        <View className="items-center mb-10">
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop' }}
                                className="w-28 h-28 rounded-full mb-6 border-4 border-white/20 shadow-lg"
                            />
                            <Text className="text-3xl font-bold text-white mb-2">MedTrack</Text>
                            <Text className="text-lg text-gray-300">Your Medicine Companion</Text>
                        </View>

                        <View className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20">
                            <Text className="text-2xl font-bold text-white mb-6">Welcome Back</Text>

                            <View className="mb-5">
                                <Text className="text-gray-300 mb-2 text-base font-medium ml-1">Email</Text>
                                <View className="relative">
                                    <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                        <MaterialIcons name="email" size={20} color="#94a3b8" />
                                    </View>
                                    <TextInput
                                        className={`
                      bg-white/5 border rounded-xl py-3.5 pl-10 pr-4 text-base text-white
                      ${emailError ? 'border-red-500' : 'border-gray-700'}
                    `}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#94a3b8"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (emailError) setEmailError('');
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {emailError && (
                                    <View className="flex-row items-center mt-1.5 ml-1">
                                        <MaterialIcons name="error-outline" size={14} color="#ef4444" />
                                        <Text className="text-xs text-red-500 ml-1">{emailError}</Text>
                                    </View>
                                )}
                            </View>

                            <View className="mb-6">
                                <Text className="text-gray-300 mb-2 text-base font-medium ml-1">Password</Text>
                                <View className="relative">
                                    <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                        <FontAwesome name="lock" size={20} color="#94a3b8" />
                                    </View>
                                    <TextInput
                                        className={`
                      bg-white/5 border rounded-xl py-3.5 pl-10 pr-4 text-base text-white
                      ${passwordError ? 'border-red-500' : 'border-gray-700'}
                    `}
                                        placeholder="Enter your password"
                                        placeholderTextColor="#94a3b8"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (passwordError) setPasswordError('');
                                        }}
                                        secureTextEntry
                                    />
                                </View>
                                {passwordError && (
                                    <View className="flex-row items-center mt-1.5 ml-1">
                                        <MaterialIcons name="error-outline" size={14} color="#ef4444" />
                                        <Text className="text-xs text-red-500 ml-1">{passwordError}</Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity className="mb-6 self-end">
                                <Text className="text-blue-400 text-sm font-medium">Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`
                  bg-blue-600 rounded-xl py-4 flex-row justify-center items-center shadow-lg
                  ${loading ? 'opacity-70' : ''}
                `}
                                onPress={handleSignIn}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text className="text-white font-bold text-base mr-2">
                                            Sign In
                                        </Text>
                                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                    </>
                                )}
                            </TouchableOpacity>

                            <View className="flex-row justify-center mt-6">
                                <Text className="text-gray-300 text-base">Don't have an account?{' '}</Text>
                                <Link href={{ pathname: "/auth/SignUp" as any }} asChild>
                                    <TouchableOpacity>
                                        <Text className="text-blue-400 font-bold text-base">Sign Up</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
