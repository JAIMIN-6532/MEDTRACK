
// Re-export other API modules
export * as healthProductApi from './healthProductApi';
export * as medicineLogApi from './medicineUsageLogApi';
export * as userApi from './userApi';

// Type definitions
interface ApiError {
  message: string;
  response?: {
    data: any;
  };
}

interface UserData {
  id: string;
  [key: string]: any;
}

interface LogData {
  [key: string]: any;
}

// Helper function for error handling
const handleApiError = (error: unknown): never => {
  const apiError = error as ApiError;
  throw apiError.response?.data || apiError.message;
};

// Example of how the commented functions would look with TypeScript
/*
export const getMedicineSchedule = async (): Promise<any> => {
  try {
    const response = await api.get('/medicines/schedule');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const logMedicine = async (logData: LogData): Promise<any> => {
  try {
    const response = await api.post('/logs/create', logData);
    console.log("response", response);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateMedicineStatus = async (medicineId: string, status: string): Promise<boolean> => {
  try {
    // const response = await api.post(`/medicines/${medicineId}/status`, { status });
    return true;
  } catch (error) {
    handleApiError(error);
  }
};

export const getOrders = async (): Promise<any> => {
  try {
    const userData = await SecureStore.getItemAsync('userData');
    if (!userData) throw new Error('No user data found');
    
    const user: UserData = JSON.parse(userData);
    const response = await api.get(`/healthproduct/orders/${user.id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserProfile = async (): Promise<any> => {
  try {
    const userData = await SecureStore.getItemAsync('userData');
    if (!userData) throw new Error('No user data found');
    
    const user: UserData = JSON.parse(userData);
    const response = await api.get(`/user/getUser/${user.id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getMedicineStats = async (): Promise<any> => {
  try {
    const userData = await SecureStore.getItemAsync('userData');
    if (!userData) throw new Error('No user data found');
    
    const user: UserData = JSON.parse(userData);
    console.log("userId", user.id);
    const response = await api.get(`/logs/${user.id}/time/30`);
    console.log("response", response.data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    // await api.post('/auth/logout');
    await SecureStore.deleteItemAsync('userData');
    router.replace('auth/SignIn');
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage even if API call fails
    await SecureStore.deleteItemAsync('userData');
  }
};
*/ 