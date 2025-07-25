import { EventEmitter } from 'events';
import WebRTCService from './WebRTCService';
import { 
  VoiceState, 
  VoiceParticipant, 
  VoiceSettings, 
  ConnectionQuality,
  SignalingMessage,
  VoiceStateUpdate,
  VoiceAnalytics
} from '../types/voice';
import { Socket } from 'socket.io-client';

export class VoiceChatManager extends EventEmitter {
  private webrtcService: WebRTCService;
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private currentPlayerId: string | null = null;
  private participants: Map<string, VoiceParticipant> = new Map();
  private isConnected = false;
  private isPushToTalkMode = false;
  private pushToTalkActive = false;
  private voiceAnalytics: VoiceAnalytics;
  private sessionStartTime: number = 0;
  private audioLevelHistory: number[] = [];
  private connectionDropCount = 0;

  constructor() {
    super();
    this.webrtcService = new WebRTCService();
    this.voiceAnalytics = this.initializeAnalytics();
    this.setupWebRTCEventHandlers();
  }

  private initializeAnalytics(): VoiceAnalytics {
    return {
      sessionDuration: 0,
      averageAudioLevel: 0,
      connectionDrops: 0,
      qualityScore: 0,
      networkLatency: 0
    };
  }

  private setupWebRTCEventHandlers(): void {
    this.webrtcService.on('initialized', () => {
      this.emit('voiceChatReady');
    });

    this.webrtcService.on('localStreamReady', (stream: MediaStream) => {
      this.emit('localStreamReady', stream);
    });

    this.webrtcService.on('remoteStreamAdded', ({ playerId, stream }) => {
      const participant = this.participants.get(playerId);
      if (participant) {
        participant.remoteStream = stream;
        this.emit('participantStreamReady', { playerId, stream });
      }
    });

    this.webrtcService.on('audioLevelUpdate', ({ audioLevel, isSpeaking }) => {
      this.audioLevelHistory.push(audioLevel);
      if (this.audioLevelHistory.length > 100) {
        this.audioLevelHistory.shift();
      }

      if (this.currentPlayerId) {
        this.updateParticipantVoiceState(this.currentPlayerId, {
          audioLevel,
          isSpeaking: this.isPushToTalkMode ? this.pushToTalkActive && isSpeaking : isSpeaking
        });
      }
    });

    this.webrtcService.on('connectionStateChange', ({ playerId, state, quality }) => {
      const participant = this.participants.get(playerId);
      if (participant) {
        participant.voiceState.connectionQuality = quality;
        this.emit('participantConnectionChanged', { playerId, state, quality });
        
        if (state === 'failed' || state === 'disconnected') {
          this.connectionDropCount++;
        }
      }
    });

    this.webrtcService.on('connectionFailed', ({ playerId }) => {
      this.emit('participantDisconnected', { playerId });
    });

    this.webrtcService.on('reconnectRequested', ({ playerId }) => {
      this.handleReconnectRequest(playerId);
    });

    this.webrtcService.on('muteStateChanged', ({ isMuted }) => {
      if (this.currentPlayerId) {
        this.updateParticipantVoiceState(this.currentPlayerId, { isMuted });
      }
    });

    this.webrtcService.on('pushToTalkStateChanged', ({ isPushToTalkActive }) => {
      this.pushToTalkActive = isPushToTalkActive;
      if (this.currentPlayerId) {
        this.updateParticipantVoiceState(this.currentPlayerId, { isPushToTalkActive });
      }
    });

    this.webrtcService.on('error', (error) => {
      this.emit('error', error);
    });
  }

