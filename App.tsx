
import { notificationService } from '@/services/notificationService';
import { Slot } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const notificationsInitialized = useRef(false);
  const [testButtonDisabled, setTestButtonDisabled] = useState(false);

  useEffect(() => {
    const setupNotifications = async () => {
      if (notificationsInitialized.current) return;

      console.log('🔔 Initializing notification service...');
      try {
        await notificationService.initialize();
        console.log('✅ Notification service initialized');
        notificationsInitialized.current = true;
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
        Alert.alert(
          'Notification Error',
          'Failed to initialize notifications. Please check permissions and try again.'
        );
      }
    };

    setupNotifications();
  }, []);

  return (
    <>
      <Slot />
    </>
  );
}