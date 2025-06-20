// Request types
export interface UserRegistrationRequest {
    fullName: string;
    email: string;
    password: string;
}

export interface UserLoginRequest {
    email: string;
    password: string;
}

// Response types
export interface UserProfile {
    userId: number; // Changed from string to number to match backend Long type
    fullName: string;
    email: string;
    createdAt?: string;
}

export interface AuthResponse {
    user: UserProfile;
    token: string;
}

// Legacy types for backward compatibility
export interface UserData extends UserRegistrationRequest { }

export interface RegisterResponse {
    user: UserProfile;
}

export interface LoginResponse extends AuthResponse { }

// User preferences and settings
export interface UserPreferences {
    notificationsEnabled: boolean;
    reminderSound: boolean;
    darkMode: boolean;
    language: string;
    timezone: string;
}

// User statistics
export interface UserStats {
    totalMedicines: number;
    adherenceRate: number;
    streakDays: number;
    totalDosesTaken: number;
    totalDosesMissed: number;
    joinedDate: string;
}

// Complete user profile with all details
export interface CompleteUserProfile extends UserProfile {
    preferences?: UserPreferences;
    stats?: UserStats;
    profilePicture?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
}

// API error response
export interface ApiError {
    error: string;
    message?: string;
    details?: string[];
}

// Form validation types
export interface ValidationError {
    field: string;
    message: string;
}

export interface FormErrors {
    [key: string]: string;
}