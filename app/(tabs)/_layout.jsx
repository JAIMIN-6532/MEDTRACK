import { Tabs } from "expo-router";
import { Pill, List } from "lucide-react-native";
import { Platform } from "react-native";

import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 88 : 60,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          borderTopWidth: 1,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
      }}
    >
      <Tabs.Screen
        name="medicines"
        options={{
          title: "My Medicines",
          tabBarIcon: ({ size, color }) => <List size={size} color={color} />,
          tabBarLabelStyle: {
            fontSize: 12,
          },
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: "Add Medicine",
          tabBarIcon: ({ size, color }) => <Pill size={size} color={color} />,
          tabBarLabelStyle: {
            fontSize: 12,
          },
        }}
      />

<Tabs.Screen
        name="Orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
        />
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
        />


    </Tabs>
  );
}
