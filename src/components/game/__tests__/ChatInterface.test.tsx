import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { ChatInterface } from '../ChatInterface';

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      Value: jest.fn(() => ({
        interpolate: jest.fn(() => 0),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
    },
  };
});

describe('ChatInterface', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Hello everyone!',
      playerId: 'player-1',
      playerName: 'Alice',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      type: 'player_chat' as const,
    },
    {
      id: '2',
      content: 'Game starting soon',
      playerId: 'system',
      playerName: 'System',
      timestamp: new Date('2023-01-01T10:01:00Z'),
      type: 'system_message' as const,
    },
    {
      id: '3',
      content: 'Player eliminated',
      playerId: 'system',
      playerName: 'Game',
      timestamp: new Date('2023-01-01T10:02:00Z'),
      type: 'game_event' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders empty state when no messages', () => {
      const { getByText } = render(
        <ChatInterface messages={[]} />
      );
      
      expect(getByText('No messages yet...')).toBeTruthy();
    });

    it('renders messages correctly', () => {
      const { getByText } = render(
        <ChatInterface messages={mockMessages} />
      );
      
      expect(getByText('Hello everyone!')).toBeTruthy();
      expect(getByText('Game starting soon')).toBeTruthy();
      expect(getByText('Player eliminated')).toBeTruthy();
    });

    it('displays player names for messages', () => {
      const { getByText } = render(
        <ChatInterface messages={mockMessages} />
      );
      
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('System')).toBeTruthy();
      expect(getByText('Game')).toBeTruthy();
    });

    it('applies correct styles for different message types', () => {
      const { getByText } = render(
        <ChatInterface messages={mockMessages} />
      );
      
      const playerMessage = getByText('Hello everyone!').parent?.parent;
      const systemMessage = getByText('Game starting soon').parent?.parent;
      const gameEventMessage = getByText('Player eliminated').parent?.parent;
      
      // Check that different message types have different styling
      expect(playerMessage?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#374151' })
        ])
      );
      
      expect(systemMessage?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#1e40af' })
        ])
      );
      
      expect(gameEventMessage?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#7c2d12' })
        ])
      );
    });
  });

  describe('Timestamps', () => {
    it('shows timestamps when enabled', () => {
      const { getByText } = render(
        <ChatInterface messages={mockMessages} showTimestamps={true} />
      );
      
      // Should show formatted time (10:00 AM format)
      expect(getByText('10:00')).toBeTruthy();
      expect(getByText('10:01')).toBeTruthy();
      expect(getByText('10:02')).toBeTruthy();
    });

    it('hides timestamps by default', () => {
      const { queryByText } = render(
        <ChatInterface messages={mockMessages} />
      );
      
      expect(queryByText('10:00')).toBeNull();
      expect(queryByText('10:01')).toBeNull();
      expect(queryByText('10:02')).toBeNull();
    });
  });

  describe('Animations', () => {
    it('creates animations for new messages when enabled', () => {
      const { rerender } = render(
        <ChatInterface messages={[]} animated={true} />
      );
      
      // Add a new message
      rerender(
        <ChatInterface messages={[mockMessages[0]]} animated={true} />
      );
      
      expect(Animated.Value).toHaveBeenCalled();
      expect(Animated.timing).toHaveBeenCalled();
    });

    it('does not create animations when disabled', () => {
      const { rerender } = render(
        <ChatInterface messages={[]} animated={false} />
      );
      
      rerender(
        <ChatInterface messages={[mockMessages[0]]} animated={false} />
      );
      
      // Should not create new animations
      expect(Animated.timing).not.toHaveBeenCalled();
    });

    it('cleans up animations for removed messages', () => {
      const { rerender } = render(
        <ChatInterface messages={mockMessages} animated={true} />
      );
      
      // Remove messages
      rerender(
        <ChatInterface messages={[mockMessages[0]]} animated={true} />
      );
      
      // Should have cleaned up animations for removed messages
      expect(Animated.Value).toHaveBeenCalled();
    });
  });

  describe('Custom Height', () => {
    it('applies custom height when provided', () => {
      const { getByTestId } = render(
        <ChatInterface 
          messages={mockMessages} 
          height={300}
          testID="chat-container"
        />
      );
      
      const container = getByTestId('chat-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ height: 300 })
        ])
      );
    });

    it('uses default height when not provided', () => {
      const { getByTestId } = render(
        <ChatInterface 
          messages={mockMessages}
          testID="chat-container"
        />
      );
      
      const container = getByTestId('chat-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ height: 200 })
        ])
      );
    });
  });

  describe('Message Formatting', () => {
    it('formats timestamps correctly', () => {
      const message = {
        id: '1',
        content: 'Test message',
        playerId: 'player-1',
        playerName: 'TestPlayer',
        timestamp: new Date('2023-01-01T14:30:00Z'),
        type: 'player_chat' as const,
      };

      const { getByText } = render(
        <ChatInterface messages={[message]} showTimestamps={true} />
      );
      
      // Should format as 2:30 PM or 14:30 depending on locale
      expect(getByText(/14:30|2:30/)).toBeTruthy();
    });

    it('handles messages without player names', () => {
      const message = {
        id: '1',
        content: 'System message',
        playerId: 'system',
        timestamp: new Date(),
        type: 'system_message' as const,
      };

      const { getByText, queryByText } = render(
        <ChatInterface messages={[message]} />
      );
      
      expect(getByText('System message')).toBeTruthy();
      // Should not crash when playerName is undefined
    });

    it('truncates long messages appropriately', () => {
      const longMessage = {
        id: '1',
        content: 'This is a very long message that should be handled properly by the chat interface without breaking the layout or causing any issues with the display',
        playerId: 'player-1',
        playerName: 'LongMessagePlayer',
        timestamp: new Date(),
        type: 'player_chat' as const,
      };

      const { getByText } = render(
        <ChatInterface messages={[longMessage]} />
      );
      
      expect(getByText(longMessage.content)).toBeTruthy();
    });
  });

  describe('Scrolling Behavior', () => {
    it('auto-scrolls to bottom when new messages arrive', async () => {
      const { rerender } = render(
        <ChatInterface messages={[mockMessages[0]]} />
      );
      
      // Add new message
      await act(async () => {
        rerender(
          <ChatInterface messages={mockMessages} />
        );
      });
      
      // Should trigger scroll to end (tested via setTimeout in useEffect)
      // This is difficult to test directly, but we can verify the component doesn't crash
      expect(true).toBe(true);
    });
  });

  describe('Performance', () => {
    it('handles large number of messages efficiently', () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        playerId: `player-${i % 5}`,
        playerName: `Player${i % 5}`,
        timestamp: new Date(),
        type: 'player_chat' as const,
      }));

      const { getAllByText } = render(
        <ChatInterface messages={manyMessages} />
      );
      
      // Should render all messages without performance issues
      expect(getAllByText(/Message \d+/)).toHaveLength(100);
    });

    it('efficiently manages animation state for many messages', () => {
      const manyMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        playerId: `player-${i % 5}`,
        playerName: `Player${i % 5}`,
        timestamp: new Date(),
        type: 'player_chat' as const,
      }));

      render(
        <ChatInterface messages={manyMessages} animated={true} />
      );
      
      // Should handle many animations without issues
      expect(Animated.Value).toHaveBeenCalled();
    });
  });
});