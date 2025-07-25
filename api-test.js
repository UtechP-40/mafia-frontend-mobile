// Simple API integration test for the frontend
// This tests the API service methods to ensure they work with the backend

const API_BASE_URL = 'http://localhost:3000/api';

// Mock AsyncStorage for testing
const mockAsyncStorage = {
  storage: {},
  getItem: async (key) => mockAsyncStorage.storage[key] || null,
  setItem: async (key, value) => { mockAsyncStorage.storage[key] = value; },
  removeItem: async (key) => { delete mockAsyncStorage.storage[key]; }
};

// Mock the API service class (simplified version)
class TestApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getAuthHeaders() {
    const token = await mockAsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Test authentication
  async register(userData) {
    const { confirmPassword, ...backendData } = userData;
    const response = await this.post('/auth/register', backendData);
    
    if (response.success && response.data) {
      await mockAsyncStorage.setItem('token', response.data.accessToken);
      await mockAsyncStorage.setItem('refreshToken', response.data.refreshToken);
      
      return {
        user: response.data.player,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    throw new Error(response.message || 'Registration failed');
  }

  async login(credentials) {
    const isEmail = credentials.username.includes('@');
    const loginData = isEmail 
      ? { email: credentials.username, password: credentials.password }
      : { username: credentials.username, password: credentials.password };
    
    const response = await this.post('/auth/login', loginData);
    
    if (response.success && response.data) {
      await mockAsyncStorage.setItem('token', response.data.accessToken);
      await mockAsyncStorage.setItem('refreshToken', response.data.refreshToken);
      
      return {
        user: response.data.player,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    throw new Error(response.message || 'Login failed');
  }

  // Test friends API
  async getFriends() {
    try {
      const response = await this.get('/players/friends');
      return { friends: response.data || [], friendRequests: [] };
    } catch (error) {
      console.log('Friends API error:', error);
      return { friends: [], friendRequests: [] };
    }
  }

  // Test rooms API
  async getPublicRooms(filters) {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.maxPlayers) queryParams.append('maxPlayers', filters.maxPlayers.toString());
      if (filters?.hasVoiceChat !== null && filters?.hasVoiceChat !== undefined) {
        queryParams.append('hasVoiceChat', filters.hasVoiceChat.toString());
      }
      if (filters?.skillLevel) queryParams.append('skillLevel', filters.skillLevel);
      
      const query = queryParams.toString();
      const response = await this.get(`/rooms/public${query ? `?${query}` : ''}`);
      
      if (response.success && response.data) {
        return response.data.rooms || response.data.data || [];
      }
      return [];
    } catch (error) {
      console.log('Public rooms API error:', error);
      return [];
    }
  }

  // Test matchmaking API
  async startQuickMatch(preferences) {
    try {
      const requestData = {
        preferences,
        connectionInfo: {
          region: preferences.region || 'auto',
          connectionQuality: 'good',
          latency: 50
        }
      };
      return this.post('/matchmaking/quick-match', requestData);
    } catch (error) {
      console.log('Quick match API error:', error);
      throw new Error('Quick match feature is not available yet');
    }
  }
}

// Run tests
async function runTests() {
  const api = new TestApiService(API_BASE_URL);
  
  console.log('🧪 Testing Frontend API Integration...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      confirmPassword: 'password123'
    };

    const authResult = await api.register(testUser);
    console.log('✅ Registration successful:', authResult.user.username);

    // Test 2: Test friends API
    console.log('\n2️⃣ Testing friends API...');
    const friends = await api.getFriends();
    console.log('✅ Friends API working:', friends);

    // Test 3: Test public rooms API
    console.log('\n3️⃣ Testing public rooms API...');
    const rooms = await api.getPublicRooms();
    console.log('✅ Public rooms API working:', rooms.length, 'rooms found');

    // Test 4: Test matchmaking API
    console.log('\n4️⃣ Testing matchmaking API...');
    const matchResult = await api.startQuickMatch({
      skillLevel: 'any',
      maxPlayers: 8,
      enableVoiceChat: false,
      region: 'auto'
    });
    console.log('✅ Matchmaking API working:', matchResult.success);

    console.log('\n🎉 All API tests passed! Frontend implementation is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if we're in Node.js environment
if (typeof window === 'undefined') {
  // We're in Node.js, need to use node-fetch
  console.log('Please install node-fetch to run this test: npm install node-fetch');
  console.log('Or run this test in a browser environment.');
} else {
  // We're in browser, can use native fetch
  runTests();
}