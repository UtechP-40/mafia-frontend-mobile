import { LoginCredentials, RegisterData, AuthResponse } from '../types/user';

const API_BASE_URL = 'http://localhost:3000/api'; // Will be configured later

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async socialLogin(socialData: {
    provider: 'google' | 'apple';
    token: string;
    userInfo?: any;
  }): Promise<AuthResponse> {
    return this.request('/auth/social', {
      method: 'POST',
      body: JSON.stringify(socialData),
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await this.request('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Player endpoints
  async getProfile(token: string) {
    return this.request('/players/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateProfile(token: string, updates: any) {
    return this.request('/players/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
  }

  // Room endpoints
  async createRoom(token: string, settings: any) {
    return this.request('/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
  }

  async getPublicRooms() {
    return this.request('/rooms/public');
  }

  async joinRoom(token: string, roomId: string) {
    return this.request(`/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const apiService = new ApiService();