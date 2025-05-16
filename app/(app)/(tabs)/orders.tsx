import { healthProductApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Order {
  id: string;
  name: string;
  quantity: number;
  createdAt: string;
  expiryDate: string;
  status: string;
}

export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthProductApi.getAllHealthProducts();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 p-6">
        <Text className="text-red-500 text-base text-center mb-4">{error}</Text>
        <TouchableOpacity onPress={loadOrders} className="bg-indigo-500 px-5 py-2 rounded-lg">
          <Text className="text-white font-semibold text-base">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 pt-8">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-semibold text-slate-800">My Orders</Text>
        <TouchableOpacity className="p-2">
          <Ionicons name="filter" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView className="px-4">
        {orders.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="cart-outline" size={48} color="#64748b" />
            <Text className="text-base text-slate-500 mt-3">No orders found</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity key={order.id} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-indigo-500 font-semibold text-base">
                  #MTORD{order.id}
                </Text>
              </View>

              <View className="space-y-2">
                <Text className="text-lg font-semibold text-slate-800">{order.name}</Text>

                <View className="flex-row items-center space-x-2">
                  <Ionicons name="cube-outline" size={16} color="#64748b" />
                  <Text className="text-sm text-slate-500">Quantity: {order.quantity}</Text>
                </View>

                <View className="flex-row items-center space-x-2">
                  <Ionicons name="calendar-outline" size={16} color="#64748b" />
                  <Text className="text-sm text-slate-500">
                    Ordered: {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View className="flex-row items-center space-x-2">
                  <Ionicons name="alert-circle-outline" size={16} color="#64748b" />
                  <Text className="text-sm text-slate-500">
                    Expires: {new Date(order.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
