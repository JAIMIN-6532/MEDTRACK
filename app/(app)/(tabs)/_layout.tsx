import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import { Platform, View, Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 88 : 60,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F2F2F7',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 5,
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarLabel: ({ focused, color, children }) => (
          <View className={`flex items-center justify-center mt-1 ${focused ? 'opacity-100' : 'opacity-80'}`}>
            <Text className={`text-xs font-medium ${focused ? 'text-blue-500' : 'text-gray-500'}`}>
              {children}
            </Text>
          </View>
        ),
        tabBarIcon: ({ focused }) => (
          <View className={`${focused ? 'bg-blue-50 rounded-full p-2' : ''}`} />
        ),
      }}
    >
      <Tabs.Screen
        name="medicines"
        options={{
          title: "My Medicines",
          tabBarIcon: ({ size, color, focused }) => (
            <View className={`${focused ? 'bg-blue-50 rounded-full p-2' : 'p-2'}`}>
              <Ionicons name="list" size={size - 4} color={color} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: "Add Medicine",
          tabBarIcon: ({ size, color, focused }) => (
            <View className={`${focused ? 'bg-blue-50 rounded-full p-2' : 'p-2'}`}>
              <Ionicons name="add-circle" size={size - 4} color={color} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color, focused }) => (
            <View className={`${focused ? 'bg-blue-50 rounded-full p-2' : 'p-2'}`}>
              <Ionicons name="cart" size={size - 4} color={color} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color, focused }) => (
            <View className={`${focused ? 'bg-blue-50 rounded-full p-2' : 'p-2'}`}>
              <Ionicons name="person" size={size - 4} color={color} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      />
    </Tabs>
  );
}