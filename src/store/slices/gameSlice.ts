import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { 
  Player, 
  GameState as GameStateType, 
  Room, 
  Vote, 
  GameEvent, 
  GamePhase, 
  GameSettings,
  RoomSettings 
} from '../../types/game';

interface GameSliceState {
  // Room state
  currentRoom: Room | null;
  roomCode: string | null;
  
  // Game state
  gameState: GameStateType | null;
  currentPhase: GamePhase;
  dayNumber: number;
  timeRemaining: number;
  
  // Players
  players: Player[];
  eliminatedPlayers: Player[];
  currentPlayer: Player | null;
  
  // Voting
  votes: Vote[];
  hasVoted: boolean;
  votingTarget: string | null;
  
  // Game events and history
  gameEvents: GameEvent[];
  chatMessages: any[];
  
  // Connection and status
  isConnected: boolean;
  isInGame: boolean;
  isHost: boolean;
  
  // Loading states
  isJoiningRoom: boolean;
  isCreatingRoom: boolean;
  isStartingGame: boolean;
  
  // Errors
  error: string | null;
  connectionError: string | null;
}

const initialState: GameSliceState = {
  currentRoom: null,
  roomCode: null,
  gameState: null,
  currentPhase: 'lobby',
  dayNumber: 0,
  timeRemaining: 0,
  players: [],
  eliminatedPlayers: [],
  currentPlayer: null,
  votes: [],
  hasVoted: false,
  votingTarget: null,
  gameEvents: [],
  chatMessages: [],
  isConnected: false,
  isInGame: false,
  isHost: false,
  isJoiningRoom: false,
  isCreatingRoom: false,
  isStartingGame: false,
  error: null,
  connectionError: null,
};

// Async thunks for game actions
export const createRoom = createAsyncThunk(
  'game/createRoom',
  async (settings: RoomSettings, { rejectWithValue }) => {
    try {
      const room: Room = await apiService.createRoom(settings);
      return room;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create room');
    }
  }
);

