import React, { useEffect, useRef, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { Slot } from 'expo-router';
import { Button, View, Text, StyleSheet, Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// 🔧 Configure foreground notification display
// Note: This is already set in the NotificationService, but keeping it here for redundancy
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
  const [notificationStatus, setNotificationStatus] = useState<string>('Initializing...');

  useEffect(() => {
    const setupNotifications = async () => {
      if (notificationsInitialized.current) return;
      
      try {
        console.log('🚀 Starting notification setup...');
        setNotificationStatus('Setting up permissions...');

        // Check if we're on a physical device
        if (!Device.isDevice) {
          console.warn('❌ Not a physical device. Notifications will not work in simulator.');
          setNotificationStatus('Simulator - Notifications disabled');
          return;
        }

        // Request permissions first
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        console.log('📋 Current permission status:', existingStatus);

        if (existingStatus !== 'granted') {
          console.log('🔐 Requesting notification permissions...');
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowDisplayInCarPlay: true,
              allowCriticalAlerts: true,
              provideAppNotificationSettings: true,
              allowProvisional: true,
              allowAnnouncements: true,
            },
          });
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.error('❌ Notification permissions denied');
          setNotificationStatus('Permissions denied');
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive medicine reminders.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
          return;
        }

        console.log('✅ Notification permissions granted');
        setNotificationStatus('Initializing service...');

        // Initialize notification service
        await notificationService.initialize();
        notificationsInitialized.current = true;
        setNotificationStatus('Ready ✅');
        console.log('✅ Notifications initialized successfully');

        // Set up additional listeners for debugging
        const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
          console.log('📥 Notification received in foreground:', notification);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('🔔 Notification response received:', response);
        });

        // Cleanup function
        return () => {
          foregroundSubscription.remove();
          responseSubscription.remove();
        };

      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
        setNotificationStatus('Failed to initialize');
        Alert.alert(
          'Notification Error', 
          'Failed to initialize notifications. Some features may not work properly.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Retry', onPress: () => {
              notificationsInitialized.current = false;
              setupNotifications();
            }}
          ]
        );
      }
    };

    setupNotifications();
  }, []);

  // Test notification button component
  const TestNotificationButton = () => {
    const sendTestNotification = async () => {
      try {
        if (!notificationsInitialized.current) {
          Alert.alert('Error', 'Notifications not initialized yet. Please wait.');
          return;
        }

        setTestButtonDisabled(true);
        console.log('🧪 Sending test notification...');
        
        await notificationService.sendTestNotification();
        console.log('✅ Test notification sent');
        
        Alert.alert(
          'Test Notification Sent', 
          'Check your notification tray in 2 seconds. Try tapping the action buttons!',
          [{ text: 'OK' }]
        );
        
        setTimeout(() => {
          setTestButtonDisabled(false);
        }, 3000);
      } catch (error: any) {
        console.error('❌ Failed to send test notification:', error);
        Alert.alert('Error', `Failed to send test notification: ${error?.message || String(error)}`);
        setTestButtonDisabled(false);
      }
    };

    const checkScheduledNotifications = async () => {
      try {
        const notifications = await notificationService.getScheduledNotifications();
        Alert.alert(
          'Scheduled Notifications', 
          `Found ${notifications.length} scheduled notifications. Check console for details.`
        );
      } catch (error) {
        console.error('❌ Failed to check notifications:', error);
        Alert.alert('Error', 'Failed to check scheduled notifications');
      }
    };

    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Notification Testing</Text>
        <Text style={styles.statusText}>Status: {notificationStatus}</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Send Test Notification"
            onPress={sendTestNotification}
            disabled={testButtonDisabled || !notificationsInitialized.current}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Check Scheduled"
            onPress={checkScheduledNotifications}
            disabled={!notificationsInitialized.current}
          />
        </View>
        
        {Platform.OS !== 'web' && (
          <Text style={styles.instructionText}>
            📱 Make sure to test on a physical device with the app in background
          </Text>
        )}
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
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  buttonContainer: {
    marginVertical: 4,
  },
  instructionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
});