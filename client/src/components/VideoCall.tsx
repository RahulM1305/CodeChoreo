import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  ILocalVideoTrack
} from 'agora-rtc-sdk-ng';
import { Button, Box, Grid, Typography, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useAppContext } from '@/context/AppContext';
import { useSocket } from '@/context/SocketContext';
import { SocketEvent } from '@/types/socket';

// Get Agora App ID from environment variables
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

interface VideoCallProps {
  channelName: string;
  onEndCall: () => void;
  isInitiator?: boolean;
  callerUsername?: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ 
  channelName, 
  onEndCall, 
  isInitiator = false,
  callerUsername = ''
}) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showCallNotification, setShowCallNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 320 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { currentUser } = useAppContext();
  const { socket } = useSocket();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksInitialized = useRef(false);
  const userJoinedRef = useRef<{[key: string]: boolean}>({});
  const callEndedRef = useRef(false);
  const videoCallRef = useRef<HTMLDivElement>(null);

  // Handle incoming call notifications
  useEffect(() => {
    if (!isInitiator) {
      const handleCallRequest = (data: { callerUsername: string, roomId: string }) => {
        console.log('Call request received:', data);
        if (data.roomId === channelName) {
          console.log('Setting up call notification');
          setShowCallNotification(true);
        }
      };

      socket.on(SocketEvent.VIDEO_CALL_REQUEST, handleCallRequest);

      return () => {
        socket.off(SocketEvent.VIDEO_CALL_REQUEST, handleCallRequest);
      };
    }
  }, [socket, channelName, isInitiator]);

  // Handle call acceptance
  const handleAcceptCall = async () => {
    console.log('Accepting call in VideoCall component');
    setShowCallNotification(false);
    setIsCallActive(true);
    await initializeCall();
  };

  // Handle call rejection
  const handleRejectCall = () => {
    console.log('Rejecting call in VideoCall component');
    setShowCallNotification(false);
    socket.emit(SocketEvent.VIDEO_CALL_REJECTED, { roomId: channelName });
  };

  // Initialize the call
  const initializeCall = async () => {
    if (clientRef.current) return; // Prevent multiple initializations
    
    if (!APP_ID) {
      setError("Agora App ID is not configured. Please set the VITE_AGORA_APP_ID environment variable.");
      return;
    }

    try {
      console.log('Initializing Agora client');
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = agoraClient;
      setClient(agoraClient);

      // Handle remote user events
      agoraClient.on('user-published', async (user, mediaType) => {
        console.log('User published:', user.uid, mediaType);
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            // Check if user already exists to prevent duplicates
            if (userJoinedRef.current[user.uid]) {
              return prev;
            }
            userJoinedRef.current[user.uid] = true;
            return [...prev, user];
          });
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      agoraClient.on('user-unpublished', (user) => {
        console.log('User unpublished:', user.uid);
        // Don't remove the user from the list, just handle the unpublished media
      });

      agoraClient.on('user-left', (user) => {
        console.log('User left:', user.uid);
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        userJoinedRef.current[user.uid] = false;
      });

      // Join the channel
      console.log('Joining channel:', channelName);
      await agoraClient.join(APP_ID, channelName, null, null);

      // Create and publish local tracks
      console.log('Creating local tracks');
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      await agoraClient.publish([audioTrack, videoTrack]);
      tracksInitialized.current = true;
      console.log('Local tracks published');
    } catch (error) {
      console.error("Error initializing Agora client:", error);
      setError(`Failed to initialize video call: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Start call if initiator
  useEffect(() => {
    if (isInitiator && !isCallActive) {
      console.log('Starting call as initiator');
      setIsCallActive(true);
      socket.emit(SocketEvent.VIDEO_CALL_STARTED, { 
        roomId: channelName,
        callerUsername: currentUser.username
      });
      initializeCall();
    }

    return () => {
      if (clientRef.current && !callEndedRef.current) {
        console.log('Cleaning up resources in initiator effect');
        localAudioTrack?.close();
        localVideoTrack?.close();
        screenTrack?.close();
        clientRef.current.leave();
        clientRef.current = null;
        tracksInitialized.current = false;
        userJoinedRef.current = {};
      }
    };
  }, [isInitiator, channelName, currentUser.username]);

  // Initialize call when isCallActive becomes true (for non-initiators)
  useEffect(() => {
    if (!isInitiator && isCallActive && !clientRef.current) {
      console.log('Initializing call for non-initiator');
      initializeCall();
    }
  }, [isCallActive, isInitiator]);

  // Handle call end events
  useEffect(() => {
    const handleCallEnded = (data: { roomId: string }) => {
      console.log('Call ended event received in VideoCall:', data);
      if (data.roomId === channelName) {
        console.log('Cleaning up video call resources');
        callEndedRef.current = true;
        localAudioTrack?.close();
        localVideoTrack?.close();
        screenTrack?.close();
        if (clientRef.current) {
          clientRef.current.leave();
          clientRef.current = null;
        }
        tracksInitialized.current = false;
        userJoinedRef.current = {};
        onEndCall();
      }
    };

    socket.on(SocketEvent.VIDEO_CALL_ENDED, handleCallEnded);

    return () => {
      socket.off(SocketEvent.VIDEO_CALL_ENDED, handleCallEnded);
    };
  }, [socket, channelName, localAudioTrack, localVideoTrack, screenTrack, onEndCall]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isFullscreen) {
        // Ensure the video call window stays within the viewport
        setPosition(prev => ({
          x: Math.min(prev.x, window.innerWidth - size.width),
          y: Math.min(prev.y, window.innerHeight - size.height)
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, size]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle resizing
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e: MouseEvent) => {
      if (direction.includes('e')) {
        setSize(prev => ({
          ...prev,
          width: Math.max(300, startWidth + (e.clientX - startX))
        }));
      }
      if (direction.includes('s')) {
        setSize(prev => ({
          ...prev,
          height: Math.max(200, startHeight + (e.clientY - startY))
        }));
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleAudio = () => {
    if (localAudioTrack) {
      const newMuteState = !isAudioMuted;
      localAudioTrack.setEnabled(!newMuteState);
      setIsAudioMuted(newMuteState);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      const newMuteState = !isVideoMuted;
      localVideoTrack.setEnabled(!newMuteState);
      setIsVideoMuted(newMuteState);
    }
  };

  const toggleFullscreen = () => {
    if (videoCallRef.current) {
      if (!isFullscreen) {
        if (videoCallRef.current.requestFullscreen) {
          videoCallRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!clientRef.current) return;

    try {
      if (!isScreenSharing) {
        // Start screen sharing with correct parameters
        const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: 'high_quality',
          optimizationMode: 'detail'
        }, 'auto');
        
        // Handle the return type which can be either ILocalVideoTrack or [ILocalVideoTrack, ILocalAudioTrack]
        let videoTrack: ILocalVideoTrack;
        
        if (Array.isArray(screenVideoTrack)) {
          // If it's an array, the first element is the video track
          videoTrack = screenVideoTrack[0];
        } else {
          // If it's a single track, it's the video track
          videoTrack = screenVideoTrack;
        }
        
        // Set the video track in state
        setScreenTrack(videoTrack);
        
        // Stop camera video track
        if (localVideoTrack) {
          localVideoTrack.stop();
          localVideoTrack.close();
          setLocalVideoTrack(null);
        }
        
        // Publish screen track
        await clientRef.current.publish(screenVideoTrack);
        setIsScreenSharing(true);
      } else {
        // Stop screen sharing
        if (screenTrack) {
          screenTrack.stop();
          screenTrack.close();
          setScreenTrack(null);
        }
        
        // Create and publish camera video track
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(videoTrack);
        await clientRef.current.publish(videoTrack);
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  const handleEndCall = () => {
    console.log('Ending call from VideoCall component');
    callEndedRef.current = true;
    localAudioTrack?.close();
    localVideoTrack?.close();
    screenTrack?.close();
    if (clientRef.current) {
      clientRef.current.leave();
      clientRef.current = null;
    }
    tracksInitialized.current = false;
    userJoinedRef.current = {};
    socket.emit(SocketEvent.VIDEO_CALL_ENDED, { roomId: channelName });
    onEndCall();
  };

  // Call notification dialog
  const CallNotificationDialog = () => (
    <Dialog 
      open={showCallNotification} 
      onClose={handleRejectCall}
      aria-labelledby="call-notification-title"
    >
      <DialogTitle id="call-notification-title">Incoming Video Call</DialogTitle>
      <DialogContent>
        <Typography>
          {callerUsername} is calling you. Would you like to join?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleRejectCall} color="error">
          Reject
        </Button>
        <Button onClick={handleAcceptCall} color="primary" variant="contained">
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error
        </Typography>
        <Typography>{error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onEndCall}
          sx={{ mt: 2 }}
        >
          Close
        </Button>
      </Box>
    );
  }

  if (!isCallActive && !isInitiator) {
    return <CallNotificationDialog />;
  }

  return (
    <Box
      ref={videoCallRef}
      sx={{
        position: isFullscreen ? 'fixed' : 'absolute',
        top: isFullscreen ? 0 : position.y,
        left: isFullscreen ? 0 : position.x,
        width: isFullscreen ? '100vw' : size.width,
        height: isFullscreen ? '100vh' : size.height,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        border: '1px solid',
        borderColor: 'divider',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header with drag handle */}
      <Box
        className="drag-handle"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          cursor: 'move',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DragIndicatorIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            Video Call {isInitiator ? '(You initiated)' : ''}
          </Typography>
        </Box>
        <Box>
          <IconButton 
            size="small" 
            onClick={toggleFullscreen}
            sx={{ color: 'primary.contrastText' }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Video content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        <Grid container spacing={1} sx={{ height: '100%', p: 1 }}>
          {/* Local Video */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '100%',
                bgcolor: 'black',
                position: 'relative',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {localVideoTrack && (
                <div
                  ref={node => node && localVideoTrack.play(node)}
                  style={{ height: '100%', width: '100%' }}
                />
              )}
              {screenTrack && (
                <div
                  ref={node => node && screenTrack.play(node)}
                  style={{ height: '100%', width: '100%' }}
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  padding: '2px 8px',
                  borderRadius: 1,
                }}
              >
                You ({currentUser.username})
              </Typography>
            </Box>
          </Grid>

          {/* Remote Videos */}
          {remoteUsers.map(user => (
            <Grid item xs={12} md={6} key={user.uid}>
              <Box
                sx={{
                  height: '100%',
                  bgcolor: 'black',
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                {user.videoTrack && (
                  <div
                    ref={node => node && user.videoTrack?.play(node)}
                    style={{ height: '100%', width: '100%' }}
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    padding: '2px 8px',
                    borderRadius: 1,
                  }}
                >
                  {isInitiator ? callerUsername : currentUser.username}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Controls */}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
        <Button
          variant="contained"
          color={isAudioMuted ? 'error' : 'primary'}
          onClick={toggleAudio}
          startIcon={isAudioMuted ? <MicOffIcon /> : <MicIcon />}
          size="small"
        >
          {isAudioMuted ? 'Unmute' : 'Mute'}
        </Button>
        <Button
          variant="contained"
          color={isVideoMuted ? 'error' : 'primary'}
          onClick={toggleVideo}
          startIcon={isVideoMuted ? <VideocamOffIcon /> : <VideocamIcon />}
          size="small"
        >
          {isVideoMuted ? 'Start Video' : 'Stop Video'}
        </Button>
        <Button
          variant="contained"
          color={isScreenSharing ? 'secondary' : 'primary'}
          onClick={toggleScreenShare}
          startIcon={isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          size="small"
        >
          {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleEndCall}
          startIcon={<CallEndIcon />}
          size="small"
        >
          End Call
        </Button>
      </Box>

      {/* Resize handles */}
      {!isFullscreen && (
        <>
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 10,
              height: 10,
              cursor: 'se-resize',
            }}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: '50%',
              width: 10,
              height: 10,
              cursor: 'e-resize',
            }}
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              width: 10,
              height: 10,
              cursor: 's-resize',
            }}
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
        </>
      )}
    </Box>
  );
};

export default VideoCall; 