export const joinRoom = createAsyncThunk(
  'game/joinRoom',
  async (roomCode: string, { rejectWithValue }) => {
    try {
      const room: Room = await apiService.joinRoom(roomCode);
      return room;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to join room');
    }
  }
);

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Room management
    setCurrentRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload;
      state.roomCode = action.payload.code;
      state.players = action.payload.players;
      state.isHost = action.payload.hostId === state.currentPlayer?.id;
    },
    
    leaveRoom: (state) => {
      state.currentRoom = null;
      state.roomCode = null;
      state.gameState = null;
      state.players = [];
      state.eliminatedPlayers = [];
      state.currentPhase = 'lobby';
      state.dayNumber = 0;
      state.timeRemaining = 0;
      state.votes = [];
      state.hasVoted = false;
      state.votingTarget = null;
      state.gameEvents = [];
      state.chatMessages = [];
      state.isInGame = false;
      state.isHost = false;
      state.error = null;
    },
    
    updateRoomSettings: (state, action: PayloadAction<Partial<RoomSettings>>) => {
      if (state.currentRoom) {
        state.currentRoom.settings = { ...state.currentRoom.settings, ...action.payload };
      }
    },
    
    // Game state management
    setGameState: (state, action: PayloadAction<GameStateType>) => {
      state.gameState = action.payload;
      state.currentPhase = action.payload.phase;
      state.dayNumber = action.payload.dayNumber;
      state.timeRemaining = action.payload.timeRemaining;
      state.players = action.payload.players;
      state.eliminatedPlayers = action.payload.eliminatedPlayers;
      state.votes = action.payload.votes;
      state.gameEvents = action.payload.history;
      state.isInGame = true;
    },
    
    updateGamePhase: (state, action: PayloadAction<GamePhase>) => {
      state.currentPhase = action.payload;
      state.hasVoted = false;
      state.votingTarget = null;
    },
    
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    
    incrementDay: (state) => {
      state.dayNumber += 1;
    },
    
    // Player management
    updatePlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },
    
    addPlayer: (state, action: PayloadAction<Player>) => {
      const existingIndex = state.players.findIndex(p => p.id === action.payload.id);
      if (existingIndex >= 0) {
        state.players[existingIndex] = action.payload;
      } else {
        state.players.push(action.payload);
      }
    },
    
    removePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter(p => p.id !== action.payload);
    },
    
    eliminatePlayer: (state, action: PayloadAction<string>) => {
      const playerIndex = state.players.findIndex(p => p.id === action.payload);
      if (playerIndex >= 0) {
        const player = state.players[playerIndex];
        player.isAlive = false;
        state.eliminatedPlayers.push(player);
      }
    },
    
    setCurrentPlayer: (state, action: PayloadAction<Player>) => {
      state.currentPlayer = action.payload;
    },
    
    updatePlayerRole: (state, action: PayloadAction<{ playerId: string; role: string }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      if (player) {
        player.role = action.payload.role as any;
      }
    },
    
    // Voting system
    castVote: (state, action: PayloadAction<{ targetId: string }>) => {
      if (state.currentPlayer && !state.hasVoted) {
        const vote: Vote = {
          playerId: state.currentPlayer.id,
          targetId: action.payload.targetId,
          timestamp: new Date(),
        };
        
        // Remove any existing vote from this player
        state.votes = state.votes.filter(v => v.playerId !== state.currentPlayer!.id);
        state.votes.push(vote);
        state.hasVoted = true;
        state.votingTarget = action.payload.targetId;
      }
    },
    
    updateVotes: (state, action: PayloadAction<Vote[]>) => {
      state.votes = action.payload;
      
      // Check if current player has voted
      if (state.currentPlayer) {
        const playerVote = action.payload.find(v => v.playerId === state.currentPlayer!.id);
        state.hasVoted = !!playerVote;
        state.votingTarget = playerVote?.targetId || null;
      }
    },
    
    clearVotes: (state) => {
      state.votes = [];
      state.hasVoted = false;
      state.votingTarget = null;
    },
    
    // Events and chat
    addGameEvent: (state, action: PayloadAction<GameEvent>) => {
      state.gameEvents.push(action.payload);
    },
    
    addChatMessage: (state, action: PayloadAction<any>) => {
      state.chatMessages.push(action.payload);
    },
    
    clearChatMessages: (state) => {
      state.chatMessages = [];
    },
    
    // Connection management
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.connectionError = null;
      }
    },
    
    setConnectionError: (state, action: PayloadAction<string>) => {
      state.connectionError = action.payload;
      state.isConnected = false;
    },
    
    // Error handling
    setGameError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    
    clearGameError: (state) => {
      state.error = null;
    },
    
    clearConnectionError: (state) => {
      state.connectionError = null;
    },
    
    // Game flow
    startGame: (state) => {
      state.isInGame = true;
      state.currentPhase = 'day';
      state.dayNumber = 1;
    },
    
    endGame: (state) => {
      state.isInGame = false;
      state.currentPhase = 'results';
    },
    
    resetGame: (state) => {
      state.gameState = null;
      state.currentPhase = 'lobby';
      state.dayNumber = 0;
      state.timeRemaining = 0;
      state.eliminatedPlayers = [];
      state.votes = [];
      state.hasVoted = false;
      state.votingTarget = null;
      state.gameEvents = [];
      state.chatMessages = [];
      state.isInGame = false;
      
      // Reset player states but keep them in room
      state.players = state.players.map(player => ({
        ...player,
        role: undefined,
        isAlive: true,
      }));
    },
  },
  extraReducers: (builder) => {
    builder
      // Create room
      .addCase(createRoom.pending, (state) => {
        state.isCreatingRoom = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.isCreatingRoom = false;
        state.currentRoom = action.payload;
        state.roomCode = action.payload.code;
        state.players = action.payload.players;
        state.isHost = true;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.isCreatingRoom = false;
        state.error = action.payload as string;
      })
      // Join room
      .addCase(joinRoom.pending, (state) => {
        state.isJoiningRoom = true;
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.isJoiningRoom = false;
        state.currentRoom = action.payload;
        state.roomCode = action.payload.code;
        state.players = action.payload.players;
        state.isHost = false;
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.isJoiningRoom = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentRoom,
  leaveRoom,
  updateRoomSettings,
  setGameState,
  updateGamePhase,
  updateTimeRemaining,
  incrementDay,
  updatePlayers,
  addPlayer,
  removePlayer,
  eliminatePlayer,
  setCurrentPlayer,
  updatePlayerRole,
  castVote,
  updateVotes,
  clearVotes,
  addGameEvent,
  addChatMessage,
  clearChatMessages,
  setConnectionStatus,
  setConnectionError,
  setGameError,
  clearGameError,
  clearConnectionError,
  startGame,
  endGame,
  resetGame,
} = gameSlice.actions;

// Selectors
export const selectGame = (state: { game: GameSliceState }) => state.game;
export const selectCurrentRoom = (state: { game: GameSliceState }) => state.game.currentRoom;
export const selectGameState = (state: { game: GameSliceState }) => state.game.gameState;
export const selectPlayers = (state: { game: GameSliceState }) => state.game.players;
export const selectCurrentPlayer = (state: { game: GameSliceState }) => state.game.currentPlayer;
export const selectCurrentPhase = (state: { game: GameSliceState }) => state.game.currentPhase;
export const selectTimeRemaining = (state: { game: GameSliceState }) => state.game.timeRemaining;
export const selectIsConnected = (state: { game: GameSliceState }) => state.game.isConnected;
export const selectIsInGame = (state: { game: GameSliceState }) => state.game.isInGame;
export const selectIsHost = (state: { game: GameSliceState }) => state.game.isHost;
export const selectVotes = (state: { game: GameSliceState }) => state.game.votes;
export const selectHasVoted = (state: { game: GameSliceState }) => state.game.hasVoted;
export const selectGameError = (state: { game: GameSliceState }) => state.game.error;
export const selectConnectionError = (state: { game: GameSliceState }) => state.game.connectionError;