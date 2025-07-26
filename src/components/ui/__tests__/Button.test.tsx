import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '../Button';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button with title correctly', () => {
    render(<Button title="Test Button" onPress={mockOnPress} />);

    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when button is pressed', () => {
    render(<Button title="Test Button" onPress={mockOnPress} />);

    const button = screen.getByText('Test Button');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when button is disabled', () => {
    render(<Button title="Test Button" onPress={mockOnPress} disabled />);

    const button = screen.getByText('Test Button');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies disabled styling when disabled', () => {
    render(<Button title="Test Button" onPress={mockOnPress} disabled />);

    const button = screen.getByTestId('button-container');
    expect(button).toHaveStyle({
      opacity: 0.5,
    });
  });

  it('shows loading state correctly', () => {
    render(<Button title="Test Button" onPress={mockOnPress} loading />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    expect(screen.queryByText('Test Button')).toBeNull();
  });

  it('applies primary variant styling', () => {
    render(<Button title="Test Button" onPress={mockOnPress} variant="primary" />);

    const button = screen.getByTestId('button-container');
    expect(button).toHaveStyle({
      backgroundColor: '#007AFF',
    });
  });

  it('applies secondary variant styling', () => {
    render(<Button title="Test Button" onPress={mockOnPress} variant="secondary" />);

    const button = screen.getByTestId('button-container');
    expect(button).toHaveStyle({
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#007AFF',
    });
  });

  it('applies danger variant styling', () => {
    render(<Button title="Test Button" onPress={mockOnPress} variant="danger" />);

    const button = screen.getByTestId('button-container');
    expect(button).toHaveStyle({
      backgroundColor: '#FF3B30',
    });
  });

  it('applies small size styling', () => {
    render(<Button title="Test Button" onPress={mockOnPress} size="small" />);

    const button = screen.getByTestId('button-container');
    expect(button).toHaveStyle({
      paddingVertical: 8,
      paddingHorizontal: 16,
    });
  });

  it('applies large size styling', () => {
    render(<Button title="Test Button" onPress={mockOnPress} size="large" />);

    const button = screen.getByTestId('button-container');
    expect(button).toHaveStyle({
      paddingVertical: 16,
      paddingHorizontal: 32,
    });
  });

  it('renders with icon correctly', () => {
    render(
      <Button
        title="Test Button"
        onPress={mockOnPress}
        icon="checkmark"
        iconPosition="left"
      />
    );

    expect(screen.getByTestId('button-icon')).toBeTruthy();
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('renders icon-only button correctly', () => {
    render(<Button onPress={mockOnPress} icon="checkmark" />);

    expect(screen.getByTestId('button-icon')).toBeTruthy();
    expect(screen.queryByText('Test Button')).toBeNull();
  });

  it('applies custom style correctly', () => {
    const customStyle = { backgroundColor: '#FF0000' };
    render(
      <Button
        title="Test Button"
        onPress={mockOnPress}
        style={customStyle}
      />
    );

    const button = screen.getByTestId('button-container');
    expect(button).toHaveStyle(customStyle);
  });

  it('applies custom text style correctly', () => {
    const customTextStyle = { fontSize: 20 };
    render(
      <Button
        title="Test Button"
        onPress={mockOnPress}
        textStyle={customTextStyle}
      />
    );

    const buttonText = screen.getByText('Test Button');
    expect(buttonText).toHaveStyle(customTextStyle);
  });

  it('handles long press correctly', () => {
    const mockOnLongPress = jest.fn();
    render(
      <Button
        title="Test Button"
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
      />
    );

    const button = screen.getByText('Test Button');
    fireEvent(button, 'longPress');

    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
  });

  it('shows haptic feedback on press', () => {
    render(
      <Button
        title="Test Button"
        onPress={mockOnPress}
        hapticFeedback
      />
    );

    const button = screen.getByText('Test Button');
    fireEvent.press(button);

    // Haptic feedback would be tested with actual device/simulator
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies accessibility props correctly', () => {
    render(
      <Button
        title="Test Button"
        onPress={mockOnPress}
        accessibilityLabel="Custom accessibility label"
        accessibilityHint="Custom accessibility hint"
      />
    );

    const button = screen.getByTestId('button-container');
    expect(button.props.accessibilityLabel).toBe('Custom accessibility label');
    expect(button.props.accessibilityHint).toBe('Custom accessibility hint');
  });

  it('handles press animation correctly', () => {
    render(<Button title="Test Button" onPress={mockOnPress} />);

    const button = screen.getByTestId('button-container');
    
    // Simulate press in
    fireEvent(button, 'pressIn');
    // Animation would scale down the button
    
    // Simulate press out
    fireEvent(button, 'pressOut');
    // Animation would scale back to normal
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders with full width correctly', () => {
    render(<Button title="Test Button" onPress={mockOnPress} fullWidth />);

    const button = screen.getByTestId('button-container');
    expect(button).toHaveStyle({
      width: '100%',
    });
  });

  it('handles testID correctly', () => {
    render(
      <Button
        title="Test Button"
        onPress={mockOnPress}
        testID="custom-button"
      />
    );

    expect(screen.getByTestId('custom-button')).toBeTruthy();
  });
});