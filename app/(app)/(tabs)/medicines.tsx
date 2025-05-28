import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { format, isBefore, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { healthProductApi, medicineLogApi } from '@/services/api';
import {
  HealthProductResponseDto,
} from '@/types/healthProductTypes';
import { MedicineUsageSummaryDto } from '@/types/medicineUsageLogTypes';

// --- Tab Types ---
type TabType = 'daily' | 'stock' | 'weekly' | 'low';

// --- Component ---
const MedicinesList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [loading, setLoading] = useState<boolean>(true);

  const [dailyUsage, setDailyUsage] = useState<MedicineUsageSummaryDto[]>([]);
  const [stockProducts, setStockProducts] = useState<HealthProductResponseDto[]>([]);
  const [weeklyUsage, setWeeklyUsage] = useState<MedicineUsageSummaryDto[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<HealthProductResponseDto[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('userData');
      const userId = JSON.parse(userJson ?? '{}')?.id as string | undefined;
      if (!userId) {
        Alert.alert('Error', 'User not found.');
        return;
      }

      const [daily, stock, weekly, low] = await Promise.all([
        medicineLogApi.getTodayLogs(),
        healthProductApi.getAllHealthProducts(),
        medicineLogApi.getLogsForPastDays(7),
        healthProductApi.getLowStockHealthProducts(),
      ]);

      setDailyUsage(daily ?? []);
      setStockProducts(stock ?? []);
      setWeeklyUsage(weekly ?? []);
      setLowStockProducts(low ?? []);
    } catch (e) {
      console.error('Load data error:', e);
      Alert.alert('Error', 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const renderCard = <T,>(
    title: string,
    items: T[],
    renderItem: (item: T, index: number) => JSX.Element,
    emptyMsg: string
  ): JSX.Element => (
    <View className="mx-5 mb-6">
      <View className="flex-row items-center mb-4">
        <View className="w-1.5 h-6 bg-blue-500 rounded-full mr-2" />
        <Text className="text-xl font-semibold text-gray-800">{title}</Text>
      </View>
      {items.length === 0 ? (
        <View className="items-center py-10">
          <Ionicons name="sad-outline" size={40} color="#9CA3AF" />
          <Text className="text-base text-gray-500 mt-3">{emptyMsg}</Text>
        </View>
      ) : (
        items.map(renderItem)
      )}
    </View>
  );

  const DailyCard = (
    item: MedicineUsageSummaryDto,
    idx: number
  ): JSX.Element => (
    <View key={idx} className="mb-4 p-4 bg-white rounded-2xl shadow-sm">
      <Text className="text-base font-semibold text-gray-800">
        {item.healthProductName}
      </Text>
      <View className="flex-row mt-2">
        <Text className="text-sm text-green-700 mr-4">
          Taken: {item.takenCount}
        </Text>
        <Text className="text-sm text-red-700">
          Missed: {item.missedCount}
        </Text>
      </View>
    </View>
  );

  const StockCard = (
    item: HealthProductResponseDto,
    idx: number
  ): JSX.Element => {
    const expired = isBefore(parseISO(item.expiryDate), new Date());
    return (
      <View key={idx} className="mb-4 rounded-2xl overflow-hidden shadow-sm border">
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          className="p-4 rounded-2xl"
        >
          <Text className="text-base font-semibold text-gray-800">
            {item.healthProductName}
          </Text>
          <View className="flex-row mt-2">
            <Text className="text-sm text-gray-600 mr-4">
              Stock: {item.availableQuantity}/{item.totalQuantity}
            </Text>
            <Text
              className={`text-sm ml-auto ${expired ? 'text-red-500' : 'text-gray-600'
                }`}
            >
              Exp: {format(parseISO(item.expiryDate), 'dd MMM yyyy')}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const WeeklyCard = DailyCard;
  const LowCard = StockCard;

  const TabButton = ({
    title,
    icon,
    tab,
  }: {
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    tab: TabType;
  }): JSX.Element => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`items-center py-3 px-3 rounded-xl ${activeTab === tab ? 'bg-blue-500 shadow-md' : 'bg-gray-100'
        }`}
    >
      <Ionicons
        name={icon}
        size={22}
        color={activeTab === tab ? '#FFFFFF' : '#9CA3AF'}
      />
      <Text
        className={`text-xs font-medium mt-1 ${activeTab === tab ? 'text-white' : 'text-gray-500'
          }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="mt-4 text-base text-gray-600">Loading data...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#60A5FA', '#93C5FD']}
        className="pt-14 pb-10 items-center justify-center rounded-b-3xl"
      >
        <Text className="text-2xl font-bold text-white mb-3">
          Medication Management
        </Text>
        <View className="bg-white/20 p-3 rounded-full">
          <Ionicons name="medkit" size={36} color="#FFFFFF" />
        </View>
      </LinearGradient>

      <View className="flex-row justify-between mx-5 my-5">
        <TabButton title="Daily" icon="today" tab="daily" />
        <TabButton title="Stock" icon="cube" tab="stock" />
        <TabButton title="Weekly" icon="calendar" tab="weekly" />
        <TabButton title="Low" icon="alert-circle" tab="low" />
      </View>

      {activeTab === 'daily' &&
        renderCard(
          "Today's Summary",
          dailyUsage,
          DailyCard,
          'No doses logged today.'
        )}

      {activeTab === 'stock' &&
        renderCard(
          'Stock Overview',
          stockProducts,
          StockCard,
          'No products in stock.'
        )}

      {activeTab === 'weekly' &&
        renderCard(
          'Weekly Summary',
          weeklyUsage,
          WeeklyCard,
          'No usage data this week.'
        )}

      {activeTab === 'low' &&
        renderCard(
          'Low Stock Alerts',
          lowStockProducts,
          LowCard,
          'All products sufficiently stocked.'
        )}
    </ScrollView>
  );
};

export default MedicinesList;
