import { 
  VoiceState, 
  VoiceParticipant, 
  VoiceSettings, 
  ConnectionQuality, 
  AudioQuality,
  SignalingMessage,
  ICECandidateMessage,
  OfferAnswerMessage,
  VoiceStateUpdate,
  AudioConstraints
} from '../types/voice';
import { EventEmitter } from 'events';

export class WebRTCService extends EventEmitter {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private voiceSettings: VoiceSettings;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private isInitialized = false;
  private roomId: string | null = null;
  private currentPlayerId: string | null = null;

  // ICE servers configuration
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  constructor() {
    super();
    this.voiceSettings = this.getDefaultVoiceSettings();
  }

  private getDefaultVoiceSettings(): VoiceSettings {
    return {
      enableVoiceActivation: true,
      voiceActivationThreshold: 0.1,
      enableNoiseSuppression: true,
      enableEchoCancellation: true,
      enableAutoGainControl: true,
      audioQuality: AudioQuality.AUTO,
      pushToTalkKey: undefined
    };
  }

  async initialize(roomId: string, playerId: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.roomId = roomId;
    this.currentPlayerId = playerId;

    try {
      await this.initializeAudioContext();
      await this.requestMicrophonePermission();
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize WebRTC service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Audio context initialization failed');
    }
  }

  private async requestMicrophonePermission(): Promise<void> {
    try {
      const constraints = this.getAudioConstraints();
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: constraints,
        video: false 
      });

      if (this.audioContext && this.analyser) {
        this.microphoneSource = this.audioContext.createMediaStreamSource(this.localStream);
        this.microphoneSource.connect(this.analyser);
        this.startAudioLevelMonitoring();
      }