  async initialize(socket: Socket, roomId: string, playerId: string): Promise<void> {
    this.socket = socket;
    this.roomId = roomId;
    this.currentPlayerId = playerId;
    this.sessionStartTime = Date.now();

    try {
      await this.webrtcService.initialize(roomId, playerId);
      this.setupSocketEventHandlers();
      this.isConnected = true;
      
      // Join voice room
      this.socket.emit('voice:join-room', { roomId, playerId });
      
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize voice chat:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('voice:participant-joined', (data: { playerId: string, username: string }) => {
      this.handleParticipantJoined(data.playerId, data.username);
    });

    this.socket.on('voice:participant-left', (data: { playerId: string }) => {
      this.handleParticipantLeft(data.playerId);
    });

    this.socket.on('voice:signaling', (message: SignalingMessage) => {
      this.handleSignalingMessage(message);
    });

    this.socket.on('voice:state-update', (data: { playerId: string, voiceState: VoiceStateUpdate }) => {
      this.handleVoiceStateUpdate(data.playerId, data.voiceState);
    });

    this.socket.on('voice:room-settings-changed', (settings: VoiceSettings) => {
      this.webrtcService.updateVoiceSettings(settings);
    });
  }

  private handleParticipantJoined(playerId: string, username: string): void {
    if (playerId === this.currentPlayerId) return;

    const participant: VoiceParticipant = {
      playerId,
      username,
      voiceState: {
        playerId,
        isMuted: true,
        isSpeaking: false,
        audioLevel: 0,
        connectionQuality: ConnectionQuality.DISCONNECTED,
        isPushToTalkActive: false
      }
    };

    this.participants.set(playerId, participant);
    this.emit('participantJoined', participant);

    // Initiate WebRTC connection
    this.initiateConnection(playerId);
  }

  private handleParticipantLeft(playerId: string): void {
    const participant = this.participants.get(playerId);
    if (participant) {
      // Clean up WebRTC connection
      const peerConnection = this.webrtcService.peerConnections?.get(playerId);
      if (peerConnection) {
        peerConnection.close();
        this.webrtcService.peerConnections?.delete(playerId);
      }

      this.participants.delete(playerId);
      this.emit('participantLeft', { playerId });
    }
  }

  private async initiateConnection(remotePlayerId: string): Promise<void> {
    try {
      const offer = await this.webrtcService.createOffer(remotePlayerId);
      
      const signalingMessage: SignalingMessage = {
        type: 'offer',
        fromPlayerId: this.currentPlayerId!,
        toPlayerId: remotePlayerId,
        data: { sdp: offer },
        timestamp: new Date()
      };

      this.socket?.emit('voice:signaling', signalingMessage);
    } catch (error) {
      console.error('Failed to initiate connection:', error);
      this.emit('error', error);
    }
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    if (message.toPlayerId !== this.currentPlayerId) return;

    try {
      switch (message.type) {
        case 'offer':
          await this.handleOffer(message.fromPlayerId, message.data.sdp);
          break;
        case 'answer':
          await this.handleAnswer(message.fromPlayerId, message.data.sdp);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(message.fromPlayerId, message.data);
          break;
      }
    } catch (error) {
      console.error('Failed to handle signaling message:', error);
      this.emit('error', error);
    }
  }

  private async handleOffer(fromPlayerId: string, offer: RTCSessionDescription): Promise<void> {
    const answer = await this.webrtcService.createAnswer(fromPlayerId, offer);
    
    const signalingMessage: SignalingMessage = {
      type: 'answer',
      fromPlayerId: this.currentPlayerId!,
      toPlayerId: fromPlayerId,
      data: { sdp: answer },
      timestamp: new Date()
    };

    this.socket?.emit('voice:signaling', signalingMessage);
  }

  private async handleAnswer(fromPlayerId: string, answer: RTCSessionDescription): Promise<void> {
    await this.webrtcService.handleAnswer(fromPlayerId, answer);
  }

  private async handleIceCandidate(fromPlayerId: string, candidateData: any): Promise<void> {
    await this.webrtcService.handleIceCandidate(fromPlayerId, candidateData.candidate);
  }

  private handleVoiceStateUpdate(playerId: string, voiceState: VoiceStateUpdate): void {
    const participant = this.participants.get(playerId);
    if (participant) {
      participant.voiceState = {
        ...participant.voiceState,
        ...voiceState
      };
      this.emit('participantVoiceStateChanged', { playerId, voiceState: participant.voiceState });
    }
  }

  private updateParticipantVoiceState(playerId: string, updates: Partial<VoiceState>): void {
    const participant = this.participants.get(playerId);
    if (participant) {
      participant.voiceState = { ...participant.voiceState, ...updates };
      
      // Broadcast state update to other participants
      const stateUpdate: VoiceStateUpdate = {
        isMuted: participant.voiceState.isMuted,
        isSpeaking: participant.voiceState.isSpeaking,
        audioLevel: participant.voiceState.audioLevel,
        isPushToTalkActive: participant.voiceState.isPushToTalkActive
      };

      this.socket?.emit('voice:state-update', {
        roomId: this.roomId,
        playerId,
        voiceState: stateUpdate
      });

      this.emit('localVoiceStateChanged', participant.voiceState);
    }
  }

  private async handleReconnectRequest(playerId: string): Promise<void> {
    console.log(`Attempting to reconnect to player ${playerId}`);
    
    // Wait a bit before attempting reconnection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await this.initiateConnection(playerId);
      this.emit('reconnectionAttempted', { playerId });
    } catch (error) {
      console.error(`Failed to reconnect to player ${playerId}:`, error);
      this.emit('reconnectionFailed', { playerId, error });
    }
  }

