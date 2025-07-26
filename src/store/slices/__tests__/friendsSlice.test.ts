import { configureStore } from '@reduxjs/toolkit';
import { 
  friendsSlice,
  fetchFriends,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  fetchFriendActivities,
  fetchFriendsLeaderboard,
  selectOnlineFriends,
  selectFriendsWithStats,
  selectRecentFriendActivities,
} from '../friendsSlice';

// Mock the API service
jest.mock('../../../services/api', () => ({
  apiService: {
    getFriends: jest.fn(),
    searchUsers: jest.fn(),
    sendFriendRequest: jest.fn(),
    respondToFriendRequest: jest.fn(),
    removeFriend: jest.fn(),
    getFriendActivities: jest.fn(),
    getFriendsLeaderboard: jest.fn(),
    inviteFriendToGame: jest.fn(),
  },
}));

const { apiService } = require('../../../services/api');

describe('friendsSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        friends: friendsSlice.reducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().friends;
      expect(state).toEqual({
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
      });
    });
  });

  describe('reducers', () => {
    it('should clear error', () => {
      // Set an error first
      store.dispatch(friendsSlice.actions.clearError());
      const state = store.getState().friends;
      expect(state.error).toBeNull();
    });

    it('should clear search results', () => {
      store.dispatch(friendsSlice.actions.clearSearchResults());
      const state = store.getState().friends;
      expect(state.searchResults).toEqual([]);
    });

    it('should update friend status', () => {
      // First add a friend to the state
      const initialState = {
        friends: [
          {
            id: '1',
            username: 'testuser',
            avatar: '',
            status: 'offline' as const,
            statistics: { gamesPlayed: 0, gamesWon: 0, winRate: 0, eloRating: 1000, favoriteRole: 'Villager' },
          },
        ],
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

      store = configureStore({
        reducer: {
          friends: friendsSlice.reducer,
        },
        preloadedState: {
          friends: initialState,
        },
      });

      store.dispatch(friendsSlice.actions.updateFriendStatus({
        friendId: '1',
        status: 'online',
      }));

      const state = store.getState().friends;
      expect(state.friends[0].status).toBe('online');
    });
  });

  describe('async thunks', () => {
    describe('fetchFriends', () => {
      it('should handle successful fetch', async () => {
        const mockResponse = {
          friends: [
            {
              id: '1',
              username: 'testuser',
              avatar: '',
              status: 'online',
              statistics: { gamesPlayed: 10, gamesWon: 5, winRate: 0.5, eloRating: 1200, favoriteRole: 'Villager' },
            },
          ],
          friendRequests: [],
        };

        apiService.getFriends.mockResolvedValue(mockResponse);

        await store.dispatch(fetchFriends());
        const state = store.getState().friends;

        expect(state.isLoading).toBe(false);
        expect(state.friends).toEqual(mockResponse.friends);
        expect(state.error).toBeNull();
      });

      it('should handle fetch error', async () => {
        const errorMessage = 'Failed to fetch friends';
        apiService.getFriends.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(fetchFriends());
        const state = store.getState().friends;

        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('searchUsers', () => {
      it('should handle successful search', async () => {
        const mockResults = [
          {
            id: '2',
            username: 'searchuser',
            avatar: '',
            status: 'online',
            statistics: { gamesPlayed: 5, gamesWon: 2, winRate: 0.4, eloRating: 1100, favoriteRole: 'Mafia' },
          },
        ];

        apiService.searchUsers.mockResolvedValue(mockResults);

        await store.dispatch(searchUsers('searchuser'));
        const state = store.getState().friends;

        expect(state.isSearching).toBe(false);
        expect(state.searchResults).toEqual(mockResults);
        expect(state.error).toBeNull();
      });

      it('should handle search error', async () => {
        const errorMessage = 'Search failed';
        apiService.searchUsers.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(searchUsers('test'));
        const state = store.getState().friends;

        expect(state.isSearching).toBe(false);
        expect(state.error).toBe(errorMessage);
      });
    });

    describe('sendFriendRequest', () => {
      it('should handle successful friend request', async () => {
        const mockResponse = { success: true };
        apiService.sendFriendRequest.mockResolvedValue(mockResponse);

        await store.dispatch(sendFriendRequest('user123'));
        const state = store.getState().friends;

        expect(state.error).toBeNull();
      });

      it('should handle friend request error', async () => {
        const errorMessage = 'Failed to send friend request';
        apiService.sendFriendRequest.mockRejectedValue(new Error(errorMessage));

        await store.dispatch(sendFriendRequest('user123'));
        const state = store.getState().friends;

        expect(state.error).toBe(errorMessage);
      });
    });

    describe('acceptFriendRequest', () => {
      it('should remove request from list on success', async () => {
        const initialState = {
          friends: [],
          friendRequests: [
            {
              id: 'req1',
              fromUserId: 'user1',
              toUserId: 'user2',
              fromUser: { id: 'user1', username: 'testuser', avatar: '' },
              status: 'pending' as const,
              createdAt: new Date(),
            },
          ],
          searchResults: [],
          friendActivities: [],
          leaderboard: [],
          isLoading: false,
          isSearching: false,
          isLoadingActivities: false,
          isLoadingLeaderboard: false,
          error: null,
        };

        store = configureStore({
          reducer: {
            friends: friendsSlice.reducer,
          },
          preloadedState: {
            friends: initialState,
          },
        });

        apiService.respondToFriendRequest.mockResolvedValue({ success: true });

        await store.dispatch(acceptFriendRequest('req1'));
        const state = store.getState().friends;

        expect(state.friendRequests).toHaveLength(0);
      });
    });

    describe('removeFriend', () => {
      it('should remove friend from list on success', async () => {
        const initialState = {
          friends: [
            {
              id: 'friend1',
              username: 'testuser',
              avatar: '',
              status: 'online' as const,
              statistics: { gamesPlayed: 10, gamesWon: 5, winRate: 0.5, eloRating: 1200, favoriteRole: 'Villager' },
            },
          ],
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

        store = configureStore({
          reducer: {
            friends: friendsSlice.reducer,
          },
          preloadedState: {
            friends: initialState,
          },
        });

        apiService.removeFriend.mockResolvedValue({ success: true });

        await store.dispatch(removeFriend('friend1'));
        const state = store.getState().friends;

        expect(state.friends).toHaveLength(0);
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      friends: {
        friends: [
          {
            id: '1',
            username: 'onlineuser',
            avatar: '',
            status: 'online' as const,
            statistics: { gamesPlayed: 10, gamesWon: 5, winRate: 0.5, eloRating: 1200, favoriteRole: 'Villager' },
          },
          {
            id: '2',
            username: 'offlineuser',
            avatar: '',
            status: 'offline' as const,
            statistics: { gamesPlayed: 8, gamesWon: 3, winRate: 0.375, eloRating: 1100, favoriteRole: 'Mafia' },
          },
          {
            id: '3',
            username: 'ingameuser',
            avatar: '',
            status: 'in-game' as const,
            statistics: { gamesPlayed: 15, gamesWon: 12, winRate: 0.8, eloRating: 1400, favoriteRole: 'Detective' },
          },
        ],
        friendActivities: [
          {
            id: 'act1',
            friendId: '1',
            friendUsername: 'onlineuser',
            type: 'game_completed' as const,
            data: { result: 'win', role: 'Villager' },
            timestamp: new Date('2023-01-02'),
          },
          {
            id: 'act2',
            friendId: '2',
            friendUsername: 'offlineuser',
            type: 'achievement_unlocked' as const,
            data: { achievementName: 'First Win' },
            timestamp: new Date('2023-01-01'),
          },
        ],
        friendRequests: [],
        searchResults: [],
        leaderboard: [],
        isLoading: false,
        isSearching: false,
        isLoadingActivities: false,
        isLoadingLeaderboard: false,
        error: null,
      },
    };

    describe('selectOnlineFriends', () => {
      it('should return only online and in-game friends', () => {
        const onlineFriends = selectOnlineFriends(mockState);
        expect(onlineFriends).toHaveLength(2);
        expect(onlineFriends.map(f => f.username)).toEqual(['onlineuser', 'ingameuser']);
      });

      it('should return empty array for invalid input', () => {
        const invalidState = { friends: { friends: null } };
        const onlineFriends = selectOnlineFriends(invalidState as any);
        expect(onlineFriends).toEqual([]);
      });
    });

    describe('selectFriendsWithStats', () => {
      it('should return friends with statistics', () => {
        const friendsWithStats = selectFriendsWithStats(mockState);
        expect(friendsWithStats).toHaveLength(3);
        expect(friendsWithStats.every(f => f.statistics)).toBe(true);
      });
    });

    describe('selectRecentFriendActivities', () => {
      it('should return activities sorted by timestamp descending', () => {
        const recentActivities = selectRecentFriendActivities(mockState);
        expect(recentActivities).toHaveLength(2);
        expect(recentActivities[0].id).toBe('act1'); // More recent
        expect(recentActivities[1].id).toBe('act2'); // Older
      });

      it('should limit to 10 activities', () => {
        const stateWithManyActivities = {
          friends: {
            ...mockState.friends,
            friendActivities: Array.from({ length: 15 }, (_, i) => ({
              id: `act${i}`,
              friendId: '1',
              friendUsername: 'user',
              type: 'game_completed' as const,
              data: {},
              timestamp: new Date(`2023-01-${i + 1}`),
            })),
          },
        };

        const recentActivities = selectRecentFriendActivities(stateWithManyActivities);
        expect(recentActivities).toHaveLength(10);
      });
    });
  });
});