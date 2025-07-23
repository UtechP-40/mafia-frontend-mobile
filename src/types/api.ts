export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export interface SocketEvent<T = any> {
  event: string;
  data: T;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  playerId: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  isModerated: boolean;
}

export type MessageType = 'player_chat' | 'system_message' | 'game_event' | 'ai_assistance';