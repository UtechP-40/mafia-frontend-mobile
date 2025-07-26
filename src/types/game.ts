export interface Player {
  id: string;
  username: string;
  avatar: string;
  role?: GameRole;
  isAlive: boolean;
  isHost: boolean;
  statistics?: PlayerStats;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  favoriteRole: GameRole;
  averageGameDuration: number;
  eloRating: number;
}

export interface GameState {
  id: string;
  roomId: string;
  phase: GamePhase;
  dayNumber: number;
  players: Player[];
  eliminatedPlayers: Player[];
  votes: Vote[];
  timeRemaining: number;
  settings: GameSettings;
  history: GameEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSettings {
  maxPlayers: number;
  enableVoiceChat: boolean;
  dayPhaseDuration: number;
  nightPhaseDuration: number;
  votingDuration: number;
  roles: RoleConfiguration[];
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  status: RoomStatus;
  gameState?: GameState;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomSettings {
  isPublic: boolean;
  maxPlayers: number;
  gameSettings: GameSettings;
  allowSpectators: boolean;
  requireInvite: boolean;
}

export interface Vote {
  playerId: string;
  targetId: string;
  timestamp: Date;
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  playerId?: string;
  targetId?: string;
  data?: any;
  timestamp: Date;
}

export type GameRole = 'mafia' | 'villager' | 'detective' | 'doctor' | 'mayor';
export type GamePhase = 'lobby' | 'day' | 'night' | 'voting' | 'results';
export type RoomStatus = 'waiting' | 'starting' | 'in_progress' | 'finished';
export type GameEventType = 'player_join' | 'player_leave' | 'vote_cast' | 'elimination' | 'role_action';

export interface RoleConfiguration {
  role: GameRole;
  count: number;
  description: string;
}

export interface PublicRoom {
  id: string;
  name: string;
  hostUsername: string;
  playerCount: number;
  currentPlayers: number;
  maxPlayers: number;
  status: RoomStatus;
  settings: RoomSettings;
  hasVoiceChat: boolean;
  skillLevel: string;
  createdAt: Date;
}

export interface MatchmakingPreferences {
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'any';
  maxPlayers: number;
  enableVoiceChat: boolean;
  region: string;
}

export interface QuickMatchResult {
  roomId: string;
  estimatedWaitTime: number;
  playersFound: number;
  playersNeeded: number;
}

// Game Results and Statistics Types
export interface GameResult {
  game: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    settings: GameSettings;
  };
  matchStats: MatchStatistics;
  playerPerformance: PlayerPerformance[];
  gameEvents: GameEvent[];
}

export interface MatchStatistics {
  duration: number;
  totalPlayers: number;
  eliminatedCount: number;
  survivorCount: number;
  totalVotes: number;
  daysCycled: number;
  winResult?: WinResult;
}

export interface PlayerPerformance {
  player: {
    id: string;
    username: string;
    avatar: string;
    role?: GameRole;
  };
  wasEliminated: boolean;
  eliminationDay?: number;
  votesCast: number;
  votesReceived: number;
  survived: boolean;
}

export interface WinResult {
  condition: 'mafia_win' | 'villager_win' | 'draw';
  winningTeam: 'mafia' | 'villagers';
  winningPlayers: string[];
  reason: string;
}

export interface PlayerStatistics {
  player: {
    id: string;
    username: string;
    avatar: string;
    statistics: PlayerStats;
  };
  roleStats: Record<string, number>;
  streaks: {
    current: number;
    longest: number;
  };
  recentPerformance: RecentGamePerformance[];
}

export interface RecentGamePerformance {
  gameId: string;
  date: Date;
  won: boolean;
  role: GameRole;
  duration: number;
}

// Achievement Types
export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  type: AchievementType;
  rarity: AchievementRarity;
  icon: string;
  requirement: {
    type: string;
    value: number;
    conditions?: any;
  };
  reward: {
    experience: number;
    title?: string;
  };
  isActive: boolean;
}

export interface PlayerAchievement {
  id: string;
  playerId: string;
  achievementId: Achievement;
  unlockedAt?: Date;
  progress: number;
  isCompleted: boolean;
  notificationSent: boolean;
  completionPercentage: number;
}

export interface PlayerAchievements {
  unlocked: PlayerAchievement[];
  inProgress: PlayerAchievement[];
  available: Achievement[];
  totalUnlocked: number;
  totalAvailable: number;
}

export type AchievementType = 
  | 'games_played' 
  | 'games_won' 
  | 'win_streak' 
  | 'role_mastery' 
  | 'survival' 
  | 'voting' 
  | 'social' 
  | 'special';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Game History Types
export interface GameHistory {
  games: GameHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GameHistoryItem {
  id: string;
  players: Player[];
  eliminatedPlayers: Player[];
  winResult?: WinResult;
  createdAt: Date;
  updatedAt: Date;
  settings: GameSettings;
}