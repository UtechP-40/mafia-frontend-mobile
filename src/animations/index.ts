// Animation system exports
export * from './AnimationConfig';
export * from './AnimationUtils';

// Animation components
export * from './components/AnimatedButton';
export * from './components/AnimatedPlayerCard';
export * from './components/CardFlipAnimation';
export * from './components/VotingAnimation';
export * from './components/EliminationAnimation';

// Animation hooks
export * from './hooks/useAnimations';
export * from './hooks/useSpringAnimation';
export * from './hooks/useTimingAnimation';

// Performance utilities
export { runAnimationBenchmark, monitorFrameRate } from './__tests__/AnimationPerformance.test';