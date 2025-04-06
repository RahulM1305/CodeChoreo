import React, { useEffect, useRef, useState } from 'react';
import { useVideo } from '../../context/VideoContext';
import { useAppContext } from '../../context/AppContext';
import { IoVideocam, IoVideocamOff, IoMic, IoMicOff, IoDesktop, IoCall } from 'react-icons/io5';

export function VideoComponent() {
    const [isVideoWindowOpen, setIsVideoWindowOpen] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
    
    const {
        localStream,
        remoteStreams,
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        isInCall,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        endCall
    } = useVideo();
    
    const { users } = useAppContext();
    
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

    // Handle dragging the video window
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
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
                    {isInCall ? 'In a call' : 'Not in a call'}
                </p>
            </div>
            
            {isInCall && (
                <button
                    onClick={() => {
                        endCall();
                        setIsVideoWindowOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>End Call</span>
                </button>
            )}
            
            {isVideoWindowOpen && (
                <div
                    className="fixed bg-gray-900 rounded-lg shadow-lg overflow-hidden"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: '400px',
                        height: '300px',
                        cursor: isDragging ? 'grabbing' : 'default'
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div
                        className="bg-gray-800 p-2 cursor-grab"
                        onMouseDown={handleMouseDown}
                    >
                        <h3 className="text-white text-sm font-medium">Video Call</h3>
                    </div>

                    <div className={`grid ${gridClass} gap-2 p-2 h-[calc(100%-40px)]`}>
                        {/* Local Video */}
                        {localStream && (
                            <div className="relative aspect-video bg-black rounded overflow-hidden">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-1 py-0.5 rounded">
                                    You {isScreenSharing && '(Screen)'}
                                </div>
                            </div>
                        )}

                        {/* Remote Videos */}
                        {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                            <div key={userId} className="relative aspect-video bg-black rounded overflow-hidden">
                                <video
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                    ref={(video) => {
                                        if (video) {
                                            remoteVideoRefs.current.set(userId, video);
                                            video.srcObject = stream;
                                        }
                                    }}
                                />
                                <div className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-1 py-0.5 rounded">
                                    {users.find(user => user.socketId === userId)?.username || 'User'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-2 bg-gray-800">
                        <button
                            onClick={toggleAudio}
                            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                            title={isAudioEnabled ? "Mute Audio" : "Unmute Audio"}
                        >
                            {isAudioEnabled ? (
                                <IoMic className="w-4 h-4 text-white" />
                            ) : (
                                <IoMicOff className="w-4 h-4 text-red-500" />
                            )}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                            title={isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
                        >
                            {isVideoEnabled ? (
                                <IoVideocam className="w-4 h-4 text-white" />
                            ) : (
                                <IoVideocamOff className="w-4 h-4 text-red-500" />
                            )}
                        </button>
                        <button
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                            title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                        >
                            <IoDesktop className={`w-4 h-4 ${isScreenSharing ? 'text-green-500' : 'text-white'}`} />
                        </button>
                        <button
                            onClick={() => {
                                endCall();
                                setIsVideoWindowOpen(false);
                            }}
                            className="p-2 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
                            title="End Call"
                        >
                            <IoCall className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 