import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Replace lucide-react-native with Vector Icons
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

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = () => {
        if (!email) {
            setEmailError('Email is required');
            return false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Please enter a valid email');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleResetPassword = async () => {
        if (!validateEmail()) return;

        setLoading(true);
        try {
            // Call your password reset API here
            // await userApi.resetPassword({ email });

            Alert.alert(
                'Reset Email Sent',
                'If this email exists in our system, you will receive password reset instructions.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.log('error', error);
            Alert.alert(
                'Something went wrong',
                'Please try again later'
            );
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
                    <View className="flex-1 justify-center py-8">
                        {/* Logo and Title */}
                        <View className="items-center mb-8">
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop' }}
                                className="w-28 h-28 rounded-full mb-5 border-4 border-white/20 shadow-lg"
                            />
                            <Text className="text-3xl font-bold text-white mb-2">Reset Password</Text>
                            <Text className="text-base text-gray-300 text-center">Enter your email to receive reset instructions</Text>
                        </View>

                        {/* Form */}
                        <View className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20">
                            <Text className="text-xl font-bold text-white mb-6">Forgot Password</Text>

                            {/* Email */}
                            <View className="mb-6">
                                <Text className="text-gray-300 mb-2 text-base font-medium ml-1">Email</Text>
                                <View className="relative">
                                    <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                        <Ionicons name="mail-outline" size={20} color="#94a3b8" />
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
                                {emailError ? (
                                    <View className="flex-row items-center mt-1.5 ml-1">
                                        <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                        <Text className="text-xs text-red-500 ml-1">{emailError}</Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Submit */}
                            <TouchableOpacity
                                className={`
                  bg-blue-600 rounded-xl py-4 flex-row justify-center items-center shadow-lg
                  ${loading ? 'opacity-70' : ''}
                `}
                                onPress={handleResetPassword}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text className="text-white font-bold text-base mr-2">
                                            Send Reset Link
                                        </Text>
                                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Back to Sign In */}
                            <TouchableOpacity
                                className="flex-row justify-center mt-6"
                                onPress={() => router.back()}
                            >
                                <Text className="text-blue-400 text-base">Back to Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}