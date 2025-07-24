import { Middleware } from "@reduxjs/toolkit";
import { socketService } from "../../services/socket";
import {
  setConnectionStatus,
  setConnectionError,
  addPlayer,
  removePlayer,
  setGameState,
  updateGamePhase,
  updateTimeRemaining,
  addGameEvent,
  addChatMessage,
  updateVotes,
  eliminatePlayer,
  setCurrentRoom,
} from "../slices/gameSlice";
import { addNotification } from "../slices/uiSlice";

// Socket event types
interface SocketEventMap {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;

  // Room events
  "room-joined": (data: { room: any; player: any }) => void;
  "room-left": (data: { playerId: string }) => void;
  "player-joined": (data: { player: any }) => void;
  "player-left": (data: { playerId: string }) => void;
  "room-updated": (data: { room: any }) => void;

  // Game events
  "game-started": (data: { gameState: any }) => void;
  "game-state-update": (data: { gameState: any }) => void;
  "phase-changed": (data: { phase: string; timeRemaining: number }) => void;
  "player-eliminated": (data: { playerId: string; reason: string }) => void;
  "votes-updated": (data: { votes: any[] }) => void;
  "game-ended": (data: { winner: string; results: any }) => void;

  // Chat events
  "chat-message": (data: { message: any }) => void;
  "system-message": (data: { message: string; type: string }) => void;

  // Error events
  error: (data: { message: string; code?: string }) => void;
  "game-error": (data: { message: string; code?: string }) => void;
}

// Actions that should trigger socket events
const SOCKET_ACTIONS = {
  // Room actions
  "game/joinRoom/pending": "join-room",
  "game/createRoom/pending": "create-room",
  "game/leaveRoom": "leave-room",

  // Game actions
  "game/castVote": "cast-vote",
  "game/startGame": "start-game",

  // Chat actions
  "game/addChatMessage": "send-chat-message",
} as const;

export const socketMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();

  // Handle socket connection based on auth state
  if (
    action.type === "auth/loginSuccess" ||
    action.type === "auth/loginUser/fulfilled"
  ) {
    const { token } = state.auth;
    if (token && !socketService.isConnected()) {
      connectSocket(store, token);
    }
  }

  // Handle socket disconnection on logout
  if (action.type === "auth/logout") {
    if (socketService.isConnected()) {
      socketService.disconnect();
      store.dispatch(setConnectionStatus(false));
    }
  }

  // Handle actions that should emit socket events
  const socketEvent =
    SOCKET_ACTIONS[action.type as keyof typeof SOCKET_ACTIONS];
  if (socketEvent && socketService.isConnected()) {
    emitSocketEvent(socketEvent, action.payload);
  }

  return result;
};

