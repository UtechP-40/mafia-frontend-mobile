import { lazy } from 'react';

// Lazy load heavy screens to reduce initial bundle size
export const LazyGameScreen = lazy(() => import('../screens/GameScreen'));
export const LazyLobbyScreen = lazy(() => import('../screens/LobbyScreen'));
export const LazySettingsScreen = lazy(() => import('../screens/SettingsScreen'));
export const LazyStatsScreen = lazy(() => import('../screens/StatsScreen'));
export const LazyFriendsScreen = lazy(() => import('../screens/FriendsScreen'));

// Lazy load heavy components
export const LazyVoiceChat = lazy(() => import('../components/voice/VoiceChat'));
export const LazyGameBoard = lazy(() => import('../components/game/GameBoard'));
export const LazyPlayerList = lazy(() => import('../components/game/PlayerList'));
export const LazyAnimatedBackground = lazy(() => import('../components/ui/AnimatedBackground'));

// Lazy load services that are not immediately needed
export const LazyWebRTCService = lazy(() => import('../services/WebRTCService'));
export const LazyAnalyticsService = lazy(() => import('../services/AnalyticsService'));

// Bundle splitting utility
export const loadChunk = async (chunkName: string) => {
  try {
    switch (chunkName) {
      case 'game':
        return await import('../components/game');
      case 'voice':
        return await import('../components/voice');
      case 'animations':
        return await import('../components/animations');
      case 'utils':
        return await import('../utils');
      default:
        throw new Error(`Unknown chunk: ${chunkName}`);
    }
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error);
    throw error;
  }
};

// Preload critical chunks
export const preloadCriticalChunks = async () => {
  const criticalChunks = ['game', 'voice'];
  
  try {
    await Promise.all(
      criticalChunks.map(chunk => loadChunk(chunk))
    );
  } catch (error) {
    console.warn('Failed to preload some critical chunks:', error);
  }
};