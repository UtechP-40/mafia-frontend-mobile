import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AchievementCard } from '../AchievementCard';
import { Achievement, PlayerAchievement } from '../../../types/game';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('AchievementCard', () => {
  const mockAchievement: Achievement = {
    id: '1',
    key: 'first_game',
    name: 'First Steps',
    description: 'Play your first game of Mafia',
    type: 'games_played',
    rarity: 'common',
    icon: '🎮',
    requirement: {
      type: 'games_played',
      value: 1
    },
    reward: {
      experience: 50
    },
    isActive: true
  };

  const mockPlayerAchievement: PlayerAchievement = {
    id: '1',
    playerId: 'player1',
    achievementId: mockAchievement,
    unlockedAt: new Date('2024-01-15'),
    progress: 1,
    isCompleted: true,
    notificationSent: false,
    completionPercentage: 100
  };

  it('renders achievement information correctly', () => {
    const { getByText } = render(
      <AchievementCard achievement={mockAchievement} />
    );

    expect(getByText('First Steps')).toBeTruthy();
    expect(getByText('Play your first game of Mafia')).toBeTruthy();
    expect(getByText('🎮')).toBeTruthy();
  });

  it('shows unlocked state correctly', () => {
    const { getByText } = render(
      <AchievementCard 
        achievement={mockPlayerAchievement} 
        isUnlocked={true} 
      />
    );

    expect(getByText('First Steps')).toBeTruthy();
    expect(getByText('✓')).toBeTruthy(); // Unlocked badge
    expect(getByText('+50 XP')).toBeTruthy(); // Reward
  });

  it('displays progress bar when showProgress is true', () => {
    const inProgressAchievement: PlayerAchievement = {
      ...mockPlayerAchievement,
      progress: 0.5,
      isCompleted: false
    };

    const { getByText } = render(
      <AchievementCard 
        achievement={inProgressAchievement}
        showProgress={true}
      />
    );

    expect(getByText('0.5/1')).toBeTruthy(); // Progress text
  });

  it('handles different rarity levels', () => {
    const legendaryAchievement: Achievement = {
      ...mockAchievement,
      rarity: 'legendary',
      name: 'Legendary Achievement'
    };

    const { getByText } = render(
      <AchievementCard achievement={legendaryAchievement} />
    );

    expect(getByText('Legendary Achievement')).toBeTruthy();
    // Rarity affects styling but is harder to test without style inspection
  });

  it('shows reward information for unlocked achievements', () => {
    const achievementWithTitle: Achievement = {
      ...mockAchievement,
      reward: {
        experience: 100,
        title: 'Champion'
      }
    };

    const unlockedWithTitle: PlayerAchievement = {
      ...mockPlayerAchievement,
      achievementId: achievementWithTitle,
      isCompleted: true
    };

    const { getByText } = render(
      <AchievementCard 
        achievement={unlockedWithTitle}
        isUnlocked={true}
      />
    );

    expect(getByText('+100 XP')).toBeTruthy();
    expect(getByText('Title: "Champion"')).toBeTruthy();
  });

  it('renders different sizes correctly', () => {
    const { getByText: getSmallText } = render(
      <AchievementCard 
        achievement={mockAchievement} 
        size="small"
      />
    );

    const { getByText: getLargeText } = render(
      <AchievementCard 
        achievement={mockAchievement} 
        size="large"
      />
    );

    expect(getSmallText('First Steps')).toBeTruthy();
    expect(getLargeText('First Steps')).toBeTruthy();
    // Size affects styling but component should render in all sizes
  });

  it('handles locked achievements correctly', () => {
    const { getByText, queryByText } = render(
      <AchievementCard 
        achievement={mockAchievement}
        isUnlocked={false}
      />
    );

    expect(getByText('First Steps')).toBeTruthy();
    expect(queryByText('✓')).toBeNull(); // No unlocked badge
    expect(queryByText('+50 XP')).toBeNull(); // No reward shown
  });

  it('can disable animations', () => {
    const { getByText } = render(
      <AchievementCard 
        achievement={mockAchievement}
        animated={false}
      />
    );

    expect(getByText('First Steps')).toBeTruthy();
    // Component should render without animation-related errors
  });

  it('handles PlayerAchievement type correctly', () => {
    const { getByText } = render(
      <AchievementCard achievement={mockPlayerAchievement} />
    );

    expect(getByText('First Steps')).toBeTruthy();
    expect(getByText('Play your first game of Mafia')).toBeTruthy();
  });

  it('shows correct progress for in-progress achievements', () => {
    const partialProgress: PlayerAchievement = {
      ...mockPlayerAchievement,
      progress: 3,
      isCompleted: false,
      achievementId: {
        ...mockAchievement,
        requirement: { type: 'games_played', value: 5 }
      }
    };

    const { getByText } = render(
      <AchievementCard 
        achievement={partialProgress}
        showProgress={true}
      />
    );

    expect(getByText('3/5')).toBeTruthy();
  });
});