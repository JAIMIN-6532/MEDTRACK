import { healthProductApi } from '@/services/api';
import { notificationService } from '@/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
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

import { HealthProductRequestDto } from '@/types/healthProductTypes';

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
      
      if (!userData || !userData.id) {
        console.error('❌ User data not found or invalid:', userData);
        return Alert.alert('Error', 'User not found');
      }

      const userId = userData.id;
      console.log('👤 User ID:', userId);

      if (!medicineName.trim()) {
        return Alert.alert('Error', 'Please enter medicine name');
      }

      const newHealthProduct: HealthProductRequestDto = {
        userId,
        healthProductName: medicineName.trim(),
        totalQuantity: parseFloat(totalQuantity),
        availableQuantity: parseFloat(totalQuantity),
        thresholdQuantity: parseFloat(thresholdQuantity),
        doseQuantity: parseFloat(doseQuantity),
        unit,
        expiryDate: expiryDate.toISOString().split('T')[0],
        reminderTimes: doseTimes.filter(Boolean),
      };

      console.log('📦 Creating health product with data:', newHealthProduct);

      const response = await healthProductApi.createHealthProduct(newHealthProduct);
      const healthProductId = response?.healthProductId; 
      console.log("HealthProduct id " , healthProductId)
      
      if (!response || !response.healthProductId) {
        console.error('❌ Invalid response from API:', response);
        return Alert.alert('Error', 'Failed to add medicine');
      }

      console.log('✅ Health product created with ID:', response.healthProductId);

      const localMedicine: MedicineLocalStorage = {
        id: response.healthProductId,
        userId,
        name: response.healthProductName,
        totalQuantity: response.totalQuantity,
        availableQuantity: response.availableQuantity,
        thresholdQuantity: response.thresholdQuantity,
        doseQuantity: response.doseQuantity,
        unit: response.unit,
        expiryDate: response.expiryDate,
        doseTimes: response.reminderTimes,
      };
      //check kar add karine.. ok
      const existingStr = await AsyncStorage.getItem('medicines');
      const existing: MedicineLocalStorage[] = existingStr ? JSON.parse(existingStr) : [];
      existing.push(localMedicine);
      await AsyncStorage.setItem('medicines', JSON.stringify(existing));

      if(Platform.OS !== 'web') {
          const notificationIds = await Promise.all(
            localMedicine.doseTimes.map(async(t,index)=>{
              const [hour, minute] = t.split(':');
              console.log("inside index:",healthProductId);
              const identifier = await Notifications.scheduleNotificationAsync({
                //asyncstorage ma medicines (thi ) save che ne ? ? 
                // yes
                content: {
                  title: `Time to take ${localMedicine.name}`,
                  body: `Don't forget to take your ${localMedicine.doseQuantity}}`,
                  data: { id: healthProductId, scheduleId: healthProductId },
                  categoryIdentifier: "MEDICINE_REMINDER"
                },
                trigger: {
                  hour: parseInt(hour),
                  minute: parseInt(minute),
                  repeats: true,
                },
              });
              console.log('Notification scheduled with ID:', identifier);
              return identifier;
              }));
              await AsyncStorage.setItem(
                `notifications_${response.healthProductId}`,  
                JSON.stringify(notificationIds)
              );

            }
      // if (Platform.OS !== 'web') {
      //   console.log('🔔 Scheduling notifications with:', {
      //     healthProductId: response.healthProductId,
      //     userId,
      //     doseQuantity: response.doseQuantity,
      //     unit: response.unit,
      //     medicineName: medicineName.trim(),
      //     reminderTimes: response.reminderTimes,
      //   });

      //   const notificationIds = await notificationService.scheduleDailyReminders(
      //     response.healthProductId,
      //     userId,
      //     response.doseQuantity,
      //     response.unit,
      //     medicineName.trim(),
      //     response.reminderTimes
      //   );

      //   if (notificationIds && notificationIds.length > 0) {
      //     await AsyncStorage.setItem(
      //       `notifications_${response.healthProductId}`,
      //       JSON.stringify(notificationIds)
      //     );
      //     console.log('✅ Notifications scheduled successfully:', notificationIds);
      //   } else {
      //     console.warn('⚠️ No notification IDs returned');
      //   }
      // }

      Alert.alert('Success', 'Medicine added successfully');
      router.push('/medicines' as never);

    } catch (error) {
      console.error('❌ Error saving medicine:', error);
      Alert.alert('Error', 'Failed to save medicine');
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