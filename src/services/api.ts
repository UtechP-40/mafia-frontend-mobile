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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { username: string; email: string; password: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(token: string) {
    return this.request('/players/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

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
}

export const apiService = new ApiService();