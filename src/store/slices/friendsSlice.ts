import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game' | 'away';
  lastSeen?: Date;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface FriendsState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  searchResults: Friend[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
}

const initialState: FriendsState = {
  friends: [],
  friendRequests: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,
};

// Async thunks
export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getFriends();
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch friends');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'friends/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await apiService.searchUsers(query);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search users');
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'friends/sendFriendRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.sendFriendRequest(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send friend request');
    }
  }
);

export const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    updateFriendStatus: (state, action: PayloadAction<{ friendId: string; status: Friend['status'] }>) => {
      const friend = state.friends.find(f => f.id === action.payload.friendId);
      if (friend) {
        friend.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch friends
      .addCase(fetchFriends.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.friends = action.payload.friends || [];
        state.friendRequests = action.payload.friendRequests || [];
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSearchResults, updateFriendStatus } = friendsSlice.actions;

// Selectors
export const selectFriends = (state: { friends: FriendsState }) => state.friends;
export const selectFriendsList = (state: { friends: FriendsState }) => state.friends.friends;
export const selectOnlineFriends = (state: { friends: FriendsState }) => 
  state.friends.friends.filter(friend => friend.status === 'online' || friend.status === 'in-game');
export const selectFriendRequests = (state: { friends: FriendsState }) => state.friends.friendRequests;
export const selectSearchResults = (state: { friends: FriendsState }) => state.friends.searchResults;
export const selectFriendsLoading = (state: { friends: FriendsState }) => state.friends.isLoading;
export const selectFriendsError = (state: { friends: FriendsState }) => state.friends.error;