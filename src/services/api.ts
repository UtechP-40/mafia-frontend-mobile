import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'https://m6b83ch2-3000.inc1.devtunnels.ms/api'  // Use localhost for development
  : 'https://m6b83ch2-3000.inc1.devtunnels.ms/api';

// Define API response types
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AuthResponse {
  player: any;
  accessToken: string;
  refreshToken: string;
}

interface PaginatedResponse<T> {
  rooms?: T[];
  data?: T[];
  total: number;
  page: number;
  totalPages: number;
}

interface User {
  id: string;
  username: string;
  email?: string;
  avatar: string;
  statistics?: {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    favoriteRole: string;
    averageGameDuration: number;
    eloRating: number;
  };
}

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
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data as ApiResponse<T>;
    } catch (error) {
      console.table(error)
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
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
        // Backend expects DELETE request with refreshToken in body
        await this.request('/auth/logout', {
          method: 'DELETE',
          body: JSON.stringify({ refreshToken })
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    
    // Clear tokens from AsyncStorage
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
  }

  async validateToken(_token: string) {
    try {
      const response = await this.post('/auth/verify-token', {});
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async socialLogin(_socialData: { provider: string; token: string; userInfo?: any }) {
    // TODO: Implement social login when backend supports it
    throw new Error('Social login not implemented yet');
  }

  async requestPasswordReset(_email: string) {
    // TODO: Implement password reset when backend supports it
    throw new Error('Password reset not implemented yet');
  }

  async resetPassword(_token: string, _newPassword: string) {
    // TODO: Implement password reset when backend supports it
    throw new Error('Password reset not implemented yet');
  }

  // Friends API
  async getFriends() {
    try {
      const response = await this.get('/players/friends');
      return { friends: response.data || [], friendRequests: [] };
    } catch (error) {
      // Return empty data if friends API is not implemented yet
      console.log('Friends API error:', error);
      return { friends: [], friendRequests: [] };
    }
  }

  async searchUsers(query: string) {
    try {
      const response = await this.get(`/players/search?q=${encodeURIComponent(query)}`);
      return response.data || [];
    } catch (error) {
      console.log('User search API error:', error);
      return [];
    }
  }

  async sendFriendRequest(userId: string) {
    try {
      return this.post('/players/friends', { friendId: userId });
    } catch (error) {
      console.log('Send friend request API error:', error);
      throw error;
    }
  }

  async respondToFriendRequest(requestId: string, accept: boolean) {
    try {
      // TODO: Implement when backend supports friend requests
      return this.put(`/players/friends/request/${requestId}`, { accept });
    } catch (error) {
      console.log('Respond to friend request API not implemented yet');
      throw error;
    }
  }

  async removeFriend(friendId: string) {
    try {
      return this.delete(`/players/friends/${friendId}`);
    } catch (error) {
      console.log('Remove friend API error:', error);
      throw error;
    }
  }

  async getFriendActivities() {
    try {
      const response = await this.get('/players/friends/activities');
      return response.data || [];
    } catch (error) {
      console.log('Friend activities API error:', error);
      return [];
    }
  }

  async getFriendsLeaderboard() {
    try {
      const response = await this.get('/players/friends/leaderboard');
      return response.data || [];
    } catch (error) {
      console.log('Friends leaderboard API error:', error);
      return [];
    }
  }

  async inviteFriendToGame(friendId: string, roomId: string) {
    try {
      return this.post('/players/friends/invite', { friendId, roomId });
    } catch (error) {
      console.log('Invite friend to game API error:', error);
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
      const response = await this.get<PaginatedResponse<any>>(`/rooms/public${query ? `?${query}` : ''}`);
      
      // Handle paginated response format
      if (response.success && response.data) {
        return response.data.rooms || response.data.data || [];
      }
      return [];
    } catch (error) {
      console.log('Public rooms API error:', error);
      return [];
    }
  }

  async createRoom(roomData: any) {
    const response = await this.post('/rooms', { settings: roomData });
    return response.data;
  }

  async joinRoom(roomId: string) {
    const response = await this.post('/rooms/join', { roomIdentifier: roomId });
    return response.data;
  }

  // Matchmaking API
  async startQuickMatch(preferences: any) {
    try {
      // The backend expects connectionInfo, so we'll provide default values
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

  async cancelQuickMatch() {
    try {
      return this.post('/matchmaking/leave');
    } catch (error) {
      console.log('Cancel quick match API error:', error);
      throw error;
    }
  }

  // Game Results and Statistics API
  async getGameHistory(page = 1, limit = 10) {
    try {
      const response = await this.get(`/games/history?page=${page}&limit=${limit}`);
      return response.data || { games: [], pagination: { page, limit, total: 0, pages: 0 } };
    } catch (error) {
      console.log('Game history API error:', error);
      return { games: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
  }

  async getGameResults(gameId: string) {
    try {
      const response = await this.get(`/games/${gameId}/results`);
      return response.data;
    } catch (error) {
      console.log('Game results API error:', error);
      throw error;
    }
  }

  async getPlayerStatistics(playerId?: string) {
    try {
      const endpoint = playerId ? `/games/stats/${playerId}` : '/games/stats';
      const response = await this.get(endpoint);
      return response.data;
    } catch (error) {
      console.log('Player statistics API error:', error);
      throw error;
    }
  }

  // Achievements API
  async getPlayerAchievements(playerId?: string) {
    try {
      const endpoint = playerId ? `/games/achievements/${playerId}` : '/games/achievements';
      const response = await this.get(endpoint);
      return response.data || { unlocked: [], inProgress: [], available: [], totalUnlocked: 0, totalAvailable: 0 };
    } catch (error) {
      console.log('Player achievements API error:', error);
      return { unlocked: [], inProgress: [], available: [], totalUnlocked: 0, totalAvailable: 0 };
    }
  }

  async getRecentAchievements(playerId?: string) {
    try {
      const endpoint = playerId ? `/games/achievements/recent/${playerId}` : '/games/achievements/recent';
      const response = await this.get(endpoint);
      return response.data?.recentUnlocks || [];
    } catch (error) {
      console.log('Recent achievements API error:', error);
      return [];
    }
  }

  async markAchievementsAsRead(achievementIds: string[]) {
    try {
      return this.post('/games/achievements/mark-read', { achievementIds });
    } catch (error) {
      console.log('Mark achievements as read API error:', error);
      throw error;
    }
  }

  // Social Sharing API (placeholder for future implementation)
  async shareGameResult(gameId: string, platform: 'twitter' | 'facebook' | 'instagram') {
    try {
      return this.post('/games/share', { gameId, platform });
    } catch (error) {
      console.log('Share game result API error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL);

// Export types for better TypeScript support
export type { ApiResponse };
export type ApiError = {
  message: string;
  code?: string;
  status?: number;
};