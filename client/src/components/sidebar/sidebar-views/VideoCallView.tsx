import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { useAppContext } from '@/context/AppContext';
import { useSocket } from '@/context/SocketContext';
import { SocketEvent } from '@/types/socket';
import VideoCall from '@/components/VideoCall';

const VideoCallView: React.FC = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [activeCaller, setActiveCaller] = useState<string | null>(null);
  const [showCallNotification, setShowCallNotification] = useState(false);
  const [callerUsername, setCallerUsername] = useState('');
  const { currentUser, currentRoom } = useAppContext();
  const { socket } = useSocket();

  // Listen for call start events
  useEffect(() => {
    if (!currentRoom) return;

    const handleCallStarted = (data: { roomId: string, callerUsername: string }) => {
      console.log('Call started event received:', data);
      if (data.roomId === currentRoom.id && data.callerUsername !== currentUser.username) {
        console.log('Setting up call notification for:', data.callerUsername);
        setActiveCaller(data.callerUsername);
        setShowCallNotification(true);
        setCallerUsername(data.callerUsername);
      }
    };

    const handleCallEnded = (data: { roomId: string }) => {
      console.log('Call ended event received:', data);
      if (data.roomId === currentRoom.id) {
        console.log('Cleaning up call state');
        setIsCallActive(false);
        setIsInitiator(false);
        setActiveCaller(null);
        setShowCallNotification(false);
        setCallerUsername('');
      }
    };

    const handleCallAccepted = (data: { roomId: string, username: string }) => {
      console.log('Call accepted event received:', data);
      if (data.roomId === currentRoom.id && isInitiator) {
        console.log('Call was accepted by:', data.username);
      }
    };

    const handleCallRejected = (data: { roomId: string }) => {
      console.log('Call rejected event received:', data);
      if (data.roomId === currentRoom.id && isInitiator) {
        console.log('Call was rejected');
        setIsCallActive(false);
        setIsInitiator(false);
      }
    };

    // Set up event listeners
    socket.on(SocketEvent.VIDEO_CALL_STARTED, handleCallStarted);
    socket.on(SocketEvent.VIDEO_CALL_ENDED, handleCallEnded);
    socket.on(SocketEvent.VIDEO_CALL_ACCEPTED, handleCallAccepted);
    socket.on(SocketEvent.VIDEO_CALL_REJECTED, handleCallRejected);

    // Clean up event listeners
    return () => {
      socket.off(SocketEvent.VIDEO_CALL_STARTED, handleCallStarted);
      socket.off(SocketEvent.VIDEO_CALL_ENDED, handleCallEnded);
      socket.off(SocketEvent.VIDEO_CALL_ACCEPTED, handleCallAccepted);
      socket.off(SocketEvent.VIDEO_CALL_REJECTED, handleCallRejected);
    };
  }, [socket, currentRoom, currentUser.username, isInitiator]);

  const handleStartCall = () => {
    if (!currentRoom) return;
    
    console.log('Starting call as initiator');
    setIsCallActive(true);
    setIsInitiator(true);
    
    // Notify other users that a call has started
    socket.emit(SocketEvent.VIDEO_CALL_STARTED, { 
      roomId: currentRoom.id,
      callerUsername: currentUser.username
    });
  };

  const handleEndCall = () => {
    if (!currentRoom) return;
    
    console.log('Ending call');
    setIsCallActive(false);
    setIsInitiator(false);
    setActiveCaller(null);
    setShowCallNotification(false);
    setCallerUsername('');
    
    // Notify other users that the call has ended
    socket.emit(SocketEvent.VIDEO_CALL_ENDED, { roomId: currentRoom.id });
  };

  const handleAcceptCall = () => {
    console.log('Accepting call from:', callerUsername);
    setShowCallNotification(false);
    setIsCallActive(true);
    // Notify the caller that the call was accepted
    socket.emit(SocketEvent.VIDEO_CALL_ACCEPTED, { 
      roomId: currentRoom?.id,
      username: currentUser.username
    });
  };

  const handleRejectCall = () => {
    console.log('Rejecting call from:', callerUsername);
    setShowCallNotification(false);
    setCallerUsername('');
    socket.emit(SocketEvent.VIDEO_CALL_REJECTED, { roomId: currentRoom?.id });
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

  if (!currentRoom) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Please join a room to start a video call.</Typography>
      </Box>
    );
  }

  if (isCallActive) {
    return (
      <VideoCall 
        channelName={currentRoom.id} 
        onEndCall={handleEndCall} 
        isInitiator={isInitiator}
        callerUsername={callerUsername}
      />
    );
  }

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      {activeCaller ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            {activeCaller} has started a video call
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAcceptCall}
            startIcon={<VideoCallIcon />}
          >
            Join Call
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Start a video call with your team
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleStartCall}
            startIcon={<VideoCallIcon />}
          >
            Start Video Call
          </Button>
        </Box>
      )}
      
      {showCallNotification && <CallNotificationDialog />}
    </Box>
  );
};

export default VideoCallView; 