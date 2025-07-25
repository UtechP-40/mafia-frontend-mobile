import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Animated, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../hooks/useSocket';
import { 
  selectGame,
  selectCurrentPlayer,
  selectPlayers,
  selectCurrentPhase,
  selectTimeRemaining,
  selectIsConnected,
  selectVotes,
  selectHasVoted,
  selectGameError,
  selectConnectionError,
  castVote,
  clearGameError,
  clearConnectionError,
  addChatMessage,
  setConnectionStatus
} from '../store/slices/gameSlice';
import { selectAuth } from '../store/slices/authSlice';
import {
  GamePhaseIndicator,
  PlayerCard,
  VotingInterface,
  ChatInterface,
  ActionButtons
} from '../components/game';
import { Button } from '../components/ui/Button';
import { GamePhase, Player } from '../types/game';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const GameScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(selectAuth);
  const gameState = useSelector(selectGame);
  const currentPlayer = useSelector(selectCurrentPlayer);
  const players = useSelector(selectPlayers);
  const currentPhase = useSelector(selectCurrentPhase);
  const timeRemaining = useSelector(selectTimeRemaining);
  const isConnected = useSelector(selectIsConnected);
  const votes = useSelector(selectVotes);
  const hasVoted = useSelector(selectHasVoted);
  const gameError = useSelector(selectGameError);
  const connectionError = useSelector(selectConnectionError);

  // Socket connection
  const { emit, on, off } = useSocket(token);

  // Animation states
  const [phaseTransitionAnim] = useState(new Animated.Value(1));
  const [chatOverlayAnim] = useState(new Animated.Value(0));
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Game state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize socket listeners
  useEffect(() => {
    if (!isConnected || !token) return;

    // Game state synchronization
    on('game-state-update', handleGameStateUpdate);
    on('phase-changed', handlePhaseChange);
    on('votes-updated', handleVotesUpdate);
    on('player-eliminated', handlePlayerElimination);
    on('game-ended', handleGameEnd);
    
    // Chat events
    on('chat-message', handleChatMessage);
    on('system-message', handleSystemMessage);
    
    // Connection events
    on('disconnect', handleDisconnect);
    on('reconnect', handleReconnect);
    on('sync-conflict', handleSyncConflict);

    return () => {
      off('game-state-update');
      off('phase-changed');
      off('votes-updated');
      off('player-eliminated');
      off('game-ended');
      off('chat-message');
      off('system-message');
      off('disconnect');
      off('reconnect');
      off('sync-conflict');
    };
  }, [isConnected, token]);

  // Handle connection errors
  useEffect(() => {
    if (connectionError) {
      setIsReconnecting(true);
      reconnectTimeoutRef.current = setTimeout(() => {
        dispatch(clearConnectionError());
        setIsReconnecting(false);
      }, 3000);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectionError, dispatch]);

  // Handle game errors
  useEffect(() => {
    if (gameError) {
      Alert.alert('Game Error', gameError, [
        { text: 'OK', onPress: () => dispatch(clearGameError()) }
      ]);
    }
  }, [gameError, dispatch]);

  // Socket event handlers
  const handleGameStateUpdate = (data: any) => {
    setLastSyncTime(Date.now());
    // Game state is handled by socket middleware
  };

  const handlePhaseChange = (data: { phase: GamePhase; timeRemaining: number }) => {
    // Animate phase transition
    Animated.sequence([
      Animated.timing(phaseTransitionAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(phaseTransitionAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Add system message for phase change
    const phaseMessages = {
      day: '☀️ Day phase has begun - discuss and vote!',
      night: '🌙 Night phase - Mafia, choose your target',
      voting: '🗳️ Voting time! Cast your votes now',
      results: '🏆 Game over! Check the results',
    };

    const message = phaseMessages[data.phase] || `Phase changed to ${data.phase}`;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system_message',
      content: message,
      timestamp: new Date(),
    }]);
  };

  const handleVotesUpdate = (data: { votes: any[] }) => {
    // Votes are handled by socket middleware
  };

  const handlePlayerElimination = (data: { playerId: string; reason: string }) => {
    const eliminatedPlayer = players.find(p => p.id === data.playerId);
    if (eliminatedPlayer) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'game_event',
        content: `${eliminatedPlayer.username} has been eliminated (${data.reason})`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleGameEnd = (data: { winner: string; results: any }) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system_message',
      content: `🏆 Game ended! Winner: ${data.winner}`,
      timestamp: new Date(),
    }]);
  };

  const handleChatMessage = (data: { message: any }) => {
    setChatMessages(prev => [...prev, data.message]);
  };

  const handleSystemMessage = (data: { message: string; type: string }) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system_message',
      content: data.message,
      timestamp: new Date(),
    }]);
  };

  const handleDisconnect = (reason: string) => {
    dispatch(setConnectionStatus(false));
    setIsReconnecting(true);
  };

  const handleReconnect = () => {
    dispatch(setConnectionStatus(true));
    setIsReconnecting(false);
    
    // Request game state sync
    emit('request-sync', { lastSyncTime });
  };

  const handleSyncConflict = (data: { serverState: any; clientState: any }) => {
    // Resolve conflicts by preferring server state
    console.log('Sync conflict detected, resolving with server state');
    // The socket middleware will handle the state update
  };

  // Game actions
  const handleVote = (targetId: string) => {
    if (!currentPlayer || hasVoted) return;

    dispatch(castVote({ targetId }));
    emit('cast-vote', { 
      targetId, 
      playerId: currentPlayer.id,
      timestamp: new Date().toISOString()
    });
  };

  const handleSendChatMessage = (message: string) => {
    if (!currentPlayer || !message.trim()) return;

    const chatMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      playerId: currentPlayer.id,
      playerName: currentPlayer.username,
      timestamp: new Date(),
      type: 'player_chat' as const,
    };

    // Optimistically add to local state
    setChatMessages(prev => [...prev, chatMessage]);

    // Send to server
    emit('send-chat-message', chatMessage);
  };

  const toggleChatOverlay = () => {
    const toValue = isChatVisible ? 0 : 1;
    setIsChatVisible(!isChatVisible);

    Animated.timing(chatOverlayAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Get eligible voting targets
  const getEligibleVotingTargets = (): Player[] => {
    if (currentPhase !== 'voting' && currentPhase !== 'day') return [];
    
    return players.filter(player => 
      player.isAlive && 
      player.id !== currentPlayer?.id
    );
  };

  // Render connection status
  const renderConnectionStatus = () => {
    if (isReconnecting) {
      return (
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionStatusText}>
            🔄 Reconnecting to game...
          </Text>
        </View>
      );
    }

    if (!isConnected) {
      return (
        <View style={[styles.connectionStatus, styles.disconnected]}>
          <Text style={styles.connectionStatusText}>
            ⚠️ Disconnected from game server
          </Text>
          <Button
            title="Retry Connection"
            onPress={() => emit('reconnect', {})}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return null;
  };

  // Render game content based on phase
  const renderGameContent = () => {
    if (!currentPlayer || !gameState.currentRoom) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      );
    }

    const eligibleTargets = getEligibleVotingTargets();

    return (
      <View style={styles.gameContent}>
        {/* Players Grid */}
        <View style={styles.playersContainer}>
          <Text style={styles.sectionTitle}>Players ({players.length})</Text>
          <View style={styles.playersGrid}>
            {players.map((player) => (
              <View key={player.id} style={styles.playerCardWrapper}>
                <PlayerCard
                  player={player}
                  showRole={currentPhase === 'results' || !player.isAlive}
                  isVoting={currentPhase === 'voting' && eligibleTargets.includes(player)}
                  animated={true}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Voting Interface */}
        {(currentPhase === 'voting' || currentPhase === 'day') && eligibleTargets.length > 0 && (
          <VotingInterface
            eligibleTargets={eligibleTargets}
            timeRemaining={timeRemaining}
            hasVoted={hasVoted}
            currentVote={votes.find(v => v.playerId === currentPlayer.id)?.targetId}
            onVote={handleVote}
            allowSkip={currentPhase === 'day'}
          />
        )}

        {/* Action Buttons */}
        <ActionButtons
          currentPhase={currentPhase}
          currentPlayer={currentPlayer}
          onChatToggle={toggleChatOverlay}
          isHost={gameState.isHost}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Connection Status */}
        {renderConnectionStatus()}

        {/* Game Phase Indicator */}
        <Animated.View style={{ transform: [{ scale: phaseTransitionAnim }] }}>
          <GamePhaseIndicator
            phase={currentPhase}
            timeRemaining={timeRemaining}
            dayNumber={gameState.dayNumber}
            animated={true}
          />
        </Animated.View>

        {/* Game Content */}
        {renderGameContent()}

        {/* Chat Overlay */}
        <Animated.View 
          style={[
            styles.chatOverlay,
            {
              opacity: chatOverlayAnim,
              transform: [
                {
                  translateY: chatOverlayAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={isChatVisible ? 'auto' : 'none'}
        >
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Game Chat</Text>
              <Button
                title="✕"
                onPress={toggleChatOverlay}
                style={styles.chatCloseButton}
              />
            </View>
            
            <ChatInterface
              messages={chatMessages}
              height={screenHeight * 0.6}
              showTimestamps={true}
              animated={true}
            />
            
            <ChatInput onSendMessage={handleSendChatMessage} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Chat Input Component
const ChatInput: React.FC<{ onSendMessage: (message: string) => void }> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.chatInputContainer}>
      <TextInput
        style={styles.chatInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message..."
        placeholderTextColor="#9ca3af"
        multiline
        maxLength={200}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Button
        title="Send"
        onPress={handleSend}
        disabled={!message.trim()}
        style={styles.sendButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  keyboardAvoid: {
    flex: 1,
  },
  connectionStatus: {
    backgroundColor: '#f59e0b',
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disconnected: {
    backgroundColor: '#ef4444',
  },
  connectionStatusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
  gameContent: {
    flex: 1,
    padding: 16,
  },
  playersContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  playerCardWrapper: {
    width: screenWidth * 0.28,
    margin: 4,
  },
  chatOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  chatContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  chatTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatCloseButton: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#374151',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#4b5563',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});