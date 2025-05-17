export interface UserData {
    fullName: string;
    email: string;
    password: string;
}

export interface RegisterResponse {
    user: UserProfile;
}

export interface LoginResponse {
    token: string;
    user: UserProfile;
}

export interface UserProfile {
    userId: string;
    fullName: string;
    email: string;
}
