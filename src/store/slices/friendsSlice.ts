import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game' | 'away';
  lastSeen?: Date;
  currentActivity?: string;
  statistics?: {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    eloRating: number;
    favoriteRole: string;
  };
  recentGames?: GameResult[];
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    id: string;
    username: string;
    avatar: string;
  };
  toUser?: {
    id: string;
    username: string;
    avatar: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface GameResult {
  id: string;
  gameMode: string;
  result: 'win' | 'loss';
  role: string;
  duration: number;
  playedAt: Date;
  players: string[];
}

interface FriendActivity {
  id: string;
  friendId: string;
  friendUsername: string;
  type: 'game_completed' | 'achievement_unlocked' | 'status_change';
  data: any;
  timestamp: Date;
}

interface FriendsState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  searchResults: Friend[];
  friendActivities: FriendActivity[];
  leaderboard: Friend[];
  isLoading: boolean;
  isSearching: boolean;
  isLoadingActivities: boolean;
  isLoadingLeaderboard: boolean;
  error: string | null;
}

const initialState: FriendsState = {
  friends: [],
  friendRequests: [],
  searchResults: [],
  friendActivities: [],
  leaderboard: [],
  isLoading: false,
  isSearching: false,
  isLoadingActivities: false,
  isLoadingLeaderboard: false,
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

export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptFriendRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.respondToFriendRequest(requestId, true);
      return { requestId, response };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to accept friend request');
    }
  }
);

export const declineFriendRequest = createAsyncThunk(
  'friends/declineFriendRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.respondToFriendRequest(requestId, false);
      return { requestId, response };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to decline friend request');
    }
  }
);

export const removeFriend = createAsyncThunk(
  'friends/removeFriend',
  async (friendId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.removeFriend(friendId);
      return { friendId, response };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove friend');
    }
  }
);

export const fetchFriendActivities = createAsyncThunk(
  'friends/fetchFriendActivities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getFriendActivities();
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch friend activities');
    }
  }
);

export const fetchFriendsLeaderboard = createAsyncThunk(
  'friends/fetchFriendsLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getFriendsLeaderboard();
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch friends leaderboard');
    }
  }
);

export const inviteFriendToGame = createAsyncThunk(
  'friends/inviteFriendToGame',
  async ({ friendId, roomId }: { friendId: string; roomId: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.inviteFriendToGame(friendId, roomId);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to invite friend to game');
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
      })
      // Send friend request
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Accept friend request
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const requestId = action.payload.requestId;
        state.friendRequests = state.friendRequests.filter(req => req.id !== requestId);
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Decline friend request
      .addCase(declineFriendRequest.fulfilled, (state, action) => {
        const requestId = action.payload.requestId;
        state.friendRequests = state.friendRequests.filter(req => req.id !== requestId);
      })
      .addCase(declineFriendRequest.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Remove friend
      .addCase(removeFriend.fulfilled, (state, action) => {
        const friendId = action.payload.friendId;
        state.friends = state.friends.filter(friend => friend.id !== friendId);
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch friend activities
      .addCase(fetchFriendActivities.pending, (state) => {
        state.isLoadingActivities = true;
        state.error = null;
      })
      .addCase(fetchFriendActivities.fulfilled, (state, action) => {
        state.isLoadingActivities = false;
        state.friendActivities = action.payload;
      })
      .addCase(fetchFriendActivities.rejected, (state, action) => {
        state.isLoadingActivities = false;
        state.error = action.payload as string;
      })
      // Fetch friends leaderboard
      .addCase(fetchFriendsLeaderboard.pending, (state) => {
        state.isLoadingLeaderboard = true;
        state.error = null;
      })
      .addCase(fetchFriendsLeaderboard.fulfilled, (state, action) => {
        state.isLoadingLeaderboard = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchFriendsLeaderboard.rejected, (state, action) => {
        state.isLoadingLeaderboard = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSearchResults, updateFriendStatus } = friendsSlice.actions;

// Base selectors
export const selectFriends = (state: { friends: FriendsState }) => state.friends;
export const selectFriendsList = (state: { friends: FriendsState }) => state.friends.friends;
export const selectFriendRequests = (state: { friends: FriendsState }) => state.friends.friendRequests;
export const selectSearchResults = (state: { friends: FriendsState }) => state.friends.searchResults;
export const selectFriendActivities = (state: { friends: FriendsState }) => state.friends.friendActivities;
export const selectFriendsLeaderboard = (state: { friends: FriendsState }) => state.friends.leaderboard;
export const selectFriendsLoading = (state: { friends: FriendsState }) => state.friends.isLoading;
export const selectActivitiesLoading = (state: { friends: FriendsState }) => state.friends.isLoadingActivities;
export const selectLeaderboardLoading = (state: { friends: FriendsState }) => state.friends.isLoadingLeaderboard;
export const selectFriendsError = (state: { friends: FriendsState }) => state.friends.error;

// Memoized selectors
export const selectOnlineFriends = createSelector(
  [selectFriendsList],
  (friends) => {
    if (!friends || !Array.isArray(friends)) {
      return [];
    }
    return friends.filter(friend => friend.status === 'online' || friend.status === 'in-game');
  }
);

export const selectFriendsWithStats = createSelector(
  [selectFriendsList],
  (friends) => {
    if (!friends || !Array.isArray(friends)) {
      return [];
    }
    return friends.filter(friend => friend.statistics);
  }
);

export const selectRecentFriendActivities = createSelector(
  [selectFriendActivities],
  (activities) => {
    if (!activities || !Array.isArray(activities)) {
      return [];
    }
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }
);