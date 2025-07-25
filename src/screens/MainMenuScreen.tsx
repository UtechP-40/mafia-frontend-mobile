import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../types/navigation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { selectAuth } from '../store/slices/authSlice';
import { addNotification, setCurrentScreen } from '../store/slices/uiSlice';
import { selectOnlineFriends, selectFriendsList, fetchFriends } from '../store/slices/friendsSlice';
import { selectIsMatchmaking, selectMatchmakingPreferences, startQuickMatch } from '../store/slices/roomsSlice';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../store/store';

type MainMenuNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

export const MainMenuScreen: React.FC = () => {
  const navigation = useNavigation<MainMenuNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector(selectAuth);
  const onlineFriends = useSelector((state: RootState) => selectOnlineFriends(state));
  const isMatchmaking = useSelector((state: RootState) => selectIsMatchmaking(state));
  const matchmakingPreferences = useSelector((state: RootState) => selectMatchmakingPreferences(state));

  useEffect(() => {
    dispatch(setCurrentScreen('MainMenu'));
    // Fetch friends when screen loads
    dispatch(fetchFriends());
  }, [dispatch]);

  const handleQuickMatch = () => {
    dispatch(startQuickMatch(matchmakingPreferences))
      .unwrap()
      .then((result) => {
        if (result.roomId) {
          navigation.navigate('Lobby', { roomId: result.roomId });
        }
      })
      .catch((error) => {
        dispatch(addNotification({
          message: error || 'Failed to start quick match',
          type: 'error'
        }));
      });
  };

  const handleBrowseRooms = () => {
    navigation.navigate('RoomBrowser');
  };

  const handleFriends = () => {
    navigation.navigate('Friends');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.username}>{user?.username || 'Player'}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <Card>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.statistics?.gamesPlayed || 0}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.statistics?.gamesWon || 0}</Text>
              <Text style={styles.statLabel}>Games Won</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user?.statistics?.winRate ? `${Math.round(user.statistics.winRate * 100)}%` : '0%'}
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>
        </Card>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title={isMatchmaking ? "Finding Match..." : "Quick Match"}
            onPress={handleQuickMatch}
            disabled={isMatchmaking}
            style={styles.primaryButton}
          />
          
          <Button
            title="Browse Rooms"
            onPress={handleBrowseRooms}
            variant="secondary"
            style={styles.secondaryButton}
          />
        </View>

        {/* Friends Section */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <TouchableOpacity onPress={handleFriends}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {onlineFriends.length > 0 ? (
            <View style={styles.friendsList}>
              {onlineFriends.slice(0, 3).map((friend) => (
                <View key={friend.id} style={styles.friendItem}>
                  <View style={styles.friendInfo}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {friend.username.charAt(0).toUpperCase()}
                      </Text>
                      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(friend.status) }]} />
                    </View>
                    <View style={styles.friendDetails}>
                      <Text style={styles.friendName}>{friend.username}</Text>
                      <Text style={styles.friendStatus}>{getStatusText(friend.status)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.inviteButton}>
                    <Ionicons name="person-add-outline" size={16} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#6b7280" />
              <Text style={styles.emptyStateText}>No friends online</Text>
              <Text style={styles.emptyStateSubtext}>Add friends to play together</Text>
            </View>
          )}
        </Card>

        {/* Recent Activity */}
        <Card>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubtext}>Your game history will appear here</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
  },
  actionsContainer: {
    marginVertical: 8,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2d2d2d',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    color: '#9ca3af',
  },
  inviteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});