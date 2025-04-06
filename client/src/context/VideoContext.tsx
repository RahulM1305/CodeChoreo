import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAppContext } from './AppContext';
import { SocketEvent } from '../types/socket';
import { toast } from 'react-hot-toast';

interface VideoContextType {
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    isScreenSharing: boolean;
    isInCall: boolean;
    activeCallId: string | null;
    startVideo: () => Promise<void>;
    stopVideo: () => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => void;
    acceptCall: () => void;
    declineCall: () => void;
    endCall: () => void;
    callInvitation: {
        callId: string;
        fromUserId: string;
        toUserId: string;
        roomId: string;
    } | null;
    sendCallInvite: (toUserId: string) => void;
}

const VideoContext = createContext<VideoContextType | null>(null);

export function VideoProvider({ children }: { children: React.ReactNode }) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isInCall, setIsInCall] = useState(false);
    const [activeCallId, setActiveCallId] = useState<string | null>(null);
    const [callInvitation, setCallInvitation] = useState<{
        callId: string;
        fromUserId: string;
        toUserId: string;
        roomId: string;
    } | null>(null);
    const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
    
    const { socket } = useSocket();
    const { currentUser } = useAppContext();
    
    // Initialize WebRTC configuration
    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ]
    };
    
    // Start video
    const startVideo = useCallback(async () => {
        try {
            console.log('Starting video...');
            
            // Always request fresh permissions
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            // Process audio to ensure it's working
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);
            
            // Create a new stream with processed audio
            const processedStream = new MediaStream([
                ...stream.getVideoTracks(),
                ...destination.stream.getAudioTracks()
            ]);
            
            setLocalStream(processedStream);
            setIsVideoEnabled(true);
            setIsAudioEnabled(true);
            
            // Update all peer connections with the new stream
            peerConnections.forEach(pc => {
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                const audioSender = senders.find(s => s.track?.kind === 'audio');
                
                if (videoSender) {
                    processedStream.getVideoTracks().forEach(track => {
                        videoSender.replaceTrack(track);
                    });
                }
                
                if (audioSender) {
                    processedStream.getAudioTracks().forEach(track => {
                        audioSender.replaceTrack(track);
                    });
                }
            });
            
            console.log('Video started successfully');
        } catch (error) {
            console.error('Error starting video:', error);
            toast.error('Failed to access camera or microphone');
            setIsVideoEnabled(false);
            setIsAudioEnabled(false);
        }
    }, [peerConnections]);
    
    // Stop video stream
    const stopVideo = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            setIsVideoEnabled(false);
            setIsAudioEnabled(false);
        }
    }, [localStream]);
    
    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
                
                // Update all peer connections
                peerConnections.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
                    if (sender && sender.track) {
                        sender.track.enabled = audioTrack.enabled;
                    }
                });
            }
        }
    }, [localStream, peerConnections]);
    
    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                
                // Update all peer connections
                peerConnections.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && sender.track) {
                        sender.track.enabled = videoTrack.enabled;
                    }
                });
            }
        }
    }, [localStream, peerConnections]);
    
    // Start screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            console.log('Starting screen share...');
            
            // Always request fresh permissions
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true // Try to capture system audio if available
            });
            
            // Handle stream ending
            stream.getVideoTracks()[0].onended = () => {
                console.log('Screen share ended by user');
                stopScreenShare();
            };
            
            // Process audio if available
            let processedStream = stream;
            if (stream.getAudioTracks().length > 0) {
                const audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(stream);
                const destination = audioContext.createMediaStreamDestination();
                source.connect(destination);
                
                processedStream = new MediaStream([
                    ...stream.getVideoTracks(),
                    ...destination.stream.getAudioTracks()
                ]);
            }
            
            setLocalStream(processedStream);
            setIsScreenSharing(true);
            
            // Update all peer connections with the new stream
            peerConnections.forEach(pc => {
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                const audioSender = senders.find(s => s.track?.kind === 'audio');
                
                if (videoSender) {
                    processedStream.getVideoTracks().forEach(track => {
                        videoSender.replaceTrack(track);
                    });
                }
                
                if (audioSender && processedStream.getAudioTracks().length > 0) {
                    processedStream.getAudioTracks().forEach(track => {
                        audioSender.replaceTrack(track);
                    });
                }
            });
            
            console.log('Screen sharing started successfully');
        } catch (error) {
            console.error('Error starting screen share:', error);
            toast.error('Failed to start screen sharing');
            setIsScreenSharing(false);
        }
    }, [peerConnections]);
    
    // Stop screen sharing
    const stopScreenShare = useCallback(() => {
        if (localStream) {
            // Get the original video track
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    const videoTrack = stream.getVideoTracks()[0];
                    const audioTrack = localStream.getAudioTracks()[0];
                    
                    const newStream = new MediaStream();
                    if (videoTrack) newStream.addTrack(videoTrack);
                    if (audioTrack) newStream.addTrack(audioTrack);
                    
                    setLocalStream(newStream);
                    setIsScreenSharing(false);
                    
                    // Update all peer connections with the original stream
                    peerConnections.forEach(pc => {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(videoTrack);
                        }
                    });
                })
                .catch(error => {
                    console.error('Error restoring video track:', error);
                    toast.error('Failed to restore video');
                });
        }
    }, [localStream, peerConnections]);
    
    // Create a new peer connection
    const createPeerConnection = useCallback((userId: string) => {
        const pc = new RTCPeerConnection(configuration);
        
        // Add local stream
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit(SocketEvent.ICE_CANDIDATE, {
                    candidate: event.candidate,
                    toUserId: userId
                });
            }
        };
        
        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state for ${userId}:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                console.log('Peer connection established');
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                console.log('Peer connection failed or disconnected');
                // Try to reconnect
                if (pc.connectionState === 'failed') {
                    pc.restartIce();
                }
            }
        };
        
        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE connection state for ${userId}:`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
                console.log('ICE connection failed, trying to restart');
                pc.restartIce();
            }
        };
        
        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            setRemoteStreams(prev => {
                const newStreams = new Map(prev);
                newStreams.set(userId, event.streams[0]);
                return newStreams;
            });
        };
        
        // Store the peer connection
        setPeerConnections(prev => {
            const newConnections = new Map(prev);
            newConnections.set(userId, pc);
            return newConnections;
        });
        
        return pc;
    }, [localStream, socket]);
    
    // Handle video offer
    const handleVideoOffer = useCallback(async (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
        const { fromUserId, offer } = data;
        console.log('Received video offer from:', fromUserId);
        
        // Create or get peer connection
        let pc = peerConnections.get(fromUserId);
        if (!pc) {
            pc = createPeerConnection(fromUserId);
        }
        
        try {
            // Set remote description
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            if (socket) {
                socket.emit(SocketEvent.VIDEO_ANSWER, {
                    answer,
                    toUserId: fromUserId
                });
                console.log('Sent video answer to:', fromUserId);
            }
        } catch (error) {
            console.error('Error handling video offer:', error);
            toast.error('Failed to establish call connection');
        }
    }, [peerConnections, createPeerConnection, socket]);
    
    // Handle video answer
    const handleVideoAnswer = useCallback(async (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
        const { fromUserId, answer } = data;
        console.log('Received video answer from:', fromUserId);
        
        try {
            const pc = peerConnections.get(fromUserId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('Set remote description from answer');
            }
        } catch (error) {
            console.error('Error handling video answer:', error);
            toast.error('Failed to complete call connection');
        }
    }, [peerConnections]);
    
    // Handle ICE candidate
    const handleIceCandidate = useCallback(async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
        const { fromUserId, candidate } = data;
        console.log('Received ICE candidate from:', fromUserId);
        
        try {
            const pc = peerConnections.get(fromUserId);
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('Added ICE candidate');
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }, [peerConnections]);
    
    // Accept call
    const acceptCall = useCallback(() => {
        if (callInvitation && socket) {
            console.log('Accepting call from:', callInvitation.fromUserId);
            setIsInCall(true);
            setActiveCallId(callInvitation.callId);
            
            // Start video
            startVideo();
            
            // Create peer connection
            const pc = createPeerConnection(callInvitation.fromUserId);
            
            // Create and send offer
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    if (socket && pc.localDescription) {
                        socket.emit(SocketEvent.VIDEO_OFFER, {
                            offer: pc.localDescription,
                            toUserId: callInvitation.fromUserId
                        });
                        console.log('Sent video offer after accepting call');
                    }
                })
                .catch(error => {
                    console.error('Error creating offer:', error);
                    toast.error('Failed to establish call');
                });
            
            // Notify caller
            socket.emit(SocketEvent.CALL_ACCEPT, {
                callId: callInvitation.callId
            });
            
            setCallInvitation(null);
        }
    }, [callInvitation, socket, startVideo, createPeerConnection]);
    
    // Decline call
    const declineCall = useCallback(() => {
        if (callInvitation && socket) {
            console.log('Declining call from:', callInvitation.fromUserId);
            socket.emit(SocketEvent.CALL_DECLINE, {
                callId: callInvitation.callId
            });
            setCallInvitation(null);
        }
    }, [callInvitation, socket]);
    
    // End call
    const endCall = useCallback(() => {
        if (activeCallId && socket) {
            console.log('Ending call:', activeCallId);
            socket.emit(SocketEvent.CALL_ENDED, {
                callId: activeCallId
            });
            
            // Close all peer connections
            peerConnections.forEach(pc => pc.close());
            setPeerConnections(new Map());
            
            // Stop local stream and release all tracks
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    track.stop();
                    localStream.removeTrack(track);
                });
                setLocalStream(null);
            }
            
            // Reset all states
            setIsInCall(false);
            setActiveCallId(null);
            setRemoteStreams(new Map());
            setIsVideoEnabled(false);
            setIsAudioEnabled(false);
            setIsScreenSharing(false);
            
            // Clear any pending call invitation
            setCallInvitation(null);
            
            // Force garbage collection of media devices
            navigator.mediaDevices.getUserMedia({ video: false, audio: false })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                })
                .catch(() => {
                    // Ignore errors as this is just to reset permissions
                });
                
            console.log('Call ended, all permissions and streams reset');
        }
    }, [activeCallId, socket, peerConnections, localStream]);
    
    // Send call invite
    const sendCallInvite = useCallback((toUserId: string) => {
        if (socket && currentUser) {
            console.log('Sending call invite to:', toUserId);
            const callId = Math.random().toString(36).substring(2, 15);
            
            socket.emit(SocketEvent.CALL_INVITE, {
                callId,
                fromUserId: socket.id,
                toUserId,
                roomId: currentUser.roomId
            });
            
            setIsInCall(true);
            setActiveCallId(callId);
        }
    }, [socket, currentUser]);
    
    // Set up socket event listeners
    useEffect(() => {
        if (!socket) return;
        
        socket.on(SocketEvent.VIDEO_OFFER, handleVideoOffer);
        socket.on(SocketEvent.VIDEO_ANSWER, handleVideoAnswer);
        socket.on(SocketEvent.ICE_CANDIDATE, handleIceCandidate);
        socket.on(SocketEvent.CALL_INVITE, (data) => {
            console.log('Received call invitation:', data);
            setCallInvitation(data);
        });
        socket.on(SocketEvent.CALL_ENDED, () => {
            console.log('Call ended by remote user');
            endCall();
        });
        
        return () => {
            socket.off(SocketEvent.VIDEO_OFFER);
            socket.off(SocketEvent.VIDEO_ANSWER);
            socket.off(SocketEvent.ICE_CANDIDATE);
            socket.off(SocketEvent.CALL_INVITE);
            socket.off(SocketEvent.CALL_ENDED);
        };
    }, [socket, handleVideoOffer, handleVideoAnswer, handleIceCandidate, endCall]);
    
    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            peerConnections.forEach(pc => pc.close());
        };
    }, [localStream, peerConnections]);
    
    return (
        <VideoContext.Provider value={{
            localStream,
            remoteStreams,
            isVideoEnabled,
            isAudioEnabled,
            isScreenSharing,
            isInCall,
            activeCallId,
            startVideo,
            stopVideo,
            toggleAudio,
            toggleVideo,
            startScreenShare,
            stopScreenShare,
            acceptCall,
            declineCall,
            endCall,
            callInvitation,
            sendCallInvite
        }}>
            {children}
        </VideoContext.Provider>
    );
}

export function useVideo() {
    const context = useContext(VideoContext);
    if (!context) {
        throw new Error('useVideo must be used within a VideoProvider');
    }
    return context;
} 