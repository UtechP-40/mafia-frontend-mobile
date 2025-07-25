import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Use localhost for development
  : 'http://localhost:3000/api';

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
      // Store tokens in AsyncStorage
      await AsyncStorage.setItem('token', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      
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
      // Store tokens in AsyncStorage
      await AsyncStorage.setItem('token', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      
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
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.post('/auth/refresh', { refreshToken });
    
    // Transform backend response to match frontend expectations
    if (response.success && response.data) {
      // Update tokens in AsyncStorage
      await AsyncStorage.setItem('token', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      
      return {
        user: response.data.player,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    throw new Error(response.message || 'Token refresh failed');
  }

  async logout() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await this.delete('/auth/logout');
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    
    // Clear tokens from AsyncStorage
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
  }

  async validateToken(token: string) {
    try {
      const response = await this.post('/auth/verify-token', {});
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async socialLogin(socialData: { provider: string; token: string; userInfo?: any }) {
    // TODO: Implement social login when backend supports it
    throw new Error('Social login not implemented yet');
  }

  async requestPasswordReset(email: string) {
    // TODO: Implement password reset when backend supports it
    throw new Error('Password reset not implemented yet');
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: Implement password reset when backend supports it
    throw new Error('Password reset not implemented yet');
  }

  // Friends API
  async getFriends() {
    try {
      return this.get('/friends');
    } catch (error) {
      // Return empty data if friends API is not implemented yet
      console.log('Friends API not implemented yet');
      return { friends: [], friendRequests: [] };
    }
  }

  async searchUsers(query: string) {
    try {
      return this.get(`/users/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.log('User search API not implemented yet');
      return [];
    }
  }

  async sendFriendRequest(userId: string) {
    try {
      return this.post('/friends/request', { userId });
    } catch (error) {
      console.log('Send friend request API not implemented yet');
      throw error;
    }
  }

  async respondToFriendRequest(requestId: string, accept: boolean) {
    try {
      return this.put(`/friends/request/${requestId}`, { accept });
    } catch (error) {
      console.log('Respond to friend request API not implemented yet');
      throw error;
    }
  }

  async removeFriend(friendId: string) {
    try {
      return this.delete(`/friends/${friendId}`);
    } catch (error) {
      console.log('Remove friend API not implemented yet');
      throw error;
    }
  }

  // Rooms API
  async getPublicRooms(filters?: any) {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.maxPlayers) queryParams.append('maxPlayers', filters.maxPlayers.toString());
      if (filters?.hasVoiceChat !== null && filters?.hasVoiceChat !== undefined) {
        queryParams.append('hasVoiceChat', filters.hasVoiceChat.toString());
      }
      if (filters?.skillLevel) queryParams.append('skillLevel', filters.skillLevel);
      
      const query = queryParams.toString();
      return this.get(`/rooms/public${query ? `?${query}` : ''}`);
    } catch (error) {
      console.log('Public rooms API not fully implemented yet');
      return [];
    }
  }

  async createRoom(roomData: any) {
    return this.post('/rooms', roomData);
  }

  async joinRoom(roomId: string) {
    return this.post(`/rooms/${roomId}/join`);
  }

  // Matchmaking API
  async startQuickMatch(preferences: any) {
    try {
      return this.post('/matchmaking/quick', preferences);
    } catch (error) {
      console.log('Quick match API not implemented yet');
      throw new Error('Quick match feature is not available yet');
    }
  }

  async cancelQuickMatch() {
    try {
      return this.post('/matchmaking/cancel');
    } catch (error) {
      console.log('Cancel quick match API not implemented yet');
      throw error;
    }
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