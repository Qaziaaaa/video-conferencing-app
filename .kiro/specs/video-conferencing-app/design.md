# Design Document: Video Conferencing App

## Overview

This document describes the technical design for transforming the existing 1-to-1 WebRTC skeleton into a production-quality, Google Meet-like video conferencing platform. The system supports up to 8 simultaneous participants using a full-mesh WebRTC topology, real-time chat with MongoDB persistence, screen sharing, host admin controls, a waiting room, JWT authentication, and a polished dark UI.

The architecture is a three-tier MERN stack:

- **Client** â€” React 19 / Vite SPA with Tailwind CSS v4, Zustand, Socket.IO client, and the WebRTC browser API.
- **Signaling Server** â€” Node.js / Express / Socket.IO backend handling WebRTC signaling, REST API, JWT auth middleware, and MongoDB integration via Mongoose.
- **Database** â€” MongoDB storing Meeting documents, Chat_Message documents, and User documents.

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| WebRTC topology | Full mesh (P2P) | Simplest for â‰¤8 peers; no SFU infrastructure needed for MVP |
| Signaling transport | Socket.IO | Already in use; handles rooms, namespaces, and reconnection |
| State management | Zustand | Already in use; minimal boilerplate, fine-grained subscriptions |
| Auth token storage | In-memory (React state / closure) | Prevents XSS token theft vs. localStorage |
| Chat persistence | MongoDB via Mongoose | Structured queries, easy indexing on `meetingId` + `timestamp` |
| Screen share | `getDisplayMedia` + `RTCRtpSender.replaceTrack` | No renegotiation needed; seamless track swap |
| PBT library | `fast-check` (client) | Mature, TypeScript-friendly, runs in Vitest |

---

## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph Browser["Browser (Client)"]
        UI["React UI\n(Pages, Components)"]
        Hooks["Custom Hooks\n(useWebRTC, useChat, useAuth)"]
        Store["Zustand Store\n(meeting, auth, chat, ui)"]
        WS_Client["Socket.IO Client"]
        WebRTC["WebRTC\nRTCPeerConnection Ã— N"]
    end

    subgraph Server["Signaling Server (Node.js)"]
        Express["Express REST API\n(/api/auth, /api/meetings)"]
        SocketIO["Socket.IO Server\n(rooms, events)"]
        AuthMW["JWT Auth Middleware"]
        RoomMgr["Room Manager\n(in-memory Map)"]
        Mongoose["Mongoose ODM"]
    end

    subgraph DB["MongoDB"]
        Users[("users")]
        Meetings[("meetings")]
        Messages[("chat_messages")]
    end

    UI --> Hooks
    Hooks --> Store
    Hooks --> WS_Client
    Hooks --> WebRTC
    WS_Client <-->|"Socket.IO\n(signaling, chat, events)"| SocketIO
    WebRTC <-->|"DTLS/SRTP\n(media, P2P)"| WebRTC
    Express <-->|"REST\n(auth, meeting CRUD)"| UI
    SocketIO --> RoomMgr
    SocketIO --> AuthMW
    Express --> AuthMW
    RoomMgr --> Mongoose
    Mongoose <--> DB
```

### Request / Connection Lifecycle

```mermaid
sequenceDiagram
    participant A as Participant A (Browser)
    participant S as Signaling Server
    participant B as Participant B (Browser)
    participant DB as MongoDB

    A->>S: POST /api/meetings (create)
    S->>DB: insert Meeting document
    S-->>A: { meetingId, shareUrl }

    A->>S: Socket connect (JWT in handshake)
    S->>S: verify JWT middleware
    A->>S: emit join-room { meetingId, displayName }
    S->>DB: upsert participant in Meeting

    B->>S: Socket connect (JWT in handshake)
    B->>S: emit join-room { meetingId, displayName }
    S-->>A: emit user-joined { socketId, displayName }

    A->>A: createOffer (RTCPeerConnection)
    A->>S: emit offer { sdp, targetSocketId }
    S-->>B: emit offer { sdp, fromSocketId }
    B->>B: setRemoteDescription, createAnswer
    B->>S: emit answer { sdp, targetSocketId }
    S-->>A: emit answer { sdp, fromSocketId }
    A->>A: setRemoteDescription

    A-->B: ICE candidates exchanged via server
    A<-->B: DTLS/SRTP media (P2P, bypasses server)
