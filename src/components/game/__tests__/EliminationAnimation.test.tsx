import React from 'react';
import { render } from '@testing-library/react-native';
import { EliminationAnimation } from '../EliminationAnimation';

// Mock Animated to avoid issues in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: jest.fn((callback) => callback && callback()),
    stop: jest.fn(),
  });
  RN.Animated.spring = () => ({
    start: jest.fn((callback) => callback && callback()),
    stop: jest.fn(),
  });
  RN.Animated.parallel = (animations: any[]) => ({
    start: jest.fn((callback) => callback && callback()),
    stop: jest.fn(),
  });
  RN.Animated.Value = jest.fn(() => ({
    setValue: jest.fn(),
    interpolate: jest.fn(() => 'mocked-interpolation'),
  }));
  return RN;
});

// Mock setTimeout to avoid timing issues in tests
jest.useFakeTimers();

describe('EliminationAnimation', () => {
  const mockPlayer = {
    id: 'player-1',
    username: 'TestPlayer',
    avatar: '',
    role: 'villager' as const,
    isAlive: false,
    isHost: false,
  };

  const defaultProps = {
    eliminatedPlayer: mockPlayer,
    onAnimationComplete: jest.fn(),
    visible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Basic Rendering', () => {
    it('renders elimination animation when visible', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      expect(getByText('TestPlayer')).toBeTruthy();
      expect(getByText('ELIMINATED')).toBeTruthy();
    });

    it('does not render when not visible', () => {
      const { queryByText } = render(
        <EliminationAnimation {...defaultProps} visible={false} />
      );
      
      expect(queryByText('TestPlayer')).toBeNull();
      expect(queryByText('ELIMINATED')).toBeNull();
    });

    it('does not render when no eliminated player', () => {
      const { queryByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={null}
        />
      );
      
      expect(queryByText('ELIMINATED')).toBeNull();
    });

    it('renders player information correctly', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      expect(getByText('TestPlayer')).toBeTruthy();
      expect(getByText('was a VILLAGER')).toBeTruthy();
    });
  });

  describe('Role-Specific Icons', () => {
    it('shows correct icon for mafia player', () => {
      const mafiaPlayer = { ...mockPlayer, role: 'mafia' as const };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={mafiaPlayer}
        />
      );
      
      expect(getByText('💀')).toBeTruthy();
    });

    it('shows correct icon for detective player', () => {
      const detectivePlayer = { ...mockPlayer, role: 'detective' as const };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={detectivePlayer}
        />
      );
      
      expect(getByText('🔍')).toBeTruthy();
    });

    it('shows correct icon for doctor player', () => {
      const doctorPlayer = { ...mockPlayer, role: 'doctor' as const };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={doctorPlayer}
        />
      );
      
      expect(getByText('⚕️')).toBeTruthy();
    });

    it('shows correct icon for mayor player', () => {
      const mayorPlayer = { ...mockPlayer, role: 'mayor' as const };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={mayorPlayer}
        />
      );
      
      expect(getByText('🏛️')).toBeTruthy();
    });

    it('shows default icon for villager player', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      expect(getByText('👤')).toBeTruthy();
    });
  });

  describe('Elimination Messages', () => {
    it('shows special message for mafia elimination', () => {
      const mafiaPlayer = { ...mockPlayer, role: 'mafia' as const };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={mafiaPlayer}
        />
      );
      
      expect(getByText('A Mafia member has been eliminated!')).toBeTruthy();
    });

    it('shows player name message for non-mafia elimination', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      expect(getByText('TestPlayer has been eliminated!')).toBeTruthy();
    });

    it('shows player name message for detective elimination', () => {
      const detectivePlayer = { ...mockPlayer, role: 'detective' as const };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={detectivePlayer}
        />
      );
      
      expect(getByText('TestPlayer has been eliminated!')).toBeTruthy();
    });
  });

  describe('Role Display', () => {
    it('displays role when player has role', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      expect(getByText('was a VILLAGER')).toBeTruthy();
    });

    it('handles player without role', () => {
      const playerWithoutRole = { ...mockPlayer, role: undefined };
      const { queryByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={playerWithoutRole}
        />
      );
      
      expect(queryByText(/was a/)).toBeNull();
    });

    it('displays role in uppercase', () => {
      const mafiaPlayer = { ...mockPlayer, role: 'mafia' as const };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={mafiaPlayer}
        />
      );
      
      expect(getByText('was a MAFIA')).toBeTruthy();
    });
  });

  describe('Animation Lifecycle', () => {
    it('calls onAnimationComplete after animation sequence', () => {
      const mockOnComplete = jest.fn();
      render(
        <EliminationAnimation 
          {...defaultProps} 
          onAnimationComplete={mockOnComplete}
        />
      );
      
      // Fast-forward through the hold timeout (2 seconds)
      jest.advanceTimersByTime(2000);
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call onAnimationComplete when not visible', () => {
      const mockOnComplete = jest.fn();
      render(
        <EliminationAnimation 
          {...defaultProps} 
          visible={false}
          onAnimationComplete={mockOnComplete}
        />
      );
      
      jest.advanceTimersByTime(5000);
      
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('does not call onAnimationComplete when no eliminated player', () => {
      const mockOnComplete = jest.fn();
      render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={null}
          onAnimationComplete={mockOnComplete}
        />
      );
      
      jest.advanceTimersByTime(5000);
      
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('Visual Elements', () => {
    it('renders cross-out effect', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      expect(getByText('✗')).toBeTruthy();
    });

    it('renders dramatic effect text', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      expect(getByText('ELIMINATED')).toBeTruthy();
    });

    it('renders overlay background', () => {
      const { UNSAFE_getByProps } = render(<EliminationAnimation {...defaultProps} />);
      
      const overlay = UNSAFE_getByProps({
        style: expect.arrayContaining([
          expect.objectContaining({ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            position: 'absolute'
          })
        ])
      });
      expect(overlay).toBeTruthy();
    });

    it('renders particle effects', () => {
      const { UNSAFE_getAllByProps } = render(<EliminationAnimation {...defaultProps} />);
      
      const particles = UNSAFE_getAllByProps({
        style: expect.arrayContaining([
          expect.objectContaining({ 
            backgroundColor: '#ef4444',
            borderRadius: 4
          })
        ])
      });
      
      expect(particles.length).toBe(6); // Should have 6 particles
    });
  });

  describe('Styling', () => {
    it('applies correct container styling', () => {
      const { UNSAFE_getByProps } = render(<EliminationAnimation {...defaultProps} />);
      
      const container = UNSAFE_getByProps({
        style: expect.arrayContaining([
          expect.objectContaining({ 
            backgroundColor: '#2d2d2d',
            borderRadius: 20,
            borderColor: '#ef4444'
          })
        ])
      });
      expect(container).toBeTruthy();
    });

    it('applies correct dramatic effect styling', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      const dramaticText = getByText('ELIMINATED');
      const dramaticContainer = dramaticText.parent;
      
      expect(dramaticContainer?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            backgroundColor: '#ef4444',
            transform: [{ rotate: '-5deg' }]
          })
        ])
      );
    });

    it('applies correct cross-out styling', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      const crossOut = getByText('✗');
      expect(crossOut.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            color: '#ef4444',
            fontWeight: 'bold'
          })
        ])
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles player with empty username', () => {
      const emptyNamePlayer = { ...mockPlayer, username: '' };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={emptyNamePlayer}
        />
      );
      
      expect(getByText(' has been eliminated!')).toBeTruthy();
    });

    it('handles player with special characters in username', () => {
      const specialCharPlayer = { ...mockPlayer, username: 'Player@123!' };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={specialCharPlayer}
        />
      );
      
      expect(getByText('Player@123!')).toBeTruthy();
      expect(getByText('Player@123! has been eliminated!')).toBeTruthy();
    });

    it('handles very long username', () => {
      const longNamePlayer = { 
        ...mockPlayer, 
        username: 'VeryLongUsernameThatshouldStillWork' 
      };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={longNamePlayer}
        />
      );
      
      expect(getByText('VeryLongUsernameThatshouldStillWork')).toBeTruthy();
    });

    it('handles unknown role gracefully', () => {
      const unknownRolePlayer = { 
        ...mockPlayer, 
        role: 'unknown' as any 
      };
      const { getByText } = render(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={unknownRolePlayer}
        />
      );
      
      expect(getByText('👤')).toBeTruthy(); // Should use default icon
      expect(getByText('was a UNKNOWN')).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('handles visibility changes correctly', () => {
      const { rerender, queryByText } = render(
        <EliminationAnimation {...defaultProps} visible={false} />
      );
      
      expect(queryByText('TestPlayer')).toBeNull();
      
      rerender(<EliminationAnimation {...defaultProps} visible={true} />);
      
      expect(queryByText('TestPlayer')).toBeTruthy();
    });

    it('handles eliminated player changes', () => {
      const newPlayer = {
        ...mockPlayer,
        id: 'player-2',
        username: 'NewPlayer',
        role: 'mafia' as const,
      };
      
      const { rerender, getByText } = render(
        <EliminationAnimation {...defaultProps} />
      );
      
      expect(getByText('TestPlayer')).toBeTruthy();
      
      rerender(
        <EliminationAnimation 
          {...defaultProps} 
          eliminatedPlayer={newPlayer}
        />
      );
      
      expect(getByText('NewPlayer')).toBeTruthy();
      expect(getByText('A Mafia member has been eliminated!')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible text content', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      const playerName = getByText('TestPlayer');
      const eliminationText = getByText('ELIMINATED');
      const message = getByText('TestPlayer has been eliminated!');
      
      expect(playerName.props.accessible).not.toBe(false);
      expect(eliminationText.props.accessible).not.toBe(false);
      expect(message.props.accessible).not.toBe(false);
    });

    it('provides accessible role information', () => {
      const { getByText } = render(<EliminationAnimation {...defaultProps} />);
      
      const roleText = getByText('was a VILLAGER');
      expect(roleText.props.accessible).not.toBe(false);
    });
  });
});