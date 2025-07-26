import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { 
  ANIMATION_DURATIONS, 
  EASING_FUNCTIONS,
  TRANSFORM_VALUES
} from '../AnimationConfig';

interface CardFlipAnimationProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  style?: ViewStyle;
  cardStyle?: ViewStyle;
  duration?: number;
  onFlipStart?: () => void;
  onFlipMidpoint?: () => void;
  onFlipComplete?: () => void;
}

export interface CardFlipAnimationRef {
  flipToBack: () => void;
  flipToFront: () => void;
  flip: () => void;
  isFlipped: boolean;
}

export const CardFlipAnimation = forwardRef<CardFlipAnimationRef, CardFlipAnimationProps>(({
  frontContent,
  backContent,
  style,
  cardStyle,
  duration = ANIMATION_DURATIONS.CARD_FLIP,
  onFlipStart,
  onFlipMidpoint,
  onFlipComplete,
}, ref) => {
  const rotateY = useSharedValue(0);
  const isFlipped = useSharedValue(false);

  const flipToBack = useCallback(() => {
    if (isFlipped.value) return;
    
    onFlipStart?.();
    
    rotateY.value = withSequence(
      withTiming(TRANSFORM_VALUES.CARD_FLIP_HALF, {
        duration: duration / 2,
        easing: EASING_FUNCTIONS.EASE_IN,
      }, onFlipMidpoint ? runOnJS(onFlipMidpoint) : undefined),
      withTiming(TRANSFORM_VALUES.CARD_FLIP_FULL, {
        duration: duration / 2,
        easing: EASING_FUNCTIONS.EASE_OUT,
      }, onFlipComplete ? runOnJS(onFlipComplete) : undefined)
    );
    
    isFlipped.value = true;
  }, [duration, onFlipStart, onFlipMidpoint, onFlipComplete]);

  const flipToFront = useCallback(() => {
    if (!isFlipped.value) return;
    
    onFlipStart?.();
    
    rotateY.value = withSequence(
      withTiming(TRANSFORM_VALUES.CARD_FLIP_HALF, {
        duration: duration / 2,
        easing: EASING_FUNCTIONS.EASE_IN,
      }, onFlipMidpoint ? runOnJS(onFlipMidpoint) : undefined),
      withTiming(0, {
        duration: duration / 2,
        easing: EASING_FUNCTIONS.EASE_OUT,
      }, onFlipComplete ? runOnJS(onFlipComplete) : undefined)
    );
    
    isFlipped.value = false;
  }, [duration, onFlipStart, onFlipMidpoint, onFlipComplete]);

  const flip = useCallback(() => {
    if (isFlipped.value) {
      flipToFront();
    } else {
      flipToBack();
    }
  }, [flipToFront, flipToBack]);

  useImperativeHandle(ref, () => ({
    flipToBack,
    flipToFront,
    flip,
    isFlipped: isFlipped.value,
  }));

  // Front card animated style
  const frontCardStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      rotateY.value,
      [0, TRANSFORM_VALUES.CARD_FLIP_HALF, TRANSFORM_VALUES.CARD_FLIP_FULL],
      [1, 0, 0],
      Extrapolate.CLAMP
    );

    const rotateYDeg = interpolate(
      rotateY.value,
      [0, TRANSFORM_VALUES.CARD_FLIP_HALF],
      [0, TRANSFORM_VALUES.CARD_FLIP_HALF],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateYDeg}deg` },
      ],
    };
  });

  // Back card animated style
  const backCardStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      rotateY.value,
      [0, TRANSFORM_VALUES.CARD_FLIP_HALF, TRANSFORM_VALUES.CARD_FLIP_FULL],
      [0, 0, 1],
      Extrapolate.CLAMP
    );

    const rotateYDeg = interpolate(
      rotateY.value,
      [TRANSFORM_VALUES.CARD_FLIP_HALF, TRANSFORM_VALUES.CARD_FLIP_FULL],
      [-TRANSFORM_VALUES.CARD_FLIP_HALF, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateYDeg}deg` },
      ],
    };
  });

  return (
    <View style={[styles.container, style]}>
      {/* Front Card */}
      <Animated.View style={[styles.card, styles.frontCard, cardStyle, frontCardStyle]}>
        {frontContent}
      </Animated.View>
      
      {/* Back Card */}
      <Animated.View style={[styles.card, styles.backCard, cardStyle, backCardStyle]}>
        {backContent}
      </Animated.View>
    </View>
  );
});

CardFlipAnimation.displayName = 'CardFlipAnimation';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  
  card: {
    backfaceVisibility: 'hidden',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  frontCard: {
    position: 'relative',
    zIndex: 2,
  },
  
  backCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});