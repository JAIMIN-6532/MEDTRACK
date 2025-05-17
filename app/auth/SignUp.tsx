import { Ionicons } from '@expo/vector-icons'; // Import Ionicons from Vector Icons
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { userApi } from '../../services/api';

const SignUp = () => {
    const [fullName, setFullName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const [nameError, setNameError] = useState<string>('');
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');

    const validateInputs = (): boolean => {
        let isValid = true;

        if (!fullName) {
            setNameError('Username is required');
            isValid = false;
        } else if (fullName.length < 3) {
            setNameError('Username must be at least 3 characters');
            isValid = false;
        } else {
            setNameError('');
        }

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

    const handleSignUp = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        try {
            const response = await userApi.registerUser({ fullName, email, password });

            Alert.alert(
                'Account Created',
                'Your account has been created successfully. Please sign in.',
                [{ text: 'OK', onPress: () => router.replace('/auth/SignIn' as any) }]
            );
        } catch (error: any) {
            console.log("error", error);
            Alert.alert(
                'Registration Failed',
                error.response?.data?.message || 'Could not create your account. Please try again.'
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
                            <Text className="text-3xl font-bold text-white mb-2">Join MedTrack</Text>
                            <Text className="text-base text-gray-300 text-center">Track and manage your medications with ease</Text>
                        </View>

                        {/* Form */}
                        <View className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20">
                            <Text className="text-xl font-bold text-white mb-6">Create Your Account</Text>

                            {/* Username */}
                            <View className="mb-5">
                                <Text className="text-gray-300 mb-2 text-base font-medium ml-1">Username</Text>
                                <View className="relative">
                                    <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                        <Ionicons name="person-outline" size={20} color="#94a3b8" />
                                    </View>
                                    <TextInput
                                        className={`
                          bg-white/5 border rounded-xl py-3.5 pl-10 pr-4 text-base text-white
                          ${nameError ? 'border-red-500' : 'border-gray-700'}
                        `}
                                        placeholder="Enter your username"
                                        placeholderTextColor="#94a3b8"
                                        value={fullName}
                                        onChangeText={(text) => {
                                            setFullName(text);
                                            if (nameError) setNameError('');
                                        }}
                                        autoCapitalize="none"
                                    />
                                </View>
                                {nameError ? (
                                    <View className="flex-row items-center mt-1.5 ml-1">
                                        <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                        <Text className="text-xs text-red-500 ml-1">{nameError}</Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Email */}
                            <View className="mb-5">
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

                            {/* Password */}
                            <View className="mb-6">
                                <Text className="text-gray-300 mb-2 text-base font-medium ml-1">Password</Text>
                                <View className="relative">
                                    <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                        <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                                    </View>
                                    <TextInput
                                        className={`
                          bg-white/5 border rounded-xl py-3.5 pl-10 pr-4 text-base text-white
                          ${passwordError ? 'border-red-500' : 'border-gray-700'}
                        `}
                                        placeholder="Create a password"
                                        placeholderTextColor="#94a3b8"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (passwordError) setPasswordError('');
                                        }}
                                        secureTextEntry
                                    />
                                </View>
                                {passwordError ? (
                                    <View className="flex-row items-center mt-1.5 ml-1">
                                        <Ionicons name="alert-circle" size={14} color="#ef4444" />
                                        <Text className="text-xs text-red-500 ml-1">{passwordError}</Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Submit */}
                            <TouchableOpacity
                                className={`
                      bg-blue-600 rounded-xl py-4 flex-row justify-center items-center shadow-lg
                      ${loading ? 'opacity-70' : ''}
                    `}
                                onPress={handleSignUp}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text className="text-white font-bold text-base mr-2">
                                            Create Account
                                        </Text>
                                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Link to Sign In */}
                            <View className="flex-row justify-center mt-6">
                                <Text className="text-gray-300 text-base">
                                    Already have an account?{' '}
                                </Text>
                                <Link href="/auth/SignIn" asChild>
                                    <TouchableOpacity>
                                        <Text className="text-blue-400 font-bold text-base">Sign In</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

export default SignUp;