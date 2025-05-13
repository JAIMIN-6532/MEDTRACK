import "react-native-reanimated"; // ✅ Required at top for gesture/reanimated
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";

import "../global.css";

// ✅ Prevent splash screen auto-hide
SplashScreen.preventAutoHideAsync();

// ✅ Notification config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

if (Platform.OS !== "web") {
  Notifications.setNotificationCategoryAsync("MEDICINE_REMINDER", [
    {
      identifier: "TAKEN",
      buttonTitle: "Taken",
      options: {
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    },
    {
      identifier: "MISSED",
      buttonTitle: "Missed",
      options: {
        isAuthenticationRequired: false,
        isDestructive: true,
      },
    },
  ]);
}

export default function RootLayout() {

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      requestNotificationPermissions();
    }
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
    }
  };

  if (!loaded) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* These should match folder names in /app */}
        <Stack.Screen name="(app)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </>
  );
}
