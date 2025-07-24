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

export interface Friend {
  id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: Date;
  status: 'online' | 'in-game' | 'away' | 'offline';
  currentActivity?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: Pick<User, 'id' | 'username' | 'avatar'>;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface UserSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  animationsEnabled: boolean;
  pushNotifications: boolean;
  friendRequestNotifications: boolean;
  gameInviteNotifications: boolean;
  theme: 'light' | 'dark';
  language: string;
}