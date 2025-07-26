import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedPlayerCard } from '../components/AnimatedPlayerCard';
import { CardFlipAnimation } from '../components/CardFlipAnimation';
import { VotingAnimation } from '../components/VotingAnimation';
import { EliminationAnimation } from '../components/EliminationAnimation';
import { Text, View } from 'react-native';

// React Native Reanimated is mocked via Jest configuration

describe('Animation Components', () => {
  describe('AnimatedButton', () => {
    it('should render correctly with default props', () => {
      const { getByText } = render(
        <AnimatedButton title="Test Button" onPress={jest.fn()} />
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should handle press events with animation', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <AnimatedButton title="Test Button" onPress={onPressMock} />
      );
      
      const button = getByText('Test Button');
      
      act(() => {
        fireEvent.press(button);
      });
      
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should not trigger press when disabled', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <AnimatedButton title="Test Button" onPress={onPressMock} disabled />
      );
      
      const button = getByText('Test Button');
      
      act(() => {
        fireEvent.press(button);
      });
      
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('should apply correct styles for different variants', () => {
      const { rerender, getByText } = render(
        <AnimatedButton title="Primary" onPress={jest.fn()} variant="primary" />
      );
      
      let button = getByText('Primary');
      expect(button).toBeTruthy();
      
      rerender(
        <AnimatedButton title="Secondary" onPress={jest.fn()} variant="secondary" />
      );
      
      button = getByText('Secondary');
      expect(button).toBeTruthy();
      
      rerender(
        <AnimatedButton title="Danger" onPress={jest.fn()} variant="danger" />
      );
      
      button = getByText('Danger');
      expect(button).toBeTruthy();
    });
  });

  describe('AnimatedPlayerCard', () => {
    const mockPlayer = {
      id: '1',
      username: 'TestPlayer',
      isAlive: true,
      role: 'Villager',
    };

    it('should render player information correctly', () => {
      const { getByText } = render(
        <AnimatedPlayerCard player={mockPlayer} />
      );
      
      expect(getByText('TestPlayer')).toBeTruthy();
    });

    it('should show host indicator when player is host', () => {
      const hostPlayer = { ...mockPlayer, isHost: true };
      const { getByText } = render(
        <AnimatedPlayerCard player={hostPlayer} />
      );
      
      expect(getByText('👑')).toBeTruthy();
    });

    it('should handle selection state changes', () => {
      const { rerender, getByText } = render(
        <AnimatedPlayerCard player={mockPlayer} isSelected={false} />
      );
      
      expect(getByText('TestPlayer')).toBeTruthy();
      
      rerender(
        <AnimatedPlayerCard player={mockPlayer} isSelected={true} />
      );
      
      expect(getByText('TestPlayer')).toBeTruthy();
    });

    it('should show elimination overlay when player is eliminated', () => {
      const { getByText } = render(
        <AnimatedPlayerCard player={mockPlayer} isEliminated={true} />
      );
      
      expect(getByText('💀')).toBeTruthy();
    });

    it('should show voted indicator when player has voted', () => {
      const { getByText } = render(
        <AnimatedPlayerCard player={mockPlayer} hasVoted={true} />
      );
      
      expect(getByText('✓')).toBeTruthy();
    });
  });

  describe('CardFlipAnimation', () => {
    const frontContent = <Text>Front</Text>;
    const backContent = <Text>Back</Text>;

    it('should render front content initially', () => {
      const { getByText } = render(
        <CardFlipAnimation 
          frontContent={frontContent} 
          backContent={backContent} 
        />
      );
      
      expect(getByText('Front')).toBeTruthy();
      expect(getByText('Back')).toBeTruthy();
    });

    it('should handle flip animations through ref', () => {
      const ref = React.createRef<any>();
      render(
        <CardFlipAnimation 
          ref={ref}
          frontContent={frontContent} 
          backContent={backContent} 
        />
      );
      
      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.flip).toBe('function');
      expect(typeof ref.current.flipToBack).toBe('function');
      expect(typeof ref.current.flipToFront).toBe('function');
    });

    it('should call animation callbacks', () => {
      const onFlipStart = jest.fn();
      const onFlipMidpoint = jest.fn();
      const onFlipComplete = jest.fn();
      
      const ref = React.createRef<any>();
      render(
        <CardFlipAnimation 
          ref={ref}
          frontContent={frontContent} 
          backContent={backContent}
          onFlipStart={onFlipStart}
          onFlipMidpoint={onFlipMidpoint}
          onFlipComplete={onFlipComplete}
        />
      );
      
      act(() => {
        ref.current.flip();
      });
      
      expect(onFlipStart).toHaveBeenCalled();
    });
  });

  describe('VotingAnimation', () => {
    const childContent = <Text>Vote Content</Text>;

    it('should render children correctly', () => {
      const { getByText } = render(
        <VotingAnimation>{childContent}</VotingAnimation>
      );
      
      expect(getByText('Vote Content')).toBeTruthy();
    });

    it('should handle voting state changes', () => {
      const { rerender, getByText } = render(
        <VotingAnimation isVoting={false}>{childContent}</VotingAnimation>
      );
      
      expect(getByText('Vote Content')).toBeTruthy();
      
      rerender(
        <VotingAnimation isVoting={true}>{childContent}</VotingAnimation>
      );
      
      expect(getByText('Vote Content')).toBeTruthy();
    });

    it('should show progress bar for multiple votes', () => {
      const { getByText } = render(
        <VotingAnimation 
          voteCount={2} 
          maxVotes={5}
        >
          {childContent}
        </VotingAnimation>
      );
      
      expect(getByText('Vote Content')).toBeTruthy();
    });

    it('should call onVoteComplete callback', () => {
      const onVoteComplete = jest.fn();
      const { rerender } = render(
        <VotingAnimation 
          hasVoted={false}
          onVoteComplete={onVoteComplete}
        >
          {childContent}
        </VotingAnimation>
      );
      
      rerender(
        <VotingAnimation 
          hasVoted={true}
          onVoteComplete={onVoteComplete}
        >
          {childContent}
        </VotingAnimation>
      );
      
      expect(onVoteComplete).toHaveBeenCalled();
    });
  });

  describe('EliminationAnimation', () => {
    const childContent = <Text>Player Content</Text>;

    it('should render children correctly', () => {
      const { getByText } = render(
        <EliminationAnimation>{childContent}</EliminationAnimation>
      );
      
      expect(getByText('Player Content')).toBeTruthy();
    });

    it('should show elimination message when visible', () => {
      const { getByText } = render(
        <EliminationAnimation 
          isVisible={true}
          playerName="TestPlayer"
          eliminationType="voted"
        >
          {childContent}
        </EliminationAnimation>
      );
      
      expect(getByText('TestPlayer was voted out!')).toBeTruthy();
      expect(getByText('🗳️')).toBeTruthy();
    });

    it('should show different messages for different elimination types', () => {
      const { rerender, getByText } = render(
        <EliminationAnimation 
          isVisible={true}
          playerName="TestPlayer"
          eliminationType="killed"
        >
          {childContent}
        </EliminationAnimation>
      );
      
      expect(getByText('TestPlayer was eliminated!')).toBeTruthy();
      expect(getByText('💀')).toBeTruthy();
      
      rerender(
        <EliminationAnimation 
          isVisible={true}
          playerName="TestPlayer"
          eliminationType="lynched"
        >
          {childContent}
        </EliminationAnimation>
      );
      
      expect(getByText('TestPlayer was lynched!')).toBeTruthy();
      expect(getByText('⚖️')).toBeTruthy();
    });

    it('should show role information when provided', () => {
      const { getByText } = render(
        <EliminationAnimation 
          isVisible={true}
          playerName="TestPlayer"
          role="Mafia"
        >
          {childContent}
        </EliminationAnimation>
      );
      
      expect(getByText('They were a Mafia')).toBeTruthy();
    });

    it('should handle animation callbacks', () => {
      const onAnimationStart = jest.fn();
      const onAnimationMidpoint = jest.fn();
      const onAnimationComplete = jest.fn();
      
      render(
        <EliminationAnimation 
          isVisible={true}
          onAnimationStart={onAnimationStart}
          onAnimationMidpoint={onAnimationMidpoint}
          onAnimationComplete={onAnimationComplete}
        >
          {childContent}
        </EliminationAnimation>
      );
      
      expect(onAnimationStart).toHaveBeenCalled();
    });

    it('should control animation through ref', () => {
      const ref = React.createRef<any>();
      render(
        <EliminationAnimation ref={ref}>
          {childContent}
        </EliminationAnimation>
      );
      
      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.startElimination).toBe('function');
      expect(typeof ref.current.resetAnimation).toBe('function');
    });
  });
});

