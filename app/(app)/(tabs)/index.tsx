import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
import { healthProductApi } from '@/services/api';

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string;
  doseAmount: number;
  doseTimes: string[];
}

interface ApiResponse {
  status: number;
  data: {
    id: string;
    medicationSchedules: string[];
  };
}

const AddMedicine: React.FC = () => {
  const [medicineName, setMedicineName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [doseAmount, setDoseAmount] = useState<string>("");
  const [doseTimes, setDoseTimes] = useState<string[]>([""]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);

  const handleAddDoseTime = (): void => {
    setDoseTimes([...doseTimes, ""]);
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
      const medicine: Medicine = {
        id: Date.now().toString(),
        name: medicineName,
        quantity: parseInt(quantity),
        expiryDate: expiryDate.toISOString(),
        doseAmount: parseInt(doseAmount),
        doseTimes: doseTimes.filter((time) => time !== ""),
      };

      const userData = await AsyncStorage.getItem("userData");
      const userId = userData ? JSON.parse(userData)?.id : null;

      if (!userId) {
        Alert.alert("Error", "User data not found");
        return;
      }

      const newMedicine = {
        name: medicineName.trim(),
        quantity: parseFloat(quantity),
        expiryDate: expiryDate.toISOString().split("T")[0],
        amount: parseFloat(doseAmount),
        times: doseTimes.filter((time) => time !== ""),
        userId,
      };

      const existingMedicines = await AsyncStorage.getItem("medicines");
      const medicines: Medicine[] = existingMedicines ? JSON.parse(existingMedicines) : [];

      const response = await healthProductApi.createHealthProduct(newMedicine) as ApiResponse;

      console.log("response", response);
      console.log("response data", response.data);

      if (response.status === 200) {
        medicines.push(medicine);
        await AsyncStorage.setItem("medicines", JSON.stringify(medicines));

        if (Platform.OS !== "web") {
          const notificationIds = await Promise.all(
            medicine.doseTimes.map(async (time) => {
              const [hours, minutes] = time.split(":");
              const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                  title: `Medicine Time ${medicine.name}`,
                  body: `Take this -- ${medicine.doseAmount} pills`,
                  data: { medicineId: response.data.id, scheduleId: response.data.medicationSchedules },
                  categoryIdentifier: "MEDICINE_REMINDER",
                },
                trigger: {
                  hour: parseInt(hours),
                  minute: parseInt(minutes),
                  repeats: true,
                } as Notifications.DailyTriggerInput,
              });
              return identifier;
            })
          );

          // Store notification IDs
          await AsyncStorage.setItem(
            `notifications_${response.data.id}`,
            JSON.stringify(notificationIds)
          );
        }
        Alert.alert("Success", "Medicine added successfully");
        router.push("/medicines" as any);
      } else {
        Alert.alert("Error", "Failed to add medicine");
      }
    } catch (error) {
      console.error("Error saving medicine:", error);
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
        <Text className="text-base font-medium text-gray-700 mb-2">Quantity</Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Enter quantity"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
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
        <Text className="text-base font-medium text-gray-700 mb-2">Dose Amount (pills)</Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50"
          value={doseAmount}
          onChangeText={setDoseAmount}
          placeholder="Enter dose amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-5">
        <Text className="text-base font-medium text-gray-700 mb-2">Dose Times</Text>
        {doseTimes.map((time, index) => (
          <TouchableOpacity
            key={index}
            className="border border-gray-300 rounded-xl p-3 bg-gray-50 mb-2 flex-row items-center justify-between"
            onPress={() => {
              setCurrentTimeIndex(index);
              setShowTimePicker(true);
            }}
          >
            <Text className="text-base text-gray-800">{time || "Select time"}</Text>
            <View className="bg-blue-50 rounded-full p-1">
              <Text className="text-blue-500 text-xs font-medium">{time ? "CHANGE" : "SELECT"}</Text>
            </View>
          </TouchableOpacity>
        ))}
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