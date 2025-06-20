import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { format, isBefore, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Dimensions,
} from 'react-native';

import { healthProductApi } from '@/services/api';
import { HealthProductResponseDto } from '@/types/healthProductTypes';

const { width } = Dimensions.get('window');

// Enhanced Order Status Component
const OrderStatusBadge = ({ status }: { status: 'active' | 'expired' | 'low' | 'out' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100', textColor: 'text-green-800', text: 'Active', icon: 'checkmark-circle' };
      case 'expired':
        return { color: 'bg-red-100', textColor: 'text-red-800', text: 'Expired', icon: 'alert-circle' };
      case 'low':
        return { color: 'bg-orange-100', textColor: 'text-orange-800', text: 'Low Stock', icon: 'warning' };
      case 'out':
        return { color: 'bg-red-100', textColor: 'text-red-800', text: 'Out of Stock', icon: 'close-circle' };
      default:
        return { color: 'bg-gray-100', textColor: 'text-gray-800', text: 'Unknown', icon: 'help-circle' };
    }
  };

  const config = getStatusConfig();
  return (
    <View className={`${config.color} px-3 py-1 rounded-full flex-row items-center`}>
      <Ionicons name={config.icon as any} size={12} color="#374151" />
      <Text className={`${config.textColor} text-xs font-semibold ml-1`}>{config.text}</Text>
    </View>
  );
};

// Enhanced Order Card Component
const OrderCard = ({ order, onPress }: { order: HealthProductResponseDto; onPress: () => void }) => {
  const isExpired = isBefore(parseISO(order.expiryDate), new Date());
  const isLowStock = order.availableQuantity <= order.thresholdQuantity;
  const isOutOfStock = order.availableQuantity <= 0;

  const getOrderStatus = () => {
    if (isOutOfStock) return 'out';
    if (isExpired) return 'expired';
    if (isLowStock) return 'low';
    return 'active';
  };

  const stockPercentage = Math.min((order.availableQuantity / order.totalQuantity) * 100, 100);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      <LinearGradient
        colors={isExpired ? ['#fef2f2', '#ffffff'] : ['#f8fafc', '#ffffff']}
        className="p-4"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
              {order.healthProductName}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 mr-2">Order ID:</Text>
              <Text className="text-xs font-mono text-blue-600">
                #{order.healthProductId.toString().padStart(6, '0')}
              </Text>
            </View>
          </View>
          <OrderStatusBadge status={getOrderStatus()} />
        </View>

        {/* Stock Progress Bar */}
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-medium text-gray-700">Stock Level</Text>
            <Text className="text-sm text-gray-600">
              {order.availableQuantity} / {order.totalQuantity} {order.unit}
            </Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${isOutOfStock ? 'bg-red-500' :
                isLowStock ? 'bg-orange-500' :
                  'bg-green-500'
                }`}
              style={{ width: `${Math.max(stockPercentage, 5)}%` }}
            />
          </View>
        </View>

        {/* Details Grid */}
        <View className="flex-row justify-between">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Ionicons name="medical" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                Dose: {order.doseQuantity} {order.unit}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                Added: {format(parseISO(order.createdAt || new Date().toISOString()), 'MMM dd, yyyy')}
              </Text>
            </View>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle-outline" size={16} color={isExpired ? "#EF4444" : "#6B7280"} />
              <Text className={`text-sm ml-2 ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                Exp: {format(parseISO(order.expiryDate), 'MMM dd, yyyy')}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                {order.reminderTimes?.length || 0} reminders
              </Text>
            </View>
          </View>
        </View>

        {/* Action Indicator */}
        <View className="flex-row justify-end mt-3">
          <View className="flex-row items-center">
            <Text className="text-sm text-blue-600 font-medium mr-1">View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#2563EB" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Main Orders Component
export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<HealthProductResponseDto[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'low'>('all');

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await healthProductApi.getAllHealthProducts();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
      console.error('Orders loading error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const onRefresh = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

  const handleOrderPress = (order: HealthProductResponseDto) => {
    // TODO: Navigate to order details screen
    console.log('Order pressed:', order.healthProductId);
  };

  const getFilteredOrders = () => {
    return orders.filter(order => {
      const isExpired = isBefore(parseISO(order.expiryDate), new Date());
      const isLowStock = order.availableQuantity <= order.thresholdQuantity;

      switch (filter) {
        case 'expired':
          return isExpired;
        case 'low':
          return isLowStock && !isExpired;
        case 'active':
          return !isExpired && !isLowStock;
        default:
          return true;
      }
    });
  };

  const filteredOrders = getFilteredOrders();

  // Filter Button Component
  const FilterButton = ({ filterType, label, count }: { filterType: typeof filter; label: string; count: number }) => (
    <TouchableOpacity
      onPress={() => setFilter(filterType)}
      className={`px-4 py-2 rounded-full mr-3 ${filter === filterType ? 'bg-blue-500' : 'bg-gray-100'
        }`}
    >
      <Text className={`text-sm font-medium ${filter === filterType ? 'text-white' : 'text-gray-700'
        }`}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600 text-base">Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        className="pt-14 pb-6"
      >
        <View className="px-4">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-2xl font-bold text-white">My Orders</Text>
              <Text className="text-blue-100 text-base">Manage your medicine inventory</Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <Ionicons name="medical-outline" size={24} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton filterType="all" label="All" count={orders.length} />
          <FilterButton
            filterType="active"
            label="Active"
            count={orders.filter(o => !isBefore(parseISO(o.expiryDate), new Date()) && o.availableQuantity > o.thresholdQuantity).length}
          />
          <FilterButton
            filterType="low"
            label="Low Stock"
            count={orders.filter(o => o.availableQuantity <= o.thresholdQuantity && !isBefore(parseISO(o.expiryDate), new Date())).length}
          />
          <FilterButton
            filterType="expired"
            label="Expired"
            count={orders.filter(o => isBefore(parseISO(o.expiryDate), new Date())).length}
          />
        </ScrollView>
      </View>

      {/* Content */}
      {error ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-red-600 text-lg font-semibold mt-4 text-center">{error}</Text>
          <TouchableOpacity
            onPress={() => loadOrders()}
            className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="medical-outline" size={80} color="#D1D5DB" />
              <Text className="text-xl font-semibold text-gray-600 mt-4">
                {filter === 'all' ? 'No Orders Found' : `No ${filter} orders`}
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                {filter === 'all'
                  ? 'Start by adding your first medicine to track your inventory'
                  : `You don't have any ${filter} medicines at the moment`
                }
              </Text>
            </View>
          ) : (
            <View className="py-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.healthProductId}
                  order={order}
                  onPress={() => handleOrderPress(order)}
                />
              ))}
              <View className="h-20" />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}