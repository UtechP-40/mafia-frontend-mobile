import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GamePhase, GameRole, Player } from '../../types/game';
import { Button } from '../ui/Button';

interface ActionButtonsProps {
  currentPhase: GamePhase;
  currentPlayer: Player;
  onChatToggle: () => void;
  isHost: boolean;
  onStartGame?: () => void;
  onUseAbility?: () => void;
  onEndPhase?: () => void;
  onLeaveGame?: () => void;
  onViewResults?: () => void;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  currentPhase,
  currentPlayer,
  onChatToggle,
  isHost,
  onStartGame,
  onUseAbility,
  onEndPhase,
  onLeaveGame,
  onViewResults,
  disabled = false,
}) => {
  const { role: playerRole, isAlive } = currentPlayer;
  const renderLobbyActions = () => (
    <View style={styles.buttonContainer}>
      {isHost && (
        <Button
          title="Start Game"
          onPress={onStartGame}
          disabled={disabled || !onStartGame}
          style={styles.primaryButton}
        />
      )}
      <Button
        title="Leave Room"
        onPress={onLeaveGame}
        variant="outline"
        disabled={disabled}
        style={styles.secondaryButton}
      />
    </View>
  );

  const renderDayActions = () => (
    <View style={styles.buttonContainer}>
      <Button
        title="💬 Chat"
        onPress={onChatToggle}
        disabled={disabled}
        style={styles.chatButton}
      />
      <Button
        title="Leave Game"
        onPress={onLeaveGame}
        variant="outline"
        disabled={disabled}
        style={styles.secondaryButton}
      />
    </View>
  );

  const renderNightActions = () => {
    if (!isAlive) {
      return (
        <View style={styles.buttonContainer}>
          <Button
            title="💬 Chat"
            onPress={onChatToggle}
            disabled={disabled}
            style={styles.chatButton}
          />
          <Button
            title="Leave Game"
            onPress={onLeaveGame}
            variant="outline"
            disabled={disabled}
            style={styles.secondaryButton}
          />
        </View>
      );
    }

    const getAbilityButtonText = () => {
      switch (playerRole) {
        case 'mafia':
          return 'Choose Target';
        case 'detective':
          return 'Investigate Player';
        case 'doctor':
          return 'Protect Player';
        default:
          return 'No Action Available';
      }
    };

    const canUseAbility = () => {
      return playerRole && 
             ['mafia', 'detective', 'doctor'].includes(playerRole);
    };

    return (
      <View style={styles.buttonContainer}>
        {canUseAbility() && (
          <Button
            title={getAbilityButtonText()}
            onPress={onUseAbility}
            disabled={disabled}
            style={styles.primaryButton}
          />
        )}
        
        <Button
          title="💬 Chat"
          onPress={onChatToggle}
          disabled={disabled}
          style={styles.chatButton}
        />
        
        <Button
          title="Leave Game"
          onPress={onLeaveGame}
          variant="outline"
          disabled={disabled}
          style={styles.secondaryButton}
        />
      </View>
    );
  };

  const renderVotingActions = () => {
    if (!isAlive) {
      return (
        <View style={styles.buttonContainer}>
          <Button
            title="💬 Chat"
            onPress={onChatToggle}
            disabled={disabled}
            style={styles.chatButton}
          />
          <Button
            title="Leave Game"
            onPress={onLeaveGame}
            variant="outline"
            disabled={disabled}
            style={styles.secondaryButton}
          />
        </View>
      );
    }

    return (
      <View style={styles.buttonContainer}>
        <Button
          title="💬 Chat"
          onPress={onChatToggle}
          disabled={disabled}
          style={styles.chatButton}
        />
        <Button
          title="Leave Game"
          onPress={onLeaveGame}
          variant="outline"
          disabled={disabled}
          style={styles.secondaryButton}
        />
      </View>
    );
  };

  const renderResultsActions = () => (
    <View style={styles.buttonContainer}>
      <Button
        title="View Full Results"
        onPress={onViewResults}
        disabled={disabled || !onViewResults}
        style={styles.primaryButton}
      />
      
      {isHost && (
        <Button
          title="Play Again"
          onPress={onStartGame}
          disabled={disabled || !onStartGame}
          style={styles.secondaryButton}
        />
      )}
      
      <Button
        title="Leave Game"
        onPress={onLeaveGame}
        variant="outline"
        disabled={disabled}
        style={styles.secondaryButton}
      />
    </View>
  );

  const renderPhaseActions = () => {
    switch (currentPhase) {
      case 'lobby':
        return renderLobbyActions();
      case 'day':
        return renderDayActions();
      case 'night':
        return renderNightActions();
      case 'voting':
        return renderVotingActions();
      case 'results':
        return renderResultsActions();
      default:
        return (
          <View style={styles.buttonContainer}>
            <Button
              title="💬 Chat"
              onPress={onChatToggle}
              disabled={disabled}
              style={styles.chatButton}
            />
            <Button
              title="Leave Game"
              onPress={onLeaveGame}
              variant="outline"
              disabled={disabled}
              style={styles.secondaryButton}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderPhaseActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: '#374151',
  },
  completedButton: {
    backgroundColor: '#10b981',
  },
  chatButton: {
    backgroundColor: '#f59e0b',
  },
});