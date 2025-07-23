export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  statistics: UserStatistics;
  friends: string[];
  createdAt: Date;
  lastActive: Date;
}

export interface UserStatistics {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  favoriteRole: string;
  averageGameDuration: number;
  eloRating: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}