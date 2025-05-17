import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { medicineLogApi, healthProductApi } from './api';
import { LogData } from '../types/medicineUsageLogTypes';

class NotificationService {
    private static instance: NotificationService;
    private responseListener?: Notifications.Subscription;
    private readonly categoryIdentifier = 'medication-reminder';

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public async initialize(): Promise<void> {
        console.log('🔧 Initializing Notification Service...');

        // Critical fix: Set up notification handler first
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });

        // Set up response handler
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }

        // Set up foreground notification handler for Android
        const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('🔔 Notification received in foreground:', notification.request.identifier);
        });

        // This is the key handler for notification responses (including actions)
        this.responseListener = Notifications.addNotificationResponseReceivedListener(
            this.handleNotificationAction
        );

        // Set up permissions and categories
        await this.registerForPushNotifications();
        await this.setupNotificationCategory();

        // Clear any stale notifications on app start
        try {
            await Notifications.dismissAllNotificationsAsync();
            console.log('🧹 Cleaned up any existing notifications on startup');
        } catch (error) {
            console.warn('⚠️ Could not dismiss notifications on startup:', error);
        }
    }

    private async registerForPushNotifications(): Promise<void> {
        if (!Device.isDevice) {
            console.warn('❌ Not a physical device. Notifications skipped.');
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('❌ Notification permissions not granted');
            return;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('med-pill', {
                name: 'Medication Reminders',
                importance: Notifications.AndroidImportance.MAX,
                description: 'Reminders to take your medication',
                vibrationPattern: [0, 250, 250, 250],
                sound: 'default',
                enableLights: true,
                showBadge: true,
            });
        }
    }

    private async setupNotificationCategory(): Promise<void> {
        try {
            await Notifications.setNotificationCategoryAsync(this.categoryIdentifier, [
                {
                    identifier: 'TAKEN',
                    buttonTitle: 'Taken ✅',
                    // Set options for iOS
                    options: {
                        opensAppToForeground: true, // Changed to true to ensure proper handling
                        isDestructive: false,
                        isAuthenticationRequired: false
                    },
                },
                {
                    identifier: 'MISSED',
                    buttonTitle: 'Missed ❌',
                    // Set options for iOS
                    options: {
                        opensAppToForeground: true, // Changed to true to ensure proper handling
                        isDestructive: true,
                        isAuthenticationRequired: false
                    },
                },
            ]);
            console.log('✅ Notification categories set up successfully');
        } catch (error) {
            console.error('❌ Error setting up notification categories:', error);
        }
    }

    private handleNotificationAction = async (
        response: Notifications.NotificationResponse
    ): Promise<void> => {
        try {
            const { actionIdentifier, notification } = response;
            const payload = notification.request.content.data as LogData;

            // The key issue - don't use identifiers from the notification for dismissal
            const notificationId = response.notification?.request?.identifier;

            console.log('🔔 Received action:', actionIdentifier);
            console.log('🔔 Response type:', response.actionIdentifier);
            console.log('🔔 Notification identifier:', notificationId || 'NONE');
            console.log('🔔 Payload data:', JSON.stringify(payload || {}));

            // Process notifications even if there's no actionIdentifier (default action)
            const userAction = actionIdentifier || 'DEFAULT';

            if (!payload || !payload.userId || !payload.healthProductId) {
                console.warn('⚠️ Invalid payload received in notification action.');
                // Still try to dismiss notification even with invalid payload
            } else {
                // Process action based on identifier
                if (userAction === 'TAKEN' || userAction === 'DEFAULT') {
                    console.log('✅ TAKEN action - Logging usage');
                    await this.logMedicineUsage(payload, true);
                } else if (userAction === 'MISSED') {
                    console.log('❌ MISSED action - Marking as missed');
                    await this.logMedicineUsage(payload, false);
                }
            }

            // Important: Use the notification property from Expo API for dismissal
            // This is different from manually using the identifier
            try {
                // Method 1: Try to dismiss all delivered notifications
                await Notifications.dismissAllNotificationsAsync();
                console.log('🧹 Dismissed all delivered notifications');

                // Method 2: As a backup, also try to dismiss the specific notification
                if (notificationId) {
                    try {
                        await Notifications.dismissNotificationAsync(notificationId);
                        console.log('🧹 Dismissed specific notification');
                    } catch (specificError) {
                        console.log('⚠️ Could not dismiss specific notification, already handled by dismissAll');
                    }
                }
            } catch (dismissError) {
                console.warn('⚠️ Error dismissing notifications:', dismissError);
            }
        } catch (error) {
            console.error('❌ Error handling notification action:', error);
        }
    };

    public async scheduleDailyReminders(
        healthProductId: string,
        userId: string,
        doseQuantity: number,
        unit: string,
        medicineName: string,
        scheduleTimes: string[]
    ): Promise<string[]> {
        console.log(`📅 Scheduling reminders for ${medicineName}`);
        const notificationIds: string[] = [];

        try {
            for (const time of scheduleTimes) {
                if (!time) {
                    console.warn('⚠️ Empty time provided for reminder, skipping');
                    continue;
                }

                // Process time string properly
                let hour = 0;
                let minute = 0;

                if (time.includes(':')) {
                    // Format: "HH:MM"
                    [hour, minute] = time.split(':').map(num => parseInt(num, 10));
                } else {
                    // Try to handle 24-hour time format without colon
                    const timeStr = time.trim();
                    if (timeStr.length === 4) {
                        hour = parseInt(timeStr.substring(0, 2), 10);
                        minute = parseInt(timeStr.substring(2), 10);
                    } else if (timeStr.length <= 2) {
                        hour = parseInt(timeStr, 10);
                        minute = 0;
                    } else {
                        console.warn(`⚠️ Invalid time format: ${time}, skipping`);
                        continue;
                    }
                }

                // Validate hour and minute
                if (isNaN(hour) || hour < 0 || hour > 23 || isNaN(minute) || minute < 0 || minute > 59) {
                    console.warn(`⚠️ Invalid time values: hour=${hour}, minute=${minute}, skipping`);
                    continue;
                }

                console.log(`⏰ Scheduling for ${hour}:${minute < 10 ? '0' + minute : minute}`);

                const content = {
                    title: `Time to take ${medicineName}`,
                    body: `Dose: ${doseQuantity} ${unit}`,
                    categoryIdentifier: this.categoryIdentifier,
                    data: {
                        userId,
                        healthProductId,
                        createdAt: new Date().toISOString() // Add timestamp for uniqueness
                    } as LogData,
                    sound: 'default',
                };

                const trigger = Platform.OS === 'android'
                    ? { hour, minute, repeats: true, channelId: 'med-pill' }
                    : { hour, minute, repeats: true };

                const notificationId = await Notifications.scheduleNotificationAsync({
                    content,
                    trigger,
                });

                if (notificationId) {
                    console.log(`⏰ Scheduled reminder with ID: ${notificationId}`);
                    notificationIds.push(notificationId);
                } else {
                    console.error('❌ Failed to get notification ID');
                }
            }

            // Store notification IDs with prefix to prevent conflicts
            if (notificationIds.length > 0) {
                await AsyncStorage.setItem(
                    `notif-ids:${healthProductId}`,
                    JSON.stringify(notificationIds)
                );
            }

            return notificationIds;
        } catch (error) {
            console.error('❌ Error scheduling reminders:', error);
            return notificationIds; // Return any IDs we managed to create
        }
    }

    public async cancelAllRemindersForMedicine(healthProductId: string): Promise<void> {
        try {
            const rawIds = await AsyncStorage.getItem(`notif-ids:${healthProductId}`);
            if (!rawIds) {
                console.log(`ℹ️ No notification IDs found for ${healthProductId}`);
                return;
            }

            const ids: string[] = JSON.parse(rawIds);
            console.log(`🗑️ Cancelling ${ids.length} reminders for ${healthProductId}`);

            for (const id of ids) {
                try {
                    if (id) {
                        await Notifications.cancelScheduledNotificationAsync(id);
                        console.log(`✅ Cancelled notification: ${id}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error cancelling notification ${id}:`, error);
                }
            }

            await AsyncStorage.removeItem(`notif-ids:${healthProductId}`);
        } catch (error) {
            console.error(`❌ Error cancelling reminders for ${healthProductId}:`, error);
        }
    }

    private async logMedicineUsage(payload: LogData, isTaken: boolean): Promise<void> {
        try {
            console.log(`📦 Logging medicine usage for ${payload.healthProductId}`);
            await medicineLogApi.addMedicineUsageLog({
                userId: payload.userId,
                healthProductId: payload.healthProductId,
                isTaken,
                createdAt: new Date().toISOString(),
            });

            if (isTaken) {
                await healthProductApi.recordMedicineUsage(payload.healthProductId);
            }
            console.log(`✅ Logged medicine usage successfully (taken: ${isTaken})`);
        } catch (error) {
            console.error('❌ Failed to log medicine usage:', error);
        }
    }

    public async listScheduledNotifications(): Promise<void> {
        try {
            const notifications = await Notifications.getAllScheduledNotificationsAsync();
            console.log(`🔍 Found ${notifications.length} scheduled notifications:`);

            notifications.forEach((notif, index) => {
                console.log(`- Notification #${index + 1}`);
                console.log(`  ID: ${notif.identifier}`);
                console.log(`  Title: ${notif.content.title}`);
                console.log(`  Data: ${JSON.stringify(notif.content.data)}`);
                console.log(`  Trigger: ${JSON.stringify(notif.trigger)}`);
            });
        } catch (error) {
            console.error('❌ Error listing notifications:', error);
        }
    }
}

export const notificationService = NotificationService.getInstance();