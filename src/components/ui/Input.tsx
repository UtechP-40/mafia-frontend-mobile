import React from 'react';
import { TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  style?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  style,
  ...props
}) => {
  return (
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        style,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#6b7280"
      secureTextEntry={secureTextEntry}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#374151',
  },
  inputError: {
    borderColor: '#ef4444',
  },
});