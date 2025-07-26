import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { PlayerStats, RecentGamePerformance } from '../../types/game';

interface StatisticsChartProps {
  statistics: PlayerStats;
  recentPerformance?: RecentGamePerformance[];
  animated?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  statistics,
  recentPerformance = [],
  animated = true
}) => {
  // Animation values
  const animationProgress = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      animationProgress.value = withDelay(300, withTiming(1, { duration: 1000 }));
    } else {
      animationProgress.value = 1;
    }
  }, [animated, animationProgress]);

  // Animated styles for progress bars
  const createProgressBarStyle = (value: number, maxValue: number, delay: number = 0) => {
    return useAnimatedStyle(() => {
      const progress = animated ? animationProgress.value : 1;
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      
      return {
        width: withDelay(
          delay,
          withTiming(
            interpolate(
              progress,
              [0, 1],
              [0, (percentage / 100) * (chartWidth - 100)],
              Extrapolate.CLAMP
            ),
            { duration: 800 }
          )
        ),
      };
    });
  };

  // Calculate max values for scaling
  const maxGames = Math.max(statistics.gamesPlayed, 100);
  const maxRating = 3000;

  // Win rate color based on performance
  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return '#10b981'; // Green
    if (winRate >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  // ELO rating color based on skill level
  const getEloColor = (rating: number) => {
    if (rating >= 2000) return '#8b5cf6'; // Purple (Master)
    if (rating >= 1600) return '#3b82f6'; // Blue (Expert)
    if (rating >= 1200) return '#10b981'; // Green (Intermediate)
    return '#6b7280'; // Gray (Beginner)
  };

  // Recent performance trend
  const getPerformanceTrend = () => {
    if (recentPerformance.length < 3) return 'neutral';
    
    const recentWins = recentPerformance.slice(0, 5).filter(game => game.won).length;
    const winRate = (recentWins / Math.min(5, recentPerformance.length)) * 100;
    
    if (winRate >= 60) return 'up';
    if (winRate <= 40) return 'down';
    return 'neutral';
  };

  const trend = getPerformanceTrend();
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';
  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Player Statistics</Text>
      
      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics.gamesPlayed}</Text>
          <Text style={styles.statLabel}>Games Played</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics.gamesWon}</Text>
          <Text style={styles.statLabel}>Games Won</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getWinRateColor(statistics.winRate) }]}>
            {statistics.winRate}%
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getEloColor(statistics.eloRating) }]}>
            {statistics.eloRating}
          </Text>
          <Text style={styles.statLabel}>ELO Rating</Text>
        </View>
      </View>

      {/* Progress Bars */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        
        {/* Games Played Progress */}
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Games Played</Text>
            <Text style={styles.progressValue}>{statistics.gamesPlayed}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { backgroundColor: '#6366f1' },
                createProgressBarStyle(statistics.gamesPlayed, maxGames, 0)
              ]} 
            />
          </View>
        </View>

        {/* Win Rate Progress */}
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Win Rate</Text>
            <Text style={styles.progressValue}>{statistics.winRate}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { backgroundColor: getWinRateColor(statistics.winRate) },
                createProgressBarStyle(statistics.winRate, 100, 200)
              ]} 
            />
          </View>
        </View>

        {/* ELO Rating Progress */}
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>ELO Rating</Text>
            <Text style={styles.progressValue}>{statistics.eloRating}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { backgroundColor: getEloColor(statistics.eloRating) },
                createProgressBarStyle(statistics.eloRating, maxRating, 400)
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Recent Performance Trend */}
      {recentPerformance.length > 0 && (
        <View style={styles.trendSection}>
          <Text style={styles.sectionTitle}>Recent Performance</Text>
          <View style={styles.trendContainer}>
            <Text style={styles.trendIcon}>{trendIcon}</Text>
            <View style={styles.trendInfo}>
              <Text style={[styles.trendText, { color: trendColor }]}>
                {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
              </Text>
              <Text style={styles.trendSubtext}>
                Last {Math.min(5, recentPerformance.length)} games
              </Text>
            </View>
          </View>
          
          {/* Recent Games Mini Chart */}
          <View style={styles.miniChart}>
            {recentPerformance.slice(0, 10).map((game, index) => (
              <View
                key={game.gameId}
                style={[
                  styles.miniBar,
                  { 
                    backgroundColor: game.won ? '#10b981' : '#ef4444',
                    opacity: 1 - (index * 0.1)
                  }
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Additional Stats */}
      <View style={styles.additionalStats}>
        <View style={styles.additionalStatItem}>
          <Text style={styles.additionalStatLabel}>Favorite Role</Text>
          <Text style={styles.additionalStatValue}>
            {statistics.favoriteRole.charAt(0).toUpperCase() + statistics.favoriteRole.slice(1)}
          </Text>
        </View>
        
        <View style={styles.additionalStatItem}>
          <Text style={styles.additionalStatLabel}>Avg Game Duration</Text>
          <Text style={styles.additionalStatValue}>
            {Math.round(statistics.averageGameDuration / 60000)}m
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  trendSection: {
    marginBottom: 20,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  trendInfo: {
    flex: 1,
  },
  trendText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trendSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 2,
  },
  miniBar: {
    flex: 1,
    height: '60%',
    borderRadius: 2,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  additionalStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  additionalStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  additionalStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});