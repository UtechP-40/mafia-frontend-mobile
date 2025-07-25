import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  const defaultProps = {
    phase: 'day' as const,
    isAlive: true,
    isHost: false,
    canPerformAction: true,
    hasPerformedAction: false,
  };

  const mockCallbacks = {
    onStartGame: jest.fn(),
    onUseAbility: jest.fn(),
    onEndPhase: jest.fn(),
    onLeaveGame: jest.fn(),
    onViewResults: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lobby Phase Actions', () => {
    it('shows start game button for host', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          isHost={true}
          onStartGame={mockCallbacks.onStartGame}
        />
      );
      
      expect(getByText('Start Game')).toBeTruthy();
    });

    it('does not show start game button for non-host', () => {
      const { queryByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          isHost={false}
        />
      );
      
      expect(queryByText('Start Game')).toBeNull();
    });

    it('shows leave room button in lobby', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      expect(getByText('Leave Room')).toBeTruthy();
    });

    it('calls onStartGame when start game button is pressed', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          isHost={true}
          onStartGame={mockCallbacks.onStartGame}
        />
      );
      
      fireEvent.press(getByText('Start Game'));
      expect(mockCallbacks.onStartGame).toHaveBeenCalledTimes(1);
    });

    it('calls onLeaveGame when leave room button is pressed', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      fireEvent.press(getByText('Leave Room'));
      expect(mockCallbacks.onLeaveGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('Day Phase Actions', () => {
    it('shows leave game button during day phase', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="day"
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      expect(getByText('Leave Game')).toBeTruthy();
    });

    it('does not show ability buttons during day phase', () => {
      const { queryByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="day"
          playerRole="mafia"
        />
      );
      
      expect(queryByText('Choose Target')).toBeNull();
    });
  });

  describe('Night Phase Actions', () => {
    it('shows mafia ability button for mafia player', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="mafia"
          onUseAbility={mockCallbacks.onUseAbility}
        />
      );
      
      expect(getByText('Choose Target')).toBeTruthy();
    });

    it('shows detective ability button for detective player', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="detective"
          onUseAbility={mockCallbacks.onUseAbility}
        />
      );
      
      expect(getByText('Investigate Player')).toBeTruthy();
    });

    it('shows doctor ability button for doctor player', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="doctor"
          onUseAbility={mockCallbacks.onUseAbility}
        />
      );
      
      expect(getByText('Protect Player')).toBeTruthy();
    });

    it('does not show ability button for villager', () => {
      const { queryByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="villager"
        />
      );
      
      expect(queryByText('Choose Target')).toBeNull();
      expect(queryByText('Investigate Player')).toBeNull();
      expect(queryByText('Protect Player')).toBeNull();
    });

    it('shows completed state when action is performed', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="mafia"
          hasPerformedAction={true}
          onUseAbility={mockCallbacks.onUseAbility}
        />
      );
      
      expect(getByText('Target Selected')).toBeTruthy();
    });

    it('disables ability button when action is performed', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="mafia"
          hasPerformedAction={true}
          onUseAbility={mockCallbacks.onUseAbility}
        />
      );
      
      const button = getByText('Target Selected');
      expect(button.parent?.props.disabled).toBeTruthy();
    });

    it('disables ability button when cannot perform action', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="mafia"
          canPerformAction={false}
          onUseAbility={mockCallbacks.onUseAbility}
        />
      );
      
      const button = getByText('Choose Target');
      expect(button.parent?.props.disabled).toBeTruthy();
    });

    it('calls onUseAbility when ability button is pressed', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="mafia"
          onUseAbility={mockCallbacks.onUseAbility}
        />
      );
      
      fireEvent.press(getByText('Choose Target'));
      expect(mockCallbacks.onUseAbility).toHaveBeenCalledTimes(1);
    });

    it('shows only leave game button for dead players', () => {
      const { getByText, queryByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="mafia"
          isAlive={false}
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      expect(getByText('Leave Game')).toBeTruthy();
      expect(queryByText('Choose Target')).toBeNull();
    });
  });

  describe('Voting Phase Actions', () => {
    it('shows leave game button for alive players', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="voting"
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      expect(getByText('Leave Game')).toBeTruthy();
    });

    it('shows leave game button for dead players', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="voting"
          isAlive={false}
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      expect(getByText('Leave Game')).toBeTruthy();
    });

    it('does not show voting-specific buttons (handled by VotingInterface)', () => {
      const { queryByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="voting"
        />
      );
      
      expect(queryByText('Vote')).toBeNull();
      expect(queryByText('Skip Vote')).toBeNull();
    });
  });

  describe('Results Phase Actions', () => {
    it('shows view results button', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="results"
          onViewResults={mockCallbacks.onViewResults}
        />
      );
      
      expect(getByText('View Full Results')).toBeTruthy();
    });

    it('shows play again button for host', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="results"
          isHost={true}
          onStartGame={mockCallbacks.onStartGame}
        />
      );
      
      expect(getByText('Play Again')).toBeTruthy();
    });

    it('does not show play again button for non-host', () => {
      const { queryByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="results"
          isHost={false}
        />
      );
      
      expect(queryByText('Play Again')).toBeNull();
    });

    it('shows leave game button', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="results"
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      expect(getByText('Leave Game')).toBeTruthy();
    });

    it('calls onViewResults when view results button is pressed', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="results"
          onViewResults={mockCallbacks.onViewResults}
        />
      );
      
      fireEvent.press(getByText('View Full Results'));
      expect(mockCallbacks.onViewResults).toHaveBeenCalledTimes(1);
    });

    it('calls onStartGame when play again button is pressed', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="results"
          isHost={true}
          onStartGame={mockCallbacks.onStartGame}
        />
      );
      
      fireEvent.press(getByText('Play Again'));
      expect(mockCallbacks.onStartGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('disables all buttons when disabled prop is true', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          isHost={true}
          disabled={true}
          onStartGame={mockCallbacks.onStartGame}
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      const startButton = getByText('Start Game');
      const leaveButton = getByText('Leave Room');
      
      expect(startButton.parent?.props.disabled).toBeTruthy();
      expect(leaveButton.parent?.props.disabled).toBeTruthy();
    });

    it('does not call callbacks when buttons are disabled', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          isHost={true}
          disabled={true}
          onStartGame={mockCallbacks.onStartGame}
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      fireEvent.press(getByText('Start Game'));
      fireEvent.press(getByText('Leave Room'));
      
      expect(mockCallbacks.onStartGame).not.toHaveBeenCalled();
      expect(mockCallbacks.onLeaveGame).not.toHaveBeenCalled();
    });
  });

  describe('Missing Callbacks', () => {
    it('disables start game button when callback is missing', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          isHost={true}
          // onStartGame is undefined
        />
      );
      
      const startButton = getByText('Start Game');
      expect(startButton.parent?.props.disabled).toBeTruthy();
    });

    it('disables view results button when callback is missing', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="results"
          // onViewResults is undefined
        />
      );
      
      const viewButton = getByText('View Full Results');
      expect(viewButton.parent?.props.disabled).toBeTruthy();
    });
  });

  describe('Unknown Phase', () => {
    it('shows leave game button for unknown phase', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase={'unknown' as any}
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      expect(getByText('Leave Game')).toBeTruthy();
    });

    it('does not show other buttons for unknown phase', () => {
      const { queryByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase={'unknown' as any}
        />
      );
      
      expect(queryByText('Start Game')).toBeNull();
      expect(queryByText('Choose Target')).toBeNull();
      expect(queryByText('View Full Results')).toBeNull();
    });
  });

  describe('Role-Specific Button Text', () => {
    it('shows correct text for mafia actions', () => {
      const { getByText, rerender } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="mafia"
          hasPerformedAction={false}
        />
      );
      
      expect(getByText('Choose Target')).toBeTruthy();
      
      rerender(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="mafia"
          hasPerformedAction={true}
        />
      );
      
      expect(getByText('Target Selected')).toBeTruthy();
    });

    it('shows correct text for detective actions', () => {
      const { getByText, rerender } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="detective"
          hasPerformedAction={false}
        />
      );
      
      expect(getByText('Investigate Player')).toBeTruthy();
      
      rerender(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="detective"
          hasPerformedAction={true}
        />
      );
      
      expect(getByText('Investigation Complete')).toBeTruthy();
    });

    it('shows correct text for doctor actions', () => {
      const { getByText, rerender } = render(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="doctor"
          hasPerformedAction={false}
        />
      );
      
      expect(getByText('Protect Player')).toBeTruthy();
      
      rerender(
        <ActionButtons 
          {...defaultProps}
          phase="night"
          playerRole="doctor"
          hasPerformedAction={true}
        />
      );
      
      expect(getByText('Protection Set')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible button labels', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          isHost={true}
          onStartGame={mockCallbacks.onStartGame}
          onLeaveGame={mockCallbacks.onLeaveGame}
        />
      );
      
      const startButton = getByText('Start Game');
      const leaveButton = getByText('Leave Room');
      
      expect(startButton.props.accessible).not.toBe(false);
      expect(leaveButton.props.accessible).not.toBe(false);
    });

    it('maintains accessibility when disabled', () => {
      const { getByText } = render(
        <ActionButtons 
          {...defaultProps}
          phase="lobby"
          isHost={true}
          disabled={true}
          onStartGame={mockCallbacks.onStartGame}
        />
      );
      
      const startButton = getByText('Start Game');
      expect(startButton.props.accessible).not.toBe(false);
    });
  });
});