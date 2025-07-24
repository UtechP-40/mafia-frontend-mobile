import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  persistent?: boolean;
  timestamp: number;
}

interface Modal {
  id: string;
  type: string;
  props?: any;
  closable?: boolean;
}

interface UIState {
  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;
  
  // Modal management
  activeModals: Modal[];
  
  // Notifications
  notifications: Notification[];
  
  // Theme and appearance
  theme: 'light' | 'dark';
  
  // Navigation
  currentScreen: string;
  navigationHistory: string[];
  
  // Game UI specific
  showPlayerList: boolean;
  showChat: boolean;
  chatInputFocused: boolean;
  
  // Settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  animationsEnabled: boolean;
  
  // Network status
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  // Performance
  fps: number;
  memoryUsage: number;
}

const initialState: UIState = {
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
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = null;
      }
    },
    
    setLoadingMessage: (state, action: PayloadAction<string>) => {
      state.loadingMessage = action.payload;
      state.isLoading = true;
    },
    
    // Modal management
    showModal: (state, action: PayloadAction<Modal>) => {
      // Remove existing modal of same type
      state.activeModals = state.activeModals.filter(m => m.type !== action.payload.type);
      state.activeModals.push(action.payload);
    },
    
    hideModal: (state, action: PayloadAction<string>) => {
      state.activeModals = state.activeModals.filter(m => m.id !== action.payload);
    },
    
    hideModalByType: (state, action: PayloadAction<string>) => {
      state.activeModals = state.activeModals.filter(m => m.type !== action.payload);
    },
    
    hideAllModals: (state) => {
      state.activeModals = [];
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        duration: 5000, // Default 5 seconds
        persistent: false,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    clearExpiredNotifications: (state) => {
      const now = Date.now();
      state.notifications = state.notifications.filter(n => 
        n.persistent || (n.duration && (now - n.timestamp) < n.duration)
      );
    },
    
    // Theme and appearance
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    // Navigation
    setCurrentScreen: (state, action: PayloadAction<string>) => {
      if (state.currentScreen !== action.payload) {
        state.navigationHistory.push(state.currentScreen);
        state.currentScreen = action.payload;
        
        // Keep history limited to last 10 screens
        if (state.navigationHistory.length > 10) {
          state.navigationHistory = state.navigationHistory.slice(-10);
        }
      }
    },
    
    navigateBack: (state) => {
      if (state.navigationHistory.length > 0) {
        state.currentScreen = state.navigationHistory.pop()!;
      }
    },
    
    clearNavigationHistory: (state) => {
      state.navigationHistory = [];
    },
    
    // Game UI specific
    togglePlayerList: (state) => {
      state.showPlayerList = !state.showPlayerList;
    },
    
    setShowPlayerList: (state, action: PayloadAction<boolean>) => {
      state.showPlayerList = action.payload;
    },
    
    toggleChat: (state) => {
      state.showChat = !state.showChat;
    },
    
    setShowChat: (state, action: PayloadAction<boolean>) => {
      state.showChat = action.payload;
    },
    
    setChatInputFocused: (state, action: PayloadAction<boolean>) => {
      state.chatInputFocused = action.payload;
    },
    
    // Settings
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
    
    setVibrationEnabled: (state, action: PayloadAction<boolean>) => {
      state.vibrationEnabled = action.payload;
    },
    
    setAnimationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.animationsEnabled = action.payload;
    },
    
    updateSettings: (state, action: PayloadAction<Partial<{
      soundEnabled: boolean;
      vibrationEnabled: boolean;
      animationsEnabled: boolean;
    }>>) => {
      Object.assign(state, action.payload);
    },
    
    // Network status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (!action.payload) {
        state.connectionQuality = 'offline';
      }
    },
    
    setConnectionQuality: (state, action: PayloadAction<'excellent' | 'good' | 'poor' | 'offline'>) => {
      state.connectionQuality = action.payload;
      state.isOnline = action.payload !== 'offline';
    },
    
    // Performance monitoring
    updatePerformanceMetrics: (state, action: PayloadAction<{ fps?: number; memoryUsage?: number }>) => {
      if (action.payload.fps !== undefined) {
        state.fps = action.payload.fps;
      }
      if (action.payload.memoryUsage !== undefined) {
        state.memoryUsage = action.payload.memoryUsage;
      }
    },
    
    // Utility actions
    resetUI: (state) => {
      state.activeModals = [];
      state.notifications = [];
      state.isLoading = false;
      state.loadingMessage = null;
      state.currentScreen = 'MainMenu';
      state.navigationHistory = [];
      state.showPlayerList = true;
      state.showChat = true;
      state.chatInputFocused = false;
    },
  },
});

export const {
  setLoading,
  setLoadingMessage,
  showModal,
  hideModal,
  hideModalByType,
  hideAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  clearExpiredNotifications,
  setTheme,
  toggleTheme,
  setCurrentScreen,
  navigateBack,
  clearNavigationHistory,
  togglePlayerList,
  setShowPlayerList,
  toggleChat,
  setShowChat,
  setChatInputFocused,
  setSoundEnabled,
  setVibrationEnabled,
  setAnimationsEnabled,
  updateSettings,
  setOnlineStatus,
  setConnectionQuality,
  updatePerformanceMetrics,
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectIsLoading = (state: { ui: UIState }) => state.ui.isLoading;
export const selectLoadingMessage = (state: { ui: UIState }) => state.ui.loadingMessage;
export const selectActiveModals = (state: { ui: UIState }) => state.ui.activeModals;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectCurrentScreen = (state: { ui: UIState }) => state.ui.currentScreen;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline;
export const selectConnectionQuality = (state: { ui: UIState }) => state.ui.connectionQuality;
export const selectSettings = (state: { ui: UIState }) => ({
  soundEnabled: state.ui.soundEnabled,
  vibrationEnabled: state.ui.vibrationEnabled,
  animationsEnabled: state.ui.animationsEnabled,
});