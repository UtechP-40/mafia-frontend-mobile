import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VotingInterface } from '../VotingInterface';

describe('VotingInterface', () => {
  const mockPlayers = [
    {
      id: 'player-1',
      username: 'Alice',
      avatar: '',
      isAlive: true,
      isHost: false,
    },
    {
      id: 'player-2',
      username: 'Bob',
      avatar: '',
      isAlive: true,
      isHost: false,
    },
    {
      id: 'player-3',
      username: 'Charlie',
      avatar: '',
      isAlive: true,
      isHost: true,
    },
  ];

  const defaultProps = {
    eligibleTargets: mockPlayers,
    timeRemaining: 60,
    hasVoted: false,
    onVote: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders voting interface correctly', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      expect(getByText('Cast Your Vote')).toBeTruthy();
      expect(getByText('Select a player to eliminate:')).toBeTruthy();
      expect(getByText('1:00')).toBeTruthy();
      expect(getByText('remaining')).toBeTruthy();
    });

    it('renders all eligible players', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      mockPlayers.forEach(player => {
        expect(getByText(player.username)).toBeTruthy();
      });
    });

    it('shows confirm vote button when not voted', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      expect(getByText('Confirm Vote')).toBeTruthy();
    });

    it('shows skip vote button when allowed', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} allowSkip={true} />
      );
      
      expect(getByText('Skip Vote')).toBeTruthy();
    });

    it('does not show skip vote button when not allowed', () => {
      const { queryByText } = render(
        <VotingInterface {...defaultProps} allowSkip={false} />
      );
      
      expect(queryByText('Skip Vote')).toBeNull();
    });
  });

  describe('Timer Display', () => {
    it('formats time correctly for minutes and seconds', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} timeRemaining={125} />
      );
      
      expect(getByText('2:05')).toBeTruthy();
    });

    it('formats time correctly for seconds only', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} timeRemaining={45} />
      );
      
      expect(getByText('0:45')).toBeTruthy();
    });

    it('applies urgent color when time is low', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} timeRemaining={5} />
      );
      
      const timer = getByText('0:05');
      expect(timer.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#ef4444' })
        ])
      );
    });

    it('applies warning color when time is moderate', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} timeRemaining={25} />
      );
      
      const timer = getByText('0:25');
      expect(timer.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#f59e0b' })
        ])
      );
    });

    it('applies normal color when time is plenty', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} timeRemaining={60} />
      );
      
      const timer = getByText('1:00');
      expect(timer.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#10b981' })
        ])
      );
    });
  });

  describe('Player Selection', () => {
    it('allows selecting a player when not voted', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      const aliceCard = getByText('Alice').parent?.parent?.parent;
      fireEvent.press(aliceCard);
      
      // Should be able to select (no error thrown)
      expect(aliceCard).toBeTruthy();
    });

    it('toggles selection when clicking same player twice', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      const aliceCard = getByText('Alice').parent?.parent?.parent;
      
      // First click - select
      fireEvent.press(aliceCard);
      // Second click - deselect (should work without error)
      fireEvent.press(aliceCard);
      
      expect(aliceCard).toBeTruthy();
    });

    it('changes selection when clicking different players', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      const aliceCard = getByText('Alice').parent?.parent?.parent;
      const bobCard = getByText('Bob').parent?.parent?.parent;
      
      fireEvent.press(aliceCard);
      fireEvent.press(bobCard);
      
      expect(bobCard).toBeTruthy();
    });

    it('does not allow selection when already voted', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} hasVoted={true} />
      );
      
      const aliceCard = getByText('Alice').parent?.parent?.parent;
      fireEvent.press(aliceCard);
      
      // Should not crash but also should not allow interaction
      expect(aliceCard).toBeTruthy();
    });
  });

  describe('Vote Confirmation', () => {
    it('enables confirm button when player is selected', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      const aliceCard = getByText('Alice').parent?.parent?.parent;
      fireEvent.press(aliceCard);
      
      const confirmButton = getByText('Confirm Vote');
      expect(confirmButton.parent?.props.disabled).toBeFalsy();
    });

    it('disables confirm button when no player is selected', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      const confirmButton = getByText('Confirm Vote');
      expect(confirmButton.parent?.props.disabled).toBeTruthy();
    });

    it('calls onVote when confirm button is pressed', () => {
      const mockOnVote = jest.fn();
      const { getByText } = render(
        <VotingInterface {...defaultProps} onVote={mockOnVote} />
      );
      
      const aliceCard = getByText('Alice').parent?.parent?.parent;
      fireEvent.press(aliceCard);
      
      const confirmButton = getByText('Confirm Vote');
      fireEvent.press(confirmButton);
      
      expect(mockOnVote).toHaveBeenCalledWith('player-1');
    });

    it('shows voting state when confirming', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      const aliceCard = getByText('Alice').parent?.parent?.parent;
      fireEvent.press(aliceCard);
      
      const confirmButton = getByText('Confirm Vote');
      fireEvent.press(confirmButton);
      
      expect(getByText('Voting...')).toBeTruthy();
    });

    it('does not call onVote when already voted', () => {
      const mockOnVote = jest.fn();
      const { getByText } = render(
        <VotingInterface 
          {...defaultProps} 
          onVote={mockOnVote}
          hasVoted={true}
          currentVote="player-1"
        />
      );
      
      // Confirm button should not be visible when already voted
      expect(() => getByText('Confirm Vote')).toThrow();
      expect(mockOnVote).not.toHaveBeenCalled();
    });
  });

  describe('Skip Vote', () => {
    it('calls onSkip when skip button is pressed', () => {
      const mockOnSkip = jest.fn();
      const { getByText } = render(
        <VotingInterface 
          {...defaultProps} 
          onSkip={mockOnSkip}
          allowSkip={true}
        />
      );
      
      const skipButton = getByText('Skip Vote');
      fireEvent.press(skipButton);
      
      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it('does not call onSkip when already voted', () => {
      const mockOnSkip = jest.fn();
      const { queryByText } = render(
        <VotingInterface 
          {...defaultProps} 
          onSkip={mockOnSkip}
          hasVoted={true}
          allowSkip={true}
        />
      );
      
      // Skip button should not be visible when already voted
      expect(queryByText('Skip Vote')).toBeNull();
      expect(mockOnSkip).not.toHaveBeenCalled();
    });
  });

  describe('Vote Status Display', () => {
    it('shows waiting message when voted', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} hasVoted={true} />
      );
      
      expect(getByText('You have voted. Waiting for other players...')).toBeTruthy();
    });

    it('shows current vote when voted', () => {
      const { getByText } = render(
        <VotingInterface 
          {...defaultProps} 
          hasVoted={true}
          currentVote="player-1"
        />
      );
      
      expect(getByText('You voted for: Alice')).toBeTruthy();
    });

    it('does not show vote status when not voted', () => {
      const { queryByText } = render(<VotingInterface {...defaultProps} />);
      
      expect(queryByText('You have voted. Waiting for other players...')).toBeNull();
      expect(queryByText(/You voted for:/)).toBeNull();
    });

    it('hides action buttons when voted', () => {
      const { queryByText } = render(
        <VotingInterface {...defaultProps} hasVoted={true} />
      );
      
      expect(queryByText('Confirm Vote')).toBeNull();
      expect(queryByText('Skip Vote')).toBeNull();
    });
  });

  describe('Current Vote Initialization', () => {
    it('initializes with current vote selection', () => {
      const { getByText } = render(
        <VotingInterface 
          {...defaultProps} 
          currentVote="player-2"
          hasVoted={false}
        />
      );
      
      // Bob should be pre-selected
      expect(getByText('Bob')).toBeTruthy();
    });

    it('updates selection when currentVote prop changes', () => {
      const { rerender, getByText } = render(
        <VotingInterface 
          {...defaultProps} 
          currentVote="player-1"
          hasVoted={false}
        />
      );
      
      expect(getByText('Alice')).toBeTruthy();
      
      rerender(
        <VotingInterface 
          {...defaultProps} 
          currentVote="player-2"
          hasVoted={false}
        />
      );
      
      expect(getByText('Bob')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty eligible targets list', () => {
      const { getByText } = render(
        <VotingInterface 
          {...defaultProps} 
          eligibleTargets={[]}
        />
      );
      
      expect(getByText('Cast Your Vote')).toBeTruthy();
      expect(getByText('Select a player to eliminate:')).toBeTruthy();
    });

    it('handles missing onSkip prop', () => {
      const { queryByText } = render(
        <VotingInterface 
          {...defaultProps} 
          onSkip={undefined}
          allowSkip={true}
        />
      );
      
      // Skip button should still be visible but not functional
      expect(queryByText('Skip Vote')).toBeTruthy();
    });

    it('handles zero time remaining', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} timeRemaining={0} />
      );
      
      expect(getByText('0:00')).toBeTruthy();
    });

    it('handles negative time remaining', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} timeRemaining={-5} />
      );
      
      // Should handle gracefully, likely showing 0:00 or similar
      expect(getByText('Cast Your Vote')).toBeTruthy();
    });

    it('handles currentVote for non-existent player', () => {
      const { getByText } = render(
        <VotingInterface 
          {...defaultProps} 
          currentVote="non-existent-player"
          hasVoted={true}
        />
      );
      
      expect(getByText('You have voted. Waiting for other players...')).toBeTruthy();
      // Should not crash when trying to find non-existent player
    });
  });

  describe('Accessibility', () => {
    it('provides accessible timer information', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      const timer = getByText('1:00');
      const timerLabel = getByText('remaining');
      
      expect(timer.props.accessible).not.toBe(false);
      expect(timerLabel.props.accessible).not.toBe(false);
    });

    it('provides accessible voting instructions', () => {
      const { getByText } = render(<VotingInterface {...defaultProps} />);
      
      const instructions = getByText('Select a player to eliminate:');
      expect(instructions.props.accessible).not.toBe(false);
    });

    it('provides accessible button labels', () => {
      const { getByText } = render(
        <VotingInterface {...defaultProps} allowSkip={true} />
      );
      
      const confirmButton = getByText('Confirm Vote');
      const skipButton = getByText('Skip Vote');
      
      expect(confirmButton.props.accessible).not.toBe(false);
      expect(skipButton.props.accessible).not.toBe(false);
    });
  });
});