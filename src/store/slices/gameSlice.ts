import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Player {
  id: string;
  username: string;
  avatar: string;
  role?: string;
  isAlive: boolean;
  isHost: boolean;
}

interface GameState {
  roomId: string | null;
  players: Player[];
  currentPhase: 'lobby' | 'day' | 'night' | 'voting' | 'results';
  timeRemaining: number;
  isConnected: boolean;
  error: string | null;
}

const initialState: GameState = {
  roomId: null,
  players: [],
  currentPhase: 'lobby',
  timeRemaining: 0,
  isConnected: false,
  error: null,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    joinRoom: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    leaveRoom: (state) => {
      state.roomId = null;
      state.players = [];
      state.currentPhase = 'lobby';
    },
    updatePlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },
    updateGamePhase: (state, action: PayloadAction<'lobby' | 'day' | 'night' | 'voting' | 'results'>) => {
      state.currentPhase = action.payload;
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setGameError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearGameError: (state) => {
      state.error = null;
    },
  },
});