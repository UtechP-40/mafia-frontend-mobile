import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../types/navigation';
import { Button, Card } from '../components/ui';
import { 
  selectFriendsList,
  selectFriendRequests,
  selectSearchResults,
  selectFriendActivities,
  selectFriendsLeaderboard,
  selectFriendsLoading as selectIsSearching,
  selectActivitiesLoading,
  selectLeaderboardLoading,
  selectFriendsError,
  fetchFriends,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  fetchFriendActivities,
  fetchFriendsLeaderboard,
  inviteFriendToGame,
  clearSearchResults,
  clearError as clearFriendsError
} from '../store/slices/friendsSlice';
import { setCurrentScreen, addNotification } from '../store/slices/uiSlice';
import { Ionicons } from '@expo/vector-icons';

type FriendsNavigationProp = StackNavigationProp<RootStackParamList, 'Friends'>;

export const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<FriendsNavigationProp>();
  const dispatch = useDispatch();
  
  const friends = useSelector(selectFriendsList);
  const friendRequests = useSelector(selectFriendRequests);
  const searchResults = useSelector(selectSearchResults);
  const friendActivities = useSelector(selectFriendActivities);
  const friendsLeaderboard = useSelector(selectFriendsLeaderboard);
  const isSearching = useSelector(selectIsSearching);
  const isLoadingActivities = useSelector(selectActivitiesLoading);
  const isLoadingLeaderboard = useSelector(selectLeaderboardLoading);
  const error = useSelector(selectFriendsError);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search' | 'activities' | 'leaderboard'>('friends');

  useEffect(() => {
    dispatch(setCurrentScreen('Friends'));
    dispatch(fetchFriends());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'activities') {
      dispatch(fetchFriendActivities());
    } else if (activeTab === 'leaderboard') {
      dispatch(fetchFriendsLeaderboard());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (error) {
      dispatch(addNotification({
        message: error,
        type: 'error'
      }));
      dispatch(clearFriendsError());
    }
  }, [error, dispatch]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      dispatch(searchUsers(searchQuery.trim()));
    }
  };

  const handleSendFriendRequest = (userId: string, username: string) => {
    dispatch(sendFriendRequest(userId))
      .unwrap()
      .then(() => {
        dispatch(addNotification({
          message: `Friend request sent to ${username}`,
          type: 'success'
        }));
      })
      .catch((error) => {
        dispatch(addNotification({
          message: error || 'Failed to send friend request',
          type: 'error'
        }));
      });
  };

  const handleAcceptFriendRequest = (requestId: string, username: string) => {
    dispatch(acceptFriendRequest(requestId))
      .unwrap()
      .then(() => {
        dispatch(addNotification({
          message: `Friend request from ${username} accepted`,
          type: 'success'
        }));
        dispatch(fetchFriends()); // Refresh friends list
      })
      .catch((error) => {
        dispatch(addNotification({
          message: error || 'Failed to accept friend request',
          type: 'error'
        }));
      });
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    dispatch(declineFriendRequest(requestId))
      .unwrap()
      .then(() => {
        dispatch(addNotification({
          message: 'Friend request declined',
          type: 'success'
        }));
      })
      .catch((error) => {
        dispatch(addNotification({
          message: error || 'Failed to decline friend request',
          type: 'error'
        }));
      });
  };

  const handleRemoveFriend = (friendId: string, username: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            dispatch(removeFriend(friendId))
              .unwrap()
              .then(() => {
                dispatch(addNotification({
                  message: `${username} removed from friends`,
                  type: 'success'
                }));
              })
              .catch((error) => {
                dispatch(addNotification({
                  message: error || 'Failed to remove friend',
                  type: 'error'
                }));
              });
          }
        }
      ]
    );
  };

  const handleInviteFriend = (friendId: string, friendUsername: string) => {
    // For now, show a placeholder message since we need room context
    dispatch(addNotification({
      message: `Game invitation feature will be available when in a room`,
      type: 'info'
    }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    dispatch(clearSearchResults());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'in-game': return '#f59e0b';
      case 'away': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-game': return 'In Game';
      case 'away': return 'Away';
      default: return 'Offline';
    }
  };

  const renderFriendItem = (friend: any, showRemove = false) => (
    <View key={friend.id} style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {friend.username.charAt(0).toUpperCase()}
          </Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(friend.status || 'offline') }]} />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{friend.username}</Text>
          <Text style={styles.friendStatus}>
            {friend.status ? getStatusText(friend.status) : 'Offline'}
          </Text>
          {friend.currentActivity && (
            <Text style={styles.friendActivity}>{friend.currentActivity}</Text>
          )}
        </View>
      </View>
      <View style={styles.friendActions}>
        {showRemove ? (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveFriend(friend.id, friend.username)}
          >
            <Ionicons name="person-remove-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => handleInviteFriend(friend.id, friend.username)}
          >
            <Ionicons name="game-controller-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFriendRequestItem = (request: any) => (
    <View key={request.id} style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {request.fromUser.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{request.fromUser.username}</Text>
          <Text style={styles.requestTime}>
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptFriendRequest(request.id, request.fromUser.username)}
        >
          <Ionicons name="checkmark" size={20} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleDeclineFriendRequest(request.id)}
        >
          <Ionicons name="close" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResultItem = (user: any) => (
    <View key={user.id} style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{user.username}</Text>
          <Text style={styles.friendStatus}>
            {user.statistics ? `${user.statistics.gamesPlayed} games played` : 'New player'}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleSendFriendRequest(user.id, user.username)}
      >
        <Ionicons name="person-add" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const renderActivityItem = (activity: any) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'game_completed': return 'game-controller-outline';
        case 'achievement_unlocked': return 'trophy-outline';
        case 'status_change': return 'person-outline';
        default: return 'pulse-outline';
      }
    };

    const getActivityText = (activity: any) => {
      switch (activity.type) {
        case 'game_completed':
          return `${activity.friendUsername} ${activity.data.result === 'win' ? 'won' : 'lost'} a game as ${activity.data.role}`;
        case 'achievement_unlocked':
          return `${activity.friendUsername} unlocked "${activity.data.achievementName}"`;
        case 'status_change':
          return `${activity.friendUsername} is now ${activity.data.status}`;
        default:
          return `${activity.friendUsername} had some activity`;
      }
    };

    const getTimeAgo = (timestamp: string) => {
      const now = new Date();
      const activityTime = new Date(timestamp);
      const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return (
      <View key={activity.id} style={styles.activityItem}>
        <View style={styles.activityIcon}>
          <Ionicons name={getActivityIcon(activity.type)} size={20} color="#6366f1" />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>{getActivityText(activity)}</Text>
          <Text style={styles.activityTime}>{getTimeAgo(activity.timestamp)}</Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = (friend: any, index: number) => {
    const getRankIcon = (rank: number) => {
      switch (rank) {
        case 0: return '🥇';
        case 1: return '🥈';
        case 2: return '🥉';
        default: return `${rank + 1}`;
      }
    };

    const getRankColor = (rank: number) => {
      switch (rank) {
        case 0: return '#ffd700';
        case 1: return '#c0c0c0';
        case 2: return '#cd7f32';
        default: return '#9ca3af';
      }
    };

    return (
      <View key={friend.id} style={styles.leaderboardItem}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: getRankColor(index) }]}>
            {getRankIcon(index)}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {friend.username.charAt(0).toUpperCase()}
            </Text>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(friend.status || 'offline') }]} />
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{friend.username}</Text>
            <Text style={styles.friendStatus}>
              {friend.statistics?.winRate ? `${Math.round(friend.statistics.winRate * 100)}% win rate` : 'No games played'}
            </Text>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.eloText}>
            {friend.statistics?.eloRating || 1000}
          </Text>
          <Text style={styles.eloLabel}>ELO</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollContainer}
        contentContainerStyle={styles.tabContainer}
      >
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({friendRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
          onPress={() => setActiveTab('activities')}
        >
          <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'friends' && (
          <Card>
            {friends.length > 0 ? (
              <View style={styles.friendsList}>
                {friends.map((friend) => renderFriendItem(friend, true))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#6b7280" />
                <Text style={styles.emptyStateText}>No friends yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Search for players to add as friends
                </Text>
              </View>
            )}
          </Card>
        )}

        {activeTab === 'requests' && (
          <Card>
            {friendRequests.length > 0 ? (
              <View style={styles.requestsList}>
                {friendRequests.map(renderFriendRequestItem)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={64} color="#6b7280" />
                <Text style={styles.emptyStateText}>No friend requests</Text>
                <Text style={styles.emptyStateSubtext}>
                  Friend requests will appear here
                </Text>
              </View>
            )}
          </Card>
        )}

        {activeTab === 'search' && (
          <>
            <Card>
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={handleClearSearch}>
                      <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
                <Button
                  title={isSearching ? "Searching..." : "Search"}
                  onPress={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  style={styles.searchButton}
                />
              </View>
            </Card>

            {searchResults.length > 0 && (
              <Card>
                <Text style={styles.sectionTitle}>Search Results</Text>
                <View style={styles.searchResultsList}>
                  {searchResults.map(renderSearchResultItem)}
                </View>
              </Card>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <Card>
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={64} color="#6b7280" />
                  <Text style={styles.emptyStateText}>No users found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try searching with a different username
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}

        {activeTab === 'activities' && (
          <Card>
            {isLoadingActivities ? (
              <View style={styles.loadingState}>
                <Text style={styles.loadingText}>Loading activities...</Text>
              </View>
            ) : friendActivities.length > 0 ? (
              <View style={styles.activitiesList}>
                <Text style={styles.sectionTitle}>Friend Activity</Text>
                {friendActivities.map((activity) => renderActivityItem(activity))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="pulse-outline" size={64} color="#6b7280" />
                <Text style={styles.emptyStateText}>No recent activity</Text>
                <Text style={styles.emptyStateSubtext}>
                  Friend activities will appear here
                </Text>
              </View>
            )}
          </Card>
        )}

        {activeTab === 'leaderboard' && (
          <Card>
            {isLoadingLeaderboard ? (
              <View style={styles.loadingState}>
                <Text style={styles.loadingText}>Loading leaderboard...</Text>
              </View>
            ) : friendsLeaderboard.length > 0 ? (
              <View style={styles.leaderboardList}>
                <Text style={styles.sectionTitle}>Friends Leaderboard</Text>
                {friendsLeaderboard.map((friend, index) => renderLeaderboardItem(friend, index))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={64} color="#6b7280" />
                <Text style={styles.emptyStateText}>No leaderboard data</Text>
                <Text style={styles.emptyStateSubtext}>
                  Play games with friends to see rankings
                </Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 4,
    minWidth: '100%',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 4,
  },
  activeTab: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  friendsList: {
    gap: 16,
  },
  requestsList: {
    gap: 16,
  },
  searchResultsList: {
    gap: 16,
    marginTop: 16,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarText: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 48,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#2d2d2d',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  friendActivity: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  requestTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  acceptButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#10b981',
  },
  declineButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  searchContainer: {
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 4,
  },
  searchButton: {
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  tabScrollContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  leaderboardList: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  eloText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eloLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
});