```

---

## Components and Interfaces

### File Structure

```
client/src/
â”œâ”€â”€ App.jsx                          # Router: auth guard â†’ Home | Meeting | Auth pages
â”œâ”€â”€ main.jsx
â”œâ”€â”€ index.css
â”‚
â”œâ”€â”€ pages/
â”‚   â”œâ”€â”€ Home.jsx                     # Landing: create / join meeting
â”‚   â”œâ”€â”€ MeetingRoom.jsx              # Main meeting view (orchestrates panels)
â”‚   â”œâ”€â”€ PreJoinLobby.jsx             # Camera preview + display name entry
â”‚   â”œâ”€â”€ WaitingRoom.jsx              # "Waiting for host" screen
â”‚   â”œâ”€â”€ RemovedScreen.jsx            # "You were removed" screen
â”‚   â”œâ”€â”€ MeetingNotFound.jsx          # 404 meeting error page
â”‚   â”œâ”€â”€ Login.jsx                    # JWT login form
â”‚   â””â”€â”€ Register.jsx                 # JWT register form
â”‚
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â””â”€â”€ MeetingLayout.jsx        # Shell: VideoGrid + sidepanels + ControlBar
â”‚   â”œâ”€â”€ video/
â”‚   â”‚   â”œâ”€â”€ VideoGrid.jsx            # Responsive CSS grid of Tiles
â”‚   â”‚   â”œâ”€â”€ Tile.jsx                 # Single participant tile (video or avatar)
â”‚   â”‚   â”œâ”€â”€ VideoPlayer.jsx          # <video> element wrapper
â”‚   â”‚   â””â”€â”€ AvatarFallback.jsx       # Initials avatar when camera is off
â”‚   â”œâ”€â”€ controls/
â”‚   â”‚   â””â”€â”€ ControlBar.jsx           # Bottom toolbar with all action buttons
â”‚   â”œâ”€â”€ chat/
â”‚   â”‚   â”œâ”€â”€ ChatPanel.jsx            # Collapsible right-side chat panel
â”‚   â”‚   â”œâ”€â”€ ChatMessage.jsx          # Single message bubble
â”‚   â”‚   â””â”€â”€ ChatInput.jsx            # Message input + send button
â”‚   â”œâ”€â”€ participants/
â”‚   â”‚   â”œâ”€â”€ ParticipantsPanel.jsx    # Collapsible right-side participants list
â”‚   â”‚   â””â”€â”€ ParticipantRow.jsx       # Single participant row with status icons
â”‚   â”œâ”€â”€ waiting/
â”‚   â”‚   â””â”€â”€ AdmissionPanel.jsx       # Host's panel showing waiting participants
â”‚   â”œâ”€â”€ notifications/
â”‚   â”‚   â””â”€â”€ NotificationStack.jsx    # Toast notification stack (bottom of screen)
â”‚   â””â”€â”€ ui/
â”‚       â”œâ”€â”€ ConfirmDialog.jsx        # Escape-to-leave confirmation modal
â”‚       â”œâ”€â”€ SkeletonTile.jsx         # Loading skeleton for tiles
â”‚       â””â”€â”€ CopyLinkButton.jsx       # Share URL copy-to-clipboard button
â”‚
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useWebRTC.js                 # Mesh peer connection management (refactored)
â”‚   â”œâ”€â”€ useChat.js                   # Chat send/receive + history fetch
â”‚   â”œâ”€â”€ useAuth.js                   # JWT login/register/token management
â”‚   â”œâ”€â”€ useScreenShare.js            # getDisplayMedia + track replacement
â”‚   â”œâ”€â”€ useParticipants.js           # Participant list state + events
â”‚   â”œâ”€â”€ useNotifications.js          # Toast queue management
â”‚   â””â”€â”€ useKeyboardShortcuts.js      # M, V, H, Escape bindings
â”‚
â””â”€â”€ store/
    â”œâ”€â”€ useMeetingStore.js           # Meeting + WebRTC state (refactored)
    â”œâ”€â”€ useAuthStore.js              # JWT token + user identity
    â”œâ”€â”€ useChatStore.js              # Chat messages + unread count
    â””â”€â”€ useUIStore.js                # Panel visibility, notifications, dialogs

