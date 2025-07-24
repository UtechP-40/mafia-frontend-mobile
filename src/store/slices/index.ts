// Redux slice exports
export * from './authSlice';
export * from './gameSlice';
export * from './uiSlice';

// Re-export commonly used actions for convenience
export {
  // Auth actions
  loginUser,
  registerUser,
  refreshAuthToken,
  logout,
  updateUser,
  clearError as clearAuthError,
  
  // Auth selectors
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from './authSlice';

export {
  // Game actions
  createRoom,
  joinRoom,
  leaveRoom,
  setCurrentRoom,
  updateRoomSettings,
  setGameState,
  updateGamePhase,
  updateTimeRemaining,
  incrementDay,
  updatePlayers,
  addPlayer,
  removePlayer,
  eliminatePlayer,
  setCurrentPlayer,
  updatePlayerRole,
  castVote,
  updateVotes,
  clearVotes,
  addGameEvent,
  addChatMessage,
  clearChatMessages,
  setConnectionStatus,
  setConnectionError,
  setGameError,
  clearGameError,
  clearConnectionError,
  startGame,
  endGame,
  resetGame,
  
  // Game selectors
  selectGame,
  selectCurrentRoom,
  selectGameState,
  selectPlayers,
  selectCurrentPlayer,
  selectCurrentPhase,
  selectTimeRemaining,
  selectIsConnected,
  selectIsInGame,
  selectIsHost,
  selectVotes,
  selectHasVoted,
  selectGameError,
  selectConnectionError,
} from './gameSlice';

export {
  // UI actions
  setLoading,
  setLoadingMessage,
  showModal,
  hideModal,
  hideModalByType,
  hideAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  clearExpiredNotifications,
  setTheme,
  toggleTheme,
  setCurrentScreen,
  navigateBack,
  clearNavigationHistory,
  togglePlayerList,
  setShowPlayerList,
  toggleChat,
  setShowChat,
  setChatInputFocused,
  setSoundEnabled,
  setVibrationEnabled,
  setAnimationsEnabled,
  updateSettings,
  setOnlineStatus,
  setConnectionQuality,
  updatePerformanceMetrics,
  resetUI,
  
  // UI selectors
  selectUI,
  selectIsLoading,
  selectLoadingMessage,
  selectActiveModals,
  selectNotifications,
  selectTheme,
  selectCurrentScreen,
  selectIsOnline,
  selectConnectionQuality,
  selectSettings,
} from './uiSlice';