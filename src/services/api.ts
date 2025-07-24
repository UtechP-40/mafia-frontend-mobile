import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'https://m6b83ch2-3000.inc1.devtunnels.ms/api' 
  : 'https://m6b83ch2-3000.inc1.devtunnels.ms/api';

// API Service class
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth specific methods
  async login(credentials: { username: string; password: string }) {
    // Detect if username is actually an email and send in correct field
    const isEmail = credentials.username.includes('@');
    const loginData = isEmail 
      ? { email: credentials.username, password: credentials.password }
      : { username: credentials.username, password: credentials.password };
    
    const response = await this.post('/auth/login', loginData);
    
    // Transform backend response to match frontend expectations
    if (response.success && response.data) {
      return {
        user: response.data.player,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    throw new Error(response.message || 'Login failed');
  }

  async register(userData: { username: string; email: string; password: string; confirmPassword?: string }) {
    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...backendData } = userData;
    const response = await this.post('/auth/register', backendData);
    
    // Transform backend response to match frontend expectations
    if (response.success && response.data) {
      return {
        user: response.data.player,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    throw new Error(response.message || 'Registration failed');
  }

  async refreshToken() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const response = await this.post('/auth/refresh', { refreshToken });
    
    // Transform backend response to match frontend expectations
    if (response.success && response.data) {
      return {
        user: response.data.player,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    throw new Error(response.message || 'Token refresh failed');
  }

  // Friends API
  async getFriends() {
    return this.get('/friends');
  }

  async searchUsers(query: string) {
    return this.get(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async sendFriendRequest(userId: string) {
    return this.post('/friends/request', { userId });
  }

  async respondToFriendRequest(requestId: string, accept: boolean) {
    return this.put(`/friends/request/${requestId}`, { accept });
  }

  async removeFriend(friendId: string) {
    return this.delete(`/friends/${friendId}`);
  }

  // Rooms API
  async getPublicRooms(filters?: any) {
    const queryParams = new URLSearchParams();
    if (filters?.maxPlayers) queryParams.append('maxPlayers', filters.maxPlayers.toString());
    if (filters?.hasVoiceChat !== null && filters?.hasVoiceChat !== undefined) {
      queryParams.append('hasVoiceChat', filters.hasVoiceChat.toString());
    }
    if (filters?.skillLevel) queryParams.append('skillLevel', filters.skillLevel);
    
    const query = queryParams.toString();
    return this.get(`/rooms/public${query ? `?${query}` : ''}`);
  }

  async createRoom(roomData: any) {
    return this.post('/rooms', roomData);
  }

  async joinRoom(roomId: string) {
    return this.post(`/rooms/${roomId}/join`);
  }

  // Matchmaking API
  async startQuickMatch(preferences: any) {
    return this.post('/matchmaking/quick', preferences);
  }

  async cancelQuickMatch() {
    return this.post('/matchmaking/cancel');
  }
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL);

// Export types for better TypeScript support
export type ApiResponse<T> = T;
export type ApiError = {
  message: string;
  code?: string;
  status?: number;
};