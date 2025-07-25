import {
  createSlice,
  PayloadAction,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import { apiService } from "../../services/api";
import {
  Room,
  PublicRoom,
  MatchmakingPreferences,
  QuickMatchResult,
} from "../../types/game";

interface RoomsState {
  publicRooms: PublicRoom[];
  matchmakingPreferences: MatchmakingPreferences;
  matchmakingResult: QuickMatchResult | null;
  isLoading: boolean;
  isMatchmaking: boolean;
  error: string | null;
  filters: {
    maxPlayers?: number;
    hasVoiceChat?: boolean;
    skillLevel?: string;
  };
}

const initialState: RoomsState = {
  publicRooms: [],
  matchmakingPreferences: {
    skillLevel: "any",
    maxPlayers: 8,
    enableVoiceChat: false,
    region: "auto",
  },
  matchmakingResult: null,
  isLoading: false,
  isMatchmaking: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchPublicRooms = createAsyncThunk(
  "rooms/fetchPublicRooms",
  async (filters?: any, { rejectWithValue }) => {
    try {
      const response = await apiService.getPublicRooms(filters);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch public rooms"
      );
    }
  }
);

export const startQuickMatch = createAsyncThunk(
  "rooms/startQuickMatch",
  async (preferences: MatchmakingPreferences, { rejectWithValue }) => {
    try {
      const response = await apiService.startQuickMatch(preferences);
      
      // Handle the API response structure properly
      if (response.success && response.data) {
        return response.data;
      }
      
      // If no proper data, return a default QuickMatchResult structure
      return {
        roomId: '',
        estimatedWaitTime: 0,
        playersFound: 0,
        playersNeeded: 0
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to start quick match"
      );
    }
  }
);

export const cancelQuickMatch = createAsyncThunk(
  "rooms/cancelQuickMatch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.cancelQuickMatch();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to cancel quick match"
      );
    }
  }
);

export const roomsSlice = createSlice({
  name: "rooms",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
    },
    updateMatchmakingPreferences: (
      state,
      action: PayloadAction<Partial<MatchmakingPreferences>>
    ) => {
      state.matchmakingPreferences = {
        ...state.matchmakingPreferences,
        ...action.payload,
      };
    },
    clearMatchmakingResult: (state) => {
      state.matchmakingResult = null;
      state.isMatchmaking = false;
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
      // Start quick match
      .addCase(startQuickMatch.pending, (state) => {
        state.isMatchmaking = true;
        state.error = null;
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
      });
  },
});

export const {
  clearError,
  setFilters,
  updateMatchmakingPreferences,
  clearMatchmakingResult,
} = roomsSlice.actions;

// Base selectors
export const selectRooms = (state: { rooms: RoomsState }) => state.rooms;
export const selectPublicRooms = (state: { rooms: RoomsState }) =>
  state.rooms.publicRooms;
export const selectMatchmakingPreferences = (state: { rooms: RoomsState }) =>
  state.rooms.matchmakingPreferences;
export const selectIsMatchmaking = (state: { rooms: RoomsState }) =>
  state.rooms.isMatchmaking;
export const selectMatchmakingResult = (state: { rooms: RoomsState }) =>
  state.rooms.matchmakingResult;
export const selectRoomsLoading = (state: { rooms: RoomsState }) =>
  state.rooms.isLoading;
export const selectRoomsError = (state: { rooms: RoomsState }) =>
  state.rooms.error;

// Memoized selectors
export const selectFilteredPublicRooms = createSelector(
  [selectPublicRooms, (state: { rooms: RoomsState }) => state.rooms.filters],
  (rooms, filters) => {
    if (!rooms || !Array.isArray(rooms)) {
      return [];
    }

    if (!filters || Object.keys(filters).length === 0) {
      return rooms;
    }

    return rooms.filter((room) => {
      if (filters.maxPlayers && room.currentPlayers > filters.maxPlayers) {
        return false;
      }
      if (
        filters.hasVoiceChat !== undefined &&
        room.hasVoiceChat !== filters.hasVoiceChat
      ) {
        return false;
      }
      if (
        filters.skillLevel &&
        filters.skillLevel !== "any" &&
        room.skillLevel !== filters.skillLevel
      ) {
        return false;
      }
      return true;
    });
  }
);
