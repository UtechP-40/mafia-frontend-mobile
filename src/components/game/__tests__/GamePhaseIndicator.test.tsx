import React from 'react';
import { render } from '@testing-library/react-native';
import { GamePhaseIndicator } from '../GamePhaseIndicator';

// Mock Animated to avoid issues in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: jest.fn(),
    stop: jest.fn(),
  });
  RN.Animated.loop = (animation: any) => ({
    start: jest.fn(),
    stop: jest.fn(),
  });
  RN.Animated.sequence = (animations: any[]) => ({
    start: jest.fn(),
    stop: jest.fn(),
  });
  RN.Animated.Value = jest.fn(() => ({
    setValue: jest.fn(),
  }));
  return RN;
});

describe('GamePhaseIndicator', () => {
  const defaultProps = {
    phase: 'day' as const,
    timeRemaining: 120,
    dayNumber: 1,
  };

  describe('Basic Rendering', () => {
    it('renders phase indicator correctly', () => {
      const { getByText } = render(<GamePhaseIndicator {...defaultProps} />);
      
      expect(getByText('Day 1')).toBeTruthy();
      expect(getByText('Discussion Phase')).toBeTruthy();
      expect(getByText('☀️')).toBeTruthy();
    });

    it('displays timer when time remaining is provided', () => {
      const { getByText } = render(<GamePhaseIndicator {...defaultProps} />);
      
      expect(getByText('2:00')).toBeTruthy();
    });

    it('does not display timer for lobby phase', () => {
      const { queryByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="lobby"
          timeRemaining={60}
        />
      );
      
      expect(queryByText('1:00')).toBeNull();
    });

    it('does not display timer for results phase', () => {
      const { queryByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="results"
          timeRemaining={60}
        />
      );
      
      expect(queryByText('1:00')).toBeNull();
    });
  });

  describe('Phase Information', () => {
    it('displays correct information for lobby phase', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="lobby"
        />
      );
      
      expect(getByText('Waiting for Players')).toBeTruthy();
      expect(getByText('Game will start soon')).toBeTruthy();
      expect(getByText('⏳')).toBeTruthy();
    });

    it('displays correct information for day phase', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="day"
          dayNumber={3}
        />
      );
      
      expect(getByText('Day 3')).toBeTruthy();
      expect(getByText('Discussion Phase')).toBeTruthy();
      expect(getByText('☀️')).toBeTruthy();
    });

    it('displays correct information for night phase', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="night"
          dayNumber={2}
        />
      );
      
      expect(getByText('Night 2')).toBeTruthy();
      expect(getByText('Mafia Phase')).toBeTruthy();
      expect(getByText('🌙')).toBeTruthy();
    });

    it('displays correct information for voting phase', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="voting"
        />
      );
      
      expect(getByText('Voting Time')).toBeTruthy();
      expect(getByText('Cast your votes')).toBeTruthy();
      expect(getByText('🗳️')).toBeTruthy();
    });

    it('displays correct information for results phase', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="results"
        />
      );
      
      expect(getByText('Game Over')).toBeTruthy();
      expect(getByText('Final Results')).toBeTruthy();
      expect(getByText('🏆')).toBeTruthy();
    });
  });

  describe('Timer Formatting', () => {
    it('formats minutes and seconds correctly', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={125}
        />
      );
      
      expect(getByText('2:05')).toBeTruthy();
    });

    it('formats seconds only correctly', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={45}
        />
      );
      
      expect(getByText('0:45')).toBeTruthy();
    });

    it('pads single digit seconds with zero', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={65}
        />
      );
      
      expect(getByText('1:05')).toBeTruthy();
    });

    it('handles zero time remaining', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={0}
        />
      );
      
      expect(getByText('0:00')).toBeTruthy();
    });
  });

  describe('Timer Colors', () => {
    it('applies urgent color when time is very low', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={5}
        />
      );
      
      const timer = getByText('0:05');
      expect(timer.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#ef4444' })
        ])
      );
    });

    it('applies warning color when time is low', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={25}
        />
      );
      
      const timer = getByText('0:25');
      expect(timer.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#f59e0b' })
        ])
      );
    });

    it('applies normal color when time is sufficient', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={60}
        />
      );
      
      const timer = getByText('1:00');
      expect(timer.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#ffffff' })
        ])
      );
    });
  });

  describe('Progress Bar', () => {
    it('shows progress bar for active phases', () => {
      const { UNSAFE_getByProps } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="day"
          timeRemaining={60}
        />
      );
      
      // Look for progress bar background
      const progressBarBg = UNSAFE_getByProps({
        style: expect.arrayContaining([
          expect.objectContaining({ 
            height: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.3)'
          })
        ])
      });
      expect(progressBarBg).toBeTruthy();
    });

    it('does not show progress bar for lobby phase', () => {
      const { UNSAFE_queryByProps } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="lobby"
          timeRemaining={60}
        />
      );
      
      const progressBarBg = UNSAFE_queryByProps({
        style: expect.arrayContaining([
          expect.objectContaining({ height: 4 })
        ])
      });
      expect(progressBarBg).toBeNull();
    });

    it('does not show progress bar for results phase', () => {
      const { UNSAFE_queryByProps } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="results"
          timeRemaining={60}
        />
      );
      
      const progressBarBg = UNSAFE_queryByProps({
        style: expect.arrayContaining([
          expect.objectContaining({ height: 4 })
        ])
      });
      expect(progressBarBg).toBeNull();
    });
  });

  describe('Phase-Specific Indicators', () => {
    it('shows night indicator for night phase', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="night"
        />
      );
      
      expect(getByText('🤫 Mafia is choosing their target...')).toBeTruthy();
    });

    it('shows voting indicator for voting phase', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="voting"
        />
      );
      
      expect(getByText('⚡ Time to vote! Choose wisely...')).toBeTruthy();
    });

    it('does not show special indicators for other phases', () => {
      const { queryByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="day"
        />
      );
      
      expect(queryByText('🤫 Mafia is choosing their target...')).toBeNull();
      expect(queryByText('⚡ Time to vote! Choose wisely...')).toBeNull();
    });
  });

  describe('Day Number', () => {
    it('uses default day number when not provided', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          phase="day"
          timeRemaining={60}
        />
      );
      
      expect(getByText('Day 1')).toBeTruthy();
    });

    it('uses provided day number', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          dayNumber={5}
        />
      );
      
      expect(getByText('Day 5')).toBeTruthy();
    });

    it('displays day number for night phase', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="night"
          dayNumber={3}
        />
      );
      
      expect(getByText('Night 3')).toBeTruthy();
    });
  });

  describe('Animation Props', () => {
    it('accepts animated prop', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          animated={true}
        />
      );
      
      expect(getByText('Day 1')).toBeTruthy();
    });

    it('works without animated prop', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          animated={false}
        />
      );
      
      expect(getByText('Day 1')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown phase gracefully', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase={'unknown' as any}
        />
      );
      
      expect(getByText('Unknown Phase')).toBeTruthy();
      expect(getByText('❓')).toBeTruthy();
    });

    it('handles negative time remaining', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={-10}
        />
      );
      
      // Should handle gracefully
      expect(getByText('Day 1')).toBeTruthy();
    });

    it('handles very large time remaining', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          timeRemaining={3661} // 1 hour, 1 minute, 1 second
        />
      );
      
      expect(getByText('61:01')).toBeTruthy();
    });

    it('handles zero day number', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          dayNumber={0}
        />
      );
      
      expect(getByText('Day 0')).toBeTruthy();
    });

    it('handles negative day number', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          dayNumber={-1}
        />
      );
      
      expect(getByText('Day -1')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible phase information', () => {
      const { getByText } = render(<GamePhaseIndicator {...defaultProps} />);
      
      const title = getByText('Day 1');
      const subtitle = getByText('Discussion Phase');
      
      expect(title.props.accessible).not.toBe(false);
      expect(subtitle.props.accessible).not.toBe(false);
    });

    it('provides accessible timer information', () => {
      const { getByText } = render(<GamePhaseIndicator {...defaultProps} />);
      
      const timer = getByText('2:00');
      expect(timer.props.accessible).not.toBe(false);
    });

    it('provides accessible special indicators', () => {
      const { getByText } = render(
        <GamePhaseIndicator 
          {...defaultProps} 
          phase="night"
        />
      );
      
      const nightIndicator = getByText('🤫 Mafia is choosing their target...');
      expect(nightIndicator.props.accessible).not.toBe(false);
    });
  });
});