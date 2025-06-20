import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { PieChart, LineChart } from "react-native-chart-kit";
import { userApi, medicineLogApi, healthProductApi } from "@/services/api";

const { width } = Dimensions.get("window");

interface ProfileData {
  userId: string;
  fullName: string;
  email: string;
  photoUrl?: string;
}

interface MedicineStats {
  totalMedicines: number;
  activeMedicines: number;
  expiredMedicines: number;
  lowStockMedicines: number;
  adherenceRate: number;
  totalDosesTaken: number;
  totalDosesMissed: number;
}

interface ChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<MedicineStats>({
    totalMedicines: 0,
    activeMedicines: 0,
    expiredMedicines: 0,
    lowStockMedicines: 0,
    adherenceRate: 0,
    totalDosesTaken: 0,
    totalDosesMissed: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [pieChartData, setPieChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const userData = await AsyncStorage.getItem("userData");
      if (!userData) throw new Error("User not found");

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Load all data in parallel
      const [todayLogs, weeklyLogs, allProducts, lowStockProducts] = await Promise.all([
        medicineLogApi.getTodayLogs().catch(() => []),
        medicineLogApi.getLogsForPastDays(7).catch(() => []),
        healthProductApi.getAllHealthProducts().catch(() => []),
        healthProductApi.getLowStockHealthProducts().catch(() => []),
      ]);

      // Calculate statistics
      const currentDate = new Date();
      const expiredProducts = allProducts.filter(product =>
        new Date(product.expiryDate) < currentDate
      );
      const activeProducts = allProducts.filter(product =>
        new Date(product.expiryDate) >= currentDate && product.availableQuantity > 0
      );

      const totalTaken = weeklyLogs.reduce((sum: number, log: any) => sum + (log.takenCount || 0), 0);
      const totalMissed = weeklyLogs.reduce((sum: number, log: any) => sum + (log.missedCount || 0), 0);
      const adherenceRate = totalTaken + totalMissed > 0 ? (totalTaken / (totalTaken + totalMissed)) * 100 : 0;

      setStats({
        totalMedicines: allProducts.length,
        activeMedicines: activeProducts.length,
        expiredMedicines: expiredProducts.length,
        lowStockMedicines: lowStockProducts.length,
        adherenceRate: Math.round(adherenceRate),
        totalDosesTaken: totalTaken,
        totalDosesMissed: totalMissed,
      });

      // Prepare pie chart data
      const chartData: ChartData[] = [
        {
          name: "Taken",
          population: totalTaken,
          color: "#10B981",
          legendFontColor: "#374151",
          legendFontSize: 12,
        },
        {
          name: "Missed",
          population: totalMissed,
          color: "#EF4444",
          legendFontColor: "#374151",
          legendFontSize: 12,
        },
      ].filter(item => item.population > 0);

      setPieChartData(chartData);

      // Prepare weekly line chart data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      });

      setWeeklyData({
        labels: last7Days,
        datasets: [
          {
            data: [85, 90, 78, 95, 88, 92, 87], // Mock data - replace with actual
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      });

    } catch (err: any) {
      console.error('Profile loading error:', err);
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadProfileData(true);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await userApi.logoutUser();
              await AsyncStorage.clear();
              router.replace("/auth/SignIn");
            } catch (err) {
              console.error("Logout failed:", err);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  const StatCard = ({ title, value, subtitle, icon, color = "blue" }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color?: string;
  }) => (
    <View className="bg-white rounded-2xl p-4 shadow-sm flex-1 mx-1">
      <View className="flex-row items-center justify-between mb-2">
        <View className={`p-2 rounded-full ${color === 'green' ? 'bg-green-100' : color === 'red' ? 'bg-red-100' : color === 'orange' ? 'bg-orange-100' : 'bg-blue-100'}`}>
          <Ionicons
            name={icon as any}
            size={20}
            color={color === 'green' ? '#10B981' : color === 'red' ? '#EF4444' : color === 'orange' ? '#F59E0B' : '#3B82F6'}
          />
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      <Text className="text-sm font-medium text-gray-600">{title}</Text>
      {subtitle && (
        <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
      )}
    </View>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, color = "#6B7280" }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="p-3 rounded-full bg-gray-100 mr-4">
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600 text-base">Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-red-600 text-lg font-semibold mt-4 text-center">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
          onPress={() => loadProfileData()}
        >
          <Text className="text-white font-semibold text-base">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        className="pt-14 pb-8"
      >
        <View className="px-4">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center flex-1">
              <Image
                source={{
                  uri: user?.photoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
                }}
                className="w-20 h-20 rounded-full border-4 border-white/30"
              />
              <View className="ml-4 flex-1">
                <Text className="text-2xl font-bold text-white">{user?.fullName}</Text>
                <Text className="text-blue-100 text-base mt-1">{user?.email}</Text>
                <View className="flex-row items-center mt-2">
                  <View className="bg-white/20 rounded-full px-3 py-1">
                    <Text className="text-white text-sm font-medium">
                      {stats.adherenceRate}% Adherence
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity className="p-2 bg-white/20 rounded-full">
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Statistics Cards */}
      <View className="px-4 -mt-4 mb-6">
        <View className="flex-row mb-3">
          <StatCard
            title="Total Medicines"
            value={stats.totalMedicines}
            icon="medical"
            color="blue"
          />
          <StatCard
            title="Active"
            value={stats.activeMedicines}
            icon="checkmark-circle"
            color="green"
          />
        </View>
        <View className="flex-row">
          <StatCard
            title="Low Stock"
            value={stats.lowStockMedicines}
            icon="warning"
            color="orange"
          />
          <StatCard
            title="Expired"
            value={stats.expiredMedicines}
            icon="alert-circle"
            color="red"
          />
        </View>
      </View>

      {/* Charts Section */}
      {pieChartData.length > 0 && (
        <View className="bg-white mx-4 mb-6 p-4 rounded-2xl shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">Weekly Adherence</Text>
          <PieChart
            data={pieChartData}
            width={width - 64}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
          />
          <View className="flex-row justify-center mt-4">
            <View className="flex-row items-center mr-6">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <Text className="text-sm text-gray-600">Taken: {stats.totalDosesTaken}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              <Text className="text-sm text-gray-600">Missed: {stats.totalDosesMissed}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Weekly Trend */}
      {weeklyData && (
        <View className="bg-white mx-4 mb-6 p-4 rounded-2xl shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">7-Day Trend</Text>
          <LineChart
            data={weeklyData}
            width={width - 64}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#3B82F6"
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )}

      {/* Menu Items */}
      <View className="px-4 mb-8">
        <Text className="text-lg font-bold text-gray-900 mb-4">Settings</Text>

        <MenuItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Manage your reminder settings"
          onPress={() => {/* TODO: Navigate to notifications */ }}
        />

        <MenuItem
          icon="analytics-outline"
          title="Reports"
          subtitle="View detailed adherence reports"
          onPress={() => {/* TODO: Navigate to reports */ }}
        />

        <MenuItem
          icon="settings-outline"
          title="App Settings"
          subtitle="Customize your experience"
          onPress={() => {/* TODO: Navigate to settings */ }}
        />

        <MenuItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Get help and contact support"
          onPress={() => {/* TODO: Navigate to help */ }}
        />

        <MenuItem
          icon="information-circle-outline"
          title="About"
          subtitle="App version and information"
          onPress={() => {/* TODO: Navigate to about */ }}
        />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 rounded-2xl p-4 mt-4 flex-row items-center border border-red-100"
          activeOpacity={0.7}
        >
          <View className="p-3 rounded-full bg-red-100 mr-4">
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-red-600">Logout</Text>
            <Text className="text-sm text-red-500 mt-1">Sign out of your account</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="h-20" />
    </ScrollView>
  );
};

export default Profile;