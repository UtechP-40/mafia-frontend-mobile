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
  maxPlayers: number;
  status: RoomStatus;
  settings: RoomSettings;
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