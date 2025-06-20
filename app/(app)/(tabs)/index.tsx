import { healthProductApi } from '@/services/api';
import { notificationService } from '@/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CreateHealthProductRequest, HealthProductRequestDto } from '@/types/healthProductTypes';

interface MedicineLocalStorage {
  id: string;
  userId: string;
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  thresholdQuantity: number;
  doseQuantity: number;
  unit: string;
  expiryDate: string;
  doseTimes: string[];
}

const AddMedicine: React.FC = () => {
  const [medicineName, setMedicineName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [thresholdQuantity, setThresholdQuantity] = useState('');
  const [doseQuantity, setDoseQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [doseTimes, setDoseTimes] = useState<string[]>(['']);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);

  const handleAddDoseTime = () => setDoseTimes([...doseTimes, '']);

  const handleRemoveDoseTime = (index: number) => {
    const updated = [...doseTimes];
    updated.splice(index, 1);
    setDoseTimes(updated);
  };

  const handleTimeChange = (_: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const updatedTimes = [...doseTimes];
      updatedTimes[currentTimeIndex] = timeString;
      setDoseTimes(updatedTimes);
    }
  };

  const handleSubmit = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (!userData || (!userData.id && !userData.userId)) {
        console.error('❌ User data not found or invalid:', userData);
        return Alert.alert('Error', 'User not found');
      }

      // ✅ FIX: Handle both id and userId fields for backward compatibility
      const userId = userData.userId || userData.id;
      const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

      if (isNaN(numericUserId)) {
        console.error('❌ Invalid user ID:', userId);
        return Alert.alert('Error', 'Invalid user session');
      }

      if (!medicineName.trim()) {
        return Alert.alert('Error', 'Please enter medicine name');
      }

      // ✅ FIX: Validate required fields
      if (!totalQuantity || isNaN(parseFloat(totalQuantity))) {
        return Alert.alert('Error', 'Please enter valid total quantity');
      }

      if (!thresholdQuantity || isNaN(parseFloat(thresholdQuantity))) {
        return Alert.alert('Error', 'Please enter valid threshold quantity');
      }

      if (!doseQuantity || isNaN(parseFloat(doseQuantity))) {
        return Alert.alert('Error', 'Please enter valid dose quantity');
      }

      if (!unit) {
        return Alert.alert('Error', 'Please select a unit');
      }

      if (doseTimes.filter(time => time.trim()).length === 0) {
        return Alert.alert('Error', 'Please add at least one reminder time');
      }

      // ✅ FIX: Use the correct request format expected by backend
      const newHealthProduct: CreateHealthProductRequest = {
        healthProductName: medicineName.trim(),
        totalQuantity: parseFloat(totalQuantity),
        thresholdQuantity: parseFloat(thresholdQuantity),
        doseQuantity: parseFloat(doseQuantity),
        unit: unit as 'mg' | 'ml' | 'pills' | 'drops',
        expiryDate: expiryDate.toISOString().split('T')[0],
        reminderTimes: doseTimes.filter(time => time.trim()), // Remove empty times
      };

      console.log('📦 Creating health product with data:', newHealthProduct);
      const response = await healthProductApi.createHealthProduct(newHealthProduct);

      if (!response || !response.healthProductId) {
        console.error('❌ Invalid response from API:', response);
        return Alert.alert('Error', 'Failed to add medicine - invalid server response');
      }

      console.log('✅ Health product created with ID:', response.healthProductId);

      // ✅ FIX: Store locally with proper ID handling
      const localMedicine: MedicineLocalStorage = {
        id: response.healthProductId.toString(), // Convert to string for local storage
        userId: numericUserId.toString(),
        name: response.healthProductName,
        totalQuantity: response.totalQuantity,
        availableQuantity: response.availableQuantity,
        thresholdQuantity: response.thresholdQuantity,
        doseQuantity: response.doseQuantity,
        unit: response.unit,
        expiryDate: response.expiryDate,
        doseTimes: response.reminderTimes,
      };

      const existingStr = await AsyncStorage.getItem('medicines');
      const existing: MedicineLocalStorage[] = existingStr ? JSON.parse(existingStr) : [];
      existing.push(localMedicine);
      await AsyncStorage.setItem('medicines', JSON.stringify(existing));

      // ✅ FIX: Schedule notifications with proper ID conversion
      if (Platform.OS !== 'web' && response.reminderTimes.length > 0) {
        console.log('🔔 Setting up notifications...');

        try {
          const notificationIds = await notificationService.scheduleDailyReminders(
            response.healthProductId, // Pass as number
            numericUserId, // Pass as number
            response.doseQuantity,
            response.unit,
            medicineName.trim(),
            response.reminderTimes
          );

          console.log(`✅ Scheduled ${notificationIds.length} notifications`);

        } catch (notificationError) {
          console.error('❌ Notification setup failed:', notificationError);
          Alert.alert('Warning', 'Medicine added but notifications may not work. Please check your notification permissions.');
        }
      }

      Alert.alert('Success', 'Medicine added successfully!', [
        {
          text: 'OK', onPress: () => {
            // Reset form
            setMedicineName('');
            setTotalQuantity('');
            setThresholdQuantity('');
            setDoseQuantity('');
            setUnit('mg');
            setExpiryDate(new Date());
            setDoseTimes(['']);

            // Navigate back to medicines list
            router.push('/medicines' as never);
          }
        }
      ]);

    } catch (error: any) {
      console.error('❌ Error saving medicine:', error);

      // ✅ FIX: Better error handling with specific messages
      let errorMessage = 'Failed to save medicine';

      if (error.message?.includes('User not found')) {
        errorMessage = 'Please log in again';
      } else if (error.message?.includes('already exists')) {
        errorMessage = 'A medicine with this name already exists';
      } else if (error.message?.includes('validation')) {
        errorMessage = 'Please check your input data';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-5">
      <View className="pt-14 pb-6">
        <Text className="text-2xl font-bold text-gray-800">Add New Medicine</Text>
      </View>

      <View className="mb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">Medicine Name</Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50"
          value={medicineName}
          onChangeText={setMedicineName}
          placeholder="Enter medicine name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">Total Quantity</Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50"
          value={totalQuantity}
          onChangeText={setTotalQuantity}
          placeholder="Enter medicine quantity"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">Threshold Quantity</Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50"
          value={thresholdQuantity}
          onChangeText={setThresholdQuantity}
          placeholder="Enter quantity"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">Dose Quantity</Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50"
          value={doseQuantity}
          onChangeText={setDoseQuantity}
          placeholder="Enter quantity"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">Unit</Text>
        <View className="border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
          <Picker
            selectedValue={unit}
            onValueChange={(itemValue) => setUnit(itemValue)}
            style={{ height: 50, color: '#1F2937', paddingHorizontal: 12 }} // text-gray-800
            dropdownIconColor="#6B7280" // Tailwind gray-500
          >
            <Picker.Item label="mg" value="mg" />
            <Picker.Item label="ml" value="ml" />
            <Picker.Item label="Pills" value="pills" />
            <Picker.Item label="drops" value="drops" />
          </Picker>
        </View>
      </View>

      <View className="mb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">Expiry Date</Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-xl p-3 bg-gray-50 flex-row items-center justify-between"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className="text-base text-gray-800">{expiryDate.toLocaleDateString()}</Text>
          <View className="bg-blue-50 rounded-full p-1">
            <Text className="text-blue-500 text-xs font-medium">CHANGE</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="mb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">Dose Times</Text>

        {doseTimes.map((time, index) => (
          <View key={index} className="flex-row items-center space-x-2 mb-2">
            {/* Time Input */}
            <TouchableOpacity
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 flex-row items-center justify-between"
              onPress={() => {
                setCurrentTimeIndex(index);
                setShowTimePicker(true);
              }}
            >
              <Text className="text-base text-gray-800">{time || "Select time"}</Text>
              <View className="bg-blue-100 px-2 py-1 rounded-full">
                <Text className="text-blue-600 text-xs font-semibold">{time ? "CHANGE" : "SELECT"}</Text>
              </View>
            </TouchableOpacity>

            {/* Remove Button */}
            <TouchableOpacity
              className="bg-red-500 w-8 h-8 ml-1 rounded-lg justify-center items-center"
              onPress={() => handleRemoveDoseTime(index)}
            >
              <Text className="text-white text-base font-bold">X</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Another Button */}
        <TouchableOpacity
          className="bg-gray-100 p-3 rounded-xl mt-2 items-center flex-row justify-center"
          onPress={handleAddDoseTime}
        >
          <Text className="text-gray-600 font-medium">+ Add Another Time</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-blue-500 p-4 rounded-xl items-center mt-4 mb-10"
        onPress={handleSubmit}
      >
        <Text className="text-white font-bold text-lg">Add Medicine</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={expiryDate}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setExpiryDate(date);
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
};

export default AddMedicine;