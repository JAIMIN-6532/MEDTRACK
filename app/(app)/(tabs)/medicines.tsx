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
  RefreshControl,
  Dimensions,
} from 'react-native';

import { healthProductApi, medicineLogApi } from '@/services/api';
import { HealthProductResponseDto } from '@/types/healthProductTypes';
import { MedicineUsageSummaryDto } from '@/types/medicineUsageLogTypes';

const { width } = Dimensions.get('window');

type TabType = 'daily' | 'stock' | 'weekly' | 'low';

// Enhanced Medicine Card Component
const MedicineCard = ({
  medicine,
  onTakeMedicine,
  type = 'usage'
}: {
  medicine: any;
  onTakeMedicine?: (id: string) => void;
  type?: 'usage' | 'stock';
}) => {
  const isStockCard = type === 'stock';
  const isExpired = isStockCard && isBefore(parseISO(medicine.expiryDate), new Date());
  const isLowStock = isStockCard && medicine.availableQuantity <= medicine.thresholdQuantity;
  const stockPercentage = isStockCard ? Math.min((medicine.availableQuantity / medicine.totalQuantity) * 100, 100) : 0;

  return (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm mx-4">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
            {isStockCard ? medicine.healthProductName : medicine.healthProductName}
          </Text>
          {isStockCard && (
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 mr-2">ID:</Text>
              <Text className="text-xs font-mono text-blue-600">
                #{medicine.healthProductId.toString().padStart(4, '0')}
              </Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        {isStockCard && (
          <View className={`px-3 py-1 rounded-full ${isExpired ? 'bg-red-100' :
            isLowStock ? 'bg-orange-100' :
              'bg-green-100'
            }`}>
            <Text className={`text-xs font-semibold ${isExpired ? 'text-red-800' :
              isLowStock ? 'text-orange-800' :
                'text-green-800'
              }`}>
              {isExpired ? 'Expired' : isLowStock ? 'Low Stock' : 'Active'}
            </Text>
          </View>
        )}
      </View>

      {/* Content based on type */}
      {isStockCard ? (
        <>
          {/* Stock Progress Bar */}
          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-medium text-gray-700">Stock Level</Text>
              <Text className="text-sm text-gray-600">
                {medicine.availableQuantity} / {medicine.totalQuantity} {medicine.unit}
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${medicine.availableQuantity <= 0 ? 'bg-red-500' :
                  isLowStock ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                style={{ width: `${Math.max(stockPercentage, 5)}%` }}
              />
            </View>
          </View>

          {/* Stock Details */}
          <View className="flex-row justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Ionicons name="medical" size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  Dose: {medicine.doseQuantity} {medicine.unit}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  {medicine.reminderTimes?.length || 0} reminders
                </Text>
              </View>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Ionicons name="calendar-outline" size={14} color={isExpired ? "#EF4444" : "#6B7280"} />
                <Text className={`text-sm ml-2 ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                  Exp: {format(parseISO(medicine.expiryDate), 'MMM dd')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="alert-circle-outline" size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  Alert: {medicine.thresholdQuantity} {medicine.unit}
                </Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Usage Stats */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 flex-row items-center">
              <View className="bg-green-100 p-2 rounded-full mr-3">
                <Ionicons name="checkmark" size={16} color="#10B981" />
              </View>
              <View>
                <Text className="text-xl font-bold text-green-700">{medicine.takenCount}</Text>
                <Text className="text-xs text-gray-500">Taken</Text>
              </View>
            </View>

            <View className="flex-1 flex-row items-center">
              <View className="bg-red-100 p-2 rounded-full mr-3">
                <Ionicons name="close" size={16} color="#EF4444" />
              </View>
              <View>
                <Text className="text-xl font-bold text-red-700">{medicine.missedCount}</Text>
                <Text className="text-xs text-gray-500">Missed</Text>
              </View>
            </View>

            {onTakeMedicine && (
              <TouchableOpacity
                onPress={() => onTakeMedicine(medicine.healthProductId.toString())}
                className="bg-blue-500 px-4 py-2 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold text-sm">Mark Taken</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Adherence Rate */}
          <View className="bg-gray-50 rounded-lg p-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-medium text-gray-700">Adherence Rate</Text>
              <Text className="text-sm font-bold text-blue-600">
                {medicine.takenCount + medicine.missedCount > 0
                  ? Math.round((medicine.takenCount / (medicine.takenCount + medicine.missedCount)) * 100)
                  : 0}%
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

// Quick Stats Component
const QuickStats = ({ data }: { data: any }) => (
  <View className="mx-4 mb-6">
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <Text className="text-lg font-bold text-gray-900 mb-4">Quick Overview</Text>
      <View className="flex-row justify-between">
        <View className="items-center flex-1">
          <View className="bg-blue-100 p-3 rounded-full mb-2">
            <Ionicons name="medical" size={24} color="#3B82F6" />
          </View>
          <Text className="text-xl font-bold text-gray-900">{data.total || 0}</Text>
          <Text className="text-sm text-gray-500">Total</Text>
        </View>

        <View className="items-center flex-1">
          <View className="bg-green-100 p-3 rounded-full mb-2">
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
          <Text className="text-xl font-bold text-green-700">{data.taken || 0}</Text>
          <Text className="text-sm text-gray-500">Taken</Text>
        </View>

        <View className="items-center flex-1">
          <View className="bg-red-100 p-3 rounded-full mb-2">
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
          </View>
          <Text className="text-xl font-bold text-red-700">{data.missed || 0}</Text>
          <Text className="text-sm text-gray-500">Missed</Text>
        </View>

        <View className="items-center flex-1">
          <View className="bg-orange-100 p-3 rounded-full mb-2">
            <Ionicons name="warning" size={24} color="#F59E0B" />
          </View>
          <Text className="text-xl font-bold text-orange-700">{data.adherence || 0}%</Text>
          <Text className="text-sm text-gray-500">Adherence</Text>
        </View>
      </View>
    </View>
  </View>
);

// Main Component
const MedicinesList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [dailyUsage, setDailyUsage] = useState<MedicineUsageSummaryDto[]>([]);
  const [stockProducts, setStockProducts] = useState<HealthProductResponseDto[]>([]);
  const [weeklyUsage, setWeeklyUsage] = useState<MedicineUsageSummaryDto[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<HealthProductResponseDto[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefresh = false): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const userJson = await AsyncStorage.getItem('userData');
      const userId = JSON.parse(userJson ?? '{}')?.id as string | undefined;
      if (!userId) {
        Alert.alert('Error', 'User not found.');
        return;
      }

      // Load data in parallel with error handling
      const [daily, stock, weekly, low] = await Promise.all([
        medicineLogApi.getTodayLogs().catch(() => []),
        healthProductApi.getAllHealthProducts().catch(() => []),
        medicineLogApi.getLogsForPastDays(7).catch(() => []),
        healthProductApi.getLowStockHealthProducts().catch(() => []),
      ]);

      console.log('🔍 API Response Debug:');
      console.log('Daily logs:', daily);
      console.log('Stock products:', stock);
      console.log('Weekly logs:', weekly);
      console.log('Low stock:', low);

      setDailyUsage(Array.isArray(daily) ? daily : []);
      setStockProducts(Array.isArray(stock) ? stock : []);
      setWeeklyUsage(Array.isArray(weekly) ? weekly : []);
      setLowStockProducts(Array.isArray(low) ? low : []);
    } catch (e) {
      console.error('Load data error:', e);
      Alert.alert('Error', 'Failed to load some data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadData(true);
  }, []);

  const handleTakeMedicine = async (medicineId: string) => {
    try {
      await healthProductApi.recordMedicineUsage(medicineId);
      Alert.alert('Success', 'Medicine intake recorded successfully!');
      loadData(); // Refresh data
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record medicine intake');
    }
  };

  const getQuickStatsData = () => {
    const totalTaken = dailyUsage.reduce((sum, item) => sum + (item.takenCount || 0), 0);
    const totalMissed = dailyUsage.reduce((sum, item) => sum + (item.missedCount || 0), 0);
    const total = totalTaken + totalMissed;
    const adherence = total > 0 ? Math.round((totalTaken / total) * 100) : 0;

    return {
      total: dailyUsage.length,
      taken: totalTaken,
      missed: totalMissed,
      adherence,
    };
  };

  // Tab Button Component
  const TabButton = ({
    title,
    icon,
    tab,
    count,
  }: {
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    tab: TabType;
    count: number;
  }): JSX.Element => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 items-center py-4 px-3 rounded-xl mx-1 ${activeTab === tab ? 'bg-blue-500 shadow-md' : 'bg-white'
        }`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={icon}
          size={20}
          color={activeTab === tab ? '#FFFFFF' : '#6B7280'}
        />
        <View className={`ml-2 px-2 py-1 rounded-full ${activeTab === tab ? 'bg-white/20' : 'bg-gray-100'
          }`}>
          <Text className={`text-xs font-bold ${activeTab === tab ? 'text-white' : 'text-gray-600'
            }`}>
            {count}
          </Text>
        </View>
      </View>
      <Text
        className={`text-sm font-semibold mt-2 ${activeTab === tab ? 'text-white' : 'text-gray-600'
          }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = (message: string, icon: string) => (
    <View className="items-center justify-center py-20 px-8">
      <Ionicons name={icon as any} size={80} color="#D1D5DB" />
      <Text className="text-xl font-semibold text-gray-600 mt-4 text-center">
        {message}
      </Text>
      <Text className="text-gray-500 text-center mt-2">
        Pull down to refresh or add a new medicine
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-base text-gray-600">Loading your medicines...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        className="pt-14 pb-8"
      >
        <View className="px-4">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-2xl font-bold text-white mb-2">
                Medicine Tracker
              </Text>
              <Text className="text-blue-100 text-base">
                Stay on track with your medications
              </Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <Ionicons name="medical" size={28} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      {activeTab === 'daily' && <QuickStats data={getQuickStatsData()} />}

      {/* Tab Navigation */}
      <View className="px-4 mb-6">
        <View className="flex-row bg-gray-100 rounded-xl p-2">
          <TabButton title="Today" icon="today" tab="daily" count={dailyUsage.length} />
          <TabButton title="Stock" icon="cube" tab="stock" count={stockProducts.length} />
          <TabButton title="Weekly" icon="calendar" tab="weekly" count={weeklyUsage.length} />
          <TabButton title="Low Stock" icon="warning" tab="low" count={lowStockProducts.length} />
        </View>
      </View>

      {/* Content */}
      <View className="pb-8">
        {activeTab === 'daily' && (
          <>
            {dailyUsage.length === 0 ? (
              renderEmptyState('No medicines tracked today', 'medical-outline')
            ) : (
              dailyUsage.map((item, index) => (
                <MedicineCard
                  key={`daily-${index}`}
                  medicine={item}
                  onTakeMedicine={handleTakeMedicine}
                  type="usage"
                />
              ))
            )}
          </>
        )}

        {activeTab === 'stock' && (
          <>
            {stockProducts.length === 0 ? (
              renderEmptyState('No medicines in stock', 'cube-outline')
            ) : (
              stockProducts.map((item) => (
                <MedicineCard
                  key={`stock-${item.healthProductId}`}
                  medicine={item}
                  type="stock"
                />
              ))
            )}
          </>
        )}

        {activeTab === 'weekly' && (
          <>
            {weeklyUsage.length === 0 ? (
              renderEmptyState('No weekly data available', 'analytics-outline')
            ) : (
              weeklyUsage.map((item, index) => (
                <MedicineCard
                  key={`weekly-${index}`}
                  medicine={item}
                  type="usage"
                />
              ))
            )}
          </>
        )}

        {activeTab === 'low' && (
          <>
            {lowStockProducts.length === 0 ? (
              renderEmptyState('All medicines are well stocked', 'checkmark-circle-outline')
            ) : (
              lowStockProducts.map((item) => (
                <MedicineCard
                  key={`low-${item.healthProductId}`}
                  medicine={item}
                  type="stock"
                />
              ))
            )}
          </>
        )}
      </View>

      {/* Bottom Spacing for Tab Bar */}
      <View className="h-20" />
    </ScrollView>
  );
};

export default MedicinesList;