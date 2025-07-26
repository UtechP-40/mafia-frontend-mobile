import { pushNotificationService } from '../../services/pushNotifications';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('expo-linking');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/api', () => ({
  apiService: {
    registerPushToken: jest.fn(),
    updateNotificationPreferences: jest.fn(),
  },
}));

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockLinking = Linking as jest.Mocked<typeof Linking>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockApiService = require('../../services/api').apiService;

describe('Push Notifications Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
      canAskAgain: true,
      granted: true,
    });
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[test-token]',
    });
  });

  describe('Initialization', () => {
    it('initializes push notifications correctly', async () => {
      await pushNotificationService.initialize();

      expect(mockNotifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('requests permissions when not granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: true,
        granted: false,
      });
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
        granted: true,
      });

      await pushNotificationService.initialize();

      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('handles permission denial gracefully', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
        granted: false,
      });

      await pushNotificationService.initialize();

      // Should not crash and should handle gracefully
      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('registers push token with server', async () => {
      mockApiService.registerPushToken.mockResolvedValue({ success: true });

      await pushNotificationService.initialize();

      expect(mockApiService.registerPushToken).toHaveBeenCalledWith(
        'ExponentPushToken[test-token]'
      );
    });

    it('handles token registration failure', async () => {
      mockApiService.registerPushToken.mockRejectedValue(new Error('Server error'));

      await expect(pushNotificationService.initialize()).resolves.not.toThrow();
    });
  });

  describe('Notification Handling', () => {
    it('handles incoming notifications correctly', async () => {
      const mockNotification = {
        request: {
          identifier: 'test-notification',
          content: {
            title: 'Game Started',
            body: 'Your game has started!',
            data: {
              type: 'game_started',
              roomId: 'room-123',
            },
          },
        },
        date: Date.now(),
      };

      const handler = jest.fn();
      pushNotificationService.addNotificationListener(handler);

      await pushNotificationService.initialize();

      // Simulate receiving notification
      const notificationHandler = mockNotifications.setNotificationHandler.mock.calls[0][0];
      const response = await notificationHandler.handleNotification(mockNotification);

      expect(response).toEqual({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      });
      expect(handler).toHaveBeenCalledWith(mockNotification);
    });

    it('handles notification responses (taps)', async () => {
      const mockResponse = {
        notification: {
          request: {
            identifier: 'test-notification',
            content: {
              title: 'Friend Request',
              body: 'John sent you a friend request',
              data: {
                type: 'friend_request',
                userId: 'user-123',
              },
            },
          },
          date: Date.now(),
        },
        actionIdentifier: 'default',
      };

      const responseHandler = jest.fn();
      pushNotificationService.addNotificationResponseListener(responseHandler);

      await pushNotificationService.initialize();

      // Simulate notification tap
      const responseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];
      responseListener(mockResponse);

      expect(responseHandler).toHaveBeenCalledWith(mockResponse);
    });

    it('filters notifications based on preferences', async () => {
      const preferences = {
        gameNotifications: false,
        friendNotifications: true,
        systemNotifications: true,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(preferences));

      const gameNotification = {
        request: {
          content: {
            data: { type: 'game_started' },
          },
        },
      };

      const friendNotification = {
        request: {
          content: {
            data: { type: 'friend_request' },
          },
        },
      };

      await pushNotificationService.initialize();
      const notificationHandler = mockNotifications.setNotificationHandler.mock.calls[0][0];

      const gameResponse = await notificationHandler.handleNotification(gameNotification);
      const friendResponse = await notificationHandler.handleNotification(friendNotification);

      expect(gameResponse.shouldShowAlert).toBe(false);
      expect(friendResponse.shouldShowAlert).toBe(true);
    });

    it('handles notification categories and actions', async () => {
      await pushNotificationService.initialize();

      expect(mockNotifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
        'game_invite',
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'accept',
            buttonTitle: 'Accept',
          }),
          expect.objectContaining({
            identifier: 'decline',
            buttonTitle: 'Decline',
          }),
        ])
      );
    });

    it('handles rich notifications with images', async () => {
      const richNotification = {
        request: {
          content: {
            title: 'Game Result',
            body: 'You won the game!',
            data: {
              type: 'game_result',
              imageUrl: 'https://example.com/victory.png',
            },
          },
        },
      };

      await pushNotificationService.initialize();
      const notificationHandler = mockNotifications.setNotificationHandler.mock.calls[0][0];

      const response = await notificationHandler.handleNotification(richNotification);

      expect(response.shouldShowAlert).toBe(true);
      // Should handle image attachment
    });
  });

  describe('Deep Linking', () => {
    it('handles deep links from notifications', async () => {
      const deepLinkHandler = jest.fn();
      pushNotificationService.addDeepLinkHandler(deepLinkHandler);

      const notificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'game_invite',
                deepLink: 'mafiaapp://join-room/ABC123',
              },
            },
          },
        },
        actionIdentifier: 'default',
      };

      await pushNotificationService.initialize();
      const responseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];
      responseListener(notificationResponse);

      expect(deepLinkHandler).toHaveBeenCalledWith('mafiaapp://join-room/ABC123');
    });

    it('parses deep link URLs correctly', () => {
      const testCases = [
        {
          url: 'mafiaapp://join-room/ABC123',
          expected: { screen: 'Lobby', params: { roomId: 'ABC123' } },
        },
        {
          url: 'mafiaapp://friend-profile/user-456',
          expected: { screen: 'FriendProfile', params: { userId: 'user-456' } },
        },
        {
          url: 'mafiaapp://game-result/game-789',
          expected: { screen: 'Results', params: { gameId: 'game-789' } },
        },
      ];

      testCases.forEach(({ url, expected }) => {
        const parsed = pushNotificationService.parseDeepLink(url);
        expect(parsed).toEqual(expected);
      });
    });

    it('handles invalid deep links gracefully', () => {
      const invalidUrls = [
        'invalid-url',
        'mafiaapp://unknown-action',
        'mafiaapp://join-room/', // Missing room ID
        'https://external-site.com',
      ];

      invalidUrls.forEach(url => {
        const parsed = pushNotificationService.parseDeepLink(url);
        expect(parsed).toBeNull();
      });
    });

    it('handles app launch from notification', async () => {
      const launchNotification = {
        request: {
          content: {
            data: {
              type: 'game_started',
              roomId: 'room-123',
            },
          },
        },
      };

      mockNotifications.getLastNotificationResponseAsync.mockResolvedValue({
        notification: launchNotification,
        actionIdentifier: 'default',
      });

      const launchHandler = jest.fn();
      pushNotificationService.addLaunchHandler(launchHandler);

      await pushNotificationService.handleAppLaunch();

      expect(launchHandler).toHaveBeenCalledWith(launchNotification);
    });

    it('integrates with React Navigation', async () => {
      const mockNavigate = jest.fn();
      const mockNavigation = { navigate: mockNavigate };

      pushNotificationService.setNavigationRef(mockNavigation);

      const notificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'game_invite',
                roomId: 'room-123',
              },
            },
          },
        },
      };

      await pushNotificationService.initialize();
      const responseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];
      responseListener(notificationResponse);

      expect(mockNavigate).toHaveBeenCalledWith('Lobby', { roomId: 'room-123' });
    });
  });

  describe('Local Notifications', () => {
    it('schedules local notifications', async () => {
      const notification = {
        title: 'Game Reminder',
        body: 'Your game starts in 5 minutes',
        data: { type: 'game_reminder' },
        trigger: { seconds: 300 }, // 5 minutes
      };

      await pushNotificationService.scheduleLocalNotification(notification);

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
        trigger: notification.trigger,
      });
    });

    it('cancels scheduled notifications', async () => {
      const notificationId = 'reminder-123';

      await pushNotificationService.cancelLocalNotification(notificationId);

      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        notificationId
      );
    });

    it('cancels all notifications', async () => {
      await pushNotificationService.cancelAllNotifications();

      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('handles recurring notifications', async () => {
      const recurringNotification = {
        title: 'Daily Challenge',
        body: 'New daily challenge available!',
        data: { type: 'daily_challenge' },
        trigger: {
          repeats: true,
          hour: 9,
          minute: 0,
        },
      };

      await pushNotificationService.scheduleLocalNotification(recurringNotification);

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            repeats: true,
          }),
        })
      );
    });
  });

  describe('Notification Preferences', () => {
    it('updates notification preferences', async () => {
      const preferences = {
        gameNotifications: true,
        friendNotifications: false,
        systemNotifications: true,
        soundEnabled: false,
        vibrationEnabled: true,
      };

      await pushNotificationService.updatePreferences(preferences);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_preferences',
        JSON.stringify(preferences)
      );
      expect(mockApiService.updateNotificationPreferences).toHaveBeenCalledWith(preferences);
    });

    it('gets current notification preferences', async () => {
      const storedPreferences = {
        gameNotifications: false,
        friendNotifications: true,
        systemNotifications: true,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedPreferences));

      const preferences = await pushNotificationService.getPreferences();

      expect(preferences).toEqual(storedPreferences);
    });

    it('uses default preferences when none stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const preferences = await pushNotificationService.getPreferences();

      expect(preferences).toEqual({
        gameNotifications: true,
        friendNotifications: true,
        systemNotifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
      });
    });

    it('handles quiet hours', async () => {
      const preferences = {
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(preferences));

      const notification = {
        request: {
          content: {
            data: { type: 'friend_request' },
          },
        },
      };

      // Mock current time to be during quiet hours (23:00)
      const mockDate = new Date();
      mockDate.setHours(23, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      await pushNotificationService.initialize();
      const notificationHandler = mockNotifications.setNotificationHandler.mock.calls[0][0];

      const response = await notificationHandler.handleNotification(notification);

      expect(response.shouldPlaySound).toBe(false);
      expect(response.shouldShowAlert).toBe(true); // Still show, but silently
    });
  });

  describe('Badge Management', () => {
    it('updates app badge count', async () => {
      await pushNotificationService.setBadgeCount(5);

      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
    });

    it('clears app badge', async () => {
      await pushNotificationService.clearBadge();

      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });

    it('increments badge count', async () => {
      mockNotifications.getBadgeCountAsync.mockResolvedValue(3);

      await pushNotificationService.incrementBadge();

      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(4);
    });

    it('handles badge count for different notification types', async () => {
      const gameNotification = {
        request: {
          content: {
            data: { type: 'game_started', incrementBadge: true },
          },
        },
      };

      const systemNotification = {
        request: {
          content: {
            data: { type: 'system_update', incrementBadge: false },
          },
        },
      };

      await pushNotificationService.initialize();
      const notificationHandler = mockNotifications.setNotificationHandler.mock.calls[0][0];

      await notificationHandler.handleNotification(gameNotification);
      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledWith(1);

      await notificationHandler.handleNotification(systemNotification);
      expect(mockNotifications.setBadgeCountAsync).toHaveBeenCalledTimes(1); // Should not increment
    });
  });

  describe('Error Handling', () => {
    it('handles permission errors gracefully', async () => {
      mockNotifications.getPermissionsAsync.mockRejectedValue(new Error('Permission error'));

      await expect(pushNotificationService.initialize()).resolves.not.toThrow();
    });

    it('handles token generation errors', async () => {
      mockNotifications.getExpoPushTokenAsync.mockRejectedValue(new Error('Token error'));

      await expect(pushNotificationService.initialize()).resolves.not.toThrow();
    });

    it('handles malformed notification data', async () => {
      const malformedNotification = {
        request: {
          content: {
            data: null, // Invalid data
          },
        },
      };

      await pushNotificationService.initialize();
      const notificationHandler = mockNotifications.setNotificationHandler.mock.calls[0][0];

      await expect(
        notificationHandler.handleNotification(malformedNotification)
      ).resolves.not.toThrow();
    });

    it('handles network errors during preference sync', async () => {
      mockApiService.updateNotificationPreferences.mockRejectedValue(
        new Error('Network error')
      );

      const preferences = { gameNotifications: true };

      await expect(
        pushNotificationService.updatePreferences(preferences)
      ).resolves.not.toThrow();

      // Should still save locally
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Analytics and Metrics', () => {
    it('tracks notification engagement', async () => {
      const trackingSpy = jest.spyOn(pushNotificationService, 'trackNotificationEvent');

      const notificationResponse = {
        notification: {
          request: {
            content: {
              data: { type: 'game_invite' },
            },
          },
        },
        actionIdentifier: 'default',
      };

      await pushNotificationService.initialize();
      const responseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];
      responseListener(notificationResponse);

      expect(trackingSpy).toHaveBeenCalledWith('notification_tapped', {
        type: 'game_invite',
        action: 'default',
      });
    });

    it('tracks notification delivery rates', async () => {
      const notification = {
        request: {
          content: {
            data: { type: 'friend_request', trackDelivery: true },
          },
        },
      };

      await pushNotificationService.initialize();
      const notificationHandler = mockNotifications.setNotificationHandler.mock.calls[0][0];

      await notificationHandler.handleNotification(notification);

      // Should track delivery
      expect(pushNotificationService.trackNotificationEvent).toHaveBeenCalledWith(
        'notification_delivered',
        { type: 'friend_request' }
      );
    });

    it('provides notification statistics', async () => {
      const stats = await pushNotificationService.getNotificationStats();

      expect(stats).toHaveProperty('totalReceived');
      expect(stats).toHaveProperty('totalTapped');
      expect(stats).toHaveProperty('engagementRate');
      expect(stats).toHaveProperty('typeBreakdown');
    });
  });
});