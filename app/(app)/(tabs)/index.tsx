import { healthProductApi } from '@/services/api';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Medicine {
  id: string;
  userId: string;
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  thresholdQuantity: number;
  doseQuantity: number;
  unit: string
  expiryDate: string;
  doseTimes: string[];
}

interface ApiResponse {
  status: number;
  id: string;
  data: {
    medicationSchedules: string[];
  };
}

const AddMedicine: React.FC = () => {
  const [medicineName, setMedicineName] = useState<string>("");
  const [totalQuantity, setTotalQuantity] = useState<string>("");
  const [thresholdQuantity, setThresholdQuantity] = useState<string>("");
  const [doseQuantity, setDoesQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [doseTimes, setDoseTimes] = useState<string[]>([""]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);

  const handleAddDoseTime = (): void => {
    setDoseTimes([...doseTimes, ""]);
  };

  const handleRemoveDoseTime = (index: number): void => {
    // Create a new array excluding the item at the provided index
    const updatedDoseTimes = [...doseTimes];
    updatedDoseTimes.splice(index, 1); // Remove 1 item at the specified index
    setDoseTimes(updatedDoseTimes); // Update the state
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date): void => {
    setShowTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const newDoseTimes = [...doseTimes];
      newDoseTimes[currentTimeIndex] = timeString;
      setDoseTimes(newDoseTimes);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const userId = userData ? JSON.parse(userData)?.id : null;

      if (!userId) {
        Alert.alert("Error", "User not found");
        return;
      }

      const medicine: Medicine = {
        id: Date.now().toString(),
        userId,
        name: medicineName,
        totalQuantity: parseFloat(totalQuantity),
        availableQuantity: parseFloat(totalQuantity), // Initially full
        thresholdQuantity: parseFloat(thresholdQuantity),
        doseQuantity: parseFloat(doseQuantity),
        unit,
        expiryDate: expiryDate.toISOString(),
        doseTimes: doseTimes.filter((time) => time),
      };

      const healthProductDto = {
        id: null,
        userId,
        name: medicineName.trim(),
        totalQuantity: parseFloat(totalQuantity),
        availableQuantity: parseFloat(totalQuantity),
        thresholdQuantity: parseFloat(thresholdQuantity),
        doseQuantity: parseFloat(doseQuantity),
        unit,
        expiryDate: expiryDate.toISOString().split("T")[0],
        reminderTimes: doseTimes.filter((time) => time),
      };

      const response = await healthProductApi.createHealthProduct(healthProductDto) as ApiResponse;
      console.log("Response from API of Helathproduct:", response);
      if (response) {
        console.log("Inside status:", response);
        const existing = await AsyncStorage.getItem("medicines");
        console.log("Existing medicines:", existing);
        const medicines: Medicine[] = existing ? JSON.parse(existing) : [];
        medicines.push(medicine);
        await AsyncStorage.setItem("medicines", JSON.stringify(medicines));

        if (Platform.OS !== "web") {
          const notificationIds = await Promise.all(
            medicine.doseTimes.map(async (time) => {
              const [hours, minutes] = time.split(":");
              return await Notifications.scheduleNotificationAsync({
                content: {
                  title: `Medicine Time: ${medicine.name}`,
                  body: `Take ${medicine.doseQuantity} ${medicine.unit}`,
                  data: { medicineId: response.id },
                },
                trigger: {
                  hour: parseInt(hours),
                  minute: parseInt(minutes),
                  repeats: true,
                } as Notifications.DailyTriggerInput,
              });
            })
          );
          console.log("Notification IDs:", notificationIds);
          await AsyncStorage.setItem(`notifications_${response.id}`, JSON.stringify(notificationIds));
          console.log("Notifications saved successfully");
        }

        Alert.alert("Success", "Medicine added successfully");
        router.push("/medicines" as any);
      } else {
        Alert.alert("Error", "Failed to add medicine");
      }
    } catch (err) {
      console.error("Error saving medicine:", err);
      Alert.alert("Error", "Failed to save medicine");
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
          onChangeText={setDoesQuantity}
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
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setExpiryDate(selectedDate);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
};

export default AddMedicine;