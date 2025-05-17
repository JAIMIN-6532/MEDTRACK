import { AxiosError } from 'axios';

export interface ApiErrorResponse {
    message?: string;
    errors?: { error: string };
    response?: {
        data?: any;
        status?: number;
        statusText?: string;
    };
}

export const handleApiError = (error: unknown): never => {
    let errorMessage = 'An unexpected error occurred';

    if (error && typeof error === 'object' && 'isAxiosError' in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data) {
            const data = axiosError.response.data as any;
            if (typeof data === 'string') {
                errorMessage = data;
            } else if (data.message) {
                errorMessage = data.message;
            } else if (data.errors?.error) {
                errorMessage = data.errors.error;
            }
        } else if (axiosError.message) {
            errorMessage = axiosError.message;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    throw new Error(errorMessage);
};
