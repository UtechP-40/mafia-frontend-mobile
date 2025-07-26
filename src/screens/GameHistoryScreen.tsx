import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
  withTiming
} from 'react-native-reanimated';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlayerCard } from '../components/game/PlayerCard';

import { selectCurrentPlayer } from '../store/slices/authSlice';
import { apiService } from '../services/api';
import { GameHistory, GameHistoryItem, WinResult } from '../types/game';

type RootStackParamList = {
  Results: { gameId?: string };
  MainMenu: undefined;
  GameHistory: undefined;
};

type GameHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameHistory'>;

export const GameHistoryScreen: React.FC = () => {
  const navigation = useNavigation<GameHistoryScreenNavigationProp>();
  const currentPlayer = useSelector(selectCurrentPlayer);

  // State
  const [gameHistory, setGameHistory] = useState<GameHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Animation values
  const fadeInValue = useSharedValue(0);
  const slideUpValue = useSharedValue(30);

  useEffect(() => {
    loadGameHistory();
    
    // Entrance animations
    fadeInValue.value = withDelay(100, withTiming(1, { duration: 500 }));
    slideUpValue.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 150 }));
  }, [fadeInValue, slideUpValue]);

  const loadGameHistory = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      
      const history = await apiService.getGameHistory(page, 10);
      
      if (append && gameHistory) {
        setGameHistory({
          ...history,
          games: [...gameHistory.games, ...history.games]
        });
      } else {
        setGameHistory(history);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading game history:', error);
      Alert.alert('Error', 'Failed to load game history');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGameHistory(1, false);
  };

  const handleLoadMore = () => {
    if (gameHistory && currentPage < gameHistory.pagination.pages && !loadingMore) {
      setLoadingMore(true);
      loadGameHistory(currentPage + 1, true);
    }
  };

  const handleGamePress = (gameId: string) => {
    navigation.navigate('Results', { gameId });
  };

  // Animation styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeInValue.value,
      transform: [{ translateY: slideUpValue.value }],
    };
  });

  // Get game result display for current player
  const getGameResultForPlayer = (game: GameHistoryItem) => {
    if (!currentPlayer || !game.winResult) {
      return { text: 'Completed', color: '#6b7280', won: false };
    }
    
    const playerWon = game.winResult.winningPlayers.includes(currentPlayer.id);
    
    return {
      text: playerWon ? 'Victory' : 'Defeat',
      color: playerWon ? '#10b981' : '#ef4444',
      won: playerWon
    };
  };

  // Format game duration
  const formatDuration = (startDate: Date, endDate: Date) => {
    const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
    const minutes = Math.round(duration / 60000);
    return `${minutes}m`;
  };

  // Format date
  const formatDate = (date: Date) => {
    const gameDate = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - gameDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return gameDate.toLocaleDateString();
    }
  };

  if (loading && !gameHistory) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading game history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedContainerStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Game History</Text>
          
          {gameHistory && (
            <Text style={styles.subtitle}>
              {gameHistory.pagination.total} games played
            </Text>
          )}
        </View>

        {/* Game History List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            
            if (layoutMeasurement.height + contentOffset.y >= 
                contentSize.height - paddingToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {gameHistory?.games.map((game, index) => {
            const result = getGameResultForPlayer(game);
            const duration = formatDuration(game.createdAt, game.updatedAt);
            const date = formatDate(game.createdAt);
            
            return (
              <Animated.View
                key={game.id}
                style={[
                  styles.gameCard,
                  {
                    opacity: useSharedValue(0).value = withDelay(
                      index * 100,
                      withTiming(1, { duration: 400 })
                    )
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.gameCardContent}
                  onPress={() => handleGamePress(game.id)}
                  activeOpacity={0.7}
                >
                  {/* Game Header */}
                  <View style={styles.gameHeader}>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameDate}>{date}</Text>
                      <Text style={styles.gameDuration}>{duration}</Text>
                    </View>
                    
                    <View style={[
                      styles.resultBadge,
                      { backgroundColor: result.color }
                    ]}>
                      <Text style={styles.resultText}>{result.text}</Text>
                    </View>
                  </View>

                  {/* Game Stats */}
                  <View style={styles.gameStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{game.players.length}</Text>
                      <Text style={styles.statLabel}>Players</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{game.eliminatedPlayers.length}</Text>
                      <Text style={styles.statLabel}>Eliminated</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {game.settings.enableVoiceChat ? 'Yes' : 'No'}
                      </Text>
                      <Text style={styles.statLabel}>Voice Chat</Text>
                    </View>
                  </View>

                  {/* Players Preview */}
                  <View style={styles.playersPreview}>
                    <Text style={styles.playersLabel}>Players:</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.playersScroll}
                    >
                      {game.players.slice(0, 6).map((player) => (
                        <View key={player.id} style={styles.playerPreview}>
                          <View style={[
                            styles.playerAvatar,
                            game.eliminatedPlayers.some(ep => ep.id === player.id) && 
                            styles.eliminatedAvatar
                          ]}>
                            <Text style={styles.playerAvatarText}>
                              {player.username.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.playerName} numberOfLines={1}>
                            {player.username}
                          </Text>
                        </View>
                      ))}
                      
                      {game.players.length > 6 && (
                        <View style={styles.playerPreview}>
                          <View style={styles.morePlayersIndicator}>
                            <Text style={styles.morePlayersText}>
                              +{game.players.length - 6}
                            </Text>
                          </View>
                        </View>
                      )}
                    </ScrollView>
                  </View>

                  {/* Win Result */}
                  {game.winResult && (
                    <View style={styles.winResultContainer}>
                      <Text style={styles.winResultText}>
                        {game.winResult.reason}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Load More Button */}
          {gameHistory && currentPage < gameHistory.pagination.pages && (
            <View style={styles.loadMoreContainer}>
              <Button
                title={loadingMore ? "Loading..." : "Load More"}
                onPress={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                style={styles.loadMoreButton}
              />
            </View>
          )}

          {/* Empty State */}
          {gameHistory?.games.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Games Yet</Text>
              <Text style={styles.emptyStateText}>
                Start playing to see your game history here!
              </Text>
              <Button
                title="Play Now"
                onPress={() => navigation.navigate('MainMenu')}
                style={styles.playNowButton}
              />
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gameCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gameCardContent: {
    padding: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  gameDuration: {
    fontSize: 14,
    color: '#9ca3af',
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  playersPreview: {
    marginBottom: 12,
  },
  playersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 8,
  },
  playersScroll: {
    flexDirection: 'row',
  },
  playerPreview: {
    alignItems: 'center',
    marginRight: 12,
    width: 50,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  eliminatedAvatar: {
    backgroundColor: '#6b7280',
    opacity: 0.6,
  },
  playerAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerName: {
    fontSize: 10,
    color: '#d1d5db',
    textAlign: 'center',
  },
  morePlayersIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  morePlayersText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  winResultContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
  },
  winResultText: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    minWidth: 120,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  playNowButton: {
    minWidth: 120,
  },
});