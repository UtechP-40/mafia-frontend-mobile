import { apiService } from './api';
import { storageService } from './storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class AuthService {
  async login(credentials: { username: string; password: string }) {
    try {
      const response: any = await apiService.login(credentials);
      
      if (response.token) {
        await storageService.setItem(TOKEN_KEY, response.token);
        await storageService.setObject(USER_KEY, response.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: { username: string; email: string; password: string }) {
    try {
      const response: any = await apiService.register(userData);
      
      if (response.token) {
        await storageService.setItem(TOKEN_KEY, response.token);
        await storageService.setObject(USER_KEY, response.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await storageService.removeItem(TOKEN_KEY);
      await storageService.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await storageService.getItem(TOKEN_KEY);
  }

  async getStoredUser(): Promise<any | null> {
    return await storageService.getObject(USER_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return token !== null;
  }
}

export const authService = new AuthService();