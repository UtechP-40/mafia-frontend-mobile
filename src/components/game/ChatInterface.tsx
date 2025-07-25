import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';

interface ChatMessage {
  id: string;
  content: string;
  playerId: string;
  playerName?: string;
  timestamp: Date;
  type: 'player_chat' | 'system_message' | 'game_event';
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  height?: number;
  showTimestamps?: boolean;
  animated?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  height = 200,
  showTimestamps = false,
  animated = true
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const messageAnimations = useRef(new Map<string, Animated.Value>()).current;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Animate new messages
  useEffect(() => {
    if (!animated) return;

    messages.forEach((message) => {
      if (!messageAnimations.has(message.id)) {
        const animation = new Animated.Value(0);
        messageAnimations.set(message.id, animation);
        
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    // Clean up old animations
    const currentMessageIds = new Set(messages.map(m => m.id));
    messageAnimations.forEach((animation, messageId) => {
      if (!currentMessageIds.has(messageId)) {
        messageAnimations.delete(messageId);
      }
    });
  }, [messages, animated]);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStyle = (type: ChatMessage['type']) => {
    switch (type) {
      case 'system_message':
        return styles.systemMessage;
      case 'game_event':
        return styles.gameEventMessage;
      default:
        return styles.playerMessage;
    }
  };

  const getPlayerNameStyle = (type: ChatMessage['type']) => {
    switch (type) {
      case 'system_message':
        return styles.systemPlayerName;
      case 'game_event':
        return styles.gameEventPlayerName;
      default:
        return styles.playerName;
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet...</Text>
          </View>
        ) : (
          messages.map((message) => {
            const animation = messageAnimations.get(message.id) || new Animated.Value(1);
            
            return (
              <Animated.View
                key={message.id}
                style={[
                  styles.messageContainer,
                  animated && {
                    opacity: animation,
                    transform: [
                      {
                        translateY: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={[styles.message, getMessageStyle(message.type)]}>
                  <View style={styles.messageHeader}>
                    {message.playerName && (
                      <Text style={getPlayerNameStyle(message.type)}>
                        {message.playerName}
                      </Text>
                    )}
                    {showTimestamps && (
                      <Text style={styles.timestamp}>
                        {formatTimestamp(message.timestamp)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.messageContent}>
                    {message.content}
                  </Text>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
  messageContainer: {
    marginBottom: 8,
  },
  message: {
    borderRadius: 8,
    padding: 8,
  },
  playerMessage: {
    backgroundColor: '#374151',
  },
  systemMessage: {
    backgroundColor: '#1e40af',
  },
  gameEventMessage: {
    backgroundColor: '#7c2d12',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  systemPlayerName: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  gameEventPlayerName: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    color: '#9ca3af',
    fontSize: 10,
  },
  messageContent: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
  },
});