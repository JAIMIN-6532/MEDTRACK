import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import axios from "axios";


export default function AddMedicine() {
  const [medicineName, setMedicineName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [doseAmount, setDoseAmount] = useState("");
  const [doseTimes, setDoseTimes] = useState([""]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);

  const handleAddDoseTime = () => {
    setDoseTimes([...doseTimes, ""]);
  };

  const handleTimeChange = (event, selectedTime) => {
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

  const handleSubmit = async () => {
    try {
      const medicine = {
        id: Date.now().toString(),
        name: medicineName,
        quantity: parseInt(quantity),
        expiryDate: expiryDate.toISOString(),
        doseAmount: parseInt(doseAmount),
        doseTimes: doseTimes.filter((time) => time !== ""),
      };

      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData)?.id;

      const newMedicine = {
        name: medicineName.trim(),
        quantity: parseFloat(quantity),
        expiryDate: expiryDate.toISOString().split("T")[0],
        amount: parseFloat(doseAmount),
        times: doseTimes.filter((time) => time !== ""),
        userId,
      };

      const existingMedicines = await AsyncStorage.getItem("medicines");
      const medicines = existingMedicines ? JSON.parse(existingMedicines) : [];

      const response = await axios.post(
        "http://192.168.1.7:8888/api/v1/healthproduct/insert",
        newMedicine
      );
      console.log("response jfnjsnjjdSdabsa", response.data);
      if (response.status === 200) {
        medicines.push(medicine);
        await AsyncStorage.setItem("medicines", JSON.stringify(medicines));
        if (Platform.OS !== "web") {
          const notificationIds = await Promise.all(
            medicine.doseTimes.map(async (time) => {
              const [hours, minutes] = time.split(":");
              const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                  title: `Medicine TIme ${medicine.name}`,
                  body: `Take this -- ${medicine.doseAmount} pills`,
                  data: { medicineId: response.data.id,scheduleId:response.data.medicationSchedules },
                  categoryIdentifier: "MEDICINE_REMINDER",
                },
                trigger: {
                  hour: parseInt(hours),
                  minute: parseInt(minutes),
                  repeats: true,
                },
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
        router.push("/medicines");
      } else {
        Alert.alert("Error", "Failed to add medicine");
      }
    } catch (error) {
      console.error("Error saving medicine:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Medicine</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Medicine Name</Text>
        <TextInput
          style={styles.input}
          value={medicineName}
          onChangeText={setMedicineName}
          placeholder="Enter medicine name"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Enter quantity"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Expiry Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{expiryDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Dose Amount (pills)</Text>
        <TextInput
          style={styles.input}
          value={doseAmount}
          onChangeText={setDoseAmount}
          placeholder="Enter dose amount"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Dose Times</Text>
        {doseTimes.map((time, index) => (
          <TouchableOpacity
            key={index}
            style={styles.input}
            onPress={() => {
              setCurrentTimeIndex(index);
              setShowTimePicker(true);
            }}
          >
            <Text>{time || "Select time"}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={handleAddDoseTime}>
          <Text style={styles.addButtonText}>Add Another Time</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Add Medicine</Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#333",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
