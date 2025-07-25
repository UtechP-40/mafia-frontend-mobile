import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PlayerCard } from '../PlayerCard';

describe('PlayerCard', () => {
  const mockPlayer = {
    id: 'player-1',
    username: 'TestPlayer',
    avatar: '',
    isAlive: true,
    isHost: false,
    isReady: false,
  };

  describe('Basic Rendering', () => {
    it('renders player information correctly', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} />
      );
      
      expect(getByText('TestPlayer')).toBeTruthy();
      expect(getByText('T')).toBeTruthy(); // Avatar initial
    });

    it('displays host badge for host players', () => {
      const hostPlayer = { ...mockPlayer, isHost: true };
      const { getByText } = render(
        <PlayerCard player={hostPlayer} />
      );
      
      expect(getByText('HOST')).toBeTruthy();
    });

    it('applies eliminated styling for dead players', () => {
      const deadPlayer = { ...mockPlayer, isAlive: false };
      const { getByText } = render(
        <PlayerCard player={deadPlayer} />
      );
      
      const card = getByText('TestPlayer').parent?.parent?.parent;
      expect(card?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ opacity: 0.5 })
        ])
      );
    });

    it('generates correct avatar initial from username', () => {
      const players = [
        { ...mockPlayer, username: 'alice' },
        { ...mockPlayer, username: 'Bob' },
        { ...mockPlayer, username: 'charlie123' },
      ];

      players.forEach((player) => {
        const { getByText } = render(<PlayerCard player={player} />);
        const expectedInitial = player.username.charAt(0).toUpperCase();
        expect(getByText(expectedInitial)).toBeTruthy();
      });
    });
  });

  describe('Ready State Display', () => {
    it('shows ready state when enabled', () => {
      const readyPlayer = { ...mockPlayer, isReady: true };
      const { getByText } = render(
        <PlayerCard player={readyPlayer} showReadyState={true} />
      );
      
      expect(getByText('READY')).toBeTruthy();
    });

    it('shows not ready state when player is not ready', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} showReadyState={true} />
      );
      
      expect(getByText('NOT READY')).toBeTruthy();
    });

    it('does not show ready state when disabled', () => {
      const readyPlayer = { ...mockPlayer, isReady: true };
      const { queryByText } = render(
        <PlayerCard player={readyPlayer} showReadyState={false} />
      );
      
      expect(queryByText('READY')).toBeNull();
      expect(queryByText('NOT READY')).toBeNull();
    });

    it('shows HOST instead of ready state for host players', () => {
      const hostPlayer = { ...mockPlayer, isHost: true, isReady: false };
      const { getByText, queryByText } = render(
        <PlayerCard player={hostPlayer} showReadyState={true} />
      );
      
      expect(getByText('HOST')).toBeTruthy();
      expect(queryByText('READY')).toBeNull();
      expect(queryByText('NOT READY')).toBeNull();
    });

    it('applies ready styling when player is ready', () => {
      const readyPlayer = { ...mockPlayer, isReady: true };
      const { getByText } = render(
        <PlayerCard player={readyPlayer} showReadyState={true} />
      );
      
      const card = getByText('TestPlayer').parent?.parent?.parent;
      expect(card?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#10b981' })
        ])
      );
    });

    it('applies ready styling when player is host', () => {
      const hostPlayer = { ...mockPlayer, isHost: true };
      const { getByText } = render(
        <PlayerCard player={hostPlayer} showReadyState={true} />
      );
      
      const card = getByText('TestPlayer').parent?.parent?.parent;
      expect(card?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#10b981' })
        ])
      );
    });
  });

  describe('Ready Indicator Dot', () => {
    it('shows inactive ready dot when player is not ready', () => {
      const { UNSAFE_getByProps } = render(
        <PlayerCard player={mockPlayer} showReadyState={true} />
      );
      
      const readyDot = UNSAFE_getByProps({ 
        style: expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#6b7280' })
        ])
      });
      expect(readyDot).toBeTruthy();
    });

    it('shows active ready dot when player is ready', () => {
      const readyPlayer = { ...mockPlayer, isReady: true };
      const { UNSAFE_getByProps } = render(
        <PlayerCard player={readyPlayer} showReadyState={true} />
      );
      
      const readyDot = UNSAFE_getByProps({ 
        style: expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#10b981' })
        ])
      });
      expect(readyDot).toBeTruthy();
    });

    it('shows active ready dot when player is host', () => {
      const hostPlayer = { ...mockPlayer, isHost: true };
      const { UNSAFE_getByProps } = render(
        <PlayerCard player={hostPlayer} showReadyState={true} />
      );
      
      const readyDot = UNSAFE_getByProps({ 
        style: expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#10b981' })
        ])
      });
      expect(readyDot).toBeTruthy();
    });

    it('does not show ready dot when ready state is disabled', () => {
      const { UNSAFE_queryByProps } = render(
        <PlayerCard player={mockPlayer} showReadyState={false} />
      );
      
      const readyDot = UNSAFE_queryByProps({ 
        style: expect.arrayContaining([
          expect.objectContaining({ position: 'absolute' })
        ])
      });
      expect(readyDot).toBeNull();
    });
  });

  describe('Badge Styling', () => {
    it('applies correct styling to host badge', () => {
      const hostPlayer = { ...mockPlayer, isHost: true };
      const { getByText } = render(
        <PlayerCard player={hostPlayer} />
      );
      
      const hostBadge = getByText('HOST').parent;
      expect(hostBadge?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#fbbf24' })
        ])
      );
    });

    it('applies correct styling to ready badge when not ready', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} showReadyState={true} />
      );
      
      const readyBadge = getByText('NOT READY').parent;
      expect(readyBadge?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#374151' })
        ])
      );
    });

    it('applies correct styling to ready badge when ready', () => {
      const readyPlayer = { ...mockPlayer, isReady: true };
      const { getByText } = render(
        <PlayerCard player={readyPlayer} showReadyState={true} />
      );
      
      const readyBadge = getByText('READY').parent;
      expect(readyBadge?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#10b981' })
        ])
      );
    });
  });

  describe('Username Handling', () => {
    it('truncates long usernames', () => {
      const longUsernamePlayer = { 
        ...mockPlayer, 
        username: 'VeryLongUsernameThatshouldBeTruncated' 
      };
      const { getByText } = render(
        <PlayerCard player={longUsernamePlayer} />
      );
      
      const usernameText = getByText('VeryLongUsernameThatshouldBeTruncated');
      expect(usernameText.props.numberOfLines).toBe(1);
    });

    it('handles empty username gracefully', () => {
      const emptyUsernamePlayer = { ...mockPlayer, username: '' };
      const { getByText } = render(
        <PlayerCard player={emptyUsernamePlayer} />
      );
      
      // Should still show empty string and not crash
      expect(getByText('')).toBeTruthy();
    });

    it('handles special characters in username', () => {
      const specialCharPlayer = { ...mockPlayer, username: 'Player@123!' };
      const { getByText } = render(
        <PlayerCard player={specialCharPlayer} />
      );
      
      expect(getByText('Player@123!')).toBeTruthy();
      expect(getByText('P')).toBeTruthy(); // Avatar initial
    });
  });

  describe('Animation Support', () => {
    it('accepts animated prop without crashing', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} animated={true} />
      );
      
      expect(getByText('TestPlayer')).toBeTruthy();
    });

    it('works without animated prop', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} />
      );
      
      expect(getByText('TestPlayer')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible content', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} />
      );
      
      const usernameText = getByText('TestPlayer');
      expect(usernameText.props.accessible).not.toBe(false);
    });

    it('provides accessible host badge', () => {
      const hostPlayer = { ...mockPlayer, isHost: true };
      const { getByText } = render(
        <PlayerCard player={hostPlayer} />
      );
      
      const hostBadge = getByText('HOST');
      expect(hostBadge.props.accessible).not.toBe(false);
    });

    it('provides accessible ready state information', () => {
      const readyPlayer = { ...mockPlayer, isReady: true };
      const { getByText } = render(
        <PlayerCard player={readyPlayer} showReadyState={true} />
      );
      
      const readyBadge = getByText('READY');
      expect(readyBadge.props.accessible).not.toBe(false);
    });
  });

  describe('Role Display', () => {
    it('shows role badge when showRole is enabled', () => {
      const mafiaPlayer = { ...mockPlayer, role: 'mafia' as const };
      const { getByText } = render(
        <PlayerCard player={mafiaPlayer} showRole={true} />
      );
      
      expect(getByText('MAFIA')).toBeTruthy();
    });

    it('does not show role badge when showRole is disabled', () => {
      const mafiaPlayer = { ...mockPlayer, role: 'mafia' as const };
      const { queryByText } = render(
        <PlayerCard player={mafiaPlayer} showRole={false} />
      );
      
      expect(queryByText('MAFIA')).toBeNull();
    });

    it('applies correct role colors to avatar', () => {
      const roles = [
        { role: 'mafia' as const, color: '#ef4444' },
        { role: 'detective' as const, color: '#3b82f6' },
        { role: 'doctor' as const, color: '#10b981' },
        { role: 'mayor' as const, color: '#f59e0b' },
        { role: 'villager' as const, color: '#6366f1' },
      ];

      roles.forEach(({ role, color }) => {
        const rolePlayer = { ...mockPlayer, role };
        const { getByText } = render(
          <PlayerCard player={rolePlayer} showRole={true} />
        );
        
        const avatar = getByText('T').parent;
        expect(avatar?.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ backgroundColor: color })
          ])
        );
      });
    });

    it('displays correct role names', () => {
      const roles = [
        { role: 'mafia' as const, display: 'MAFIA' },
        { role: 'detective' as const, display: 'DETECTIVE' },
        { role: 'doctor' as const, display: 'DOCTOR' },
        { role: 'mayor' as const, display: 'MAYOR' },
        { role: 'villager' as const, display: 'VILLAGER' },
      ];

      roles.forEach(({ role, display }) => {
        const rolePlayer = { ...mockPlayer, role };
        const { getByText } = render(
          <PlayerCard player={rolePlayer} showRole={true} />
        );
        
        expect(getByText(display)).toBeTruthy();
      });
    });
  });

  describe('Voting State', () => {
    it('applies voting styling when isVoting is true', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} isVoting={true} />
      );
      
      const card = getByText('TestPlayer').parent?.parent?.parent;
      expect(card?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#f59e0b' })
        ])
      );
    });

    it('shows voting indicator when isVoting is true', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} isVoting={true} />
      );
      
      expect(getByText('VOTE')).toBeTruthy();
    });

    it('does not show voting indicator when isVoting is false', () => {
      const { queryByText } = render(
        <PlayerCard player={mockPlayer} isVoting={false} />
      );
      
      expect(queryByText('VOTE')).toBeNull();
    });
  });

  describe('Selection State', () => {
    it('applies selected styling when isSelected is true', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} isSelected={true} />
      );
      
      const card = getByText('TestPlayer').parent?.parent?.parent;
      expect(card?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#6366f1' })
        ])
      );
    });

    it('shows selection indicator when isSelected is true', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} isSelected={true} />
      );
      
      expect(getByText('✓')).toBeTruthy();
    });

    it('does not show selection indicator when isSelected is false', () => {
      const { queryByText } = render(
        <PlayerCard player={mockPlayer} isSelected={false} />
      );
      
      expect(queryByText('✓')).toBeNull();
    });
  });

  describe('Touch Interaction', () => {
    it('calls onSelect when card is pressed', () => {
      const mockOnSelect = jest.fn();
      const { getByText } = render(
        <PlayerCard player={mockPlayer} onSelect={mockOnSelect} />
      );
      
      fireEvent.press(getByText('TestPlayer').parent?.parent?.parent);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('does not call onSelect when player is eliminated', () => {
      const mockOnSelect = jest.fn();
      const deadPlayer = { ...mockPlayer, isAlive: false };
      const { getByText } = render(
        <PlayerCard player={deadPlayer} onSelect={mockOnSelect} />
      );
      
      fireEvent.press(getByText('TestPlayer').parent?.parent?.parent);
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('renders as TouchableOpacity when onSelect is provided', () => {
      const mockOnSelect = jest.fn();
      const { getByText } = render(
        <PlayerCard player={mockPlayer} onSelect={mockOnSelect} />
      );
      
      const card = getByText('TestPlayer').parent?.parent?.parent;
      expect(card?.type).toBe('TouchableOpacity');
    });

    it('renders as View when onSelect is not provided', () => {
      const { getByText } = render(
        <PlayerCard player={mockPlayer} />
      );
      
      const card = getByText('TestPlayer').parent?.parent?.parent;
      expect(card?.type).toBe('View');
    });
  });

  describe('Elimination Overlay', () => {
    it('shows elimination overlay for dead players', () => {
      const deadPlayer = { ...mockPlayer, isAlive: false };
      const { getByText } = render(
        <PlayerCard player={deadPlayer} />
      );
      
      expect(getByText('ELIMINATED')).toBeTruthy();
    });

    it('does not show elimination overlay for alive players', () => {
      const { queryByText } = render(
        <PlayerCard player={mockPlayer} />
      );
      
      expect(queryByText('ELIMINATED')).toBeNull();
    });

    it('applies correct styling to elimination overlay', () => {
      const deadPlayer = { ...mockPlayer, isAlive: false };
      const { getByText } = render(
        <PlayerCard player={deadPlayer} />
      );
      
      const overlay = getByText('ELIMINATED').parent;
      expect(overlay?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          })
        ])
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined isReady property', () => {
      const playerWithoutReady = {
        id: 'player-1',
        username: 'TestPlayer',
        avatar: '',
        isAlive: true,
        isHost: false,
        // isReady is undefined
      };
      
      const { getByText } = render(
        <PlayerCard player={playerWithoutReady} showReadyState={true} />
      );
      
      expect(getByText('NOT READY')).toBeTruthy();
    });

    it('handles both host and ready states correctly', () => {
      const hostReadyPlayer = { ...mockPlayer, isHost: true, isReady: true };
      const { getByText, queryByText } = render(
        <PlayerCard player={hostReadyPlayer} showReadyState={true} />
      );
      
      // Should show HOST badge, not ready badge
      expect(getByText('HOST')).toBeTruthy();
      expect(queryByText('READY')).toBeNull();
    });

    it('handles eliminated host player', () => {
      const eliminatedHost = { ...mockPlayer, isHost: true, isAlive: false };
      const { getByText } = render(
        <PlayerCard player={eliminatedHost} />
      );
      
      expect(getByText('HOST')).toBeTruthy();
      expect(getByText('TestPlayer')).toBeTruthy();
      expect(getByText('ELIMINATED')).toBeTruthy();
    });

    it('handles unknown role gracefully', () => {
      const unknownRolePlayer = { ...mockPlayer, role: undefined };
      const { getByText } = render(
        <PlayerCard player={unknownRolePlayer} showRole={true} />
      );
      
      // Should not crash and should render normally
      expect(getByText('TestPlayer')).toBeTruthy();
    });

    it('handles multiple states simultaneously', () => {
      const complexPlayer = { 
        ...mockPlayer, 
        role: 'mafia' as const,
        isHost: true,
        isReady: true,
        isAlive: false
      };
      const { getByText } = render(
        <PlayerCard 
          player={complexPlayer} 
          showRole={true}
          showReadyState={true}
          isSelected={true}
          isVoting={true}
        />
      );
      
      expect(getByText('TestPlayer')).toBeTruthy();
      expect(getByText('HOST')).toBeTruthy();
      expect(getByText('MAFIA')).toBeTruthy();
      expect(getByText('ELIMINATED')).toBeTruthy();
    });
  });
});