  // Public API methods
  toggleMute(): boolean {
    return this.webrtcService.toggleMute();
  }

  setMute(muted: boolean): void {
    this.webrtcService.setMute(muted);
  }

  isMuted(): boolean {
    return this.webrtcService.isMuted();
  }

  setPushToTalkMode(enabled: boolean): void {
    this.isPushToTalkMode = enabled;
    if (!enabled) {
      this.setPushToTalkActive(false);
    }
    this.emit('pushToTalkModeChanged', { enabled });
  }

  setPushToTalkActive(active: boolean): void {
    if (!this.isPushToTalkMode) return;
    
    this.pushToTalkActive = active;
    this.webrtcService.setPushToTalkActive(active);
  }

  isPushToTalkModeEnabled(): boolean {
    return this.isPushToTalkMode;
  }

  isPushToTalkCurrentlyActive(): boolean {
    return this.pushToTalkActive;
  }

  updateVoiceSettings(settings: Partial<VoiceSettings>): void {
    this.webrtcService.updateVoiceSettings(settings);
    
    // Notify room about settings change
    this.socket?.emit('voice:settings-update', {
      roomId: this.roomId,
      settings
    });
  }

  getVoiceSettings(): VoiceSettings {
    return this.webrtcService.getVoiceSettings();
  }

  getParticipants(): VoiceParticipant[] {
    return Array.from(this.participants.values());
  }

  getParticipant(playerId: string): VoiceParticipant | null {
    return this.participants.get(playerId) || null;
  }

  getRemoteStream(playerId: string): MediaStream | null {
    return this.webrtcService.getRemoteStream(playerId);
  }

  getConnectionQuality(playerId: string): ConnectionQuality {
    const participant = this.participants.get(playerId);
    return participant?.voiceState.connectionQuality || ConnectionQuality.DISCONNECTED;
  }

  async getConnectionStats(playerId: string): Promise<RTCStatsReport | null> {
    return this.webrtcService.getStats(playerId);
  }

  getVoiceAnalytics(): VoiceAnalytics {
    const currentTime = Date.now();
    const sessionDuration = this.sessionStartTime ? currentTime - this.sessionStartTime : 0;
    
    const averageAudioLevel = this.audioLevelHistory.length > 0
      ? this.audioLevelHistory.reduce((sum, level) => sum + level, 0) / this.audioLevelHistory.length
      : 0;

    // Calculate quality score based on various factors
    const qualityScore = this.calculateQualityScore();

    return {
      ...this.voiceAnalytics,
      sessionDuration,
      averageAudioLevel,
      connectionDrops: this.connectionDropCount,
      qualityScore
    };
  }

  private calculateQualityScore(): number {
    const participants = Array.from(this.participants.values());
    if (participants.length === 0) return 100;

    let totalScore = 0;
    let count = 0;

    participants.forEach(participant => {
      const quality = participant.voiceState.connectionQuality;
      let score = 0;
      
      switch (quality) {
        case ConnectionQuality.EXCELLENT:
          score = 100;
          break;
        case ConnectionQuality.GOOD:
          score = 80;
          break;
        case ConnectionQuality.FAIR:
          score = 60;
          break;
        case ConnectionQuality.POOR:
          score = 40;
          break;
        case ConnectionQuality.DISCONNECTED:
          score = 0;
          break;
      }
      
      totalScore += score;
      count++;
    });

    return count > 0 ? totalScore / count : 100;
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.emit('voice:leave-room', { 
        roomId: this.roomId, 
        playerId: this.currentPlayerId 
      });
      
      // Remove socket event listeners
      this.socket.off('voice:participant-joined');
      this.socket.off('voice:participant-left');
      this.socket.off('voice:signaling');
      this.socket.off('voice:state-update');
      this.socket.off('voice:room-settings-changed');
    }

    await this.webrtcService.disconnect();
    
    this.participants.clear();
    this.isConnected = false;
    this.roomId = null;
    this.currentPlayerId = null;
    this.socket = null;
    this.sessionStartTime = 0;
    this.audioLevelHistory = [];
    this.connectionDropCount = 0;

    this.emit('disconnected');
  }

  isConnected(): boolean {
    return this.isConnected;
  }
}

export default VoiceChatManager;