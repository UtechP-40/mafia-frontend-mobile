import { configureStore } from '@reduxjs/toolkit';
import { uiSlice, selectUI, selectIsLoading, selectTheme, selectNotifications } from '../slices/uiSlice';

describe('uiSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ui: uiSlice.reducer,
      },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().ui;
      expect(state).toEqual({
        isLoading: false,
        loadingMessage: null,
        activeModals: [],
        notifications: [],
        theme: 'dark',
        currentScreen: 'MainMenu',
        navigationHistory: [],
        showPlayerList: true,
        showChat: true,
        chatInputFocused: false,
        soundEnabled: true,
        vibrationEnabled: true,
        animationsEnabled: true,
        isOnline: true,
        connectionQuality: 'excellent',
        fps: 60,
        memoryUsage: 0,
      });
    });
  });

  describe('loading state actions', () => {
    it('should handle setLoading', () => {
      store.dispatch(uiSlice.actions.setLoading(true));
      let state = store.getState().ui;
      expect(state.isLoading).toBe(true);

      store.dispatch(uiSlice.actions.setLoading(false));
      state = store.getState().ui;
      expect(state.isLoading).toBe(false);
      expect(state.loadingMessage).toBe(null);
    });

    it('should handle setLoadingMessage', () => {
      const message = 'Loading game data...';
      store.dispatch(uiSlice.actions.setLoadingMessage(message));
      const state = store.getState().ui;

      expect(state.loadingMessage).toBe(message);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('modal management actions', () => {
    const mockModal = {
      id: 'modal-1',
      type: 'settings',
      props: { title: 'Settings' },
      closable: true,
    };

    it('should handle showModal', () => {
      store.dispatch(uiSlice.actions.showModal(mockModal));
      const state = store.getState().ui;

      expect(state.activeModals).toHaveLength(1);
      expect(state.activeModals[0]).toEqual(mockModal);
    });

    it('should replace existing modal of same type', () => {
      const modal1 = { id: 'modal-1', type: 'settings', props: { version: 1 } };
      const modal2 = { id: 'modal-2', type: 'settings', props: { version: 2 } };

      store.dispatch(uiSlice.actions.showModal(modal1));
      store.dispatch(uiSlice.actions.showModal(modal2));
      const state = store.getState().ui;

      expect(state.activeModals).toHaveLength(1);
      expect(state.activeModals[0]).toEqual(modal2);
    });

    it('should handle hideModal', () => {
      store.dispatch(uiSlice.actions.showModal(mockModal));
      store.dispatch(uiSlice.actions.hideModal('modal-1'));
      const state = store.getState().ui;

      expect(state.activeModals).toHaveLength(0);
    });

    it('should handle hideModalByType', () => {
      const modal1 = { id: 'modal-1', type: 'settings' };
      const modal2 = { id: 'modal-2', type: 'profile' };

      store.dispatch(uiSlice.actions.showModal(modal1));
      store.dispatch(uiSlice.actions.showModal(modal2));
      store.dispatch(uiSlice.actions.hideModalByType('settings'));
      const state = store.getState().ui;

      expect(state.activeModals).toHaveLength(1);
      expect(state.activeModals[0].type).toBe('profile');
    });

    it('should handle hideAllModals', () => {
      const modal1 = { id: 'modal-1', type: 'settings' };
      const modal2 = { id: 'modal-2', type: 'profile' };

      store.dispatch(uiSlice.actions.showModal(modal1));
      store.dispatch(uiSlice.actions.showModal(modal2));
      store.dispatch(uiSlice.actions.hideAllModals());
      const state = store.getState().ui;

      expect(state.activeModals).toHaveLength(0);
    });
  });

  describe('notification actions', () => {
    it('should handle addNotification', () => {
      const notification = {
        message: 'Test notification',
        type: 'success' as const,
        duration: 3000,
      };

      store.dispatch(uiSlice.actions.addNotification(notification));
      const state = store.getState().ui;

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].message).toBe('Test notification');
      expect(state.notifications[0].type).toBe('success');
      expect(state.notifications[0].duration).toBe(3000);
      expect(state.notifications[0].persistent).toBe(false);
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].timestamp).toBeGreaterThan(0);
    });

    it('should handle addNotification with defaults', () => {
      const notification = {
        message: 'Default notification',
        type: 'info' as const,
      };

      store.dispatch(uiSlice.actions.addNotification(notification));
      const state = store.getState().ui;

      expect(state.notifications[0].duration).toBe(5000);
      expect(state.notifications[0].persistent).toBe(false);
    });

    it('should handle removeNotification', () => {
      const notification = { message: 'Test', type: 'info' as const };
      store.dispatch(uiSlice.actions.addNotification(notification));
      
      const state = store.getState().ui;
      const notificationId = state.notifications[0].id;
      
      store.dispatch(uiSlice.actions.removeNotification(notificationId));
      const newState = store.getState().ui;

      expect(newState.notifications).toHaveLength(0);
    });

    it('should handle clearNotifications', () => {
      store.dispatch(uiSlice.actions.addNotification({ message: 'Test 1', type: 'info' }));
      store.dispatch(uiSlice.actions.addNotification({ message: 'Test 2', type: 'success' }));
      store.dispatch(uiSlice.actions.clearNotifications());
      const state = store.getState().ui;

      expect(state.notifications).toHaveLength(0);
    });

    it('should handle clearExpiredNotifications', () => {
      // Mock Date.now to control timestamps
      const originalNow = Date.now;
      const mockNow = 1000000;
      Date.now = jest.fn(() => mockNow);

      // Add notifications with different expiry times
      store.dispatch(uiSlice.actions.addNotification({
        message: 'Expired',
        type: 'info',
        duration: 1000, // Will be expired
      }));

      store.dispatch(uiSlice.actions.addNotification({
        message: 'Not expired',
        type: 'info',
        duration: 10000, // Will not be expired
      }));

      store.dispatch(uiSlice.actions.addNotification({
        message: 'Persistent',
        type: 'info',
        persistent: true,
      }));

      // Advance time
      Date.now = jest.fn(() => mockNow + 5000);

      store.dispatch(uiSlice.actions.clearExpiredNotifications());
      const state = store.getState().ui;

      expect(state.notifications).toHaveLength(2);
      expect(state.notifications.find(n => n.message === 'Expired')).toBeUndefined();
      expect(state.notifications.find(n => n.message === 'Not expired')).toBeDefined();
      expect(state.notifications.find(n => n.message === 'Persistent')).toBeDefined();

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('theme and appearance actions', () => {
    it('should handle setTheme', () => {
      store.dispatch(uiSlice.actions.setTheme('light'));
      const state = store.getState().ui;
      expect(state.theme).toBe('light');
    });

    it('should handle toggleTheme', () => {
      // Initial theme is 'dark'
      store.dispatch(uiSlice.actions.toggleTheme());
      let state = store.getState().ui;
      expect(state.theme).toBe('light');

      store.dispatch(uiSlice.actions.toggleTheme());
      state = store.getState().ui;
      expect(state.theme).toBe('dark');
    });
  });

  describe('navigation actions', () => {
    it('should handle setCurrentScreen', () => {
      store.dispatch(uiSlice.actions.setCurrentScreen('GameScreen'));
      const state = store.getState().ui;

      expect(state.currentScreen).toBe('GameScreen');
      expect(state.navigationHistory).toContain('MainMenu');
    });

    it('should not add to history if same screen', () => {
      store.dispatch(uiSlice.actions.setCurrentScreen('MainMenu'));
      const state = store.getState().ui;

      expect(state.currentScreen).toBe('MainMenu');
      expect(state.navigationHistory).toHaveLength(0);
    });

    it('should limit navigation history to 10 items', () => {
      // Add 12 screens to test the limit
      for (let i = 1; i <= 12; i++) {
        store.dispatch(uiSlice.actions.setCurrentScreen(`Screen${i}`));
      }
      const state = store.getState().ui;

      expect(state.navigationHistory).toHaveLength(10);
      expect(state.navigationHistory[0]).toBe('Screen2'); // First item should be removed
    });

    it('should handle navigateBack', () => {
      store.dispatch(uiSlice.actions.setCurrentScreen('Screen1'));
      store.dispatch(uiSlice.actions.setCurrentScreen('Screen2'));
      store.dispatch(uiSlice.actions.navigateBack());
      const state = store.getState().ui;

      expect(state.currentScreen).toBe('Screen1');
      expect(state.navigationHistory).toContain('MainMenu');
    });

    it('should handle navigateBack with empty history', () => {
      store.dispatch(uiSlice.actions.navigateBack());
      const state = store.getState().ui;

      expect(state.currentScreen).toBe('MainMenu'); // Should remain unchanged
    });

    it('should handle clearNavigationHistory', () => {
      store.dispatch(uiSlice.actions.setCurrentScreen('Screen1'));
      store.dispatch(uiSlice.actions.clearNavigationHistory());
      const state = store.getState().ui;

      expect(state.navigationHistory).toHaveLength(0);
    });
  });

  describe('game UI specific actions', () => {
    it('should handle togglePlayerList', () => {
      store.dispatch(uiSlice.actions.togglePlayerList());
      let state = store.getState().ui;
      expect(state.showPlayerList).toBe(false);

      store.dispatch(uiSlice.actions.togglePlayerList());
      state = store.getState().ui;
      expect(state.showPlayerList).toBe(true);
    });

    it('should handle setShowPlayerList', () => {
      store.dispatch(uiSlice.actions.setShowPlayerList(false));
      const state = store.getState().ui;
      expect(state.showPlayerList).toBe(false);
    });

    it('should handle toggleChat', () => {
      store.dispatch(uiSlice.actions.toggleChat());
      let state = store.getState().ui;
      expect(state.showChat).toBe(false);

      store.dispatch(uiSlice.actions.toggleChat());
      state = store.getState().ui;
      expect(state.showChat).toBe(true);
    });

    it('should handle setShowChat', () => {
      store.dispatch(uiSlice.actions.setShowChat(false));
      const state = store.getState().ui;
      expect(state.showChat).toBe(false);
    });

    it('should handle setChatInputFocused', () => {
      store.dispatch(uiSlice.actions.setChatInputFocused(true));
      const state = store.getState().ui;
      expect(state.chatInputFocused).toBe(true);
    });
  });

  describe('settings actions', () => {
    it('should handle setSoundEnabled', () => {
      store.dispatch(uiSlice.actions.setSoundEnabled(false));
      const state = store.getState().ui;
      expect(state.soundEnabled).toBe(false);
    });

    it('should handle setVibrationEnabled', () => {
      store.dispatch(uiSlice.actions.setVibrationEnabled(false));
      const state = store.getState().ui;
      expect(state.vibrationEnabled).toBe(false);
    });

    it('should handle setAnimationsEnabled', () => {
      store.dispatch(uiSlice.actions.setAnimationsEnabled(false));
      const state = store.getState().ui;
      expect(state.animationsEnabled).toBe(false);
    });

    it('should handle updateSettings', () => {
      const settings = {
        soundEnabled: false,
        vibrationEnabled: false,
        animationsEnabled: false,
      };

      store.dispatch(uiSlice.actions.updateSettings(settings));
      const state = store.getState().ui;

      expect(state.soundEnabled).toBe(false);
      expect(state.vibrationEnabled).toBe(false);
      expect(state.animationsEnabled).toBe(false);
    });
  });

  describe('network status actions', () => {
    it('should handle setOnlineStatus', () => {
      store.dispatch(uiSlice.actions.setOnlineStatus(false));
      let state = store.getState().ui;
      expect(state.isOnline).toBe(false);
      expect(state.connectionQuality).toBe('offline');

      store.dispatch(uiSlice.actions.setOnlineStatus(true));
      state = store.getState().ui;
      expect(state.isOnline).toBe(true);
      // connectionQuality should remain 'offline' until explicitly set
    });

    it('should handle setConnectionQuality', () => {
      store.dispatch(uiSlice.actions.setConnectionQuality('poor'));
      let state = store.getState().ui;
      expect(state.connectionQuality).toBe('poor');
      expect(state.isOnline).toBe(true);

      store.dispatch(uiSlice.actions.setConnectionQuality('offline'));
      state = store.getState().ui;
      expect(state.connectionQuality).toBe('offline');
      expect(state.isOnline).toBe(false);
    });
  });

  describe('performance monitoring actions', () => {
    it('should handle updatePerformanceMetrics', () => {
      store.dispatch(uiSlice.actions.updatePerformanceMetrics({
        fps: 30,
        memoryUsage: 150,
      }));
      const state = store.getState().ui;

      expect(state.fps).toBe(30);
      expect(state.memoryUsage).toBe(150);
    });

    it('should handle partial performance metrics update', () => {
      store.dispatch(uiSlice.actions.updatePerformanceMetrics({ fps: 45 }));
      let state = store.getState().ui;
      expect(state.fps).toBe(45);
      expect(state.memoryUsage).toBe(0); // Should remain unchanged

      store.dispatch(uiSlice.actions.updatePerformanceMetrics({ memoryUsage: 200 }));
      state = store.getState().ui;
      expect(state.fps).toBe(45); // Should remain unchanged
      expect(state.memoryUsage).toBe(200);
    });
  });

  describe('utility actions', () => {
    it('should handle resetUI', () => {
      // Set up some state
      store.dispatch(uiSlice.actions.setLoading(true));
      store.dispatch(uiSlice.actions.setLoadingMessage('Loading...'));
      store.dispatch(uiSlice.actions.showModal({ id: 'modal-1', type: 'settings' }));
      store.dispatch(uiSlice.actions.addNotification({ message: 'Test', type: 'info' }));
      store.dispatch(uiSlice.actions.setCurrentScreen('GameScreen'));
      store.dispatch(uiSlice.actions.setShowPlayerList(false));
      store.dispatch(uiSlice.actions.setShowChat(false));
      store.dispatch(uiSlice.actions.setChatInputFocused(true));

      // Reset UI
      store.dispatch(uiSlice.actions.resetUI());
      const state = store.getState().ui;

      expect(state.activeModals).toHaveLength(0);
      expect(state.notifications).toHaveLength(0);
      expect(state.isLoading).toBe(false);
      expect(state.loadingMessage).toBe(null);
      expect(state.currentScreen).toBe('MainMenu');
      expect(state.navigationHistory).toHaveLength(0);
      expect(state.showPlayerList).toBe(true);
      expect(state.showChat).toBe(true);
      expect(state.chatInputFocused).toBe(false);
    });
  });

  describe('selectors', () => {
    it('should select UI state', () => {
      const state = store.getState();
      const uiState = selectUI(state);
      expect(uiState).toEqual(state.ui);
    });

    it('should select isLoading', () => {
      store.dispatch(uiSlice.actions.setLoading(true));
      const state = store.getState();
      const isLoading = selectIsLoading(state);
      expect(isLoading).toBe(true);
    });

    it('should select theme', () => {
      store.dispatch(uiSlice.actions.setTheme('light'));
      const state = store.getState();
      const theme = selectTheme(state);
      expect(theme).toBe('light');
    });

    it('should select notifications', () => {
      store.dispatch(uiSlice.actions.addNotification({ message: 'Test', type: 'info' }));
      const state = store.getState();
      const notifications = selectNotifications(state);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('Test');
    });
  });
});