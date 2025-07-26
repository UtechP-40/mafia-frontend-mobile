import React from 'react';
import { render } from '@testing-library/react-native';
import { StatisticsChart } from '../StatisticsChart';
import { PlayerStats, RecentGamePerformance } from '../../../types/game';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('StatisticsChart', () => {
  const mockStatistics: PlayerStats = {
    gamesPlayed: 25,
    gamesWon: 15,
    winRate: 60,
    favoriteRole: 'villager',
    averageGameDuration: 900000, // 15 minutes
    eloRating: 1450
  };

  const mockRecentPerformance: RecentGamePerformance[] = [
    {
      gameId: '1',
      date: new Date('2024-01-15'),
      won: true,
      role: 'villager',
      duration: 800000
    },
    {
      gameId: '2',
      date: new Date('2024-01-14'),
      won: false,
      role: 'mafia',
      duration: 1200000
    },
    {
      gameId: '3',
      date: new Date('2024-01-13'),
      won: true,
      role: 'detective',
      duration: 900000
    }
  ];

  it('renders statistics correctly', () => {
    const { getByText } = render(
      <StatisticsChart statistics={mockStatistics} />
    );

    expect(getByText('Player Statistics')).toBeTruthy();
    expect(getByText('25')).toBeTruthy(); // Games played
    expect(getByText('15')).toBeTruthy(); // Games won
    expect(getByText('60%')).toBeTruthy(); // Win rate
    expect(getByText('1450')).toBeTruthy(); // ELO rating
  });

  it('displays performance overview section', () => {
    const { getByText } = render(
      <StatisticsChart statistics={mockStatistics} />
    );

    expect(getByText('Performance Overview')).toBeTruthy();
    expect(getByText('Games Played')).toBeTruthy();
    expect(getByText('Win Rate')).toBeTruthy();
    expect(getByText('ELO Rating')).toBeTruthy();
  });

  it('shows recent performance when provided', () => {
    const { getByText } = render(
      <StatisticsChart 
        statistics={mockStatistics} 
        recentPerformance={mockRecentPerformance}
      />
    );

    expect(getByText('Recent Performance')).toBeTruthy();
    expect(getByText('Last 3 games')).toBeTruthy();
  });

  it('displays additional stats correctly', () => {
    const { getByText } = render(
      <StatisticsChart statistics={mockStatistics} />
    );

    expect(getByText('Favorite Role')).toBeTruthy();
    expect(getByText('Villager')).toBeTruthy();
    expect(getByText('Avg Game Duration')).toBeTruthy();
    expect(getByText('15m')).toBeTruthy();
  });

  it('handles zero statistics gracefully', () => {
    const zeroStats: PlayerStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      favoriteRole: 'villager',
      averageGameDuration: 0,
      eloRating: 1200
    };

    const { getByText } = render(
      <StatisticsChart statistics={zeroStats} />
    );

    expect(getByText('0')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
  });

  it('applies correct win rate colors', () => {
    const highWinRateStats: PlayerStats = {
      ...mockStatistics,
      winRate: 75
    };

    const { getByText } = render(
      <StatisticsChart statistics={highWinRateStats} />
    );

    const winRateElement = getByText('75%');
    expect(winRateElement).toBeTruthy();
    // Note: Testing style colors in React Native requires more complex setup
    // This is a basic structure test
  });

  it('shows performance trend indicators', () => {
    const improvingPerformance: RecentGamePerformance[] = [
      { gameId: '1', date: new Date(), won: true, role: 'villager', duration: 800000 },
      { gameId: '2', date: new Date(), won: true, role: 'villager', duration: 800000 },
      { gameId: '3', date: new Date(), won: true, role: 'villager', duration: 800000 },
      { gameId: '4', date: new Date(), won: true, role: 'villager', duration: 800000 },
    ];

    const { getByText } = render(
      <StatisticsChart 
        statistics={mockStatistics} 
        recentPerformance={improvingPerformance}
      />
    );

    expect(getByText('Improving')).toBeTruthy();
  });

  it('can disable animations', () => {
    const { getByText } = render(
      <StatisticsChart 
        statistics={mockStatistics} 
        animated={false}
      />
    );

    expect(getByText('Player Statistics')).toBeTruthy();
    // Component should render without animation-related errors
  });
});