server/
â”œâ”€â”€ index.js                         # Entry point: Express + Socket.IO bootstrap
â”œâ”€â”€ config/
â”‚   â””â”€â”€ db.js                        # Mongoose connect + error handling
â”œâ”€â”€ models/
â”‚   â”œâ”€â”€ User.js                      # Mongoose User schema
â”‚   â”œâ”€â”€ Meeting.js                   # Mongoose Meeting schema
â”‚   â””â”€â”€ ChatMessage.js               # Mongoose ChatMessage schema
â”œâ”€â”€ routes/
â”‚   â”œâ”€â”€ auth.js                      # POST /api/auth/register, /api/auth/login
â”‚   â””â”€â”€ meetings.js                  # GET /api/meetings/:id, GET /api/meetings/:id/chat
â”œâ”€â”€ middleware/
â”‚   â””â”€â”€ auth.js                      # JWT verification middleware
â”œâ”€â”€ socket/
â”‚   â”œâ”€â”€ index.js                     # Socket.IO server setup + auth middleware
â”‚   â”œâ”€â”€ roomHandlers.js              # join-room, user-joined, user-left, host logic
â”‚   â”œâ”€â”€ signalingHandlers.js         # offer, answer, ice-candidate
â”‚   â”œâ”€â”€ mediaHandlers.js             # participant-media-state, screen-share events
â”‚   â”œâ”€â”€ chatHandlers.js              # chat-message relay + DB persist
â”‚   â”œâ”€â”€ handHandlers.js              # raise-hand, lower-hand
â”‚   â”œâ”€â”€ adminHandlers.js             # kick-participant, host-changed
â”‚   â””â”€â”€ waitingRoomHandlers.js       # waiting, admit, deny
â””â”€â”€ utils/
    â””â”€â”€ meetingId.js                 # Meeting ID generator (abc-defg-hij format)
```

### Component Interface Contracts

#### `<Tile>` Props
```typescript
interface TileProps {
  participantId: string;
  displayName: string;
  stream: MediaStream | null;
  isLocal: boolean;
  isHost: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isDominantSpeaker: boolean;
  isScreenSharing: boolean;
  isLoading: boolean;           // shows SkeletonTile while PC establishing
  onKick?: () => void;          // only provided when viewer is host
}
```

#### `<ControlBar>` Props
```typescript
interface ControlBarProps {
  isMicOn: boolean;
  isCamOn: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  unreadChatCount: number;
  participantCount: number;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleHand: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}
