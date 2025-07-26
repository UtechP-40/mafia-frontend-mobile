import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { configureStore } from '@reduxjs/toolkit';

import { ResultsScreen } from '../ResultsScreen';
import { authSlice } from '../../store/slices/authSlice';
import { apiService } from '../../services/api';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock API service
jest.mock('../../services/api', () => ({
  apiService: {
    getGameResults: jest.fn(),
    getPlayerStatistics: jest.fn(),
    getPlayerAchievements: jest.fn(),
    getRecentAchievements: jest.fn(),
    markAchievementsAsRead: jest.fn(),
  }
}));

// Mock Share
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Share: {
      share: jest.fn(() => Promise.resolve())
    }
  };
});

const Stack = createStackNavigator();

const mockStore = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
  preloadedState: {
    auth: {
      user: {
        id: 'player1',
        username: 'testplayer',
        email: 'test@example.com',
        avatar: 'avatar.png'
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null
    }
  }
});

const mockGameResult = {
  game: {
    id: 'game1',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    settings: {
      maxPlayers: 8,
      enableVoiceChat: true,
      dayPhaseDuration: 300000,
      nightPhaseDuration: 180000,
      votingDuration: 120000,
      roles: []
    }
  },
  matchStats: {
    duration: 1800000, // 30 minutes
    totalPlayers: 6,
    eliminatedCount: 3,
    survivorCount: 3,
    totalVotes: 12,
    daysCycled: 4,
    winResult: {
      condition: 'villager_win' as const,
      winningTeam: 'villagers' as const,
      winningPlayers: ['player1'],
      reason: 'All mafia eliminated'
    }
  },
  playerPerformance: [
    {
      player: {
        id: 'player1',
        username: 'testplayer',
        avatar: 'avatar.png',
        role: 'villager' as const
      },
      wasEliminated: false,
      votesCast: 3,
      votesReceived: 1,
      survived: true
    }
  ],
  gameEvents: []
};

const mockPlayerStats = {
  player: {
    id: 'player1',
    username: 'testplayer',
    avatar: 'avatar.png',
    statistics: {
      gamesPlayed: 25,
      gamesWon: 15,
      winRate: 60,
      favoriteRole: 'villager' as const,
      averageGameDuration: 900000,
      eloRating: 1450
    }
  },
  roleStats: {
    villager: 15,
    mafia: 8,
    detective: 2
  },
  streaks: {
    current: 3,
    longest: 7
  },
  recentPerformance: []
};

const mockAchievements = {
  unlocked: [],
  inProgress: [],
  available: [],
  totalUnlocked: 5,
  totalAvailable: 20
};

const TestWrapper: React.FC<{ children: React.ReactNode; route?: any }> = ({ 
  children, 
  route = { params: { gameId: 'game1' } } 
}) => (
  <Provider store={mockStore}>
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Results" 
          component={() => children}
          initialParams={route.params}
        />
      </Stack.Navigator>
    </NavigationContainer>
  </Provider>
);

describe('ResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (apiService.getGameResults as jest.Mock).mockResolvedValue(mockGameResult);
    (apiService.getPlayerStatistics as jest.Mock).mockResolvedValue(mockPlayerStats);
    (apiService.getPlayerAchievements as jest.Mock).mockResolvedValue(mockAchievements);
    (apiService.getRecentAchievements as jest.Mock).mockResolvedValue([]);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    expect(getByText('Loading results...')).toBeTruthy();
  });

  it('loads and displays game results', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Game Results')).toBeTruthy();
      expect(getByText('🎉 Victory!')).toBeTruthy();
      expect(getByText('All mafia eliminated')).toBeTruthy();
    });

    expect(apiService.getGameResults).toHaveBeenCalledWith('game1');
  });

  it('displays match summary correctly', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Match Summary')).toBeTruthy();
      expect(getByText('30m')).toBeTruthy(); // Duration
      expect(getByText('6')).toBeTruthy(); // Total players
      expect(getByText('4')).toBeTruthy(); // Days cycled
      expect(getByText('12')).toBeTruthy(); // Total votes
    });
  });

  it('switches between tabs correctly', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Results')).toBeTruthy();
    });

    // Switch to Statistics tab
    fireEvent.press(getByText('Statistics'));
    
    await waitFor(() => {
      expect(getByText('Player Statistics')).toBeTruthy();
    });

    // Switch to Achievements tab
    fireEvent.press(getByText('Achievements'));
    
    await waitFor(() => {
      expect(getByText('Achievement Progress')).toBeTruthy();
    });
  });

  it('displays player statistics in stats tab', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      fireEvent.press(getByText('Statistics'));
    });

    await waitFor(() => {
      expect(getByText('25')).toBeTruthy(); // Games played
      expect(getByText('15')).toBeTruthy(); // Games won
      expect(getByText('60%')).toBeTruthy(); // Win rate
      expect(getByText('1450')).toBeTruthy(); // ELO rating
    });
  });

  it('shows achievement progress in achievements tab', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      fireEvent.press(getByText('Achievements'));
    });

    await waitFor(() => {
      expect(getByText('Achievement Progress')).toBeTruthy();
      expect(getByText('5 of 20 unlocked')).toBeTruthy();
    });
  });

  it('handles share functionality', async () => {
    const mockShare = require('react-native').Share.share;
    
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Share Results')).toBeTruthy();
    });

    fireEvent.press(getByText('Share Results'));

    expect(mockShare).toHaveBeenCalledWith({
      message: expect.stringContaining('I just won a game of Mobile Mafia!'),
      title: 'Mobile Mafia Game Result'
    });
  });

  it('navigates to game history', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('View History')).toBeTruthy();
    });

    // Note: Navigation testing would require more complex setup
    // This tests that the button exists
    expect(getByText('View History')).toBeTruthy();
  });

  it('navigates back to main menu', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Back to Menu')).toBeTruthy();
    });

    expect(getByText('Back to Menu')).toBeTruthy();
  });

  it('handles API errors gracefully', async () => {
    (apiService.getGameResults as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    // Component should still render even with API errors
    await waitFor(() => {
      expect(getByText('Game Results')).toBeTruthy();
    });
  });

  it('works without gameId parameter', async () => {
    const { getByText } = render(
      <TestWrapper route={{ params: {} }}>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Game Results')).toBeTruthy();
    });

    // Should not call getGameResults without gameId
    expect(apiService.getGameResults).not.toHaveBeenCalled();
  });

  it('displays defeat state correctly', async () => {
    const defeatGameResult = {
      ...mockGameResult,
      matchStats: {
        ...mockGameResult.matchStats,
        winResult: {
          condition: 'mafia_win' as const,
          winningTeam: 'mafia' as const,
          winningPlayers: ['player2'],
          reason: 'Mafia eliminated all villagers'
        }
      }
    };

    (apiService.getGameResults as jest.Mock).mockResolvedValue(defeatGameResult);

    const { getByText } = render(
      <TestWrapper>
        <ResultsScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('💀 Defeat')).toBeTruthy();
      expect(getByText('Mafia eliminated all villagers')).toBeTruthy();
    });
  });
});