import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { PublicRoom, MatchmakingPreferences, QuickMatchResult } from '../../types/game';

interface RoomsState {
  publicRooms: PublicRoom[];
  isLoading: boolean;
  error: string | null;
  matchmakingPreferences: MatchmakingPreferences;
  isMatchmaking: boolean;
  matchmakingResult: QuickMatchResult | null;
  filters: {
    maxPlayers: number | null;
    hasVoiceChat: boolean | null;
    skillLevel: string | null;
  };
}

const initialState: RoomsState = {
  publicRooms: [],
  isLoading: false,
  error: null,
  matchmakingPreferences: {
    skillLevel: 'any',
    maxPlayers: 8,
    enableVoiceChat: true,
    region: 'auto',
  },
  isMatchmaking: false,
  matchmakingResult: null,
  filters: {
    maxPlayers: null,
    hasVoiceChat: null,
    skillLevel: null,
  },
};

// Async thunks for room actions
export const fetchPublicRooms = createAsyncThunk(
  'rooms/fetchPublicRooms',
  async (filters: Partial<RoomsState['filters']> | undefined, { rejectWithValue }) => {
    try {
      const data = await apiService.getPublicRooms(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch public rooms');
    }
  }
);

export const startQuickMatch = createAsyncThunk(
  'rooms/startQuickMatch',
  async (preferences: MatchmakingPreferences, { rejectWithValue }) => {
    try {
      const data = await apiService.startQuickMatch(preferences);
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start quick match');
    }
  }
);

export const cancelQuickMatch = createAsyncThunk(
  'rooms/cancelQuickMatch',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.cancelQuickMatch();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to cancel quick match');
    }
  }
);

export const createPublicRoom = createAsyncThunk(
  'rooms/createPublicRoom',
  async (roomData: { name: string; maxPlayers: number; enableVoiceChat: boolean }, { rejectWithValue }) => {
    try {
      const data = await apiService.createRoom({
        ...roomData,
        isPublic: true,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create room');
    }
  }
);

export const joinPublicRoom = createAsyncThunk(
  'rooms/joinPublicRoom',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const data = await apiService.joinRoom(roomId);
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to join room');
    }
  }
);

export const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<RoomsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        maxPlayers: null,
        hasVoiceChat: null,
        skillLevel: null,
      };
    },
    updateMatchmakingPreferences: (state, action: PayloadAction<Partial<MatchmakingPreferences>>) => {
      state.matchmakingPreferences = { ...state.matchmakingPreferences, ...action.payload };
    },
    updateRoomInList: (state, action: PayloadAction<PublicRoom>) => {
      const index = state.publicRooms.findIndex(room => room.id === action.payload.id);
      if (index !== -1) {
        state.publicRooms[index] = action.payload;
      }
    },
    removeRoomFromList: (state, action: PayloadAction<string>) => {
      state.publicRooms = state.publicRooms.filter(room => room.id !== action.payload);
    },
    addRoomToList: (state, action: PayloadAction<PublicRoom>) => {
      state.publicRooms.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch public rooms
      .addCase(fetchPublicRooms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicRooms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicRooms = action.payload;
      })
      .addCase(fetchPublicRooms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Quick match
      .addCase(startQuickMatch.pending, (state) => {
        state.isMatchmaking = true;
        state.error = null;
        state.matchmakingResult = null;
      })
      .addCase(startQuickMatch.fulfilled, (state, action) => {
        state.isMatchmaking = false;
        state.matchmakingResult = action.payload;
      })
      .addCase(startQuickMatch.rejected, (state, action) => {
        state.isMatchmaking = false;
        state.error = action.payload as string;
      })
      // Cancel quick match
      .addCase(cancelQuickMatch.fulfilled, (state) => {
        state.isMatchmaking = false;
        state.matchmakingResult = null;
      })
      .addCase(cancelQuickMatch.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Create room
      .addCase(createPublicRoom.fulfilled, (state, action) => {
        state.publicRooms.unshift(action.payload);
      })
      .addCase(createPublicRoom.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Join room
      .addCase(joinPublicRoom.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearFilters, 
  updateMatchmakingPreferences,
  updateRoomInList,
  removeRoomFromList,
  addRoomToList,
} = roomsSlice.actions;

// Selectors
export const selectRooms = (state: { rooms: RoomsState }) => state.rooms;
export const selectPublicRooms = (state: { rooms: RoomsState }) => state.rooms.publicRooms;
export const selectRoomsLoading = (state: { rooms: RoomsState }) => state.rooms.isLoading;
export const selectRoomsError = (state: { rooms: RoomsState }) => state.rooms.error;
export const selectMatchmakingPreferences = (state: { rooms: RoomsState }) => state.rooms.matchmakingPreferences;
export const selectIsMatchmaking = (state: { rooms: RoomsState }) => state.rooms.isMatchmaking;
export const selectMatchmakingResult = (state: { rooms: RoomsState }) => state.rooms.matchmakingResult;
export const selectRoomFilters = (state: { rooms: RoomsState }) => state.rooms.filters;