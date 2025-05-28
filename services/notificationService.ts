import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { medicineLogApi, healthProductApi } from './api';
import { LogData, NotificationData } from '../types/medicineUsageLogTypes';

class NotificationService {
    private static instance: NotificationService;
    private responseListener?: Notifications.Subscription;
    private notificationReceivedListener?: Notifications.Subscription;
    private readonly categoryIdentifier = 'MEDICINE_REMINDER';
    private processingNotificationIds: Set<string> = new Set();
    private isInitialized = false; // Add flag to prevent multiple initializations

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('🔧 Notification service already initialized, skipping...');
            return;
        }

        console.log('🔧 Initializing Notification Service...');

        // Clean up existing listeners if they exist
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }

        if (this.notificationReceivedListener) {
            Notifications.removeNotificationSubscription(this.notificationReceivedListener);
        }

        // Set up permissions and categories FIRST
        await this.registerForPushNotifications();
        await this.setupNotificationCategory();

        // Set up notification received listener (foreground)
        this.notificationReceivedListener = Notifications.addNotificationReceivedListener(
            notification => {
                console.log('📥 Notification received in foreground:', notification);
            }
        );

        // This is the key handler for notification responses (including actions)
        this.responseListener = Notifications.addNotificationResponseReceivedListener(
            this.handleNotificationAction
        );

        // Clear any stale notifications on app start
        try {
            await Notifications.dismissAllNotificationsAsync();
            console.log('🧹 Cleaned up any existing notifications on startup');
        } catch (error) {
            console.warn('⚠️ Could not dismiss notifications on startup:', error);
        }

        this.isInitialized = true;
        console.log('✅ Notification service initialized successfully');
    }

    private async registerForPushNotifications(): Promise<void> {
        if (!Device.isDevice) {
            console.warn('❌ Not a physical device. Notifications skipped.');
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                    allowAnnouncements: true,
                },
                android: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                }
            });
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('❌ Notification permissions not granted');
            return;
        }

        console.log('✅ Notification permissions granted');
    }

    private async setupNotificationCategory(): Promise<void> {
        try {
            console.log('🔧 Setting up notification categories...');

            // For Android, set up the channel first
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('medicine-reminders', {
                    name: 'Medicine Reminders',
                    importance: Notifications.AndroidImportance.HIGH,
                    description: 'Daily medication reminder notifications',
                    vibrationPattern: [0, 250, 250, 250],
                    sound: 'default',
                    enableLights: true,
                    lightColor: '#FF0000',
                    showBadge: true,
                });
                console.log('✅ Android notification channel created');
            }

            // Set up the notification category with actions
            await Notifications.setNotificationCategoryAsync(this.categoryIdentifier, [
                {
                    identifier: 'TAKEN',
                    buttonTitle: '✅ Taken',
                    options: {
                        opensAppToForeground: false,
                        isDestructive: false,
                        isAuthenticationRequired: false
                    },
                },
                {
                    identifier: 'MISSED',
                    buttonTitle: '❌ Missed',
                    options: {
                        opensAppToForeground: false,
                        isDestructive: true,
                        isAuthenticationRequired: false
                    },
                },
                {
                    identifier: 'SNOOZE',
                    buttonTitle: '⏰ Snooze 5min',
                    options: {
                        opensAppToForeground: false,
                        isDestructive: false,
                        isAuthenticationRequired: false
                    },
                }
            ]);
            console.log('✅ Notification categories set up successfully');
        } catch (error) {
            console.error('❌ Error setting up notification categories:', error);
            throw error; // Re-throw to handle in initialize
        }
    }

    private handleNotificationAction = async (
        response: Notifications.NotificationResponse
    ): Promise<void> => {
        try {
            const { actionIdentifier, notification } = response;
            const payload = notification.request.content.data as NotificationData;

            console.log("🔍 Full notification response:", JSON.stringify(response, null, 2));
            console.log("🔍 Action identifier:", actionIdentifier);
            console.log("🔍 Payload received:", payload);

            // Get the notification ID from the response
            const notificationId = response.notification.request.identifier;
            console.log('🔔 Notification ID:', notificationId);

            // Check if we're already processing this notification to prevent duplicates
            if (this.processingNotificationIds.has(notificationId)) {
                console.log('⚠️ Already processing this notification, skipping');
                return;
            }

            // Add to processing set
            this.processingNotificationIds.add(notificationId);

            if (!payload || !payload.userId || !payload.healthProductId) {
                console.error('❌ Invalid payload:', payload);
                this.processingNotificationIds.delete(notificationId);
                return;
            }

            // Process action based on identifier
            console.log('🔔 Processing action:', actionIdentifier);

            try {
                // First dismiss the notification to prevent multiple taps
                if (notificationId) {
                    await Notifications.dismissNotificationAsync(notificationId);
                    console.log('✅ Dismissed notification:', notificationId);
                }

                // Then process the action
                switch (actionIdentifier) {
                    case 'TAKEN':
                    case Notifications.DEFAULT_ACTION_IDENTIFIER:
                        await this.logMedicineUsage(payload, true);
                        console.log('✅ Medicine marked as TAKEN');
                        break;
                    case 'MISSED':
                        await this.logMedicineUsage(payload, false);
                        console.log('✅ Medicine marked as MISSED');
                        break;
                    case 'SNOOZE':
                        await this.snoozeNotification(payload, 5); // 5 minutes
                        console.log('✅ Medicine notification SNOOZED for 5 minutes');
                        break;
                    default:
                        console.log('ℹ️ Unknown action identifier:', actionIdentifier);
                }
            } catch (actionError) {
                console.error('❌ Error processing action:', actionError);
                // Even if there's an error, try to dismiss the notification
                if (notificationId) {
                    await Notifications.dismissNotificationAsync(notificationId);
                }
            } finally {
                // Remove from processing set
                this.processingNotificationIds.delete(notificationId);
            }
        } catch (error) {
            console.error('❌ Error in handleNotificationAction:', error);
            // Make sure to clean up processing set in case of error
            if (response?.notification?.request?.identifier) {
                this.processingNotificationIds.delete(response.notification.request.identifier);
            }
        }
    };

    private async snoozeNotification(payload: NotificationData, minutes: number): Promise<void> {
        try {
            console.log(`⏰ Snoozing notification for ${minutes} minutes`);

            // Schedule a new notification after the snooze period
            const content = {
                title: `Reminder: Time to take your medicine`,
                body: `You snoozed this reminder ${minutes} minutes ago`,
                categoryIdentifier: this.categoryIdentifier,
                data: payload,
                sound: 'default',
            };

            const trigger = {
                seconds: minutes * 60, // Convert minutes to seconds
                repeats: false,
            };

            const notificationId = await Notifications.scheduleNotificationAsync({
                content,
                trigger,
                identifier: `snooze_${payload.healthProductId}_${Date.now()}`
            });

            console.log(`✅ Snoozed notification scheduled with ID: ${notificationId}`);
        } catch (error) {
            console.error('❌ Error snoozing notification:', error);
        }
    }

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
            // Make sure categories are set up before scheduling
            await this.setupNotificationCategory();

            for (const time of scheduleTimes) {
                if (!time) {
                    console.warn('⚠️ Empty time provided for reminder, skipping');
                    continue;
                }

                // Process time string properly
                let hour = 0;
                let minute = 0;

                if (time.includes(':')) {
                    [hour, minute] = time.split(':').map(num => parseInt(num, 10));
                } else {
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

                // Create a unique identifier for this notification
                const uniqueId = `med_${healthProductId}_${hour}_${minute}`;

                if (!healthProductId || !userId) {
                    console.error('❌ Missing healthProductId or userId when scheduling notification', {
                        healthProductId,
                        userId
                    });
                    continue;
                }

                // Simplified content structure for better compatibility
                const content = {
                    title: `Time to take ${medicineName}`,
                    body: `Dose: ${doseQuantity} ${unit}`,
                    categoryIdentifier: this.categoryIdentifier,
                    data: {
                        userId,
                        healthProductId,
                        createdAt: new Date().toISOString(),
                        notificationId: uniqueId,
                        medicineName,
                        doseQuantity,
                        unit
                    } as NotificationData,
                    sound: 'default',
                };

                // Platform-specific trigger configuration
                const trigger = Platform.OS === 'android'
                    ? {
                        hour,
                        minute,
                        repeats: true,
                        channelId: 'medicine-reminders'
                    }
                    : {
                        hour,
                        minute,
                        repeats: true
                    };

                const notificationId = await Notifications.scheduleNotificationAsync({
                    content,
                    trigger,
                    identifier: uniqueId
                });

                if (notificationId) {
                    console.log(`⏰ Scheduled reminder with ID: ${notificationId}`);
                    notificationIds.push(notificationId);
                } else {
                    console.error('❌ Failed to get notification ID');
                }
            }

            // Store notification IDs
            if (notificationIds.length > 0) {
                await AsyncStorage.setItem(
                    `notifications_${healthProductId}`,
                    JSON.stringify(notificationIds)
                );
                console.log(`✅ Stored ${notificationIds.length} notification IDs for ${healthProductId}`);
            }

            return notificationIds;
        } catch (error) {
            console.error('❌ Error scheduling reminders:', error);
            return notificationIds;
        }
    }

    public async cancelAllRemindersForMedicine(healthProductId: string): Promise<void> {
        try {
            const rawIds = await AsyncStorage.getItem(`notifications_${healthProductId}`);
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

            await AsyncStorage.removeItem(`notifications_${healthProductId}`);
        } catch (error) {
            console.error(`❌ Error cancelling reminders for ${healthProductId}:`, error);
        }
    }

    private async logMedicineUsage(payload: NotificationData, isTaken: boolean): Promise<void> {
        try {
            console.log(`📦 Logging medicine usage for ${payload.healthProductId}`);

            // Add retry logic for API calls
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    // First API call - add medicine usage log
                    await medicineLogApi.addMedicineUsageLog({
                        userId: payload.userId,
                        healthProductId: payload.healthProductId,
                        isTaken,
                        createdAt: new Date().toISOString(),
                    });

                    // Second API call - only if medicine was taken
                    if (isTaken) {
                        await healthProductApi.recordMedicineUsage(payload.healthProductId);
                    }

                    console.log(`✅ Logged medicine usage successfully (taken: ${isTaken})`);
                    break; // Success, exit the retry loop
                } catch (apiError) {
                    retryCount++;
                    console.warn(`⚠️ API call failed (attempt ${retryCount}/${maxRetries}):`, apiError);

                    if (retryCount >= maxRetries) {
                        throw apiError; // Rethrow after max retries
                    }

                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
                }
            }
        } catch (error) {
            console.error('❌ Failed to log medicine usage after retries:', error);
            // You could store failed logs locally and retry later
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
                console.log(`  Category: ${notif.content}`);
                console.log(`  Data: ${JSON.stringify(notif.content.data)}`);
                console.log(`  Trigger: ${JSON.stringify(notif.trigger)}`);
            });
        } catch (error) {
            console.error('❌ Error listing notifications:', error);
        }
    }

    public async sendTestNotification(): Promise<void> {
        try {
            // Make sure categories are set up
            await this.setupNotificationCategory();

            const content = {
                title: 'Test Medicine Reminder',
                body: 'This is a test notification with action buttons - Dose: 1 pill',
                categoryIdentifier: this.categoryIdentifier,
                data: {
                    userId: 'test-user',
                    healthProductId: 'test-medicine',
                    createdAt: new Date().toISOString(),
                    notificationId: `test_${Date.now()}`,
                    medicineName: 'Test Medicine',
                    doseQuantity: 1,
                    unit: 'pill'
                } as NotificationData,
                sound: 'default',
            };

            const notificationId = await Notifications.scheduleNotificationAsync({
                content,
                trigger: null, // Immediate notification
                identifier: `test_${Date.now()}`
            });

            console.log('✅ Test notification sent with ID:', notificationId);
            console.log('📱 Check your notification panel for action buttons!');
        } catch (error) {
            console.error('❌ Error sending test notification:', error);
            throw error;
        }
    }

    // Add method to get initialization status
    public isServiceInitialized(): boolean {
        return this.isInitialized;
    }
}

export const notificationService = NotificationService.getInstance();