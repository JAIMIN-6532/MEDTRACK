// Updated notification service using the extended NotificationData type

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { medicineLogApi, healthProductApi } from './api';
import { LogData, NotificationData } from '../types/medicineUsageLogTypes'; // Now includes all needed properties

class NotificationService {
    private static instance: NotificationService;
    private responseListener?: Notifications.Subscription;
    private isInitialized = false;
    private readonly categoryIdentifier = 'MEDICINE_REMINDER';
    private processingNotificationIds: Set<string> = new Set();

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('🔧 Notification service already initialized');
            return;
        }

        console.log('🔧 Starting notification service initialization...');

        try {
            if (!Device.isDevice) {
                console.warn('❌ Not a physical device. Notifications will not work.');
                return;
            }

            await this.requestPermissions();

            if (Platform.OS === 'android') {
                await this.setupAndroidChannel();
            }

            await this.setupNotificationCategories();
            this.setupNotificationHandlers();
            await Notifications.dismissAllNotificationsAsync();

            this.isInitialized = true;
            console.log('✅ Notification service fully initialized');

        } catch (error) {
            console.error('❌ Failed to initialize notification service:', error);
            throw error;
        }
    }

    private async requestPermissions(): Promise<void> {
        console.log('🔑 Requesting notification permissions...');

        const { status: existingStatus } = await Notifications.getPermissionsAsync();

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

            if (status !== 'granted') {
                throw new Error('Notification permissions not granted');
            }
        }

        console.log('✅ Notification permissions granted');
    }

    private async setupAndroidChannel(): Promise<void> {
        console.log('📱 Setting up Android notification channel...');

        await Notifications.setNotificationChannelAsync('medicine-reminders', {
            name: 'Medicine Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            description: 'Daily medication reminder notifications with action buttons',
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            enableLights: true,
            lightColor: '#FF0000',
            showBadge: true,
            enableVibrate: true, // 🔧 FIXED: enableVibrate instead of enableVibration
        });

        console.log('✅ Android notification channel created');
    }

    private async setupNotificationCategories(): Promise<void> {
        console.log('🏷️ Setting up notification categories...');

        // Set up categories with action buttons
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
            }
        ]);

        console.log('✅ Notification categories set up successfully');

        // Verify categories were created
        const categories = await Notifications.getNotificationCategoriesAsync();
        console.log('📋 Available categories:', categories.map(c => c.identifier));

        // For Android, also log the channel info
        if (Platform.OS === 'android') {
            const channels = await Notifications.getNotificationChannelsAsync();
            console.log('📱 Available Android channels:', channels.map(c => c.id));
        }
    }

    private setupNotificationHandlers(): void {
        console.log('🎯 Setting up notification handlers...');

        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }

        this.responseListener = Notifications.addNotificationResponseReceivedListener(
            this.handleNotificationResponse
        );

        console.log('✅ Notification handlers set up');
    }

    private handleNotificationResponse = async (response: Notifications.NotificationResponse): Promise<void> => {
        try {
            console.log('🔔 Notification response received:', JSON.stringify(response, null, 2));

            const { actionIdentifier, notification } = response;
            const data = notification.request.content.data as NotificationData; // ✅ Now properly typed
            const notificationId = notification.request.identifier;

            if (this.processingNotificationIds.has(notificationId)) {
                console.log('⚠️ Already processing notification:', notificationId);
                return;
            }

            this.processingNotificationIds.add(notificationId);

            try {
                await Notifications.dismissNotificationAsync(notificationId);

                if (!data?.userId || !data?.healthProductId) {
                    console.error('❌ Invalid notification data:', data);
                    return;
                }

                console.log('🎯 Processing action:', actionIdentifier);

                switch (actionIdentifier) {
                    case 'TAKEN':
                        await this.logMedicineUsage(data, true);
                        console.log('✅ Medicine marked as TAKEN');
                        break;
                    case 'MISSED':
                        await this.logMedicineUsage(data, false);
                        console.log('✅ Medicine marked as MISSED');
                        break;
                    case Notifications.DEFAULT_ACTION_IDENTIFIER:
                        console.log('ℹ️ Notification tapped (default action)');
                        break;
                    default:
                        console.log('❓ Unknown action:', actionIdentifier);
                }

            } finally {
                this.processingNotificationIds.delete(notificationId);
            }

        } catch (error) {
            console.error('❌ Error handling notification response:', error);
        }
    };

    private async logMedicineUsage(data: NotificationData, isTaken: boolean): Promise<void> {
        try {
            console.log(`📝 Logging medicine usage: ${isTaken ? 'TAKEN' : 'MISSED'}`);

            await medicineLogApi.addMedicineUsageLog({
                userId: data.userId,
                healthProductId: data.healthProductId,
                isTaken,
                createdAt: new Date().toISOString(),
            });

            if (isTaken) {
                await healthProductApi.recordMedicineUsage(data.healthProductId);
            }

            console.log('✅ Medicine usage logged successfully');

        } catch (error) {
            console.error('❌ Failed to log medicine usage:', error);
        }
    }

    // ✅ Platform-specific content creation with proper typing
    private createNotificationContent(
        title: string,
        body: string,
        data: NotificationData
    ): Notifications.NotificationContentInput {
        // 🔧 FIXED: Always include categoryIdentifier for action buttons
        const baseContent = {
            title,
            body,
            data: data as any,
            sound: 'default' as const,
            categoryIdentifier: this.categoryIdentifier, // ✅ Include for all platforms
        };

        return baseContent;
    }

    public async scheduleDailyReminders(
        healthProductId: string,
        userId: string,
        doseQuantity: number,
        unit: string,
        medicineName: string,
        scheduleTimes: string[]
    ): Promise<string[]> {
        console.log(`📅 Scheduling ${scheduleTimes.length} reminders for ${medicineName}`);

        if (!this.isInitialized) {
            console.warn('⚠️ Service not initialized, initializing now...');
            await this.initialize();
        }

        const notificationIds: string[] = [];

        for (let i = 0; i < scheduleTimes.length; i++) {
            const time = scheduleTimes[i];
            if (!time) continue;

            try {
                const [hour, minute] = time.split(':').map(num => parseInt(num, 10));

                if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                    console.warn(`⚠️ Invalid time: ${time}, skipping`);
                    continue;
                }

                const uniqueId = `med_${healthProductId}_${hour}_${minute}_${i}`;

                // ✅ Now properly typed with all required and optional properties
                const notificationData: NotificationData = {
                    userId,
                    healthProductId,
                    createdAt: new Date().toISOString(),
                    notificationId: uniqueId,
                    medicineName,      // ✅ Now properly typed
                    doseQuantity,      // ✅ Now properly typed
                    unit              // ✅ Now properly typed
                };

                const notificationContent = this.createNotificationContent(
                    `Time to take ${medicineName}`,
                    `Dose: ${doseQuantity} ${unit}`,
                    notificationData
                );

                // 🔧 FIXED: For Android, specify channel in trigger
                const trigger = Platform.OS === 'android'
                    ? {
                        hour,
                        minute,
                        repeats: true,
                        channelId: 'medicine-reminders', // Channel specified here for Android
                    }
                    : {
                        hour,
                        minute,
                        repeats: true,
                    };

                const notificationId = await Notifications.scheduleNotificationAsync({
                    content: notificationContent,
                    trigger,
                    identifier: uniqueId
                });

                notificationIds.push(notificationId);
                console.log(`⏰ Scheduled reminder for ${hour}:${minute.toString().padStart(2, '0')} with ID: ${notificationId}`);

                // 🔧 DEBUG: Log the actual content that was scheduled
                console.log('📋 Notification content:', JSON.stringify(notificationContent, null, 2));

            } catch (error) {
                console.error(`❌ Failed to schedule reminder for time ${time}:`, error);
            }
        }

        if (notificationIds.length > 0) {
            await AsyncStorage.setItem(
                `notifications_${healthProductId}`,
                JSON.stringify(notificationIds)
            );
        }

        console.log(`✅ Successfully scheduled ${notificationIds.length} reminders`);
        return notificationIds;
    }

    public async sendTestNotification(): Promise<void> {
        console.log('🧪 Sending test notification...');

        if (!this.isInitialized) {
            await this.initialize();
        }

        // ✅ Now properly typed test data
        const testData: NotificationData = {
            userId: 'test-user',
            healthProductId: 'test-medicine',
            createdAt: new Date().toISOString(),
            notificationId: `test_${Date.now()}`,
            medicineName: 'Test Medicine',    // ✅ Now properly typed
            doseQuantity: 1,                  // ✅ Now properly typed
            unit: 'pill'                     // ✅ Now properly typed
        };

        // 🔧 FIXED: For immediate notifications, always use null trigger regardless of platform
        const testContent = this.createNotificationContent(
            'Test Medicine Reminder',
            'This is a test - you should see action buttons',
            testData
        );

        // 🔧 DEBUG: Log what we're sending
        console.log('🧪 Test notification content:', JSON.stringify(testContent, null, 2));

        // 🔧 FIXED: Immediate notifications should always use null trigger
        // The channel is already specified in the content for Android
        await Notifications.scheduleNotificationAsync({
            content: testContent,
            trigger: null, // Always null for immediate notifications
            identifier: `test_${Date.now()}`
        });

        console.log('✅ Test notification sent - check your notification panel!');
    }

    public async listScheduledNotifications(): Promise<void> {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log(`🔍 Found ${notifications.length} scheduled notifications`);

        notifications.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.content.title} (ID: ${notif.identifier})`);
            console.log(`   Category: ${(notif.content as any).categoryIdentifier || 'N/A'}`);
        });
    }

    public isServiceInitialized(): boolean {
        return this.isInitialized;
    }
}

export const notificationService = NotificationService.getInstance();