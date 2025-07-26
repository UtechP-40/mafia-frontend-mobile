import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PlayerCard } from '../PlayerCard';
import { Player } from '../../../types/game';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('PlayerCard', () => {
  const mockPlayer: Player = {
    id: 'player-1',
    username: 'TestPlayer',
    avatar: 'avatar1.jpg',
    isAlive: true,
    isHost: false,
  };

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders player information correctly', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('TestPlayer')).toBeTruthy();
    expect(screen.getByTestId('player-avatar')).toBeTruthy();
  });

  it('shows host indicator for host player', () => {
    const hostPlayer = { ...mockPlayer, isHost: true };
    
    render(
      <PlayerCard
        player={hostPlayer}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('HOST')).toBeTruthy();
  });

  it('shows eliminated state correctly', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={true}
        isVoting={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('ELIMINATED')).toBeTruthy();
    expect(screen.getByTestId('player-card')).toHaveStyle({
      opacity: 0.5,
    });
  });

  it('shows voting state correctly', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={false}
        isVoting={true}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('VOTING...')).toBeTruthy();
  });

  it('shows role when provided', () => {
    const playerWithRole = { ...mockPlayer, role: 'mafia' };
    
    render(
      <PlayerCard
        player={playerWithRole}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
        showRole={true}
      />
    );

    expect(screen.getByText('MAFIA')).toBeTruthy();
  });

  it('calls onSelect when card is pressed', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
      />
    );

    const playerCard = screen.getByTestId('player-card');
    fireEvent.press(playerCard);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('does not call onSelect when card is disabled', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={true}
        isVoting={false}
        onSelect={mockOnSelect}
        disabled={true}
      />
    );

    const playerCard = screen.getByTestId('player-card');
    fireEvent.press(playerCard);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('shows selected state correctly', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
        isSelected={true}
      />
    );

    expect(screen.getByTestId('player-card')).toHaveStyle({
      borderColor: '#007AFF',
      borderWidth: 2,
    });
  });

  it('shows speaking indicator when player is speaking', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
        isSpeaking={true}
      />
    );

    expect(screen.getByTestId('speaking-indicator')).toBeTruthy();
  });

  it('shows muted indicator when player is muted', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
        isMuted={true}
      />
    );

    expect(screen.getByTestId('muted-indicator')).toBeTruthy();
  });

  it('applies correct styling for different game phases', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
        gamePhase="night"
      />
    );

    expect(screen.getByTestId('player-card')).toHaveStyle({
      backgroundColor: '#1a1a2e',
    });
  });

  it('shows vote count when provided', () => {
    render(
      <PlayerCard
        player={mockPlayer}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
        voteCount={3}
      />
    );

    expect(screen.getByText('3 votes')).toBeTruthy();
  });

  it('handles long usernames correctly', () => {
    const playerWithLongName = {
      ...mockPlayer,
      username: 'VeryLongUsernameThatshouldBeTruncated',
    };
    
    render(
      <PlayerCard
        player={playerWithLongName}
        isEliminated={false}
        isVoting={false}
        onSelect={mockOnSelect}
      />
    );

    const usernameText = screen.getByText('VeryLongUsernameThatshouldBeTruncated');
    expect(usernameText.props.numberOfLines).toBe(1);
    expect(usernameText.props.ellipsizeMode).toBe('tail');
  });
});