```

#### `useWebRTC` Hook Interface
```typescript
interface UseWebRTCReturn {
  peerConnections: Map<string, RTCPeerConnection>;
  connectionStates: Map<string, RTCIceConnectionState>;
  replaceVideoTrack: (newTrack: MediaStreamTrack) => Promise<void>;
  restartIce: (peerId: string) => Promise<void>;
}
```

---

## Data Models

### MongoDB Schemas

#### User
```javascript
// server/models/User.js
const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },           // bcrypt, cost factor â‰¥ 12
  displayName:  { type: String, required: true, maxlength: 50 },
  createdAt:    { type: Date, default: Date.now },
});
```

#### Meeting
```javascript
// server/models/Meeting.js
const MeetingSchema = new mongoose.Schema({
  meetingId:        { type: String, required: true, unique: true, index: true },
  hostSocketId:     { type: String, required: true },
  hostUserId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt:        { type: Date, default: Date.now },
  endedAt:          { type: Date, default: null },
  participantCount: { type: Number, default: 0 },
  waitingRoomEnabled: { type: Boolean, default: false },
});
```

#### ChatMessage
```javascript
// server/models/ChatMessage.js
const ChatMessageSchema = new mongoose.Schema({
  meetingId:   { type: String, required: true, index: true },
  senderName:  { type: String, required: true, maxlength: 50 },
  text:        { type: String, required: true, maxlength: 1000 },
  timestamp:   { type: Date, default: Date.now },
});
// Compound index for efficient history queries
ChatMessageSchema.index({ meetingId: 1, timestamp: 1 });
```

### Zustand Store Shape

```typescript
// useMeetingStore.js
interface MeetingState {
  // Identity
  meetingId: string | null;
  localSocketId: string | null;
  displayName: string;
  isHost: boolean;

  // Media streams
  localStream: MediaStream | null;
  screenShareStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;       // socketId â†’ stream

  // Participant metadata (synced via socket events)
  participants: Map<string, ParticipantMeta>;   // socketId â†’ meta

  // Connection state per peer
  connectionStates: Map<string, 'connecting' | 'connected' | 'failed'>;

  // Local media state
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;

  // Actions
  setLocalStream: (stream: MediaStream) => void;
  setRemoteStream: (socketId: string, stream: MediaStream) => void;
  removeRemoteStream: (socketId: string) => void;
  upsertParticipant: (socketId: string, meta: ParticipantMeta) => void;
  removeParticipant: (socketId: string) => void;
  setConnectionState: (socketId: string, state: string) => void;
  toggleMic: () => void;
  toggleCam: () => void;
  setScreenSharing: (active: boolean) => void;
  toggleHand: () => void;
  setHost: (socketId: string) => void;
}

interface ParticipantMeta {
  socketId: string;
  displayName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isHost: boolean;
}

// useAuthStore.js
interface AuthState {
  token: string | null;           // JWT, in-memory only
  userId: string | null;
  email: string | null;
  displayName: string | null;
  setAuth: (token: string, userId: string, email: string, displayName: string) => void;
  clearAuth: () => void;
}

// useChatStore.js
interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  isChatOpen: boolean;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  toggleChat: () => void;
}

interface ChatMessage {
  _id?: string;
  meetingId: string;
  senderName: string;
  text: string;
  timestamp: string;   // ISO 8601
}

// useUIStore.js
interface UIState {
  isParticipantsOpen: boolean;
  isConfirmLeaveOpen: boolean;
  notifications: Notification[];
  toggleParticipants: () => void;
  showConfirmLeave: () => void;
  hideConfirmLeave: () => void;
  addNotification: (msg: string) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;           // uuid
  message: string;
  createdAt: number;    // Date.now()
}
```

---

## Socket.IO Event Catalog

All events are scoped to a Socket.IO room identified by `meetingId`. Payloads are JSON objects.

### Client â†’ Server Events

| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ meetingId, displayName, waitingRoom? }` | Join or enter waiting queue |
| `offer` | `{ sdp, targetSocketId, meetingId }` | SDP offer to a specific peer |
| `answer` | `{ sdp, targetSocketId, meetingId }` | SDP answer to a specific peer |
| `ice-candidate` | `{ candidate, targetSocketId, meetingId }` | ICE candidate to a specific peer |
| `participant-media-state` | `{ meetingId, isMuted, isCameraOff }` | Broadcast own media state change |
| `screen-share-started` | `{ meetingId }` | Notify peers screen share is active |
| `screen-share-stopped` | `{ meetingId }` | Notify peers screen share ended |
| `chat-message` | `{ meetingId, senderName, text, timestamp }` | Send a chat message |
| `raise-hand` | `{ meetingId, displayName }` | Signal hand raised |
| `lower-hand` | `{ meetingId }` | Signal hand lowered |
| `kick-participant` | `{ meetingId, targetSocketId }` | Host removes a participant |
| `admit-participant` | `{ meetingId, targetSocketId }` | Host admits from waiting room |
| `deny-participant` | `{ meetingId, targetSocketId }` | Host denies from waiting room |
| `leave-room` | `{ meetingId }` | Graceful leave before disconnect |

