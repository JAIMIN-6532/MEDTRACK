import React, { useEffect, useRef, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { Slot } from 'expo-router';
import { Button, View, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

// 🔧 Configure foreground notification display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

        await notificationService.listScheduledNotifications(); // optional debug

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

    // ✅ Optional: handle foreground notification events
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📥 Notification received in foreground:', notification);
    });

    return () => {
      foregroundSubscription.remove();
    };
  }, []);

  // ✅ Optional test button shown in development only
  const TestNotificationButton = () => {
    const sendTestNotification = async () => {
      try {
        setTestButtonDisabled(true);
        await notificationService.sendTestNotification();

        // Re-enable button after delay
        setTimeout(() => {
          setTestButtonDisabled(false);
        }, 3000);
      } catch (error) {
        console.error('❌ Failed to send test notification:', error);
        Alert.alert('Error', 'Failed to send test notification');
        setTestButtonDisabled(false);
      }
    };

    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Notification Testing</Text>
        <Button
          title="Send Test Notification with Buttons"
          onPress={sendTestNotification}
          disabled={testButtonDisabled}
        />
      </View>
    );
  };

  return (
    <>
      <Slot />
      {__DEV__ && <TestNotificationButton />}
    </>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',

    // Add shadow for better visibility
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
});