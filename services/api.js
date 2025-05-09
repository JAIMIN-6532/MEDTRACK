export * as healthProductApi from './healthProductApi';
export * as medicineLogApi from './medicineUsageLogApi';
export * as userApi from './userApi';

// export const getMedicineSchedule = async () => {
//   try {
//     const response = await api.get('/medicines/schedule');
//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };

// export const logMedicine = async (logData) => {

//   try {
//     const response = await api.post('/logs/create', logData);
//     console.log("response", response);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// }

// export const updateMedicineStatus = async (medicineId, status) => {
//   try {
//     // const response = await api.post(`/medicines/${medicineId}/status`, { status });
//     return true;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };

// export const getOrders = async () => {
//   try {
//     const userData = await SecureStore.getItem('userData');
//     const user = JSON.parse(userData);
//     const userId = user.id;
//     const response = await api.get(`/healthproduct/orders/${userId}`);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };


// // 👤 Get User Profile
// export const getUserProfile = async () => {
//   try {
//     const userData = await SecureStore.getItemAsync('userData');
//     const { id } = JSON.parse(userData);
//     const response = await api.get(`/user/getUser/${id}`);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };

// export const getMedicineStats = async () => {
//   try {
//     const userData = await SecureStore.getItem('userData');
//     const user = JSON.parse(userData);
//     const userId = user.id;
//     console.log("userId", userId);
//     const response = await api.get(`/logs/${userId}/time/30`);
//     console.log("response", response.data);
//     return response.data;

//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };

// export const logoutUser = async () => {
//   try {
//     // await api.post('/auth/logout');
//     await SecureStore.clear();
//     router.replace('auth/SignIn');
//   } catch (error) {
//     console.error('Logout error:', error);
//     // Still clear local storage even if API call fails
//     await SecureStore.clear();
//   }
// };