### Server â†’ Client Events

| Event | Payload | Description |
|---|---|---|
| `user-joined` | `{ socketId, displayName }` | New participant entered the room |
| `user-left` | `{ socketId, displayName }` | Participant disconnected or left |
| `offer` | `{ sdp, fromSocketId }` | Forwarded SDP offer |
| `answer` | `{ sdp, fromSocketId }` | Forwarded SDP answer |
| `ice-candidate` | `{ candidate, fromSocketId }` | Forwarded ICE candidate |
| `participant-media-state` | `{ socketId, isMuted, isCameraOff }` | Remote peer media state update |
| `screen-share-started` | `{ socketId }` | A peer started screen sharing |
| `screen-share-stopped` | `{ socketId }` | A peer stopped screen sharing |
| `chat-message` | `{ meetingId, senderName, text, timestamp, _id }` | Broadcast chat message |
| `raise-hand` | `{ socketId, displayName }` | Remote peer raised hand |
| `lower-hand` | `{ socketId }` | Remote peer lowered hand |
| `host-changed` | `{ newHostSocketId }` | Host role transferred |
| `you-were-removed` | `{}` | Kicked by host |
| `participant-waiting` | `{ socketId, displayName }` | (Host only) Someone is in waiting room |
| `admitted` | `{}` | (Waiting participant) Host admitted you |
| `denied` | `{}` | (Waiting participant) Host denied you |
| `room-full` | `{}` | Meeting has reached 8-participant limit |
| `meeting-not-found` | `{}` | meetingId does not exist in DB |
| `error-msg` | `{ message }` | Generic server-side error |

### Signaling Flow: Targeted vs. Broadcast

A critical upgrade from the existing skeleton: signaling events (`offer`, `answer`, `ice-candidate`) are now **targeted** to a specific `targetSocketId` rather than broadcast to the whole room. This is required for mesh topology where each peer pair has its own SDP negotiation.

```javascript
// Server: targeted relay
socket.on('offer', ({ sdp, targetSocketId, meetingId }) => {
  io.to(targetSocketId).emit('offer', { sdp, fromSocketId: socket.id });
});
```

---

## REST API Endpoints

### Authentication

| Method | Path | Auth | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | `{ email, password, displayName }` | `201 { userId, email, displayName }` |
| `POST` | `/api/auth/login` | None | `{ email, password }` | `200 { token, userId, email, displayName }` |

### Meetings

| Method | Path | Auth | Description | Response |
|---|---|---|---|---|
| `POST` | `/api/meetings` | JWT | Create a new meeting | `201 { meetingId, shareUrl, createdAt }` |
| `GET` | `/api/meetings/:meetingId` | None | Get meeting metadata | `200 { meetingId, participantCount, status }` or `404` |
| `GET` | `/api/meetings/:meetingId/chat` | JWT | Get chat history (asc timestamp) | `200 { messages: ChatMessage[] }` |

### Error Response Shape
```json
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```

---

## Key Algorithms

### 1. Mesh Peer Connection Management

The refactored `useWebRTC` hook manages a `Map<socketId, RTCPeerConnection>` instead of a single `pcRef`.

