// Redux slice exports
export * from './authSlice';
export * from './gameSlice';
export * from './uiSlice';
export * from './friendsSlice';
export * from './roomsSlice';

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

// Friends exports
export {
  fetchFriends,
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  clearSearchResults,
  updateFriendStatus,
  addFriendRequest,
  removeFriendRequest,
  selectFriends,
  selectFriendsList,
  selectFriendRequests,
  selectOnlineFriends,
  selectFriendsLoading,
  selectFriendsError,
  selectSearchResults,
  selectIsSearching,
} from './friendsSlice';

// Rooms exports
export {
  fetchPublicRooms,
  startQuickMatch,
  cancelQuickMatch,
  createPublicRoom,
  joinPublicRoom,
  setFilters,
  clearFilters,
  updateMatchmakingPreferences,
  updateRoomInList,
  removeRoomFromList,
  addRoomToList,
  selectRooms,
  selectPublicRooms,
  selectRoomsLoading,
  selectRoomsError,
  selectMatchmakingPreferences,
  selectIsMatchmaking,
  selectMatchmakingResult,
  selectRoomFilters,
} from './roomsSlice';

// Specific error clearing functions
export { clearError as clearFriendsError } from './friendsSlice';
export { clearError as clearRoomsError } from './roomsSlice';