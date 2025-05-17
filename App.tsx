import React, { useEffect, useRef } from 'react';
import { notificationService } from '@/services/notificationService';
import { Slot } from 'expo-router';
import { Platform, Button, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

// Set up notification handler for when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function App() {
    const notificationsInitialized = useRef(false);

    useEffect(() => {
        const setupNotifications = async () => {
            if (notificationsInitialized.current) return;

            console.log('Initializing notification service...');
            try {
                await notificationService.init(); // request permissions and setup listeners
                console.log('Notification service initialized successfully');

                // Debug: List all scheduled notifications
                await notificationService.listAllScheduledNotifications();

                notificationsInitialized.current = true;
            } catch (error) {
                console.error('Failed to initialize notifications:', error);
            }
        };

        setupNotifications();

        // Add listener for notifications received while app is foregrounded
        const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received in foreground!', notification);
        });

        // Clean up notification listeners when component unmounts
        return () => {
            foregroundSubscription.remove();
        };
    }, []);

    // For debugging - add this somewhere in your UI for testing
    const TestNotificationButton = () => {
        const sendTestNotification = async () => {
            try {
                await notificationService.sendTestNotificationNow();
            } catch (error) {
                console.error('Failed to send test notification:', error);
            }
        };

        return (
            <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Notification Testing</Text>
                <Button
                    title="Send Test Notification with Buttons"
                    onPress={sendTestNotification}
                />
            </View>
        );
    };

    // Add the TestNotificationButton to your app's layout where appropriate
    // This is just an example - you might need to integrate it differently
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
    },
    debugTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
    }
});