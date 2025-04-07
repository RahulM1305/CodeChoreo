import { Socket } from "socket.io"

type SocketId = string

export enum SocketEvent {
	JOIN_REQUEST = "join-request",
	JOIN_ACCEPTED = "join-accepted",
	USER_JOINED = "user-joined",
	USER_DISCONNECTED = "user-disconnected",
	SYNC_FILE_STRUCTURE = "sync-file-structure",
	DIRECTORY_CREATED = "directory-created",
	DIRECTORY_UPDATED = "directory-updated",
	DIRECTORY_RENAMED = "directory-renamed",
	DIRECTORY_DELETED = "directory-deleted",
	FILE_CREATED = "file-created",
	FILE_UPDATED = "file-updated",
	FILE_RENAMED = "file-renamed",
	FILE_DELETED = "file-deleted",
	USER_OFFLINE = "offline",
	USER_ONLINE = "online",
	SEND_MESSAGE = "send-message",
	RECEIVE_MESSAGE = "receive-message",
	TYPING_START = "typing-start",
	TYPING_PAUSE = "typing-pause",
	USERNAME_EXISTS = "username-exists",
	REQUEST_DRAWING = "request-drawing",
	SYNC_DRAWING = "sync-drawing",
	DRAWING_UPDATE = "drawing-update",
	VIDEO_CALL_STARTED = "video-call-started",
	VIDEO_CALL_REQUEST = "video-call-request",
	VIDEO_CALL_ACCEPTED = "video-call-accepted",
	VIDEO_CALL_REJECTED = "video-call-rejected",
	VIDEO_CALL_ENDED = "video-call-ended",
	VIDEO_OFFER = "video-offer",
	VIDEO_ANSWER = "video-answer",
	ICE_CANDIDATE = "ice-candidate",
	VIDEO_JOIN = "video-join",
	VIDEO_LEAVE = "video-leave",
	VIDEO_TOGGLE = "video-toggle",
	AUDIO_TOGGLE = "audio-toggle",
	CALL_INVITE = 'call:invite',
	CALL_ACCEPT = 'call:accept',
	CALL_DECLINE = 'call:decline',
	CALL_ENDED = 'call:ended'
}

interface SocketContext {
	socket: Socket
}

export { SocketContext, SocketId }
