import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { format, isBefore, parseISO } from 'date-fns';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { healthProductApi, medicineLogApi } from '@/services/api';

type Medicine = {
  name: string;
  healthProductName: string;
  quantity: number;
  expiryDate: string;
  isTakenCount: number;
  misCount?: number;
  MisCount?: number;
};

export default function MedicinesList() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'stock' | 'weekly' | 'low'>('daily');
  const [userId, setUserId] = useState<string | null>(null);
  const [dailyDoses, setDailyDoses] = useState<any[]>([]);
  const [stockDetails, setStockDetails] = useState<any[]>([]);
  const [weeklyConsumption, setWeeklyConsumption] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setupNotificationHandler();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [])
  );

  const setupNotificationHandler = () => {
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      const medicineId = response.notification.request.content.data.medicineId;
      const userData = await AsyncStorage.getItem('userData');
      const userId = JSON.parse(userData ?? '{}')?.id;
      console.log('actionId', actionId);
      if (actionId === 'TAKEN' || actionId === 'MISSED') {
        const logData = {
          userId,
          healthProductId: medicineId,
          isTaken: actionId === 'TAKEN',
          medicationScheduleIds: response.notification.request.content.data.scheduleId,
        };

        console.log('logData', logData);
        const logresponse = await medicineLogApi.addMedicineUsageLog(logData);
        // Remove the notification
        await Notifications.dismissNotificationAsync(response.notification.request.identifier);
      }
    });
  };

  const loadMedicines = async () => {
    try {
      const storedMedicines = await AsyncStorage.getItem('medicines');
      if (storedMedicines) {
        setMedicines(JSON.parse(storedMedicines));
      }

      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;

      const { id: uid } = JSON.parse(userData);
      setUserId(uid);

      const [dailyRes, stockRes, weeklyRes, lowRes] = await Promise.all([
        medicineLogApi.getTodayLogs(),
        healthProductApi.getAllHealthProducts(),
        medicineLogApi.getLogsForPastDays(7),
        healthProductApi.getLowStockHealthProducts(),
      ]);

      setDailyDoses(dailyRes.data);
      setStockDetails(stockRes.data);
      setWeeklyConsumption(weeklyRes.data);
      setLowStock(lowRes?.data);
    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (
    title: string,
    items: any[],
    renderContent: (item: any, index: number) => JSX.Element,
    emptyMessage: string
  ) => (
    <View className="mx-5 mb-6">
      <View className="flex-row items-center mb-4">
        <View className="w-1.5 h-6 bg-blue-500 rounded-full mr-2" />
        <Text className="text-xl font-semibold text-gray-800">{title}</Text>
      </View>

      {items?.length === 0 ? (
        <View className="items-center justify-center py-10">
          <Ionicons name="sad-outline" size={40} color="#9CA3AF" />
          <Text className="text-gray-500 text-base mt-3">{emptyMessage}</Text>
        </View>
      ) : (
        items?.map(renderContent)
      )}
    </View>
  );

  const MedicineCard: React.FC<{ item: Medicine, type: 'daily' | 'stock' | 'weekly' | 'low' }> = ({ item, type }) => (
    <View
      className={`mb-4 rounded-2xl overflow-hidden shadow-sm ${type === 'low' ? 'border-2 border-red-100' : ''}`}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        className="p-4 rounded-2xl"
      >
        <View className="flex-row items-center mb-3">
          <View className={`w-9 h-9 rounded-full items-center justify-center ${type === 'low' ? 'bg-red-100' : 'bg-blue-100'}`}>
            <Ionicons
              name="medical"
              size={22}
              color={type === 'low' ? '#F87171' : '#60A5FA'}
            />
          </View>
          <Text className="text-base font-semibold text-gray-800 ml-2">{item?.name || item?.healthProductName}</Text>
        </View>

        {type === 'stock' && (
          <View className="flex-row items-center mt-2">
            <View className="flex-row items-center">
              <Ionicons name="pricetag" size={16} color="#4B5563" />
              <Text className="text-sm text-gray-600 ml-1">Stock: {item.quantity}</Text>
            </View>
            <View className="flex-row items-center ml-4">
              <Ionicons name="calendar" size={16} color="#4B5563" />
              <Text
                className={`text-sm ml-1 ${isBefore(parseISO(item.expiryDate), new Date()) ? 'text-red-500 font-medium' : 'text-gray-600'}`}
              >
                Exp: {format(parseISO(item.expiryDate), 'dd MMM yyyy')}
              </Text>
            </View>
          </View>
        )}

        {(type === 'daily' || type === 'weekly') && (
          <View className="flex-row items-center mt-2">
            <View className="flex-row items-center bg-green-50 rounded-full px-3 py-1.5 mr-2">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-xs font-medium text-green-700 ml-1">Taken: {item.isTakenCount}</Text>
            </View>
            <View className="flex-row items-center bg-red-50 rounded-full px-3 py-1.5">
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text className="text-xs font-medium text-red-700 ml-1">Missed: {item.misCount || item.MisCount || 0}</Text>
            </View>
          </View>
        )}

        {type === 'low' && (
          <View className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg mt-2">
            <Ionicons name="warning" size={18} color="#EF4444" />
            <Text className="text-sm text-red-600 font-medium ml-1">Only {item?.quantity} left in stock</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const TabButton: React.FC<{ title: string, icon: React.ComponentProps<typeof Ionicons>['name'], tab: 'daily' | 'stock' | 'weekly' | 'low' }> = ({ title, icon, tab }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`items-center py-3 px-3 rounded-xl ${activeTab === tab ? 'bg-blue-500 shadow-md' : 'bg-gray-100'}`}
    >
      <Ionicons
        name={icon}
        size={22}
        color={activeTab === tab ? '#FFFFFF' : '#9CA3AF'}
      />
      <Text
        className={`text-xs font-medium mt-1 ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="mt-4 text-base text-gray-600">Loading Your Health Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#60A5FA', '#93C5FD']}
        className="pt-14 pb-10 items-center justify-center rounded-b-3xl"
      >
        <Text className="text-2xl font-bold text-white mb-3">Medication Management</Text>
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

      {activeTab === 'daily' && renderCard(
        "Today's Medications",
        dailyDoses,
        (item, index) => <MedicineCard key={index} item={item} type="daily" />,
        "No medications scheduled for today"
      )}

      {activeTab === 'stock' && renderCard(
        "Medicine Stock",
        stockDetails,
        (item, index) => <MedicineCard key={index} item={item} type="stock" />,
        "No stock information available"
      )}

      {activeTab === 'weekly' && renderCard(
        "Weekly Summary",
        weeklyConsumption,
        (item, index) => <MedicineCard key={index} item={item} type="weekly" />,
        "No consumption data this week"
      )}

      {activeTab === 'low' && renderCard(
        "Low Stock Alerts",
        lowStock,
        (item, index) => <MedicineCard key={index} item={item} type="low" />,
        "All medications are well-stocked"
      )}
    </ScrollView>
  );
}