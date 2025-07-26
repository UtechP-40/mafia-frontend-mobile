import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// React Native Reanimated is mocked via Jest configuration

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(component => component),
    Directions: {},
  };
});

// Mock Socket.io
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}));

// Mock Expo modules
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

jest.mock('expo-auth-session', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  makeRedirectUri: jest.fn(() => 'test://redirect'),
  ResponseType: { Token: 'token', IdToken: 'id_token' },
  AppleAuthenticationScope: { FULL_NAME: 'name', EMAIL: 'email' },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: '', password: '' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: {},
  })),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: {},
  })),
}));

// Mock offline sync service
jest.mock('../services/offlineSync', () => ({
  offlineSyncService: {
    getOnlineStatus: jest.fn(() => true),
    addSyncListener: jest.fn(),
    removeSyncListener: jest.fn(),
    queueAction: jest.fn(() => Promise.resolve()),
    syncOfflineActions: jest.fn(() => Promise.resolve()),
    syncOfflineData: jest.fn(() => Promise.resolve()),
    storeOfflineData: jest.fn(() => Promise.resolve()),
    getOfflineData: jest.fn(() => Promise.resolve({})),
    resolveConflict: jest.fn(() => Promise.resolve({})),
    clearOfflineData: jest.fn(() => Promise.resolve()),
    forceSync: jest.fn(() => Promise.resolve()),
    getPendingActionsCount: jest.fn(() => 0),
  },
}));

// Mock progressive loader service
jest.mock('../services/progressiveLoader', () => ({
  progressiveLoaderService: {
    loadData: jest.fn(() => Promise.resolve(new Map())),
    preloadCriticalData: jest.fn(() => Promise.resolve()),
    loadGameData: jest.fn(() => Promise.resolve(new Map())),
    loadSocialData: jest.fn(() => Promise.resolve(new Map())),
    invalidateCache: jest.fn(),
    clearCache: jest.fn(() => Promise.resolve()),
    getCacheStats: jest.fn(() => ({
      size: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
    })),
    updateStrategy: jest.fn(),
    prefetchData: jest.fn(() => Promise.resolve()),
  },
}));

// Mock fetch for async thunks
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Silence the warning: Animated: `useNativeDriver` is not supported
// Note: NativeAnimatedHelper mock removed due to path issues in newer RN versions

// Setup global test environment
beforeEach(() => {
  jest.clearAllMocks();
});