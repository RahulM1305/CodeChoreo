export interface VideoContextType {
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    startVideo: () => Promise<void>;
    stopVideo: () => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
}

export interface PeerConnection {
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel | null;
}

export interface VideoState {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    peerConnections: Map<string, PeerConnection>;
} 