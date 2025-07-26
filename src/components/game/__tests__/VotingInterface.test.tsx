import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { VotingInterface } from '../VotingInterface';
import { Player } from '../../../types/game';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('VotingInterface', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      username: 'Player1',
      avatar: 'avatar1.jpg',
      isAlive: true,
      isHost: false,
    },
    {
      id: 'player-2',
      username: 'Player2',
      avatar: 'avatar2.jpg',
      isAlive: true,
      isHost: true,
    },
    {
      id: 'player-3',
      username: 'Player3',
      avatar: 'avatar3.jpg',
      isAlive: false,
      isHost: false,
    },
  ];

  const mockOnVote = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders voting interface correctly', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('Vote to Eliminate')).toBeTruthy();
    expect(screen.getByText('Time remaining: 1:00')).toBeTruthy();
    expect(screen.getByText('Skip Vote')).toBeTruthy();
  });

  it('displays eligible targets correctly', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('Player1')).toBeTruthy();
    expect(screen.getByText('Player2')).toBeTruthy();
    expect(screen.queryByText('Player3')).toBeNull(); // Eliminated player should not appear
  });

  it('formats time remaining correctly', () => {
    const { rerender } = render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={125}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('Time remaining: 2:05')).toBeTruthy();

    rerender(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={5}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('Time remaining: 0:05')).toBeTruthy();
  });

  it('shows urgent state when time is low', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={10}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByTestId('timer')).toHaveStyle({
      color: '#FF3B30',
    });
  });

  it('calls onVote when player is selected', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    const player1Card = screen.getByText('Player1');
    fireEvent.press(player1Card);

    expect(mockOnVote).toHaveBeenCalledWith('player-1');
  });

  it('calls onSkip when skip button is pressed', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    const skipButton = screen.getByText('Skip Vote');
    fireEvent.press(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('shows selected player correctly', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
        selectedTarget="player-1"
      />
    );

    const player1Card = screen.getByTestId('player-card-player-1');
    expect(player1Card).toHaveStyle({
      borderColor: '#007AFF',
      borderWidth: 2,
    });
  });

  it('disables voting when hasVoted is true', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
        hasVoted={true}
      />
    );

    expect(screen.getByText('Vote Submitted')).toBeTruthy();
    
    const player1Card = screen.getByTestId('player-card-player-1');
    expect(player1Card.props.disabled).toBe(true);
  });

  it('shows vote counts when provided', () => {
    const voteCounts = {
      'player-1': 2,
      'player-2': 1,
    };

    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
        voteCounts={voteCounts}
      />
    );

    expect(screen.getByText('2 votes')).toBeTruthy();
    expect(screen.getByText('1 vote')).toBeTruthy();
  });

  it('handles empty eligible targets', () => {
    render(
      <VotingInterface
        eligibleTargets={[]}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('No eligible targets')).toBeTruthy();
    expect(screen.queryByText('Skip Vote')).toBeNull();
  });

  it('shows different UI for night phase voting', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
        phase="night"
      />
    );

    expect(screen.getByText('Choose Target')).toBeTruthy();
    expect(screen.queryByText('Skip Vote')).toBeNull(); // No skip option in night phase
  });

  it('updates timer countdown', () => {
    jest.useFakeTimers();
    
    const { rerender } = render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('Time remaining: 1:00')).toBeTruthy();

    // Simulate time passing
    act(() => {
      rerender(
        <VotingInterface
          eligibleTargets={mockPlayers.filter(p => p.isAlive)}
          timeRemaining={59}
          onVote={mockOnVote}
          onSkip={mockOnSkip}
        />
      );
    });

    expect(screen.getByText('Time remaining: 0:59')).toBeTruthy();

    jest.useRealTimers();
  });

  it('shows confirmation dialog when voting', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
        requireConfirmation={true}
      />
    );

    const player1Card = screen.getByText('Player1');
    fireEvent.press(player1Card);

    expect(screen.getByText('Confirm Vote')).toBeTruthy();
    expect(screen.getByText('Are you sure you want to vote for Player1?')).toBeTruthy();
    expect(screen.getByText('Confirm')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('handles vote confirmation', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
        requireConfirmation={true}
      />
    );

    const player1Card = screen.getByText('Player1');
    fireEvent.press(player1Card);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.press(confirmButton);

    expect(mockOnVote).toHaveBeenCalledWith('player-1');
  });

  it('handles vote cancellation', () => {
    render(
      <VotingInterface
        eligibleTargets={mockPlayers.filter(p => p.isAlive)}
        timeRemaining={60}
        onVote={mockOnVote}
        onSkip={mockOnSkip}
        requireConfirmation={true}
      />
    );

    const player1Card = screen.getByText('Player1');
    fireEvent.press(player1Card);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockOnVote).not.toHaveBeenCalled();
    expect(screen.queryByText('Confirm Vote')).toBeNull();
  });
});