      this.emit('localStreamReady', this.localStream);
    } catch (error) {
      console.error('Failed to get microphone permission:', error);
      throw new Error('Microphone permission denied');
    }
  }

  private getAudioConstraints(): AudioConstraints {
    const quality = this.voiceSettings.audioQuality;
    
    let sampleRate: number;
    let channelCount = 1; // Mono for voice chat

    switch (quality) {
      case AudioQuality.LOW:
        sampleRate = 8000;
        break;
      case AudioQuality.MEDIUM:
        sampleRate = 16000;
        break;
      case AudioQuality.HIGH:
        sampleRate = 48000;
        break;
      default:
        sampleRate = 16000; // Auto defaults to medium
    }

    return {
      echoCancellation: this.voiceSettings.enableEchoCancellation,
      noiseSuppression: this.voiceSettings.enableNoiseSuppression,
      autoGainControl: this.voiceSettings.enableAutoGainControl,
      sampleRate,
      channelCount
    };
  }

  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const audioLevel = rms / 255; // Normalize to 0-1

      // Determine if speaking based on threshold
      const isSpeaking = audioLevel > this.voiceSettings.voiceActivationThreshold;

      this.emit('audioLevelUpdate', {
        audioLevel,
        isSpeaking
      });

      // Continue monitoring
      requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  }

  async createPeerConnection(remotePlayerId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStreams.set(remotePlayerId, remoteStream);
      this.emit('remoteStreamAdded', { playerId: remotePlayerId, stream: remoteStream });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('iceCandidate', {
          candidate: event.candidate,
          remotePlayerId
        });
      }
    };

    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      const quality = this.getConnectionQuality(state);
      
      this.emit('connectionStateChange', {
        playerId: remotePlayerId,
        state,
        quality
      });

      if (state === 'failed' || state === 'disconnected') {
        this.handleConnectionFailure(remotePlayerId);
      }
    };

    this.peerConnections.set(remotePlayerId, peerConnection);
    return peerConnection;
  }

  private getConnectionQuality(state: RTCPeerConnectionState): ConnectionQuality {
    switch (state) {
      case 'connected':
        return ConnectionQuality.EXCELLENT;
      case 'connecting':
        return ConnectionQuality.GOOD;
      case 'new':
        return ConnectionQuality.FAIR;
      case 'disconnected':
      case 'failed':
        return ConnectionQuality.DISCONNECTED;
      default:
        return ConnectionQuality.POOR;
    }
  }

  private async handleConnectionFailure(remotePlayerId: string): Promise<void> {
    console.log(`Connection failed for player ${remotePlayerId}, attempting to reconnect...`);
    
    // Clean up failed connection
    const peerConnection = this.peerConnections.get(remotePlayerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(remotePlayerId);
    }
    
    this.remoteStreams.delete(remotePlayerId);
    
    // Emit reconnection event
    this.emit('connectionFailed', { playerId: remotePlayerId });
    
    // Attempt to recreate connection after a delay
    setTimeout(() => {
      this.emit('reconnectRequested', { playerId: remotePlayerId });
    }, 2000);
  }

  async createOffer(remotePlayerId: string): Promise<RTCSessionDescription> {
    const peerConnection = await this.createPeerConnection(remotePlayerId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(remotePlayerId: string, offer: RTCSessionDescription): Promise<RTCSessionDescription> {
    const peerConnection = await this.createPeerConnection(remotePlayerId);
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(remotePlayerId: string, answer: RTCSessionDescription): Promise<void> {
    const peerConnection = this.peerConnections.get(remotePlayerId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  async handleIceCandidate(remotePlayerId: string, candidate: RTCIceCandidate): Promise<void> {
    const peerConnection = this.peerConnections.get(remotePlayerId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.emit('muteStateChanged', { isMuted: !audioTrack.enabled });
      return !audioTrack.enabled;
    }
    return false;
  }

  setMute(muted: boolean): void {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !muted;
      this.emit('muteStateChanged', { isMuted: muted });
    }
  }

  isMuted(): boolean {
    if (!this.localStream) return true;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? !audioTrack.enabled : true;
  }

  setPushToTalkActive(active: boolean): void {
    this.setMute(!active);
    this.emit('pushToTalkStateChanged', { isPushToTalkActive: active });
  }

  updateVoiceSettings(settings: Partial<VoiceSettings>): void {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
    this.emit('voiceSettingsUpdated', this.voiceSettings);
    
    // Apply settings that require stream restart
    if (settings.enableNoiseSuppression !== undefined ||
        settings.enableEchoCancellation !== undefined ||
        settings.enableAutoGainControl !== undefined ||
        settings.audioQuality !== undefined) {
      this.restartLocalStream();
    }
  }

  private async restartLocalStream(): Promise<void> {
    try {
      // Stop current stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }

      // Request new stream with updated constraints
      const constraints = this.getAudioConstraints();
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: constraints,
        video: false 
      });

      // Update all peer connections with new stream
      this.peerConnections.forEach(async (peerConnection, playerId) => {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'audio'
        );
        
        if (sender && this.localStream) {
          const audioTrack = this.localStream.getAudioTracks()[0];
          await sender.replaceTrack(audioTrack);
        }
      });

      // Reconnect audio analysis
      if (this.audioContext && this.analyser && this.localStream) {
        if (this.microphoneSource) {
          this.microphoneSource.disconnect();
        }
        this.microphoneSource = this.audioContext.createMediaStreamSource(this.localStream);
        this.microphoneSource.connect(this.analyser);
      }

      this.emit('localStreamUpdated', this.localStream);
    } catch (error) {
      console.error('Failed to restart local stream:', error);
      this.emit('error', error);
    }
  }

  getRemoteStream(playerId: string): MediaStream | null {
    return this.remoteStreams.get(playerId) || null;
  }

  getConnectionState(playerId: string): RTCPeerConnectionState | null {
    const peerConnection = this.peerConnections.get(playerId);
    return peerConnection ? peerConnection.connectionState : null;
  }

  async disconnect(): Promise<void> {
    // Close all peer connections
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.close();
    });
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Clean up audio context
    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
      this.microphoneSource = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.remoteStreams.clear();
    this.isInitialized = false;
    this.roomId = null;
    this.currentPlayerId = null;

    this.emit('disconnected');
  }

  // Utility methods for testing and monitoring
  getStats(playerId: string): Promise<RTCStatsReport | null> {
    const peerConnection = this.peerConnections.get(playerId);
    return peerConnection ? peerConnection.getStats() : Promise.resolve(null);
  }

  getVoiceSettings(): VoiceSettings {
    return { ...this.voiceSettings };
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  getConnectedPeers(): string[] {
    return Array.from(this.peerConnections.keys());
  }
}

export default WebRTCService;