function connectSocket(store: any, token: string) {
  socketService.connect(token);

  // Connection events
  socketService.on("connect", () => {
    store.dispatch(setConnectionStatus(true));
    store.dispatch(
      addNotification({
        message: "Connected to game server",
        type: "success",
        duration: 3000,
      })
    );
  });

  socketService.on("disconnect", (reason: string) => {
    store.dispatch(setConnectionStatus(false));
    store.dispatch(setConnectionError(`Disconnected: ${reason}`));

    if (reason !== "io client disconnect") {
      store.dispatch(
        addNotification({
          message: "Lost connection to game server",
          type: "error",
          persistent: true,
        })
      );
    }
  });

  socketService.on("connect_error", (error: Error) => {
    store.dispatch(setConnectionStatus(false));
    store.dispatch(setConnectionError(error.message));
    store.dispatch(
      addNotification({
        message: "Failed to connect to game server",
        type: "error",
        duration: 5000,
      })
    );
  });

  // Room events
  socketService.on("room-joined", (data) => {
    store.dispatch(setCurrentRoom(data.room));
    store.dispatch(
      addNotification({
        message: `Joined room ${data.room.code}`,
        type: "success",
        duration: 3000,
      })
    );
  });

  socketService.on("player-joined", (data) => {
    store.dispatch(addPlayer(data.player));
    store.dispatch(
      addNotification({
        message: `${data.player.username} joined the room`,
        type: "info",
        duration: 3000,
      })
    );
  });

  socketService.on("player-left", (data) => {
    store.dispatch(removePlayer(data.playerId));
    // Note: We might want to get the player name before removing
    store.dispatch(
      addNotification({
        message: "A player left the room",
        type: "info",
        duration: 3000,
      })
    );
  });

  socketService.on("room-updated", (data) => {
    store.dispatch(setCurrentRoom(data.room));
  });

  // Game events
  socketService.on("game-started", (data) => {
    store.dispatch(setGameState(data.gameState));
    store.dispatch(
      addNotification({
        message: "Game has started!",
        type: "success",
        duration: 3000,
      })
    );
  });

  socketService.on("game-state-update", (data) => {
    store.dispatch(setGameState(data.gameState));
  });

  socketService.on("phase-changed", (data) => {
    store.dispatch(updateGamePhase(data.phase as any));
    store.dispatch(updateTimeRemaining(data.timeRemaining));

    const phaseMessages = {
      day: "Day phase has begun - discuss and vote!",
      night: "Night phase - Mafia, choose your target",
      voting: "Voting time!",
      results: "Game over!",
    };

    const message =
      phaseMessages[data.phase as keyof typeof phaseMessages] ||
      `Phase changed to ${data.phase}`;
    store.dispatch(
      addNotification({
        message,
        type: "info",
        duration: 4000,
      })
    );
  });

  socketService.on("player-eliminated", (data) => {
    store.dispatch(eliminatePlayer(data.playerId));
    store.dispatch(
      addGameEvent({
        id: Date.now().toString(),
        type: "elimination",
        playerId: data.playerId,
        data: { reason: data.reason },
        timestamp: new Date(),
      })
    );

    store.dispatch(
      addNotification({
        message: `A player has been eliminated`,
        type: "warning",
        duration: 5000,
      })
    );
  });

  socketService.on("votes-updated", (data) => {
    store.dispatch(updateVotes(data.votes));
  });

  socketService.on("game-ended", (data) => {
    store.dispatch(
      addGameEvent({
        id: Date.now().toString(),
        type: "game_end" as any,
        data: { winner: data.winner, results: data.results },
        timestamp: new Date(),
      })
    );

    store.dispatch(
      addNotification({
        message: `Game ended! Winner: ${data.winner}`,
        type: "success",
        duration: 10000,
      })
    );
  });

  // Chat events
  socketService.on("chat-message", (data) => {
    store.dispatch(addChatMessage(data.message));
  });

  socketService.on("system-message", (data) => {
    store.dispatch(
      addChatMessage({
        id: Date.now().toString(),
        type: "system_message",
        content: data.message,
        timestamp: new Date(),
      })
    );

    if (data.type === "important") {
      store.dispatch(
        addNotification({
          message: data.message,
          type: "info",
          duration: 5000,
        })
      );
    }
  });

  // Error events
  socketService.on("error", (data) => {
    store.dispatch(
      addNotification({
        message: data.message,
        type: "error",
        duration: 5000,
      })
    );
  });

  socketService.on("game-error", (data) => {
    store.dispatch(
      addNotification({
        message: `Game Error: ${data.message}`,
        type: "error",
        duration: 7000,
      })
    );
  });
}

function emitSocketEvent(event: string, payload: any) {
  try {
    socketService.emit(event, payload);
  } catch (error) {
    console.error(`Failed to emit socket event ${event}:`, error);
  }
}

// Helper function to setup socket listeners for a specific room
export function setupRoomListeners(roomId: string, store: any) {
  // Join the socket room
  socketService.emit("join-room", { roomId });

  // Setup room-specific listeners if needed
  // This can be extended for room-specific events
}

// Helper function to cleanup socket listeners
export function cleanupSocketListeners() {
  // Remove all listeners except connection events
  const connectionEvents = ["connect", "disconnect", "connect_error"];

  // This would need to be implemented in the socket service
  // socketService.removeAllListenersExcept(connectionEvents);
}
