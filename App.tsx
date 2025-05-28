
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

  // Test button for development
  const TestNotificationButton = () => {
    const sendTestNotification = async () => {
      try {
        setTestButtonDisabled(true);
        await notificationService.sendTestNotification();
        setTimeout(() => setTestButtonDisabled(false), 3000);
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
          title="Send Test Notification"
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
    left: 10,
    right: 10,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 5,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
});