```
Algorithm: join-room event received (existing participants list)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Input: existingParticipants = [{ socketId, displayName }, ...]

FOR EACH participant IN existingParticipants:
  1. Create RTCPeerConnection(pc_config) â†’ pc
  2. Attach onicecandidate â†’ emit 'ice-candidate' { candidate, targetSocketId: participant.socketId }
  3. Attach ontrack â†’ store stream in remoteStreams[participant.socketId]
  4. Attach oniceconnectionstatechange â†’ update connectionStates[participant.socketId]
  5. Add all localStream tracks to pc
  6. pc.createOffer() â†’ setLocalDescription â†’ emit 'offer' { sdp, targetSocketId }
  7. Store pc in peerConnections[participant.socketId]

Algorithm: 'user-joined' event received (newcomer joins after us)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Input: { socketId, displayName }

1. Create RTCPeerConnection(pc_config) â†’ pc
2. Attach handlers (same as above, targetSocketId = socketId)
3. Add all localStream tracks to pc
4. DO NOT create offer â€” wait for newcomer's offer
   (The newcomer creates offers to all existing participants)
```

**Offer/Answer Role Assignment**: The joining participant (newcomer) creates offers to all existing participants. Existing participants answer. This avoids offer collisions.

### 2. ICE Candidate Buffering

Each peer connection maintains its own ICE buffer:

```
peerIceBuffers: Map<socketId, RTCIceCandidateInit[]>

On 'ice-candidate' received from socketId:
  IF peerConnections[socketId].remoteDescription IS SET:
    addIceCandidate(candidate)
  ELSE:
    peerIceBuffers[socketId].push(candidate)

On setRemoteDescription() completes for socketId:
  WHILE peerIceBuffers[socketId].length > 0:
    addIceCandidate(peerIceBuffers[socketId].shift())
```

### 3. Screen Share Track Replacement

```
Algorithm: startScreenShare()
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
1. stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
2. screenTrack = stream.getVideoTracks()[0]
3. Store originalCameraTrack = localStream.getVideoTracks()[0]
4. FOR EACH pc IN peerConnections.values():
     sender = pc.getSenders().find(s => s.track?.kind === 'video')
     IF sender: await sender.replaceTrack(screenTrack)
5. Replace video track in localStream (for local preview)
6. setScreenSharing(true) in store
7. emit 'screen-share-started' to server
8. screenTrack.onended = stopScreenShare  // browser native stop button

Algorithm: stopScreenShare()
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
1. FOR EACH pc IN peerConnections.values():
     sender = pc.getSenders().find(s => s.track?.kind === 'video')
     IF sender: await sender.replaceTrack(originalCameraTrack)
2. Restore original camera track in localStream
3. Stop all screenShareStream tracks
4. setScreenSharing(false) in store
5. emit 'screen-share-stopped' to server
```

`RTCRtpSender.replaceTrack` does not require SDP renegotiation as long as the codec is compatible (both are video), making this seamless.

### 4. ICE Restart on Failure

```
Algorithm: oniceconnectionstatechange â†’ 'failed'
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
1. IF restartAttempted[peerId] IS false:
     restartAttempted[peerId] = true
     pc.restartIce()                    // triggers new ICE gathering
     pc.createOffer({ iceRestart: true })
       .then(offer => pc.setLocalDescription(offer))
       .then(() => emit 'offer' { sdp, targetSocketId: peerId })
2. ELSE:
     setConnectionState(peerId, 'failed')
     Display error indicator on Tile
```

### 5. Video Grid Layout Algorithm

```
Algorithm: getGridLayout(participantCount)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
1  participant  â†’ cols: 1, rows: 1  (centered, full-width)
2  participants â†’ cols: 2, rows: 1
3â€“4 participants â†’ cols: 2, rows: 2
5â€“6 participants â†’ cols: 3, rows: 2
7â€“8 participants â†’ cols: 4, rows: 2

CSS: grid-template-columns: repeat({cols}, 1fr)
     grid-template-rows: repeat({rows}, 1fr)

Screen share active:
  â†’ Sharer tile: col-span-full, large (70% height)
  â†’ Other tiles: horizontal strip below (overflow-x: auto)
```

### 6. Dominant Speaker Detection

