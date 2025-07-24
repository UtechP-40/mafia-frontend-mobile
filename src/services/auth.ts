import { apiService } from './api';
import { storageService } from './storage';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/user';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AuthResponse = await apiService.login(credentials);
      
      if (response.token) {
        await storageService.setItem(TOKEN_KEY, response.token);
        await storageService.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        await storageService.setObject(USER_KEY, response.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response: AuthResponse = await apiService.register(userData);
      
      if (response.token) {
        await storageService.setItem(TOKEN_KEY, response.token);
        await storageService.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        await storageService.setObject(USER_KEY, response.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async socialLogin(socialData: {
    provider: 'google' | 'apple';
    token: string;
    userInfo?: any;
  }): Promise<AuthResponse> {
    try {
      const response: AuthResponse = await apiService.socialLogin(socialData);
      
      if (response.token) {
        await storageService.setItem(TOKEN_KEY, response.token);
        await storageService.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        await storageService.setObject(USER_KEY, response.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiService.requestPasswordReset(email);
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiService.resetPassword(token, newPassword);
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: AuthResponse = await apiService.refreshToken(refreshToken);
      
      if (response.token) {
        await storageService.setItem(TOKEN_KEY, response.token);
        await storageService.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        await storageService.setObject(USER_KEY, response.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      const token = await this.getStoredToken();
      if (token) {
        // Notify server about logout
        await apiService.logout();
      }
    } catch (error) {
      console.error('Error during server logout:', error);
    } finally {
      // Always clear local storage
      await storageService.removeItem(TOKEN_KEY);
      await storageService.removeItem(REFRESH_TOKEN_KEY);
      await storageService.removeItem(USER_KEY);
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await storageService.getItem(TOKEN_KEY);
  }

  async getStoredRefreshToken(): Promise<string | null> {
    return await storageService.getItem(REFRESH_TOKEN_KEY);
  }

  async getStoredUser(): Promise<any | null> {
    return await storageService.getObject(USER_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return token !== null;
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;

      // TODO: Implement token validation with backend
      return await apiService.validateToken(token);
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();