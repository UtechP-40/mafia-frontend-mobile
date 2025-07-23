export const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  background: '#1a1a1a',
  surface: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#cccccc',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const GAME_PHASES = {
  LOBBY: 'lobby',
  DAY: 'day',
  NIGHT: 'night',
  VOTING: 'voting',
  RESULTS: 'results',
} as const;

export const ROLES = {
  MAFIA: 'mafia',
  VILLAGER: 'villager',
  DETECTIVE: 'detective',
  DOCTOR: 'doctor',
  MAYOR: 'mayor',
} as const;

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  PLAYER_ACTION: 'player-action',
  GAME_STATE_UPDATE: 'game-state-update',
  CHAT_MESSAGE: 'chat-message',
  PHASE_CHANGE: 'phase-change',
} as const;