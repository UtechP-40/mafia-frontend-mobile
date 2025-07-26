import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Share,
  Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
  withSequence,
  withTiming
} from 'react-native-reanimated';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlayerCard } from '../components/game/PlayerCard';
import { StatisticsChart } from '../components/game/StatisticsChart';
import { AchievementCard } from '../components/game/AchievementCard';
import { AchievementNotification } from '../components/game/AchievementNotification';

import { selectCurrentPlayer } from '../store/slices/authSlice';
import { apiService } from '../services/api';
import { 
  GameResult, 
  PlayerStatistics, 
  PlayerAchievements, 
  PlayerAchievement,
  WinResult 
} from '../types/game';

type RootStackParamList = {
  Results: { gameId?: string };
  MainMenu: undefined;
  GameHistory: undefined;
};

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;
type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;

const { width: screenWidth } = Dimensions.get('window');

export const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<ResultsScreenNavigationProp>();
  const route = useRoute<ResultsScreenRouteProp>();
  const currentPlayer = useSelector(selectCurrentPlayer);

  // State
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatistics | null>(null);
  const [achievements, setAchievements] = useState<PlayerAchievements | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<PlayerAchievement[]>([]);
  const [currentNotification, setCurrentNotification] = useState<PlayerAchievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'stats' | 'achievements'>('results');

  // Animation values
  const fadeInValue = useSharedValue(0);
  const slideUpValue = useSharedValue(50);

  useEffect(() => {
    loadData();
    
    // Entrance animations
    fadeInValue.value = withDelay(200, withTiming(1, { duration: 600 }));
    slideUpValue.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 150 }));
  }, [fadeInValue, slideUpValue]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load game results if gameId is provided
      if (route.params?.gameId) {
        const result = await apiService.getGameResults(route.params.gameId);
        setGameResult(result);
      }
      
      // Load player statistics
      const stats = await apiService.getPlayerStatistics();
      setPlayerStats(stats);
      
      // Load achievements
      const playerAchievements = await apiService.getPlayerAchievements();
      setAchievements(playerAchievements);
      
      // Load recent achievements for notifications
      const recent = await apiService.getRecentAchievements();
      setRecentAchievements(recent);
      
      // Show first achievement notification if any
      if (recent.length > 0) {
        setCurrentNotification(recent[0]);
      }
      
    } catch (error) {
      console.error('Error loading results data:', error);
      Alert.alert('Error', 'Failed to load game results');
    } finally {
      setLoading(false);
    }
  };

  // Animation styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeInValue.value,
      transform: [{ translateY: slideUpValue.value }],
    };
  });

  // Handle achievement notification dismissal
  const handleNotificationDismiss = () => {
    setCurrentNotification(null);
    
    // Show next notification if available
    const currentIndex = recentAchievements.findIndex(
      a => a.id === currentNotification?.id
    );
    
    if (currentIndex >= 0 && currentIndex < recentAchievements.length - 1) {
      setTimeout(() => {
        setCurrentNotification(recentAchievements[currentIndex + 1]);
      }, 500);
    } else {
      // Mark all notifications as read
      const achievementIds = recentAchievements.map(a => a.id);
      apiService.markAchievementsAsRead(achievementIds).catch(console.error);
    }
  };

  // Share game result
  const handleShare = async () => {
    if (!gameResult || !currentPlayer) return;
    
    const winResult = gameResult.matchStats.winResult;
    const playerWon = winResult?.winningPlayers.includes(currentPlayer.id);
    
    const shareText = `I just ${playerWon ? 'won' : 'played'} a game of Mobile Mafia! 🎮\n` +
      `Duration: ${Math.round(gameResult.matchStats.duration / 60000)} minutes\n` +
      `Players: ${gameResult.matchStats.totalPlayers}\n` +
      `Result: ${winResult?.reason || 'Game completed'}\n\n` +
      `Join me in Mobile Mafia!`;
    
    try {
      await Share.share({
        message: shareText,
        title: 'Mobile Mafia Game Result'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Get win result display
  const getWinResultDisplay = (winResult?: WinResult) => {
    if (!winResult) return { text: 'Game Completed', color: '#6b7280' };
    
    const isPlayerWinner = currentPlayer && winResult.winningPlayers.includes(currentPlayer.id);
    
    return {
      text: isPlayerWinner ? '🎉 Victory!' : '💀 Defeat',
      color: isPlayerWinner ? '#10b981' : '#ef4444',
      subtitle: winResult.reason
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  const winDisplay = gameResult ? getWinResultDisplay(gameResult.matchStats.winResult) : null;

  return (
    <View style={styles.container}>
      {/* Achievement Notification */}
      {currentNotification && (
        <AchievementNotification
          achievement={currentNotification}
          onDismiss={handleNotificationDismiss}
        />
      )}
      
      <Animated.View style={[styles.content, animatedContainerStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Game Results</Text>
          {gameResult && winDisplay && (
            <View style={styles.winResultContainer}>
              <Text style={[styles.winResultText, { color: winDisplay.color }]}>
                {winDisplay.text}
              </Text>
              <Text style={styles.winResultSubtitle}>
                {winDisplay.subtitle}
              </Text>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'results' && styles.activeTab]}
            onPress={() => setActiveTab('results')}
          >
            <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>
              Results
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
              Statistics
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Game Results Tab */}
          {activeTab === 'results' && gameResult && (
            <View style={styles.tabContent}>
              {/* Match Summary */}
              <Card>
                <Text style={styles.sectionTitle}>Match Summary</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {Math.round(gameResult.matchStats.duration / 60000)}m
                    </Text>
                    <Text style={styles.summaryLabel}>Duration</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {gameResult.matchStats.totalPlayers}
                    </Text>
                    <Text style={styles.summaryLabel}>Players</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {gameResult.matchStats.daysCycled}
                    </Text>
                    <Text style={styles.summaryLabel}>Days</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {gameResult.matchStats.totalVotes}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Votes</Text>
                  </View>
                </View>
              </Card>

              {/* Player Performance */}
              <Card>
                <Text style={styles.sectionTitle}>Player Performance</Text>
                <View style={styles.playerGrid}>
                  {gameResult.playerPerformance.map((performance, index) => (
                    <View key={performance.player.id} style={styles.performanceItem}>
                      <PlayerCard
                        player={{
                          ...performance.player,
                          isAlive: !performance.wasEliminated,
                          isHost: false
                        }}
                        showRole={true}
                        animated={true}
                      />
                      <View style={styles.performanceStats}>
                        <Text style={styles.performanceStatText}>
                          Votes Cast: {performance.votesCast}
                        </Text>
                        <Text style={styles.performanceStatText}>
                          Votes Received: {performance.votesReceived}
                        </Text>
                        {performance.eliminationDay && (
                          <Text style={styles.eliminationText}>
                            Eliminated Day {performance.eliminationDay}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </Card>

              {/* Share Button */}
              <Button
                title="Share Results"
                onPress={handleShare}
                style={styles.shareButton}
                variant="secondary"
              />
            </View>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && playerStats && (
            <View style={styles.tabContent}>
              <StatisticsChart
                statistics={playerStats.player.statistics}
                recentPerformance={playerStats.recentPerformance}
                animated={true}
              />
              
              {/* Role Statistics */}
              {Object.keys(playerStats.roleStats).length > 0 && (
                <Card>
                  <Text style={styles.sectionTitle}>Role Statistics</Text>
                  <View style={styles.roleStatsGrid}>
                    {Object.entries(playerStats.roleStats).map(([role, count]) => (
                      <View key={role} style={styles.roleStatItem}>
                        <Text style={styles.roleStatRole}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                        <Text style={styles.roleStatCount}>{count} games</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              )}

              {/* Streaks */}
              <Card>
                <Text style={styles.sectionTitle}>Performance Streaks</Text>
                <View style={styles.streakContainer}>
                  <View style={styles.streakItem}>
                    <Text style={styles.streakValue}>{playerStats.streaks.current}</Text>
                    <Text style={styles.streakLabel}>Current Streak</Text>
                  </View>
                  <View style={styles.streakItem}>
                    <Text style={styles.streakValue}>{playerStats.streaks.longest}</Text>
                    <Text style={styles.streakLabel}>Best Streak</Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && achievements && (
            <View style={styles.tabContent}>
              {/* Achievement Summary */}
              <Card>
                <Text style={styles.sectionTitle}>Achievement Progress</Text>
                <View style={styles.achievementSummary}>
                  <Text style={styles.achievementSummaryText}>
                    {achievements.totalUnlocked} of {achievements.totalAvailable} unlocked
                  </Text>
                  <View style={styles.achievementProgressBar}>
                    <View 
                      style={[
                        styles.achievementProgressFill,
                        { 
                          width: `${(achievements.totalUnlocked / achievements.totalAvailable) * 100}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </Card>

              {/* Recently Unlocked */}
              {achievements.unlocked.length > 0 && (
                <Card>
                  <Text style={styles.sectionTitle}>Recently Unlocked</Text>
                  {achievements.unlocked.slice(0, 3).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={true}
                      animated={true}
                    />
                  ))}
                </Card>
              )}

              {/* In Progress */}
              {achievements.inProgress.length > 0 && (
                <Card>
                  <Text style={styles.sectionTitle}>In Progress</Text>
                  {achievements.inProgress.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      showProgress={true}
                      animated={true}
                    />
                  ))}
                </Card>
              )}

              {/* Available Achievements */}
              {achievements.available.length > 0 && (
                <Card>
                  <Text style={styles.sectionTitle}>Available</Text>
                  {achievements.available.slice(0, 5).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      animated={true}
                      size="small"
                    />
                  ))}
                </Card>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title="View History"
            onPress={() => navigation.navigate('GameHistory')}
            variant="outline"
            style={styles.actionButton}
          />
          
          <Button
            title="Back to Menu"
            onPress={() => navigation.navigate('MainMenu')}
            style={styles.actionButton}
          />
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  winResultContainer: {
    alignItems: 'center',
  },
  winResultText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  winResultSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#6366f1',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  playerGrid: {
    gap: 12,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 8,
  },
  performanceStats: {
    flex: 1,
    marginLeft: 12,
  },
  performanceStatText: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 2,
  },
  eliminationText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  shareButton: {
    marginTop: 16,
  },
  roleStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleStatItem: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  roleStatRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  roleStatCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakItem: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  achievementSummary: {
    alignItems: 'center',
  },
  achievementSummaryText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
  },
  achievementProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});