```
Algorithm: dominantSpeakerDetection()
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Every 500ms:
  FOR EACH pc IN peerConnections:
    stats = await pc.getStats()
    audioLevel = stats.find(s => s.type === 'inbound-rtp' && s.kind === 'audio')?.audioLevel
    audioLevels[socketId] = audioLevel ?? 0

  dominantSpeaker = socketId with max(audioLevels) IF max > THRESHOLD (0.01)
  IF dominantSpeaker !== currentDominantSpeaker:
    setDominantSpeaker(dominantSpeaker)
```

### 7. Notification Auto-Dismiss

```
Algorithm: addNotification(message)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
1. id = uuid()
2. notifications.push({ id, message, createdAt: Date.now() })
3. setTimeout(() => removeNotification(id), 4000)
```

---

## Error Handling

| Scenario | Detection | Client Response | Server Response |
|---|---|---|---|
| Camera/mic denied | `getUserMedia` rejection | Show descriptive error; allow audio-only or video-only join | â€” |
| Meeting not found | Socket `meeting-not-found` or REST 404 | Navigate to `MeetingNotFound` page | Return 404 JSON |
| Room full (>8) | Socket `room-full` event | Show "Meeting is full" toast; stay on pre-join | Emit `room-full` to socket |
| ICE failure | `iceconnectionstate === 'failed'` | Attempt ICE restart; show error on tile if retry fails | â€” |
| DB connection failure | Mongoose `connect` error | â€” | Log error, `process.exit(1)` |
| JWT expired | 401 response from API | Redirect to login, clear token | Return 401 |
| Invalid JWT on socket | Socket middleware rejection | Socket disconnected; show auth error | Disconnect socket |
| Chat message too long | Client-side length check | Show character-limit error, prevent submit | Validate server-side, return 400 |
| `getDisplayMedia` rejected | Promise rejection | Silently cancel (no error shown per Req 7.7) | â€” |
| Screen share already active | `isScreenSharing` flag in store | Show notification "Screen sharing already active" | â€” |
| Host leaves | `disconnecting` event | Promote next participant; emit `host-changed` | Emit `host-changed` to room |
| Participant kicked | `you-were-removed` event | Stop media, close PCs, navigate to `RemovedScreen` | Emit `user-left` to room |
| Waiting room denied | `denied` event | Show "Your request to join was denied" message | â€” |

---

## Testing Strategy

### Dual Testing Approach

Both unit/example-based tests and property-based tests are used. Unit tests cover specific scenarios, integration points, and error conditions. Property-based tests verify universal correctness properties across a wide input space.

### Test Stack

| Layer | Tool | Notes |
|---|---|---|
| Unit + PBT (client) | Vitest + `fast-check` | Run with `vitest --run` for CI |
| Component tests | Vitest + React Testing Library | Render + interaction tests |
| Server unit tests | Jest + `fast-check` | Node.js environment |
| Integration tests | Jest + `mongodb-memory-server` | In-memory MongoDB for DB round-trips |
| E2E (optional) | Playwright | Multi-tab WebRTC simulation |

### Property-Based Test Configuration

- Minimum **100 iterations** per property test (fast-check default: 100)
- Each test tagged with: `// Feature: video-conferencing-app, Property N: <property text>`
- Properties target pure functions and data transformation logic; WebRTC/Socket.IO interactions use mocks

### Unit Test Focus Areas

- `getGridLayout(n)` â€” all participant counts 1â€“8
- `generateMeetingId()` â€” format validation
- Chat message validation (length, empty)
- JWT middleware â€” valid, expired, missing tokens
- `addNotification` / `removeNotification` â€” queue behavior
- `ParticipantRow` rendering â€” host badge, mute icon, hand icon
- `AvatarFallback` â€” initials extraction from display names

### Integration Test Focus Areas

- Chat message write â†’ read round-trip via `/api/meetings/:id/chat`
- Meeting creation â†’ GET metadata endpoint
- Auth register â†’ login â†’ protected endpoint access
- Socket.IO room join â†’ `user-joined` relay to existing participants

