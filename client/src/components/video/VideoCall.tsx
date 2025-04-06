import React, { useEffect, useState, useRef } from 'react';
import { useVideo } from '../../context/VideoContext';
import { useAppContext } from '../../context/AppContext';
import { useSocket } from '../../context/SocketContext';
import { SocketEvent } from '../../types/socket';
import { toast } from 'react-hot-toast';
import { IoVideocam, IoVideocamOff, IoMic, IoMicOff, IoDesktop, IoCall, IoExpand, IoContract } from 'react-icons/io5';

interface CallInviteData {
    callId: string;
    fromUserId: string;
    toUserId: string;
    roomId: string;
}

export function VideoCall() {
    const [isVideoWindowOpen, setIsVideoWindowOpen] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 280 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isFullScreen, setIsFullScreen] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
    const videoWindowRef = useRef<HTMLDivElement>(null);
    
    const {
        localStream,
        remoteStreams,
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        activeCallId,
        startVideo,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        acceptCall,
        declineCall,
        endCall,
        sendCallInvite
    } = useVideo();
    
    const { socket } = useSocket();
    const { currentUser, users } = useAppContext();
    
    // Get users in the same room
    const roomUsers = users.filter(user => 
        user.roomId === currentUser.roomId && 
        user.socketId !== socket?.id
    );

    // Set up local video stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Set up remote video streams
    useEffect(() => {
        remoteStreams.forEach((stream, userId) => {
            const videoElement = remoteVideoRefs.current.get(userId);
            if (videoElement) {
                videoElement.srcObject = stream;
            }
        });
    }, [remoteStreams]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (!isFullScreen) {
                setPosition({
                    x: Math.min(position.x, window.innerWidth - 340),
                    y: Math.min(position.y, window.innerHeight - 280)
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [position, isFullScreen]);

    // Handle socket events for call flow
    useEffect(() => {
        if (!socket) return;

        // Handle incoming call invitations
        socket.on(SocketEvent.CALL_INVITE, (data: CallInviteData) => {
            if (data.toUserId === socket.id) {
                const caller = users.find(user => user.socketId === data.fromUserId);
                
                // Create a notification that stays until user responds
                const notificationId = toast.custom((t) => (
                    <div className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col`}>
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="ml-3 w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        Incoming Video Call
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {caller?.username || 'Someone'} is calling you
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-3">
                                <button
                                    onClick={() => {
                                        acceptCall();
                                        setIsVideoWindowOpen(true);
                                        toast.dismiss(t.id);
                                    }}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => {
                                        declineCall();
                                        toast.dismiss(t.id);
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                ), {
                    duration: Infinity, // Keep until user responds
                });
                
                // Store the notification ID to dismiss it later if needed
                return () => {
                    toast.dismiss(notificationId);
                };
            }
        });

        // Handle call accepted
        socket.on(SocketEvent.CALL_ACCEPT, (data: { callId: string }) => {
            if (data.callId === activeCallId) {
                toast.success('Call connected');
                setIsVideoWindowOpen(true);
            }
        });

        // Handle call declined
        socket.on(SocketEvent.CALL_DECLINE, (data: { callId: string }) => {
            if (data.callId === activeCallId) {
                toast.error('Call declined');
            }
        });

        // Handle call ended
        socket.on(SocketEvent.CALL_ENDED, (data: { callId: string }) => {
            if (data.callId === activeCallId) {
                toast('Call ended');
                setIsVideoWindowOpen(false);
                setIsFullScreen(false);
            }
        });

        return () => {
            socket.off(SocketEvent.CALL_INVITE);
            socket.off(SocketEvent.CALL_ACCEPT);
            socket.off(SocketEvent.CALL_DECLINE);
            socket.off(SocketEvent.CALL_ENDED);
        };
    }, [socket, activeCallId, users, acceptCall, declineCall]);

    // Start a call with selected user
    const startCallWithUser = (socketId: string) => {
        sendCallInvite(socketId);
        startVideo();
        setIsVideoWindowOpen(true);
    };

    // Handle dragging the video window
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isFullScreen) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && !isFullScreen) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // Keep window within viewport bounds
            const maxX = window.innerWidth - 340;
            const maxY = window.innerHeight - 280;
            
            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Toggle full screen
    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
        if (!isFullScreen && videoWindowRef.current) {
            // Save current position before going full screen
            const rect = videoWindowRef.current.getBoundingClientRect();
            setPosition({ x: rect.left, y: rect.top });
        }
    };

    // Handle end call
    const handleEndCall = () => {
        endCall();
        setIsVideoWindowOpen(false);
        setIsFullScreen(false);
    };

    // Calculate grid layout based on number of participants
    const totalParticipants = remoteStreams.size + (localStream ? 1 : 0);
    const gridClass = totalParticipants <= 4 
        ? 'grid-cols-2' 
        : totalParticipants <= 9 
            ? 'grid-cols-3' 
            : 'grid-cols-4';

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-white">Video Call</h3>
                <p className="text-sm text-gray-400">
                    {roomUsers.length > 0 
                        ? `${roomUsers.length} user${roomUsers.length > 1 ? 's' : ''} in room` 
                        : 'No other users in room'}
                </p>
                
                {roomUsers.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-white mb-2">Start a call with:</h4>
                        <div className="flex flex-col gap-2">
                            {roomUsers.map(user => (
                                <button
                                    key={user.socketId}
                                    onClick={() => startCallWithUser(user.socketId)}
                                    className="flex items-center gap-2 p-2 bg-darkHover rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-white">{user.username}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Video Window */}
            {isVideoWindowOpen && (
                <div
                    ref={videoWindowRef}
                    className={`fixed bg-dark rounded-lg shadow-lg overflow-hidden ${
                        isFullScreen 
                            ? 'fixed top-0 left-0 w-full h-full z-50' 
                            : 'w-80 h-60'
                    }`}
                    style={isFullScreen ? {} : { left: position.x, top: position.y }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Video Window Header */}
                    <div className="flex items-center justify-between p-2 bg-gray-800 cursor-move">
                        <span className="text-white text-sm font-medium">Video Call</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleFullScreen}
                                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                            >
                                {isFullScreen ? (
                                    <IoContract className="text-white" size={18} />
                                ) : (
                                    <IoExpand className="text-white" size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Video Grid */}
                    <div className={`grid ${gridClass} gap-1 p-1 h-full`}>
                        {/* Local Video */}
                        {localStream && (
                            <div className="relative bg-gray-900 rounded overflow-hidden">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-white">
                                    You
                                </div>
                            </div>
                        )}

                        {/* Remote Videos */}
                        {Array.from(remoteStreams.entries()).map(([userId, _]) => {
                            const remoteUser = users.find(user => user.socketId === userId);
                            return (
                                <div key={userId} className="relative bg-gray-900 rounded overflow-hidden">
                                    <video
                                        ref={el => {
                                            if (el) remoteVideoRefs.current.set(userId, el);
                                        }}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-white">
                                        {remoteUser?.username || 'Remote User'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Call Controls */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 p-2 bg-black bg-opacity-50">
                        <button
                            onClick={toggleAudio}
                            className={`p-2 rounded-full ${
                                isAudioEnabled ? 'bg-blue-600' : 'bg-red-600'
                            } hover:opacity-80 transition-opacity`}
                        >
                            {isAudioEnabled ? (
                                <IoMic className="text-white" size={20} />
                            ) : (
                                <IoMicOff className="text-white" size={20} />
                            )}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`p-2 rounded-full ${
                                isVideoEnabled ? 'bg-blue-600' : 'bg-red-600'
                            } hover:opacity-80 transition-opacity`}
                        >
                            {isVideoEnabled ? (
                                <IoVideocam className="text-white" size={20} />
                            ) : (
                                <IoVideocamOff className="text-white" size={20} />
                            )}
                        </button>
                        <button
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                            className={`p-2 rounded-full ${
                                isScreenSharing ? 'bg-blue-600' : 'bg-gray-600'
                            } hover:opacity-80 transition-opacity`}
                        >
                            <IoDesktop className="text-white" size={20} />
                        </button>
                        <button
                            onClick={handleEndCall}
                            className="p-2 rounded-full bg-red-600 hover:opacity-80 transition-opacity"
                        >
                            <IoCall className="text-white" size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 