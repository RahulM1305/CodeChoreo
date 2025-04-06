import React, { useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaPhoneSlash } from 'react-icons/fa';

interface FloatingVideoWindowProps {
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    isScreenSharing: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onStartScreenShare: () => void;
    onStopScreenShare: () => void;
    onEndCall: () => void;
}

export function FloatingVideoWindow({
    localStream,
    remoteStreams,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    onToggleAudio,
    onToggleVideo,
    onStartScreenShare,
    onStopScreenShare,
    onEndCall
}: FloatingVideoWindowProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

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

    const totalParticipants = remoteStreams.size + (localStream ? 1 : 0);
    const gridClass = totalParticipants <= 4 
        ? 'grid-cols-2' 
        : totalParticipants <= 9 
            ? 'grid-cols-3' 
            : 'grid-cols-4';

    return (
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
                                    video.srcObject = stream;
                                }
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-2 bg-gray-800">
                <button
                    onClick={onToggleAudio}
                    className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                    title={isAudioEnabled ? "Mute Audio" : "Unmute Audio"}
                >
                    {isAudioEnabled ? (
                        <FaMicrophone className="w-4 h-4 text-white" />
                    ) : (
                        <FaMicrophoneSlash className="w-4 h-4 text-red-500" />
                    )}
                </button>
                <button
                    onClick={onToggleVideo}
                    className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                    title={isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
                >
                    {isVideoEnabled ? (
                        <FaVideo className="w-4 h-4 text-white" />
                    ) : (
                        <FaVideoSlash className="w-4 h-4 text-red-500" />
                    )}
                </button>
                <button
                    onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
                    className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                    title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                >
                    <FaDesktop className={`w-4 h-4 ${isScreenSharing ? 'text-green-500' : 'text-white'}`} />
                </button>
                <button
                    onClick={onEndCall}
                    className="p-2 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
                    title="End Call"
                >
                    <FaPhoneSlash className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    );
} 