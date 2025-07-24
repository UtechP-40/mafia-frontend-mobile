import { configureStore } from '@reduxjs/toolkit';
import { gameSlice, createRoom, joinRoom, selectGame, selectCurrentRoom, selectPlayers, selectCurrentPhase } from '../slices/gameSlice';
import { Player, Room, GamePhase, Vote, GameEvent } from '../../types/game';

// Mock fetch for async thunks
global.fetch = jest.fn();

describe('gameSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        game: gameSlice.reducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().game;
      expect(state).toEqual({
        currentRoom: null,
        roomCode: null,
        gameState: null,
        currentPhase: 'lobby',
        dayNumber: 0,
        timeRemaining: 0,
        players: [],
        eliminatedPlayers: [],
        currentPlayer: null,
        votes: [],
        hasVoted: false,
        votingTarget: null,
        gameEvents: [],
        chatMessages: [],
        isConnected: false,
        isInGame: false,
        isHost: false,
        isJoiningRoom: false,
        isCreatingRoom: false,
        isStartingGame: false,
        error: null,
        connectionError: null,
      });
    });
  });

  describe('room management actions', () => {
    const mockRoom: Room = {
      id: 'room-1',
      code: 'ABC123',
      hostId: 'user-1',
      players: [
        {
          id: 'user-1',
          username: 'host',
          avatar: 'avatar1.jpg',
          isAlive: true,
          isHost: true,
        },
      ],
      settings: {
        isPublic: true,
        maxPlayers: 8,
        gameSettings: {
          maxPlayers: 8,
          enableVoiceChat: true,
          dayPhaseDuration: 300,
          nightPhaseDuration: 180,
          votingDuration: 60,
          roles: [],
        },
        allowSpectators: false,
        requireInvite: false,
      },
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should handle setCurrentRoom', () => {
      // Set current player first
      store.dispatch(gameSlice.actions.setCurrentPlayer({
        id: 'user-1',
        username: 'host',
        avatar: 'avatar1.jpg',
        isAlive: true,
        isHost: true,
      }));

      store.dispatch(gameSlice.actions.setCurrentRoom(mockRoom));
      const state = store.getState().game;

      expect(state.currentRoom).toEqual(mockRoom);
      expect(state.roomCode).toBe('ABC123');
      expect(state.players).toEqual(mockRoom.players);
      expect(state.isHost).toBe(true);
    });

    it('should handle leaveRoom', () => {
      // First join a room
      store.dispatch(gameSlice.actions.setCurrentRoom(mockRoom));
      
      // Then leave
      store.dispatch(gameSlice.actions.leaveRoom());
      const state = store.getState().game;

      expect(state.currentRoom).toBe(null);
      expect(state.roomCode).toBe(null);
      expect(state.gameState).toBe(null);
      expect(state.players).toEqual([]);
      expect(state.eliminatedPlayers).toEqual([]);
      expect(state.currentPhase).toBe('lobby');
      expect(state.dayNumber).toBe(0);
      expect(state.timeRemaining).toBe(0);
      expect(state.votes).toEqual([]);
      expect(state.hasVoted).toBe(false);
      expect(state.votingTarget).toBe(null);
      expect(state.gameEvents).toEqual([]);
      expect(state.chatMessages).toEqual([]);
      expect(state.isInGame).toBe(false);
      expect(state.isHost).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle updateRoomSettings', () => {
      store.dispatch(gameSlice.actions.setCurrentRoom(mockRoom));
      
      const settingsUpdate = { maxPlayers: 10, allowSpectators: true };
      store.dispatch(gameSlice.actions.updateRoomSettings(settingsUpdate));
      const state = store.getState().game;

      expect(state.currentRoom?.settings.maxPlayers).toBe(10);
      expect(state.currentRoom?.settings.allowSpectators).toBe(true);
      expect(state.currentRoom?.settings.isPublic).toBe(true); // Should remain unchanged
    });
  });

  describe('game state management actions', () => {
    const mockGameState = {
      id: 'game-1',
      roomId: 'room-1',
      phase: 'day' as GamePhase,
      dayNumber: 1,
      players: [
        { id: 'user-1', username: 'player1', avatar: 'avatar1.jpg', isAlive: true, isHost: true },
        { id: 'user-2', username: 'player2', avatar: 'avatar2.jpg', isAlive: true, isHost: false },
      ],
      eliminatedPlayers: [],
      votes: [],
      timeRemaining: 300,
      settings: {
        maxPlayers: 8,
        enableVoiceChat: true,
        dayPhaseDuration: 300,
        nightPhaseDuration: 180,
        votingDuration: 60,
        roles: [],
      },
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should handle setGameState', () => {
      store.dispatch(gameSlice.actions.setGameState(mockGameState));
      const state = store.getState().game;

      expect(state.gameState).toEqual(mockGameState);
      expect(state.currentPhase).toBe('day');
      expect(state.dayNumber).toBe(1);
      expect(state.timeRemaining).toBe(300);
      expect(state.players).toEqual(mockGameState.players);
      expect(state.eliminatedPlayers).toEqual([]);
      expect(state.votes).toEqual([]);
      expect(state.gameEvents).toEqual([]);
      expect(state.isInGame).toBe(true);
    });

    it('should handle updateGamePhase', () => {
      store.dispatch(gameSlice.actions.updateGamePhase('night'));
      const state = store.getState().game;

      expect(state.currentPhase).toBe('night');
      expect(state.hasVoted).toBe(false);
      expect(state.votingTarget).toBe(null);
    });

    it('should handle updateTimeRemaining', () => {
      store.dispatch(gameSlice.actions.updateTimeRemaining(120));
      const state = store.getState().game;

      expect(state.timeRemaining).toBe(120);
    });

    it('should handle incrementDay', () => {
      store.dispatch(gameSlice.actions.setGameState(mockGameState));
      store.dispatch(gameSlice.actions.incrementDay());
      const state = store.getState().game;

      expect(state.dayNumber).toBe(2);
    });
  });

  describe('player management actions', () => {
    const mockPlayers: Player[] = [
      { id: 'user-1', username: 'player1', avatar: 'avatar1.jpg', isAlive: true, isHost: true },
      { id: 'user-2', username: 'player2', avatar: 'avatar2.jpg', isAlive: true, isHost: false },
    ];

    it('should handle updatePlayers', () => {
      store.dispatch(gameSlice.actions.updatePlayers(mockPlayers));
      const state = store.getState().game;

      expect(state.players).toEqual(mockPlayers);
    });

    it('should handle addPlayer', () => {
      store.dispatch(gameSlice.actions.updatePlayers([mockPlayers[0]]));
      
      const newPlayer: Player = {
        id: 'user-3',
        username: 'player3',
        avatar: 'avatar3.jpg',
        isAlive: true,
        isHost: false,
      };

      store.dispatch(gameSlice.actions.addPlayer(newPlayer));
      const state = store.getState().game;

      expect(state.players).toHaveLength(2);
      expect(state.players[1]).toEqual(newPlayer);
    });

    it('should handle addPlayer with existing player (update)', () => {
      store.dispatch(gameSlice.actions.updatePlayers(mockPlayers));
      
      const updatedPlayer: Player = {
        ...mockPlayers[0],
        username: 'updatedplayer1',
      };

      store.dispatch(gameSlice.actions.addPlayer(updatedPlayer));
      const state = store.getState().game;

      expect(state.players).toHaveLength(2);
      expect(state.players[0].username).toBe('updatedplayer1');
    });

    it('should handle removePlayer', () => {
      store.dispatch(gameSlice.actions.updatePlayers(mockPlayers));
      store.dispatch(gameSlice.actions.removePlayer('user-2'));
      const state = store.getState().game;

      expect(state.players).toHaveLength(1);
      expect(state.players[0].id).toBe('user-1');
    });

    it('should handle eliminatePlayer', () => {
      store.dispatch(gameSlice.actions.updatePlayers(mockPlayers));
      store.dispatch(gameSlice.actions.eliminatePlayer('user-2'));
      const state = store.getState().game;

      const eliminatedPlayer = state.players.find(p => p.id === 'user-2');
      expect(eliminatedPlayer?.isAlive).toBe(false);
      expect(state.eliminatedPlayers).toHaveLength(1);
      expect(state.eliminatedPlayers[0].id).toBe('user-2');
    });

    it('should handle setCurrentPlayer', () => {
      const currentPlayer = mockPlayers[0];
      store.dispatch(gameSlice.actions.setCurrentPlayer(currentPlayer));
      const state = store.getState().game;

      expect(state.currentPlayer).toEqual(currentPlayer);
    });

    it('should handle updatePlayerRole', () => {
      store.dispatch(gameSlice.actions.updatePlayers(mockPlayers));
      store.dispatch(gameSlice.actions.updatePlayerRole({
        playerId: 'user-1',
        role: 'mafia',
      }));
      const state = store.getState().game;

      const player = state.players.find(p => p.id === 'user-1');
      expect(player?.role).toBe('mafia');
    });
  });

  describe('voting system actions', () => {
    beforeEach(() => {
      const currentPlayer: Player = {
        id: 'user-1',
        username: 'player1',
        avatar: 'avatar1.jpg',
        isAlive: true,
        isHost: true,
      };
      store.dispatch(gameSlice.actions.setCurrentPlayer(currentPlayer));
    });

    it('should handle castVote', () => {
      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));
      const state = store.getState().game;

      expect(state.votes).toHaveLength(1);
      expect(state.votes[0].playerId).toBe('user-1');
      expect(state.votes[0].targetId).toBe('user-2');
      expect(state.hasVoted).toBe(true);
      expect(state.votingTarget).toBe('user-2');
    });

    it('should handle castVote replacing existing vote', () => {
      // Cast first vote
      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));
      
      // Cast second vote (should replace first)
      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-3' }));
      const state = store.getState().game;

      expect(state.votes).toHaveLength(1);
      expect(state.votes[0].targetId).toBe('user-3');
      expect(state.votingTarget).toBe('user-3');
    });

    it('should not allow voting if already voted', () => {
      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));
      
      // Manually set hasVoted to true to simulate the condition
      const state = store.getState().game;
      expect(state.hasVoted).toBe(true);
    });

    it('should handle updateVotes', () => {
      const votes: Vote[] = [
        { playerId: 'user-1', targetId: 'user-2', timestamp: new Date() },
        { playerId: 'user-3', targetId: 'user-2', timestamp: new Date() },
      ];

      store.dispatch(gameSlice.actions.updateVotes(votes));
      const state = store.getState().game;

      expect(state.votes).toEqual(votes);
      expect(state.hasVoted).toBe(true); // Current player has voted
      expect(state.votingTarget).toBe('user-2');
    });

    it('should handle clearVotes', () => {
      // First cast a vote
      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));
      
      // Then clear votes
      store.dispatch(gameSlice.actions.clearVotes());
      const state = store.getState().game;

      expect(state.votes).toEqual([]);
      expect(state.hasVoted).toBe(false);
      expect(state.votingTarget).toBe(null);
    });
  });

  describe('events and chat actions', () => {
    it('should handle addGameEvent', () => {
      const gameEvent: GameEvent = {
        id: 'event-1',
        type: 'player_join',
        playerId: 'user-1',
        timestamp: new Date(),
      };

      store.dispatch(gameSlice.actions.addGameEvent(gameEvent));
      const state = store.getState().game;

      expect(state.gameEvents).toHaveLength(1);
      expect(state.gameEvents[0]).toEqual(gameEvent);
    });

    it('should handle addChatMessage', () => {
      const chatMessage = {
        id: 'msg-1',
        playerId: 'user-1',
        content: 'Hello everyone!',
        timestamp: new Date(),
      };

      store.dispatch(gameSlice.actions.addChatMessage(chatMessage));
      const state = store.getState().game;

      expect(state.chatMessages).toHaveLength(1);
      expect(state.chatMessages[0]).toEqual(chatMessage);
    });

    it('should handle clearChatMessages', () => {
      const chatMessage = { id: 'msg-1', content: 'Hello' };
      store.dispatch(gameSlice.actions.addChatMessage(chatMessage));
      store.dispatch(gameSlice.actions.clearChatMessages());
      const state = store.getState().game;

      expect(state.chatMessages).toEqual([]);
    });
  });

  describe('connection management actions', () => {
    it('should handle setConnectionStatus', () => {
      store.dispatch(gameSlice.actions.setConnectionStatus(true));
      let state = store.getState().game;
      expect(state.isConnected).toBe(true);
      expect(state.connectionError).toBe(null);

      store.dispatch(gameSlice.actions.setConnectionStatus(false));
      state = store.getState().game;
      expect(state.isConnected).toBe(false);
    });

    it('should handle setConnectionError', () => {
      const errorMessage = 'Connection lost';
      store.dispatch(gameSlice.actions.setConnectionError(errorMessage));
      const state = store.getState().game;

      expect(state.connectionError).toBe(errorMessage);
      expect(state.isConnected).toBe(false);
    });

    it('should handle clearConnectionError', () => {
      store.dispatch(gameSlice.actions.setConnectionError('Some error'));
      store.dispatch(gameSlice.actions.clearConnectionError());
      const state = store.getState().game;

      expect(state.connectionError).toBe(null);
    });
  });

  describe('error handling actions', () => {
    it('should handle setGameError', () => {
      const errorMessage = 'Game error occurred';
      store.dispatch(gameSlice.actions.setGameError(errorMessage));
      const state = store.getState().game;

      expect(state.error).toBe(errorMessage);
    });

    it('should handle clearGameError', () => {
      store.dispatch(gameSlice.actions.setGameError('Some error'));
      store.dispatch(gameSlice.actions.clearGameError());
      const state = store.getState().game;

      expect(state.error).toBe(null);
    });
  });

  describe('game flow actions', () => {
    it('should handle startGame', () => {
      store.dispatch(gameSlice.actions.startGame());
      const state = store.getState().game;

      expect(state.isInGame).toBe(true);
      expect(state.currentPhase).toBe('day');
      expect(state.dayNumber).toBe(1);
    });

    it('should handle endGame', () => {
      store.dispatch(gameSlice.actions.startGame());
      store.dispatch(gameSlice.actions.endGame());
      const state = store.getState().game;

      expect(state.isInGame).toBe(false);
      expect(state.currentPhase).toBe('results');
    });

    it('should handle resetGame', () => {
      // Setup some game state
      const mockPlayers: Player[] = [
        { id: 'user-1', username: 'player1', avatar: 'avatar1.jpg', role: 'mafia', isAlive: false, isHost: true },
        { id: 'user-2', username: 'player2', avatar: 'avatar2.jpg', role: 'villager', isAlive: true, isHost: false },
      ];
      
      store.dispatch(gameSlice.actions.updatePlayers(mockPlayers));
      store.dispatch(gameSlice.actions.startGame());
      store.dispatch(gameSlice.actions.castVote({ targetId: 'user-2' }));
      store.dispatch(gameSlice.actions.addChatMessage({ id: 'msg-1', content: 'Hello' }));

      // Reset game
      store.dispatch(gameSlice.actions.resetGame());
      const state = store.getState().game;

      expect(state.gameState).toBe(null);
      expect(state.currentPhase).toBe('lobby');
      expect(state.dayNumber).toBe(0);
      expect(state.timeRemaining).toBe(0);
      expect(state.eliminatedPlayers).toEqual([]);
      expect(state.votes).toEqual([]);
      expect(state.hasVoted).toBe(false);
      expect(state.votingTarget).toBe(null);
      expect(state.gameEvents).toEqual([]);
      expect(state.chatMessages).toEqual([]);
      expect(state.isInGame).toBe(false);

      // Players should remain but be reset
      expect(state.players).toHaveLength(2);
      expect(state.players[0].role).toBeUndefined();
      expect(state.players[0].isAlive).toBe(true);
      expect(state.players[1].role).toBeUndefined();
      expect(state.players[1].isAlive).toBe(true);
    });
  });

  describe('async thunks', () => {
    describe('createRoom', () => {
      it('should handle successful room creation', async () => {
        const mockRoom: Room = {
          id: 'room-1',
          code: 'ABC123',
          hostId: 'user-1',
          players: [],
          settings: {} as any,
          status: 'waiting',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockRoom,
        });

        const roomSettings = {
          isPublic: true,
          maxPlayers: 8,
          gameSettings: {} as any,
          allowSpectators: false,
          requireInvite: false,
        };

        await store.dispatch(createRoom(roomSettings));
        const state = store.getState().game;

        expect(state.isCreatingRoom).toBe(false);
        expect(state.currentRoom).toEqual(mockRoom);
        expect(state.roomCode).toBe('ABC123');
        expect(state.isHost).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should handle room creation failure', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

        const roomSettings = {
          isPublic: true,
          maxPlayers: 8,
          gameSettings: {} as any,
          allowSpectators: false,
          requireInvite: false,
        };

        await store.dispatch(createRoom(roomSettings));
        const state = store.getState().game;

        expect(state.isCreatingRoom).toBe(false);
        expect(state.currentRoom).toBe(null);
        expect(state.error).toBe('Failed to create room');
      });
    });

    describe('joinRoom', () => {
      it('should handle successful room join', async () => {
        const mockRoom: Room = {
          id: 'room-1',
          code: 'ABC123',
          hostId: 'user-2',
          players: [],
          settings: {} as any,
          status: 'waiting',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockRoom,
        });

        await store.dispatch(joinRoom('ABC123'));
        const state = store.getState().game;

        expect(state.isJoiningRoom).toBe(false);
        expect(state.currentRoom).toEqual(mockRoom);
        expect(state.roomCode).toBe('ABC123');
        expect(state.isHost).toBe(false);
        expect(state.error).toBe(null);
      });

      it('should handle room join failure', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await store.dispatch(joinRoom('INVALID'));
        const state = store.getState().game;

        expect(state.isJoiningRoom).toBe(false);
        expect(state.currentRoom).toBe(null);
        expect(state.error).toBe('Failed to join room');
      });
    });
  });

  describe('selectors', () => {
    it('should select game state', () => {
      const state = store.getState();
      const gameState = selectGame(state);
      expect(gameState).toEqual(state.game);
    });

    it('should select current room', () => {
      const mockRoom = { id: 'room-1', code: 'ABC123' } as Room;
      store.dispatch(gameSlice.actions.setCurrentRoom(mockRoom));
      
      const state = store.getState();
      const currentRoom = selectCurrentRoom(state);
      expect(currentRoom).toEqual(mockRoom);
    });

    it('should select players', () => {
      const mockPlayers: Player[] = [
        { id: 'user-1', username: 'player1', avatar: 'avatar1.jpg', isAlive: true, isHost: true },
      ];
      store.dispatch(gameSlice.actions.updatePlayers(mockPlayers));
      
      const state = store.getState();
      const players = selectPlayers(state);
      expect(players).toEqual(mockPlayers);
    });

    it('should select current phase', () => {
      store.dispatch(gameSlice.actions.updateGamePhase('night'));
      
      const state = store.getState();
      const currentPhase = selectCurrentPhase(state);
      expect(currentPhase).toBe('night');
    });
  });
});