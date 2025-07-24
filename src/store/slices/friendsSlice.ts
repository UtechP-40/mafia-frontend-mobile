import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Friend, FriendRequest } from '../../types/user';

interface FriendsState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  searchResults: Friend[];
  isSearching: boolean;
}

const initialState: FriendsState = {
  friends: [],
  friendRequests: [],
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false,
};

// Async thunks for friend actions
export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch friends');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'friends/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search users');
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'friends/sendFriendRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send friend request');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send friend request');
    }
  }
);

export const respondToFriendRequest = createAsyncThunk(
  'friends/respondToFriendRequest',
  async ({ requestId, accept }: { requestId: string; accept: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/friends/request/${requestId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ accept }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to respond to friend request');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to respond to friend request');
    }
  }
);

export const removeFriend = createAsyncThunk(
  'friends/removeFriend',
  async (friendId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove friend');
      }
      
      return friendId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove friend');
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
    updateFriendStatus: (state, action: PayloadAction<{ friendId: string; status: Friend['status']; isOnline: boolean }>) => {
      const friend = state.friends.find(f => f.id === action.payload.friendId);
      if (friend) {
        friend.status = action.payload.status;
        friend.isOnline = action.payload.isOnline;
        if (!action.payload.isOnline) {
          friend.lastSeen = new Date();
        }
      }
    },
    addFriendRequest: (state, action: PayloadAction<FriendRequest>) => {
      state.friendRequests.push(action.payload);
    },
    removeFriendRequest: (state, action: PayloadAction<string>) => {
      state.friendRequests = state.friendRequests.filter(req => req.id !== action.payload);
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
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        // Optionally add to pending requests or show success message
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Respond to friend request
      .addCase(respondToFriendRequest.fulfilled, (state, action) => {
        const { requestId, accept, friend } = action.payload;
        state.friendRequests = state.friendRequests.filter(req => req.id !== requestId);
        if (accept && friend) {
          state.friends.push(friend);
        }
      })
      .addCase(respondToFriendRequest.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Remove friend
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(friend => friend.id !== action.payload);
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearSearchResults, 
  updateFriendStatus, 
  addFriendRequest, 
  removeFriendRequest 
} = friendsSlice.actions;

// Selectors
export const selectFriends = (state: { friends: FriendsState }) => state.friends;
export const selectFriendsList = (state: { friends: FriendsState }) => state.friends.friends;
export const selectFriendRequests = (state: { friends: FriendsState }) => state.friends.friendRequests;
export const selectOnlineFriends = (state: { friends: FriendsState }) => 
  state.friends.friends.filter(friend => friend.isOnline);
export const selectFriendsLoading = (state: { friends: FriendsState }) => state.friends.isLoading;
export const selectFriendsError = (state: { friends: FriendsState }) => state.friends.error;
export const selectSearchResults = (state: { friends: FriendsState }) => state.friends.searchResults;
export const selectIsSearching = (state: { friends: FriendsState }) => state.friends.isSearching;