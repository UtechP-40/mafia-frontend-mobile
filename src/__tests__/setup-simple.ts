// Mock AsyncStorage for Redux Persist
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
};

// Mock AsyncStorage module
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

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

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock only the problematic parts, keep the rest
  return Object.setPrototypeOf(
    {
      ...RN,
      Dimensions: {
        get: () => ({ width: 375, height: 667 }),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      Platform: {
        OS: 'ios',
        select: (obj: any) => obj.ios || obj.default,
        Version: 14,
      },
      StyleSheet: {
        ...RN.StyleSheet,
        create: (styles: any) => styles,
        flatten: (style: any) => style,
      },
      Alert: {
        alert: jest.fn(),
      },
      Animated: {
        ...RN.Animated,
        Value: jest.fn(() => ({
          interpolate: jest.fn(() => 0),
          setValue: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          removeAllListeners: jest.fn(),
          stopAnimation: jest.fn(),
          resetAnimation: jest.fn(),
        })),
        timing: jest.fn(() => ({
          start: jest.fn(),
          stop: jest.fn(),
          reset: jest.fn(),
        })),
        spring: jest.fn(() => ({
          start: jest.fn(),
          stop: jest.fn(),
          reset: jest.fn(),
        })),
        View: RN.View,
      },
    },
    RN
  );
});

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
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: '', password: '' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
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

// Setup global test environment
beforeEach(() => {
  jest.clearAllMocks();
});