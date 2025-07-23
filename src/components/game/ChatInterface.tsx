import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatInterfaceProps {
  messages: Array<{
    id: string;
    content: string;
    playerId: string;
  }>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      {messages.map((message) => (
        <Text key={message.id} style={styles.message}>
          {message.content}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 4,
  },
});