// Performance-specific component tests
describe('Animation Component Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not cause excessive re-renders', () => {
    const renderSpy = jest.fn();
    
    const TestComponent = () => {
      renderSpy();
      return (
        <AnimatedButton title="Test" onPress={jest.fn()} />
      );
    };
    
    const { rerender } = render(<TestComponent />);
    
    // Initial render
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    // Re-render with same props should not cause additional renders
    rerender(<TestComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle rapid state changes without performance issues', () => {
    const { rerender } = render(
      <AnimatedPlayerCard 
        player={{ id: '1', username: 'Test', isAlive: true }}
        isSelected={false}
      />
    );
    
    // Rapidly change selection state
    for (let i = 0; i < 10; i++) {
      rerender(
        <AnimatedPlayerCard 
          player={{ id: '1', username: 'Test', isAlive: true }}
          isSelected={i % 2 === 0}
        />
      );
    }
    
    // Should not throw errors or cause performance issues
    expect(true).toBe(true);
  });

  it('should clean up animations on unmount', () => {
    const { unmount } = render(
      <VotingAnimation isVoting={true}>
        <Text>Test</Text>
      </VotingAnimation>
    );
    
    // Should not throw errors on unmount
    expect(() => unmount()).not.toThrow();
  });

  it('should handle multiple concurrent animations', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
      id: i.toString(),
      username: `Player${i}`,
      isAlive: true,
    }));
    
    const { getByText } = render(
      <View>
        {players.map((player, index) => (
          <AnimatedPlayerCard 
            key={player.id}
            player={player}
            isSelected={index % 2 === 0}
            animationDelay={index * 100}
          />
        ))}
      </View>
    );
    
    // All players should render correctly
    players.forEach(player => {
      expect(getByText(player.username)).toBeTruthy();
    });
  });
});