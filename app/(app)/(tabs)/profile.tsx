import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { userApi, medicineLogApi } from "@/services/api";

interface ProfileData {
  name: string;
  email: string;
  photoUrl?: string;
}

interface MedicineStat {
  name: string;
  missedDoses: number;
  color: string;
  legendFontColor: string;
}

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<ProfileData | null>(null);
  const [medicineStats, setMedicineStats] = useState<MedicineStat[]>([]);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await AsyncStorage.getItem("userData");
      if (!userData) throw new Error("User not found");

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      const [_, logsResponse] = await Promise.all([
        userApi.getUserProfile(),
        medicineLogApi.getLogsForPastDays(30),
      ]);

      const logsArray = Array.isArray(logsResponse)
        ? logsResponse
        : Array.isArray(logsResponse)
          ? logsResponse
          : [];

      const formattedStats = logsArray.map((stat: any) => ({
        name: stat.healthProductName,
        missedDoses: parseInt(stat.misCount, 10) || 0,
        color: getRandomColor(),
        legendFontColor: "#64748b",
      }));

      setMedicineStats(formattedStats);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await userApi.logoutUser();
      await AsyncStorage.clear();
      router.replace("/auth/SignIn");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getRandomColor = (): string => {
    const colors = [
      "#6366f1",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
      "#f59e0b",
      "#ef4444",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-4">
        <Text className="text-red-500 text-lg mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-indigo-500 px-6 py-2 rounded-lg"
          onPress={loadProfileData}
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 mt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center space-x-4">
          <Image
            source={{
              uri:
                user?.photoUrl ||
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
            }}
            className="w-20 h-20 rounded-full border-4 border-indigo-500"
          />
          <View>
            <Text className="text-xl font-semibold text-slate-800">
              {user?.name}
            </Text>
            <Text className="text-base text-slate-500">{user?.email}</Text>
          </View>
        </View>

        <TouchableOpacity className="p-2 bg-indigo-50 rounded-lg">
          <Ionicons name="pencil" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Pie Chart */}
      {medicineStats.length > 0 ? (
        <View className="bg-white mx-4 mt-4 p-4 rounded-2xl shadow">
          <Text className="text-lg font-semibold text-slate-800 mb-1">
            Missed Medicine Statistics
          </Text>
          <Text className="text-sm text-slate-500 mb-3">
            Percentage of missed doses by medicine
          </Text>
          <PieChart
            data={medicineStats}
            width={Dimensions.get("window").width - 32}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              strokeWidth: 2,
            }}
            accessor="missedDoses"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
            style={{ borderRadius: 16 }}
          />
        </View>
      ) : (
        <View className="bg-white mx-4 mt-4 p-6 rounded-2xl items-center justify-center h-52">
          <Text className="text-slate-500 text-base">
            No medicine statistics available
          </Text>
        </View>
      )}

      {/* Menu */}
      <View className="p-4 space-y-2">
        {[
          { label: "Notifications", icon: "notifications-outline" },
          { label: "Settings", icon: "settings-outline" },
          { label: "Help & Support", icon: "help-circle-outline" },
        ].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            className="flex-row items-center bg-white p-4 rounded-2xl"
          >
            <Ionicons name={item.icon as any} size={24} color="#64748b" />
            <Text className="text-base text-slate-800 flex-1 ml-3">
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center bg-white p-4 rounded-2xl mt-2"
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text className="text-base text-red-500 flex-1 ml-3">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Profile;
