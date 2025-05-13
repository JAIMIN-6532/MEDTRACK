import AsyncStorage from '@react-native-async-storage/async-storage';
import { showError, showSuccess } from '@/utils/errorHandler';

const STORAGE_KEY = '@medicines';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export const saveMedicine = async (medicine: Medicine): Promise<void> => {
  try {
    const existingMedicines = await getMedicines();
    const updatedMedicines = [...existingMedicines, medicine];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMedicines));
    showSuccess('Medicine saved successfully');
  } catch (error) {
    showError('Failed to save medicine');
    throw error;
  }
};

export const getMedicines = async (): Promise<Medicine[]> => {
  try {
    const medicines = await AsyncStorage.getItem(STORAGE_KEY);
    return medicines ? JSON.parse(medicines) : [];
  } catch (error) {
    showError('Failed to fetch medicines');
    return [];
  }
};

export const updateMedicine = async (medicine: Medicine): Promise<void> => {
  try {
    const medicines = await getMedicines();
    const updatedMedicines = medicines.map((m) =>
      m.id === medicine.id ? medicine : m
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMedicines));
    showSuccess('Medicine updated successfully');
  } catch (error) {
    showError('Failed to update medicine');
    throw error;
  }
};

export const deleteMedicine = async (id: string): Promise<void> => {
  try {
    const medicines = await getMedicines();
    const updatedMedicines = medicines.filter((m) => m.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMedicines));
    showSuccess('Medicine deleted successfully');
  } catch (error) {
    showError('Failed to delete medicine');
    throw error;
  }
}; 