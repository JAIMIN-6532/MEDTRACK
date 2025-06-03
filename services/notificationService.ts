// Complete Fixed services/notificationService.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

import { medicineLogApi, healthProductApi } from './api';
import { LogData, NotificationData } from '../types/medicineUsageLogTypes';

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
            description: 'Daily medication reminder notifications',
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            enableLights: true,
            lightColor: '#FF0000',
            showBadge: true,
        });

        console.log('✅ Android notification channel created');
    }

    private async setupNotificationCategories(): Promise<void> {
        console.log('🏷️ Setting up notification categories...');

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
            const data = notification.request.content.data as NotificationData;
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

                // ✅ Skip test notifications (no longer needed in production)
                if (data.userId === 'test-user' || data.healthProductId === 'test-medicine') {
                    console.log('ℹ️ Skipping test notification - not logging to backend');
                    Alert.alert('Test Notification', `Test notification "${actionIdentifier}" processed successfully!`);
                    return;
                }

                console.log('🎯 Processing action:', actionIdentifier);

                switch (actionIdentifier) {
                    case 'TAKEN':
                        await this.logMedicineUsage(data, true);
                        Alert.alert('Success', `Medicine "${data.medicineName || 'Unknown'}" marked as taken!`);
                        console.log('✅ Medicine marked as TAKEN');
                        break;
                    case 'MISSED':
                        await this.logMedicineUsage(data, false);
                        Alert.alert('Noted', `Medicine "${data.medicineName || 'Unknown'}" marked as missed.`);
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
            Alert.alert('Error', 'Failed to process notification. Please try again.');
        }
    };

    // ✅ Helper function to safely convert IDs to numbers
    private safeParseId(id: string | number): number {
        if (typeof id === 'number') return id;
        const parsed = parseInt(String(id), 10);
        if (isNaN(parsed)) {
            throw new Error(`Invalid ID: ${id}`);
        }
        return parsed;
    }

    private async logMedicineUsage(data: NotificationData, isTaken: boolean): Promise<void> {
        try {
            console.log(`📝 Logging medicine usage: ${isTaken ? 'TAKEN' : 'MISSED'}`);

            // ✅ FIX 2: Safely convert IDs to numbers for backend compatibility
            const userId = this.safeParseId(data.userId);
            const healthProductId = this.safeParseId(data.healthProductId);

            const logData: LogData = {
                userId,
                healthProductId,
                isTaken,
                createdAt: new Date().toISOString(),
            };

            console.log('📝 Sending log data:', logData);

            // Log the medicine usage first (this should always work)
            await medicineLogApi.addMedicineUsageLog(logData);
            console.log('✅ Medicine usage logged successfully');

            // ✅ FIX 3: Only record usage (decrease stock) if medicine was actually taken
            // AND handle the "insufficient quantity" error gracefully
            if (isTaken) {
                try {
                    await healthProductApi.recordMedicineUsage(healthProductId.toString());
                    console.log('✅ Medicine stock updated successfully');
                } catch (stockError: any) {
                    console.warn('⚠️ Stock update failed:', stockError.message);

                    // Show user-friendly message for stock issues
                    if (stockError.message?.includes('Insufficient quantity')) {
                        Alert.alert(
                            'Low Stock Warning',
                            `Your ${data.medicineName || 'medicine'} is running low! Please reorder soon.`,
                            [{ text: 'OK' }]
                        );
                    } else {
                        // For other stock-related errors, still show a warning but don't fail completely
                        Alert.alert(
                            'Warning',
                            'Medicine usage recorded, but stock update failed. Please check your inventory.',
                            [{ text: 'OK' }]
                        );
                    }
                    // Don't re-throw the error here - we want to continue processing
                }
            }

        } catch (error: any) {
            console.error('❌ Failed to log medicine usage:', error);

            // Show user-friendly error message
            const errorMessage = error.message || 'Unknown error occurred';
            Alert.alert(
                'Error',
                `Failed to record medicine usage: ${errorMessage}`,
                [{ text: 'OK' }]
            );
            // Re-throw for the main handler to catch
            throw error;
        }
    }

    // ✅ Platform-specific content creation with proper typing
    private createNotificationContent(
        title: string,
        body: string,
        data: NotificationData
    ): Notifications.NotificationContentInput {
        const baseContent = {
            title,
            body,
            data: data as any,
            sound: 'default' as const,
        };

        if (Platform.OS === 'ios') {
            return {
                ...baseContent,
                categoryIdentifier: this.categoryIdentifier,
            };
        } else {
            return {
                ...baseContent,
                categoryIdentifier: this.categoryIdentifier, // ✅ Also add for Android
            };
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
        console.log(`📅 Scheduling ${scheduleTimes.length} reminders for ${medicineName}`);

        if (!this.isInitialized) {
            console.warn('⚠️ Service not initialized, initializing now...');
            await this.initialize();
        }

        const notificationIds: string[] = [];

        // ✅ Convert IDs to numbers once at the beginning
        const userIdNum = this.safeParseId(userId);
        const healthProductIdNum = this.safeParseId(healthProductId);

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

                // ✅ FIX 4: Use consistent numeric data types
                const notificationData: NotificationData = {
                    userId: userIdNum,
                    healthProductId: healthProductIdNum,
                    createdAt: new Date().toISOString(),
                    notificationId: uniqueId,
                    medicineName,
                    doseQuantity,
                    unit
                };

                const notificationContent = this.createNotificationContent(
                    `Time to take ${medicineName}`,
                    `Dose: ${doseQuantity} ${unit}`,
                    notificationData
                );

                // ✅ FIX: Proper trigger setup for both platforms
                let trigger: Notifications.DailyTriggerInput = {
                    hour,
                    minute,
                    repeats: true,
                };

                // Add channel info for Android
                if (Platform.OS === 'android') {
                    trigger = {
                        ...trigger,
                        channelId: 'medicine-reminders',
                    } as any;
                }

                const notificationId = await Notifications.scheduleNotificationAsync({
                    content: notificationContent,
                    trigger,
                    identifier: uniqueId
                });

                notificationIds.push(notificationId);
                console.log(`⏰ Scheduled reminder for ${hour}:${minute.toString().padStart(2, '0')} with ID: ${notificationId}`);

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

    // Test notification method removed - no longer needed for production

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