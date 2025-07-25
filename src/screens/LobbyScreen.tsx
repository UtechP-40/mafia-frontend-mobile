import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ChatInterface } from '../components/game/ChatInterface';
import { PlayerCard } from '../components/game/PlayerCard';
import {
  selectCurrentRoom,
  selectPlayers,
  selectCurrentPlayer,
  selectIsHost,
  selectIsConnected,
  selectGameError,
  leaveRoom,
  updateRoomSettings,
  startGame,
  addChatMessage,
} from '../store/slices/gameSlice';
import { socketService } from '../services/socket';

const { width } = Dimensions.get('window');

interface LobbyPlayer {
  id: string;
  username: string;
  avatar: string;
  isAlive: boolean;
  isHost: boolean;
  isReady: boolean;
}

export const LobbyScreen: React.FC = () => {
  const dispatch = useDispatch();
  const currentRoom = useSelector(selectCurrentRoom);
  const players = useSelector(selectPlayers);
  const currentPlayer = useSelector(selectCurrentPlayer);
  const isHost = useSelector(selectIsHost);
  const isConnected = useSelector(selectIsConnected);
  const gameError = useSelector(selectGameError);

  // Local state
  const [chatMessage, setChatMessage] = useState('');
  const [playersWithReady, setPlayersWithReady] = useState<LobbyPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [playerAnimations] = useState(new Map<string, Animated.Value>());

  // Room settings state (for hosts)
  const [maxPlayers, setMaxPlayers] = useState(currentRoom?.settings.maxPlayers?.toString() || '8');
  const [enableVoiceChat, setEnableVoiceChat] = useState(currentRoom?.settings.gameSettings.enableVoiceChat || true);
  const [dayPhaseDuration, setDayPhaseDuration] = useState(currentRoom?.settings.gameSettings.dayPhaseDuration?.toString() || '300');
  const [nightPhaseDuration, setNightPhaseDuration] = useState(currentRoom?.settings.gameSettings.nightPhaseDuration?.toString() || '120');

  // Initialize player animations and ready states
  useEffect(() => {
    const updatedPlayers = players.map(player => ({
      ...player,
      isReady: false, // This would come from the server in a real implementation
    }));
    setPlayersWithReady(updatedPlayers);

    // Create animations for new players
    players.forEach(player => {
      if (!playerAnimations.has(player.id)) {
        const animation = new Animated.Value(0);
        playerAnimations.set(player.id, animation);
        
        // Animate player card in
        Animated.spring(animation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    });

    // Clean up animations for removed players
    playerAnimations.forEach((animation, playerId) => {
      if (!players.find(p => p.id === playerId)) {
        Animated.timing(animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          playerAnimations.delete(playerId);
        });
      }
    });
  }, [players]);

  // Socket event listeners for lobby-specific events
  useEffect(() => {
    if (!isConnected) return;

    const handlePlayerReady = (data: { playerId: string; isReady: boolean }) => {
      setPlayersWithReady(prev => 
        prev.map(player => 
          player.id === data.playerId 
            ? { ...player, isReady: data.isReady }
            : player
        )
      );
    };

    const handleChatMessage = (data: { message: any }) => {
      setChatMessages(prev => [...prev, data.message]);
    };

    socketService.on('player-ready-changed', handlePlayerReady);
    socketService.on('lobby-chat-message', handleChatMessage);

    return () => {
      socketService.off('player-ready-changed');
      socketService.off('lobby-chat-message');
    };
  }, [isConnected]);

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            dispatch(leaveRoom());
            socketService.emit('leave-room', { roomId: currentRoom?.id });
          },
        },
      ]
    );
  };

  const handleToggleReady = () => {
    if (!currentPlayer) return;
    
    const newReadyState = !playersWithReady.find(p => p.id === currentPlayer.id)?.isReady;
    
    // Update local state immediately for responsiveness
    setPlayersWithReady(prev => 
      prev.map(player => 
        player.id === currentPlayer.id 
          ? { ...player, isReady: newReadyState }
          : player
      )
    );

    // Emit to server
    socketService.emit('toggle-ready', { 
      roomId: currentRoom?.id,
      isReady: newReadyState 
    });
  };

  const handleStartGame = () => {
    if (!isHost || !currentRoom) return;

    const readyPlayers = playersWithReady.filter(p => p.isReady || p.isHost);
    if (readyPlayers.length < 3) {
      Alert.alert('Not Enough Players', 'At least 3 players must be ready to start the game.');
      return;
    }

    Alert.alert(
      'Start Game',
      `Start the game with ${readyPlayers.length} players?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            dispatch(startGame());
            socketService.emit('start-game', { roomId: currentRoom.id });
          },
        },
      ]
    );
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !currentPlayer || !currentRoom) return;

    const message = {
      id: Date.now().toString(),
      content: chatMessage.trim(),
      playerId: currentPlayer.id,
      playerName: currentPlayer.username,
      timestamp: new Date(),
      type: 'player_chat',
    };

    // Add to local chat immediately
    setChatMessages(prev => [...prev, message]);
    setChatMessage('');

    // Send to server
    socketService.emit('lobby-chat-message', {
      roomId: currentRoom.id,
      message: message.content,
    });
  };

  const handleUpdateRoomSettings = () => {
    if (!isHost || !currentRoom) return;

    const newSettings = {
      maxPlayers: parseInt(maxPlayers) || 8,
      gameSettings: {
        ...currentRoom.settings.gameSettings,
        enableVoiceChat,
        dayPhaseDuration: parseInt(dayPhaseDuration) || 300,
        nightPhaseDuration: parseInt(nightPhaseDuration) || 120,
      },
    };

    dispatch(updateRoomSettings(newSettings));
    socketService.emit('update-room-settings', {
      roomId: currentRoom.id,
      settings: newSettings,
    });
  };

  const readyCount = playersWithReady.filter(p => p.isReady || p.isHost).length;
  const currentPlayerReady = playersWithReady.find(p => p.id === currentPlayer?.id)?.isReady || false;

  if (!currentRoom || !currentPlayer) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Room not found</Text>
        <Button title="Back to Menu" onPress={() => {}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.roomTitle}>Room {currentRoom.code}</Text>
            <Text style={styles.playerCount}>
              {players.length}/{currentRoom.settings.maxPlayers} players • {readyCount} ready
            </Text>
          </View>
          <Button
            title="Leave"
            onPress={handleLeaveRoom}
            variant="outline"
            style={styles.leaveButton}
          />
        </View>

        {gameError && (
          <Card>
            <Text style={styles.errorText}>{gameError}</Text>
          </Card>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <Card>
            <Text style={styles.warningText}>Reconnecting to server...</Text>
          </Card>
        )}

        {/* Players List */}
        <Card>
          <Text style={styles.sectionTitle}>Players</Text>
          <View style={styles.playersGrid}>
            {playersWithReady.map((player) => {
              const animation = playerAnimations.get(player.id) || new Animated.Value(1);
              return (
                <Animated.View
                  key={player.id}
                  style={[
                    styles.playerCardContainer,
                    {
                      opacity: animation,
                      transform: [
                        {
                          scale: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <PlayerCard 
                    player={player} 
                    showReadyState={true}
                    animated={true}
                  />
                </Animated.View>
              );
            })}
          </View>
        </Card>

        {/* Ready/Start Game Controls */}
        <Card>
          <View style={styles.gameControls}>
            {!isHost ? (
              <Button
                title={currentPlayerReady ? 'Not Ready' : 'Ready Up'}
                onPress={handleToggleReady}
                variant={currentPlayerReady ? 'secondary' : 'primary'}
                style={styles.readyButton}
              />
            ) : (
              <Button
                title={`Start Game (${readyCount}/${players.length})`}
                onPress={handleStartGame}
                disabled={readyCount < 3}
                style={styles.startButton}
              />
            )}
          </View>
        </Card>

        {/* Room Settings (Host Only) */}
        {isHost && (
          <Card>
            <Text style={styles.sectionTitle}>Room Settings</Text>
            <View style={styles.settingsGrid}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Max Players</Text>
                <Input
                  value={maxPlayers}
                  onChangeText={setMaxPlayers}
                  keyboardType="numeric"
                  style={styles.settingInput}
                />
              </View>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Day Phase (seconds)</Text>
                <Input
                  value={dayPhaseDuration}
                  onChangeText={setDayPhaseDuration}
                  keyboardType="numeric"
                  style={styles.settingInput}
                />
              </View>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Night Phase (seconds)</Text>
                <Input
                  value={nightPhaseDuration}
                  onChangeText={setNightPhaseDuration}
                  keyboardType="numeric"
                  style={styles.settingInput}
                />
              </View>
            </View>
            <Button
              title="Update Settings"
              onPress={handleUpdateRoomSettings}
              variant="secondary"
              style={styles.updateSettingsButton}
            />
          </Card>
        )}

        {/* Chat Interface */}
        <Card>
          <Text style={styles.sectionTitle}>Lobby Chat</Text>
          <View style={styles.chatContainer}>
            <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
              {chatMessages.map((message) => (
                <View key={message.id} style={styles.chatMessage}>
                  <Text style={styles.chatPlayerName}>{message.playerName}:</Text>
                  <Text style={styles.chatMessageText}>{message.content}</Text>
                </View>
              ))}
              {chatMessages.length === 0 && (
                <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
              )}
            </ScrollView>
            <View style={styles.chatInput}>
              <Input
                value={chatMessage}
                onChangeText={setChatMessage}
                placeholder="Type a message..."
                style={styles.chatTextInput}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              <Button
                title="Send"
                onPress={handleSendMessage}
                disabled={!chatMessage.trim()}
                style={styles.sendButton}
              />
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerCount: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  leaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playerCardContainer: {
    width: (width - 64) / 2,
    marginBottom: 12,
  },

  gameControls: {
    alignItems: 'center',
  },
  readyButton: {
    minWidth: 120,
  },
  startButton: {
    minWidth: 200,
  },
  settingsGrid: {
    gap: 12,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  settingInput: {
    fontSize: 14,
  },
  updateSettingsButton: {
    marginTop: 8,
  },
  chatContainer: {
    height: 200,
  },
  chatMessages: {
    flex: 1,
    maxHeight: 150,
    marginBottom: 12,
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  chatPlayerName: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  chatMessageText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  emptyChatText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 14,
    textAlign: 'center',
  },
});