# Live Conferencing — Comprehensive Test Suite

> **Goal:** Cover every module (server + client) with unit, integration, and property-based tests to ensure the software is bug-free.

---

## Table of Contents

1. [Server — Unit Tests](#server--unit-tests)
   - [1.1 Auth Routes](#11-auth-routes)
   - [1.2 Meeting Routes](#12-meeting-routes)
   - [1.3 JWT Middleware](#13-jwt-middleware)
   - [1.4 Utils — meetingId.js](#14-utils--meetingidjs)
   - [1.5 Utils — chatValidation.js](#15-utils--chatvalidationjs)
   - [1.6 Models — User, Meeting, ChatMessage](#16-models)
2. [Server — Socket Handler Tests](#server--socket-handler-tests)
   - [2.1 roomHandlers.js](#21-roomhandlersjs)
   - [2.2 signalingHandlers.js](#22-signalinghandlersjs)
   - [2.3 mediaHandlers.js](#23-mediahandlersjs)
   - [2.4 chatHandlers.js](#24-chathandlersjs)
   - [2.5 handHandlers.js](#25-handhandlersjs)
   - [2.6 adminHandlers.js](#26-adminhandlersjs)
   - [2.7 waitingRoomHandlers.js](#27-waitingroomhandlersjs)
   - [2.8 Socket index.js — Auth Middleware](#28-socket-indexjs)
3. [Server — Integration Tests](#server--integration-tests)
   - [3.1 Auth Flow (register → login → protected route)](#31-auth-flow)
   - [3.2 Meeting CRUD](#32-meeting-crud)
   - [3.3 Chat History API](#33-chat-history-api)
4. [Client — Store Tests](#client--store-tests)
   - [4.1 useAuthStore](#41-useauthstore)
   - [4.2 useMeetingStore](#42-usemeetingstore)
   - [4.3 useChatStore](#43-usechatstore)
   - [4.4 useUIStore](#44-useuistore)
5. [Client — Component Tests](#client--component-tests)
   - [5.1 VideoGrid — getGridLayout PBT](#51-videogrid)
   - [5.2 AvatarFallback — getInitials](#52-avatarfallback)
   - [5.3 Tile — rendering](#53-tile)
   - [5.4 VideoPlayer — stream attachment](#54-videoplayer)
   - [5.5 ControlBar — button rendering](#55-controlbar)
   - [5.6 ChatMessage — formatting](#56-chatmessage)
   - [5.7 ChatInput — validation](#57-chatinput)
   - [5.8 ChatPanel — history fetch](#58-chatpanel)
   - [5.9 ParticipantsPanel — sorting](#59-participantspanel)
   - [5.10 ParticipantRow — rendering](#510-participantrow)
   - [5.11 NotificationStack — auto-dismiss](#511-notificationstack)
   - [5.12 ConfirmDialog — accessibility](#512-confirmdialog)
   - [5.13 CopyLinkButton — clipboard](#513-copylinkbutton)
   - [5.14 SkeletonTile — rendering](#514-skeletontile)
   - [5.15 AdmissionPanel — host-only rendering](#515-admissionpanel)
   - [5.16 MeetingLayout — composition](#516-meetinglayout)
6. [Client — Hook Tests](#client--hook-tests)
   - [6.1 useWebRTC](#61-usewebrtc)
   - [6.2 useChat](#62-usechat)
   - [6.3 useScreenShare](#63-usescreenshare)
   - [6.4 useParticipants](#64-useparticipants)
   - [6.5 useNotifications](#65-usenotifications)
   - [6.6 useKeyboardShortcuts](#66-usekeyboardshortcuts)
7. [Client — Page Tests](#client--page-tests)
   - [7.1 Home — create/join/logout](#71-home)
   - [7.2 Login — form submission](#72-login)
   - [7.3 Register — registration flow](#73-register)
   - [7.4 PreJoinLobby — media preview](#74-prejoinlobby)
   - [7.5 MeetingRoom — hook integration](#75-meetingroom)
   - [7.6 WaitingRoom — admit/deny flow](#76-waitingroom)
   - [7.7 RemovedScreen — rendering](#77-removedscreen)
   - [7.8 MeetingNotFound — rendering](#78-meetingnotfound)
8. [Client — App Routing Tests](#8-app-routing)
9. [End-to-End Smoke Tests](#9-end-to-end-smoke-tests)

---

## Server — Unit Tests

### 1.1 Auth Routes

File: `server/routes/auth.js`

| # | Test | Input | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Register with valid data | `{ email: "a@b.com", password: "123456", displayName: "Alice" }` | `201` + `{ userId, email, displayName }` | HIGH |
| 2 | Register missing fields | `{ email: "a@b.com" }` | `400` + `code: "MISSING_FIELDS"` | HIGH |
| 3 | Register weak password | `{ email: "a@b.com", password: "12345", displayName: "Alice" }` | `400` + `code: "WEAK_PASSWORD"` | HIGH |
| 4 | Register empty displayName | `{ email: "a@b.com", password: "123456", displayName: "" }` | `400` + `code: "INVALID_DISPLAY_NAME"` | HIGH |
| 5 | Register displayName > 50 chars | `{ email: "a@b.com", password: "123456", displayName: "X".repeat(51) }` | `400` + `code: "INVALID_DISPLAY_NAME"` | HIGH |
| 6 | Register duplicate email | Register twice with same email | `409` + `code: "EMAIL_EXISTS"` | HIGH |
| 7 | Login valid credentials | `{ email: "a@b.com", password: "123456" }` | `200` + `{ token, userId, email, displayName }` | HIGH |
| 8 | Login missing fields | `{ email: "a@b.com" }` | `400` + `code: "MISSING_FIELDS"` | HIGH |
| 9 | Login wrong password | `{ email: "a@b.com", password: "wrong" }` | `401` + `code: "INVALID_CREDENTIALS"` | HIGH |
| 10 | Login non-existent email | `{ email: "no@no.com", password: "123456" }` | `401` + `code: "INVALID_CREDENTIALS"` | HIGH |
| 11 | Register trims email | `"  A@B.COM  "` → stored as `"a@b.com"` | `201` + email = `"a@b.com"` | MEDIUM |
| 12 | Password hashed (not stored in plaintext) | Check `user.passwordHash !== "123456"` | `!=` original | MEDIUM |

### 1.2 Meeting Routes

File: `server/routes/meetings.js`

| # | Test | Input | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Create meeting with valid JWT | `POST /api/meetings` with auth header | `201` + `{ meetingId, shareUrl, createdAt }` | HIGH |
| 2 | Create meeting without JWT | `POST /api/meetings` no header | `401` + `code: "NO_TOKEN"` | HIGH |
| 3 | Create meeting with waiting room enabled | `{ waitingRoomEnabled: true }` | `201` + meeting DB has `waitingRoomEnabled: true` | MEDIUM |
| 4 | Get existing meeting | `GET /api/meetings/:id` | `200` + `{ meetingId, participantCount, status, waitingRoomEnabled }` | HIGH |
| 5 | Get non-existent meeting | `GET /api/meetings/fake` | `404` + `code: "MEETING_NOT_FOUND"` | HIGH |
| 6 | Get ended meeting | Meeting with `endedAt` set | `200` + `status: "ended"` | MEDIUM |
| 7 | Get chat history with valid JWT | `GET /api/meetings/:id/chat` | `200` + `{ messages: [...] }` | HIGH |
| 8 | Get chat history without JWT | same but no auth header | `401` + `code: "NO_TOKEN"` | HIGH |
| 9 | Get chat history for non-existent meeting | `GET /api/meetings/fake/chat` | `404` + `code: "MEETING_NOT_FOUND"` | HIGH |
| 10 | Chat history returns messages ordered by timestamp | Create 3 messages out of order | `200` + sorted ascending | MEDIUM |

### 1.3 JWT Middleware

File: `server/middleware/auth.js`

| # | Test | Input | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Valid token passes | `Bearer <valid_jwt>` | `next()` called, `req.user` populated | HIGH |
| 2 | Missing auth header | No `Authorization` header | `401` + `code: "NO_TOKEN"` | HIGH |
| 3 | Malformed header (no Bearer) | `Token abc` | `401` + `code: "NO_TOKEN"` | HIGH |
| 4 | Expired token | `exp` in past | `401` + `code: "TOKEN_EXPIRED"` | HIGH |
| 5 | Tampered token | Valid token with extra char appended | `401` + `code: "INVALID_TOKEN"` | HIGH |
| 6 | Empty token | `Bearer ` | `401` | MEDIUM |

### 1.4 Utils — meetingId.js

File: `server/utils/meetingId.js`

| # | Test | Input | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Format matches pattern | — | `/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/` | HIGH |
| 2 | All 1000 generated IDs unique | 1000 calls | `new Set(ids).size === 1000` | HIGH |
| 3 | Characters are a-p only | — | each char in `[a-p]` | MEDIUM |
| 4 | PBT: arbitrary batches of 50 | fast-check | format always matches | MEDIUM |

### 1.5 Utils — chatValidation.js

File: `server/utils/chatValidation.js`

| # | Test | Input | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Empty string | `""` | `"Message cannot be empty"` | HIGH |
| 2 | Whitespace-only | `"   "` | `"Message cannot be empty"` | HIGH |
| 3 | > 1000 chars (PBT) | `fc.string({ minLength: 1001, maxLength: 5000 })` | `"Message exceeds 1000 character limit"` | HIGH |
| 4 | Valid 1–1000 chars (PBT) | `fc.string({ minLength: 1, maxLength: 1000 })` filtered non-empty | `null` | HIGH |
| 5 | Exactly 1000 chars | `"x".repeat(1000)` | `null` | MEDIUM |
| 6 | Exactly 1001 chars | `"x".repeat(1001)` | Error message | MEDIUM |
| 7 | Non-string input | `123`, `null`, `undefined`, `{}` | Error (typeof check) | MEDIUM |

### 1.6 Models

| # | Test | Module | Expected | Priority |
|---|------|--------|----------|----------|
| 1 | User created with required fields | `User` | `email`, `passwordHash`, `displayName` set, `_id` auto-generated | HIGH |
| 2 | User email unique constraint | `User` | Duplicate email throws `E11000` | HIGH |
| 3 | Meeting created with required fields | `Meeting` | `meetingId`, `hostSocketId`, defaults for other fields | HIGH |
| 4 | Meeting `meetingId` unique constraint | `Meeting` | Duplicate meetingId throws error | HIGH |
| 5 | ChatMessage created with required fields | `ChatMessage` | `meetingId`, `senderName`, `text`, `timestamp` | HIGH |
| 6 | ChatMessage text maxlength 1000 (Mongoose) | `ChatMessage` | > 1000 chars → validation error | HIGH |
| 7 | ChatMessage senderName trim + maxlength 50 | `ChatMessage` | `"  Alice  "` → `"Alice"`, > 50 → error | MEDIUM |
| 8 | Meeting `participantCount` default 0 | `Meeting` | Default `0` | MEDIUM |
| 9 | Meeting `endedAt` default null | `Meeting` | Default `null` | MEDIUM |

---

## Server — Socket Handler Tests

Use `jest.fn()` with `mockImplementation` for socket/io mocks. Test each handler in isolation.

### 2.1 roomHandlers.js

File: `server/socket/roomHandlers.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | join-room: missing params | `emit("join-room", {})` | `socket.emit("error-msg", ...)` | HIGH |
| 2 | join-room: meeting not in DB | `Meeting.findOne` returns null | `socket.emit("meeting-not-found")` | HIGH |
| 3 | join-room: room full (≥8) | Room has 8 participants | `socket.emit("room-full")` | HIGH |
| 4 | join-room: first joiner is host | Empty room, `hostSocketId: "pending"` | `isHost: true`, `hostSocketId` updated in DB | HIGH |
| 5 | join-room: normal join | Room has participants | `socket.join`, `room-joined` + `user-joined` emitted | HIGH |
| 6 | join-room: waiting room + no host | `waitingRoomEnabled: true`, no host in room | Participant joins normally (fallback) | MEDIUM |
| 7 | join-room: waiting room + host present | `waitingRoomEnabled: true`, host exists | `participant-waiting` to host, no `socket.join` | MEDIUM |
| 8 | leave-room: graceful leave | `emit("leave-room", { meetingId })` | `user-left` emitted, socket leaves room | HIGH |
| 9 | disconnecting: abrupt leave | Socket disconnects | Same as leave-room, `handleLeave` called | HIGH |
| 10 | Last participant leaves → meeting ended | Room becomes empty | `endedAt` set, `rooms.delete(meetingId)` | HIGH |
| 11 | Host leaves → host transferred | `leavingParticipant.isHost === true` | Next participant gets `isHost: true`, `host-changed` emitted | HIGH |
| 12 | Non-last leave updates participantCount | Room had 3, one leaves | `participantCount: 2` in DB | MEDIUM |

### 2.2 signalingHandlers.js

File: `server/socket/signalingHandlers.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | offer emitted to target | `{ sdp, targetSocketId }` | `io.to(targetSocketId).emit("offer", ...)` | HIGH |
| 2 | offer missing fields | `{ sdp: null, targetSocketId }` | No emit (early return) | HIGH |
| 3 | answer emitted to target | `{ sdp, targetSocketId }` | `io.to(targetSocketId).emit("answer", ...)` | HIGH |
| 4 | answer missing fields | `{ targetSocketId }` | No emit | HIGH |
| 5 | ice-candidate emitted to target | `{ candidate, targetSocketId }` | `io.to(targetSocketId).emit("ice-candidate", ...)` | HIGH |
| 6 | ice-candidate missing fields | `{ candidate: null, targetSocketId }` | No emit | HIGH |

### 2.3 mediaHandlers.js

File: `server/socket/mediaHandlers.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | participant-media-state updates room state | `{ meetingId, isMuted: true, isCameraOff: false }` | Room metadata updated, relayed to others | HIGH |
| 2 | participant-media-state missing meetingId | `{ isMuted: true }` | No-op (early return) | HIGH |
| 3 | screen-share-started: no conflict | No one else is sharing | `isScreenSharing` set, relayed | HIGH |
| 4 | screen-share-started: conflict | Another participant already sharing | `error-msg` to requester | HIGH |
| 5 | screen-share-started: self already sharing | Same socket tries again | Conflict blocked (they are sharing) | MEDIUM |
| 6 | screen-share-stopped: clears state | Existing sharer stops | `isScreenSharing` cleared, relayed | HIGH |
| 7 | screen-share-stopped: not sharing | Socket not in room or not sharing | No-op (graceful) | MEDIUM |

### 2.4 chatHandlers.js

File: `server/socket/chatHandlers.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | chat-message persisted and relayed | `{ meetingId, senderName, text, timestamp }` | `ChatMessage.create(...)`, `io.to(meetingId).emit("chat-message", ...)` | HIGH |
| 2 | chat-message missing fields | `{ meetingId }` | No-op (early return) | HIGH |
| 3 | chat-message exceeds 1000 chars | `text: "x".repeat(1001)` | `error-msg` emitted, not persisted | HIGH |
| 4 | chat-message with empty text | `text: ""` | `error-msg` emitted | HIGH |
| 5 | chat-message trims text | `text: "  hello  "` | Persisted as `"hello"` | MEDIUM |
| 6 | chat-message trims senderName | `senderName: "  Bob  "` | Persisted as `"Bob"` | MEDIUM |
| 7 | chat-message timestamp defaults to now | No timestamp in payload | `new Date()` used | MEDIUM |

### 2.5 handHandlers.js

File: `server/socket/handHandlers.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | raise-hand updates room + relays | `{ meetingId, displayName }` | `isHandRaised: true` in room, `raise-hand` emitted | HIGH |
| 2 | raise-hand missing meetingId | `{ displayName }` | No-op | HIGH |
| 3 | lower-hand updates room + relays | `{ meetingId }` | `isHandRaised: false` in room, `lower-hand` emitted | HIGH |
| 4 | lower-hand missing meetingId | `{ }` | No-op | HIGH |
| 5 | raise-hand fallback displayName | No displayName in payload | Uses `socket.data.displayName` or `"Someone"` | MEDIUM |

### 2.6 adminHandlers.js

File: `server/socket/adminHandlers.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | kick-participant: host kicks participant | Host calls with `targetSocketId` | `you-were-removed` to target, `user-left` to room | HIGH |
| 2 | kick-participant: non-host tries | Non-host socket calls | `error-msg` "Only the host can remove participants" | HIGH |
| 3 | kick-participant: host tries to kick self | `targetSocketId === socket.id` | No-op (early return) | HIGH |
| 4 | kick-participant: non-existent target | Socket not in room | No-op | MEDIUM |
| 5 | kick-participant: missing fields | `{ meetingId }` | No-op | MEDIUM |
| 6 | kick-participant: room doesn't exist | `rooms.get(meetingId)` undefined | No-op | MEDIUM |

### 2.7 waitingRoomHandlers.js

File: `server/socket/waitingRoomHandlers.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | admit-participant: host admits | Host calls with `targetSocketId` | `admitted` to target | HIGH |
| 2 | admit-participant: non-host tries | Non-host calls | `error-msg` "Only the host can admit participants" | HIGH |
| 3 | admit-participant: missing fields | `{ meetingId }` | No-op | MEDIUM |
| 4 | deny-participant: host denies | Host calls with `targetSocketId` | `denied` to target | HIGH |
| 5 | deny-participant: non-host tries | Non-host calls | `error-msg` "Only the host can deny participants" | HIGH |
| 6 | deny-participant: missing fields | `{ }` | No-op | MEDIUM |

### 2.8 Socket index.js

File: `server/socket/index.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Valid JWT token on handshake | `socket.handshake.auth.token = valid_jwt` | `socket.data.user` populated | HIGH |
| 2 | Invalid JWT on handshake | `socket.handshake.auth.token = "bad"` | `socket.data.user = null`, connection allowed | HIGH |
| 3 | No token on handshake | No auth token | `socket.data.user = null`, connection allowed | HIGH |
| 4 | All handlers registered on connection | Socket connects | 7 handler modules registered | MEDIUM |
| 5 | disconnect logs | Socket disconnects | `console.log` called | LOW |

---

## Server — Integration Tests

### 3.1 Auth Flow

File: `server/routes/__tests__/auth.integration.test.js` (already exists — extend)

| # | Test | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Full happy path | Register → Login → Access `/api/meetings` | `201` → `200` with token → `201` | HIGH |
| 2 | Login after register returns 24h token | Register then login | JWT `exp` claim within 24h | MEDIUM |
| 3 | Register duplicate email | Register twice | `409` on second | HIGH |
| 4 | Access protected route without token | `POST /api/meetings` no header | `401` | HIGH |
| 5 | Access protected route with expired token | Create token with `-1h` expiry | `401` + `TOKEN_EXPIRED` | HIGH |
| 6 | Wrong password on login | Register, then login with wrong password | `401` | HIGH |

### 3.2 Meeting CRUD

File: `server/routes/__tests__/meetings.integration.test.js` (NEW)

| # | Test | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Create + Get meeting | Create meeting, then GET it | `201` with meetingId, `200` with same meetingId | HIGH |
| 2 | Create meeting with waiting room | `waitingRoomEnabled: true` | Field persisted in DB | MEDIUM |
| 3 | Get non-existent meeting | `GET /api/meetings/fake` | `404` | HIGH |
| 4 | Get ended meeting status | Set `endedAt` in DB, GET | `status: "ended"` | MEDIUM |

### 3.3 Chat History API

File: `server/routes/__tests__/chat.integration.test.js` (exists — extend)

| # | Test | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Messages sorted by timestamp ascending | Insert 3 messages with different timestamps | Response order matches | HIGH |
| 2 | Empty meeting returns `[]` | No messages for meeting | `messages: []` | HIGH |
| 3 | Messages not leaked between meetings | Messages from meeting A not in meeting B | Correct isolation | HIGH |
| 4 | Chat history requires auth | No token | `401` | HIGH |

---

## Client — Store Tests

### 4.1 useAuthStore

File: `client/src/store/useAuthStore.js`

| # | Test | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Initial state | — | `{ token: null, userId: null, email: null, displayName: null }` | HIGH |
| 2 | setAuth sets all fields | `setAuth("tok", "1", "a@b", "Alice")` | All 4 fields set | HIGH |
| 3 | clearAuth resets all fields | Set then clear | All fields `null` | HIGH |
| 4 | isAuthenticated returns false when no token | `get().isAuthenticated()` | `false` | HIGH |
| 5 | isAuthenticated returns true when token exists | After setAuth | `true` | HIGH |

### 4.2 useMeetingStore

File: `client/src/store/useMeetingStore.js`

| # | Test | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Initial state matches schema | — | All keys have expected default values | HIGH |
| 2 | setMeetingId | `setMeetingId("abc")` | `meetingId === "abc"` | HIGH |
| 3 | setLocalStream | `setLocalStream(mockStream)` | `localStream === mockStream` | HIGH |
| 4 | upsertParticipant adds new | `upsertParticipant("s1", { displayName: "Alice" })` | `participants.s1.displayName === "Alice"` | HIGH |
| 5 | upsertParticipant merges existing | `upsertParticipant("s1", { isMuted: true })` | `displayName` preserved, `isMuted` added | HIGH |
| 6 | removeParticipant | Add then remove | `participants` no longer has key | HIGH |
| 7 | setParticipants from array | `setParticipants([{socketId:"s1",...}])` | `participants.s1` exists | HIGH |
| 8 | toggleMic flips + updates track | `isMicOn: true` → toggle → `isMicOn: false` | Track `.enabled` flipped | HIGH |
| 9 | toggleCam flips + updates track | `isCamOn: true` → toggle → `isCamOn: false` | Track `.enabled` flipped | HIGH |
| 10 | toggleHand flips | `isHandRaised: false` → toggle → `isHandRaised: true` | Flipped | MEDIUM |
| 11 | toggleBlur flips | `isBlurred: false` → toggle → `isBlurred: true` | Flipped | MEDIUM |
| 12 | reset restores initial state | Set many fields then reset | All fields back to defaults | HIGH |
| 13 | setRemoteStream adds stream | `setRemoteStream("s1", stream)` | `remoteStreams.s1 === stream` | HIGH |
| 14 | removeRemoteStream deletes | Add then remove | Key gone | HIGH |
| 15 | setScreenSharing | `setScreenSharing(true)` | `isScreenSharing === true` | MEDIUM |
| 16 | setActiveScreenShare / setDominantSpeaker | Set values | State updated | MEDIUM |

### 4.3 useChatStore

File: `client/src/store/useChatStore.js`

| # | Test | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Initial state | — | `{ messages: [], unreadCount: 0, isChatOpen: false }` | HIGH |
| 2 | addMessage appends + increments unread when closed | Chat closed + addMessage | `messages.length === 1`, `unreadCount === 1` | HIGH |
| 3 | addMessage does not increment unread when open | Chat open + addMessage | `messages.length === 1`, `unreadCount === 0` | HIGH |
| 4 | setMessages replaces all | Add 2, setMessages([msg3]) | `messages.length === 1` | HIGH |
| 5 | clearUnread | `unreadCount > 0` → clearUnread | `unreadCount === 0` | HIGH |
| 6 | toggleChat flips + clears unread on open | `isChatOpen: false, unreadCount: 3` → toggle | `isChatOpen: true, unreadCount: 0` | HIGH |
| 7 | reset restores initial state | Add messages + open chat → reset | Back to defaults | HIGH |

### 4.4 useUIStore

File: `client/src/store/useUIStore.js`

| # | Test | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Initial state | — | `{ isParticipantsOpen: false, isConfirmLeaveOpen: false, notifications: [] }` | HIGH |
| 2 | toggleParticipants flips | `false` → toggle → `true` | Flipped | HIGH |
| 3 | showConfirmLeave / hideConfirmLeave | Set true then false | State matches | HIGH |
| 4 | addNotification adds + auto-removes after 4s | Add notification → advance 4s | Appears, then removed | HIGH |
| 5 | addNotification returns id | `addNotification("hi")` | Returns string id | MEDIUM |
| 6 | removeNotification removes by id | Add 2, remove first | Only second remains | HIGH |
| 7 | reset restores all defaults | Toggle everything → reset | Defaults restored | HIGH |

---

## Client — Component Tests

### 5.1 VideoGrid

| # | Test | Input | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | `getGridLayout(1)` | 1 participant | `{ cols: 1, rows: 1 }` | HIGH |
| 2 | `getGridLayout(2)` | 2 | `{ cols: 2, rows: 1 }` | HIGH |
| 3 | `getGridLayout(3-4)` | 3 or 4 | `{ cols: 2, rows: 2 }` | HIGH |
| 4 | `getGridLayout(5-6)` | 5 or 6 | `{ cols: 3, rows: 2 }` | HIGH |
| 5 | `getGridLayout(7-8)` | 7 or 8 | `{ cols: 4, rows: 2 }` | HIGH |
| 6 | PBT: all n in [1,8] | fast-check | `cols*rows >= n`, layout valid | MEDIUM |
| 7 | Screen share layout: presenter large + sidebar | activeScreenShareSocketId set | Flex layout with large tile + strip | MEDIUM |
| 8 | Shows local tile when socketId not in participants | `localSocketId` not in `participants` map | Extra `<Tile>` rendered | MEDIUM |

### 5.2 AvatarFallback

| # | Test | Input | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | `getInitials("Alice")` | Single name | `"A"` | HIGH |
| 2 | `getInitials("John Doe")` | Two names | `"JD"` | HIGH |
| 3 | `getInitials("  spaced  name  ")` | Extra spaces | `"SN"` | HIGH |
| 4 | `getInitials("Mary Jane Watson")` | Multi-word | `"MW"` | HIGH |
| 5 | `getInitials("")` / `"   "` | Empty / whitespace | `"?"` | HIGH |
| 6 | `hashName("Alice")` returns stable value | Same input | Same output | MEDIUM |
| 7 | `hashName` returns index in [0, 8) | Any string | `0 <= idx < 8` | MEDIUM |

### 5.3 Tile

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Shows VideoPlayer when stream + camera on | `stream` truthy, `isCameraOff: false` | `<video>` rendered | HIGH |
| 2 | Shows AvatarFallback when camera off | `isCameraOff: true` | Avatar rendered, no video | HIGH |
| 3 | Shows SkeletonTile when loading | `isLoading: true` | Skeleton rendered | HIGH |
| 4 | Shows "Sharing" badge when screen sharing | `isScreenSharing: true` | MonitorUp icon badge | HIGH |
| 5 | Shows "Remove" button when onKick provided | `onKick` is a function | Button present | MEDIUM |
| 6 | Does not show "Remove" button without onKick | `onKick` undefined | No button | MEDIUM |
| 7 | Shows hand overlay when hand raised | `isHandRaised: true` | Hand icon over tile | MEDIUM |
| 8 | Dominant speaker border | `isDominantSpeaker: true` | `border-blue-500` class | MEDIUM |
| 9 | `(You)` suffix for local tile | `isLocal: true` | `displayName + " (You)"` | MEDIUM |

### 5.4 VideoPlayer

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Sets `srcObject` when stream provided | Stream passed | `videoRef.current.srcObject === stream` | HIGH |
| 2 | Updates `srcObject` when stream changes | New stream passed | `srcObject` updated | HIGH |
| 3 | `muted` prop forwarded | `muted={true}` | `<video muted>` attribute | HIGH |
| 4 | `className` forwarded | `className="custom"` | Class applied | LOW |

### 5.5 ControlBar

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders all buttons | Default props | Mic, Camera, ScreenShare, Hand, Blur, Chat, Participants, Leave | HIGH |
| 2 | Mic button shows MicOff when muted | `isMicOn: false` | `<MicOff />` rendered | HIGH |
| 3 | Cam button shows VideoOff when off | `isCamOn: false` | `<VideoOff />` rendered | HIGH |
| 4 | Leave button has red danger style | Default | `bg-red-600` class | MEDIUM |
| 5 | Badge count shown for chat | `unreadChatCount: 5` | Badge with "5" | HIGH |
| 6 | Badge count shown for participants | `participantCount: 3` | Badge with "3" | HIGH |
| 7 | Badge capped at "99+" | `unreadChatCount: 150` | Badge shows "99+" | MEDIUM |
| 8 | Button onClick handlers fire correctly | Click each button | Corresponding handler called | HIGH |

### 5.6 ChatMessage

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Shows sender name and text | `{ senderName: "Alice", text: "Hi", timestamp }` | Both rendered | HIGH |
| 2 | Own message aligned right | `isOwn: true` | `items-end` class | HIGH |
| 3 | Other's message aligned left | `isOwn: false` | `items-start` class | HIGH |
| 4 | "You" for own messages | `isOwn: true` | Text shows "You" | HIGH |
| 5 | Timestamp formatted | ISO timestamp | `toLocaleTimeString` output | MEDIUM |

### 5.7 ChatInput

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Send button disabled when empty | No text | Button `disabled` | HIGH |
| 2 | Send button disabled when over limit | `text.length > 1000` | Button `disabled` + error shown | HIGH |
| 3 | Enter key sends message | Text present, Enter pressed | `onSend` called with trimmed text | HIGH |
| 4 | Shift+Enter does not send | Shift+Enter pressed | `onSend` not called | MEDIUM |
| 5 | Character count shown near limit | `text.length > 800` | "X remaining" shown | MEDIUM |
| 6 | Textarea clears after send | Send message | `text === ""` | HIGH |
| 7 | Disabled when `disabled` prop true | `disabled={true}` | Send button + textarea disabled | HIGH |

### 5.8 ChatPanel

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Fetches chat history on open | `isOpen` becomes true | `fetch` called to `/api/meetings/:id/chat` | HIGH |
| 2 | Does not fetch if already open | Already open | Only one fetch | MEDIUM |
| 3 | Auto-scrolls to bottom on new messages | New message added while open | `scrollIntoView` called | MEDIUM |
| 4 | Empty state when no messages | `messages: []` | Empty state message rendered | HIGH |
| 5 | Clears unread on open | Unread count > 0 → open | `clearUnread()` called | HIGH |

### 5.9 ParticipantsPanel

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Sorts host first, then alphabetical | Mixed participants | Host first, then alphabetical | HIGH |
| 2 | Shows participant count | 3 participants | "Participants (3)" | HIGH |
| 3 | Empty state when no participants | `participants: {}` | Empty state rendered | HIGH |
| 4 | Slides in/out with translate-x | `isOpen: true/false` | `translate-x-0` / `translate-x-full` | HIGH |

### 5.10 ParticipantRow

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Shows avatar initial | `displayName: "Alice"` | `"A"` rendered | HIGH |
| 2 | Shows "(You)" for current user | `isCurrentUser: true` | "(You)" appended | HIGH |
| 3 | Shows Crown for host | `isHost: true` | Crown icon | MEDIUM |
| 4 | Shows Hand when raised | `isHandRaised: true` | Hand icon | MEDIUM |
| 5 | Shows Kick button only for host viewer | `isViewerHost: true, !isCurrentUser` | UserX icon button | HIGH |
| 6 | Hides Kick button for self | `isCurrentUser: true` | No Kick button | HIGH |
| 7 | Hides Kick button for non-host viewer | `isViewerHost: false` | No Kick button | HIGH |

### 5.11 NotificationStack

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders nothing when empty | `notifications: []` | Returns `null` | HIGH |
| 2 | Renders notifications from store | Add 2 notifications | Both rendered | HIGH |
| 3 | Auto-dismiss after 4s | `addNotification("hi")` → advance 4s | Removed from DOM | HIGH |
| 4 | Dismiss button works | Click dismiss × | Notification removed | HIGH |

### 5.12 ConfirmDialog

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders nothing when `isOpen: false` | `isOpen: false` | Returns `null` | HIGH |
| 2 | Shows when `isOpen: true` | `isOpen: true` | Dialog visible | HIGH |
| 3 | "Leave" calls onConfirm | Click Leave button | `onConfirm` called | HIGH |
| 4 | "Stay" calls onCancel | Click Stay button | `onCancel` called | HIGH |
| 5 | Backdrop click calls onCancel | Click backdrop | `onCancel` called | MEDIUM |
| 6 | Escape key calls onCancel | Press Escape | `onCancel` called | MEDIUM |
| 7 | Focuses confirm button on open | Opens | `confirmBtnRef.current` focused | MEDIUM |
| 8 | Has correct `role="dialog"` + `aria-modal` | `isOpen: true` | `role="dialog" aria-modal="true"` | MEDIUM |

### 5.13 CopyLinkButton

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Calls `navigator.clipboard.writeText` | Click button | `writeText` called with `url` prop | HIGH |
| 2 | Shows "Copied!" after click | Click | Text changes to "Copied!" for 2s | HIGH |
| 3 | Fallback for missing clipboard API | `writeText` throws | Uses textarea + `execCommand('copy')` | MEDIUM |

### 5.14 SkeletonTile

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders shimmer animation | Default | Animated gradient present | LOW |
| 2 | Renders avatar + label placeholders | Default | Circle + bar skeleton elements | LOW |

### 5.15 AdmissionPanel

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders nothing when not host | `isHost: false` | Returns `null` | HIGH |
| 2 | Renders nothing when no waiting participants | `isHost: true`, no `isWaiting` participants | Returns `null` | HIGH |
| 3 | Shows waiting participants with admit/deny buttons | `isHost: true`, 2 waiting | Both shown with buttons | HIGH |
| 4 | Admit button emits `admit-participant` | Click admit | `socket.emit("admit-participant", ...)` + `upsertParticipant({ isWaiting: false })` | HIGH |
| 5 | Deny button emits `deny-participant` | Click deny | `socket.emit("deny-participant", ...)` + `removeParticipant` | HIGH |

### 5.16 MeetingLayout

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders VideoGrid + ControlBar + NotificationStack | Default | All 3 present | HIGH |
| 2 | Media error banner shown when error present | `mediaError: "Some error"` | Red banner visible | HIGH |
| 3 | ChatPanel slides in when chat open | `isChatOpen: true` | `translate-x-0` | HIGH |
| 4 | ParticipantsPanel slides in when participants open and chat closed | `isParticipantsOpen: true, isChatOpen: false` | Panel visible | MEDIUM |
| 5 | ConfirmDialog shown when `isConfirmLeaveOpen` | `showConfirmLeave()` | Dialog rendered | HIGH |

---

## Client — Hook Tests

### 6.1 useWebRTC

File: `client/src/hooks/useWebRTC.js`

Since `useWebRTC` heavily depends on browser APIs (`RTCPeerConnection`, `MediaDevices`, `Socket.IO`), use Vitest with jsdom + mocks.

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Creates socket connection on mount | `meetingId` and `displayName` set | `io` called with SERVER_URL | HIGH |
| 2 | Socket auth token from store | Render with token | `auth: { token }` passed to `io` | HIGH |
| 3 | `connect` handler: sets socketId, joins room | Socket connects | `setLocalSocketId`, `emit("join-room", ...)` | HIGH |
| 4 | `room-joined`: sets host, participants, creates offers | Receives from server | `setHost`, `upsertParticipant`, `createOffer` per existing | HIGH |
| 5 | `user-joined`: adds participant, creates no offer (they will) | Another joins | `upsertParticipant`, `setConnectionState("connecting")` | HIGH |
| 6 | `offer`: creates PC, sets remote desc, answers | Receives offer | `createPeerConnection`, `setRemoteDescription`, `createAnswer` | HIGH |
| 7 | `answer`: sets remote desc | Receives answer | `setRemoteDescription` | HIGH |
| 8 | `ice-candidate`: adds to PC or buffers | With/without remote desc | `addIceCandidate` or buffered | HIGH |
| 9 | `user-left`: closes PC, cleans up | Receives user-left | `pc.close()`, `removeRemoteStream`, `removeParticipant` | HIGH |
| 10 | `host-changed`: updates local + participants | Receives host-changed | `setHost`, `upsertParticipant` for all | MEDIUM |
| 11 | `you-were-removed`: redirects to /removed | Kicked | `window.location.href = "/removed"` | HIGH |
| 12 | Cleanup on unmount: closes all PCs, stops local tracks | Component unmounts | All peer connections closed, tracks stopped | HIGH |
| 13 | `replaceVideoTrack` replaces on all PCs | New track | `sender.replaceTrack(newTrack)` for each PC | MEDIUM |
| 14 | Dominant speaker detection interval | Audio level stats | `setDominantSpeaker` called based on max audio level | MEDIUM |
| 15 | ICE restart on connection failure | ICE fails once | `restartIce()` + new offer sent | MEDIUM |
| 16 | `room-full` error | Receives room-full | `setMediaError("This meeting is full...")` | HIGH |
| 17 | `meeting-not-found` redirect | Receives | `window.location.href = "/meeting-not-found"` | HIGH |
| 18 | `error-msg` handler | Receives error | `setMediaError(message)` | MEDIUM |

### 6.2 useChat

File: `client/src/hooks/useChat.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Subscribes to `chat-message` on socket | `socket` provided | `socket.on("chat-message", ...)` | HIGH |
| 2 | `addMessage` called on incoming chat | fake socket event | `useChatStore.getState().addMessage` called | HIGH |
| 3 | Unsubscribes on cleanup | Hook unmounts | `socket.off("chat-message", ...)` | HIGH |
| 4 | `sendMessage` emits `chat-message` | Called with text | `socket.emit("chat-message", ...)` | HIGH |
| 5 | `sendMessage` no-op without socket | `socket` null | No emit | HIGH |
| 6 | `sendMessage` no-op with empty text | `text.trim() === ""` | No emit | HIGH |
| 7 | `sendMessage` no-op with > 1000 chars | `"x".repeat(1001)` | No emit | HIGH |

### 6.3 useScreenShare

File: `client/src/hooks/useScreenShare.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | `startScreenShare` calls `getDisplayMedia` | Called | `navigator.mediaDevices.getDisplayMedia` called | HIGH |
| 2 | `startScreenShare` replaces video track | screen track obtained | `replaceVideoTrack(screenTrack)` called | HIGH |
| 3 | `startScreenShare` emits `screen-share-started` | Success | `socket.emit("screen-share-started", ...)` | HIGH |
| 4 | `startScreenShare` sets store state | Success | `setScreenSharing(true)`, `setActiveScreenShare(localSocketId)` | HIGH |
| 5 | `startScreenShare` blocked if someone else sharing | `activeScreenShareSocketId` set | `setMediaError("...already active")`, returns early | HIGH |
| 6 | `startScreenShare` handles user cancellation | `NotAllowedError` from `getDisplayMedia` | Silently ignored | HIGH |
| 7 | `stopScreenShare` restores original camera track | Called | `replaceVideoTrack(originalCameraTrackRef.current)` | HIGH |
| 8 | `stopScreenShare` emits `screen-share-stopped` | Called | `socket.emit("screen-share-stopped", ...)` | HIGH |
| 9 | `stopScreenShare` updates store | Called | `setScreenSharing(false)`, `setActiveScreenShare(null)` | HIGH |
| 10 | `screenTrack.onended` triggers stop | Browser "Stop sharing" | `stopScreenShare()` called | MEDIUM |

### 6.4 useParticipants

File: `client/src/hooks/useParticipants.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Subscribes to all 6 participant events | Socket provided | 6 `socket.on(...)` calls | HIGH |
| 2 | participant-media-state updates store | Event received | `upsertParticipant(socketId, { isMuted, isCameraOff })` | HIGH |
| 3 | raise-hand updates store | Event received | `upsertParticipant(socketId, { isHandRaised: true })` | MEDIUM |
| 4 | lower-hand updates store | Event received | `upsertParticipant(socketId, { isHandRaised: false })` | MEDIUM |
| 5 | screen-share-started updates store + activeScreenShare | Event received | `upsertParticipant + setActiveScreenShare` | MEDIUM |
| 6 | screen-share-stopped clears | Event received | `upsertParticipant + setActiveScreenShare(null)` | MEDIUM |
| 7 | host-changed updates all participants | Event received | `upsertParticipant` for each + `setHost` | MEDIUM |
| 8 | Unsubscribes all on cleanup | Hook unmounts | 6 `socket.off(...)` calls | HIGH |

### 6.5 useNotifications

File: `client/src/hooks/useNotifications.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Subscribes to user-joined, user-left, raise-hand | Socket provided | 3 `socket.on(...)` calls | HIGH |
| 2 | user-joined triggers notification | `{ displayName: "Alice" }` | `addNotification("Alice joined the meeting")` | HIGH |
| 3 | user-left triggers notification | `{ displayName: "Bob" }` | `addNotification("Bob left the meeting")` | HIGH |
| 4 | raise-hand triggers notification | `{ displayName: "Charlie" }` | `addNotification("✋ Charlie raised their hand")` | HIGH |
| 5 | No notification if displayName missing | `{ }` | `addNotification` not called | MEDIUM |
| 6 | Unsubscribes all on cleanup | Hook unmounts | 3 `socket.off(...)` calls | HIGH |

### 6.6 useKeyboardShortcuts

File: `client/src/hooks/useKeyboardShortcuts.js`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Pressing 'M' toggles mic + emits | Keydown `m` | `toggleMic()` + `emit("participant-media-state", ...)` | HIGH |
| 2 | Pressing 'V' toggles cam + emits | Keydown `v` | `toggleCam()` + emit | HIGH |
| 3 | Pressing 'H' toggles hand + emits raise/lower | Keydown `h` | `toggleHand()` + emit appropriate event | HIGH |
| 4 | Pressing Escape shows leave confirm | Keydown `Escape` | `showConfirmLeave()` | HIGH |
| 5 | Shortcuts ignored when focused on input | Focused on `<input>` | No action | HIGH |
| 6 | Shortcuts ignored when focused on textarea | Focused on `<textarea>` | No action | HIGH |
| 7 | Listener registered on mount, removed on unmount | Hook lifecycle | `addEventListener` / `removeEventListener` | HIGH |

---

## Client — Page Tests

### 7.1 Home

File: `client/src/pages/Home.jsx`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders CTA when unauthenticated | `token: null` | "Get started" link visible, no share URL | HIGH |
| 2 | Renders user info when authenticated | `token: "abc"`, `displayName: "Alice"` | Name shown, "Sign out" button, "New meeting" enabled | HIGH |
| 3 | "New meeting" navigates to login when unauthenticated | No token, click | `navigate("/login")` | HIGH |
| 4 | "New meeting" calls API when authenticated | Token present, click | `fetch` to `/api/meetings` | HIGH |
| 5 | Create meeting error displayed | API returns error | Error message rendered | HIGH |
| 6 | Join with code navigates to lobby | Valid meetingId | `navigate("/meeting/:meetingId")` | HIGH |
| 7 | Join with full URL extracts meetingId | Input = `http://.../meeting/abc-defg-hij` | Extracted `abc-defg-hij` | MEDIUM |
| 8 | "Sign out" clears auth | Click | `clearAuth()` called | HIGH |
| 9 | Waiting room checkbox state | Checked → create | `body.waitingRoomEnabled === true` | MEDIUM |
| 10 | Copy link button renders after creation | `shareUrl` set | Copy button with URL | MEDIUM |

### 7.2 Login

File: `client/src/pages/Login.jsx`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Submit calls POST /api/auth/login | Valid email/password | `fetch` called with correct body | HIGH |
| 2 | Successful login calls setAuth + navigates | API returns token | `setAuth(data)`, `navigate(redirectUrl)` | HIGH |
| 3 | Error message displayed on failure | API returns 401 | Error message shown | HIGH |
| 4 | Network error handled | fetch throws | "Network error" shown | HIGH |
| 5 | Redirect parameter preserved | `?redirect=/meeting/abc/room` | `navigate("/meeting/abc/room")` | MEDIUM |
| 6 | Loading state shows spinner | Submitting | `Loader2` + disabled button | MEDIUM |

### 7.3 Register

File: `client/src/pages/Register.jsx`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Submit: calls register then login | Valid data | Two fetch calls (register + login) | HIGH |
| 2 | Successful flow calls setAuth + navigates home | Both APIs succeed | `setAuth`, `navigate("/")` | HIGH |
| 3 | Registration error shown | API returns 400 | Error message rendered | HIGH |
| 4 | Register succeeds but login fails → redirect to /login | Login fails after register | `navigate("/login")` | HIGH |
| 5 | minLength/maxLength on displayName input | HTML validation | min=1, max=50 on input | MEDIUM |
| 6 | minLength=6 on password input | HTML validation | min=6 on password input | MEDIUM |

### 7.4 PreJoinLobby

File: `client/src/pages/PreJoinLobby.jsx`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Validates meeting exists on mount | `fetch /api/meetings/:id` | Loading → valid redirect to room | HIGH |
| 2 | Meeting 404 → redirect to /meeting-not-found | API 404 | `navigate("/meeting-not-found")` | HIGH |
| 3 | Requests camera/mic on mount | Component renders | `getUserMedia` called | HIGH |
| 4 | Media error shown when denied | `NotAllowedError` | Warning message rendered | HIGH |
| 5 | Audio-only fallback when video fails | Video denied → audio allowed | Audio stream, cam off | HIGH |
| 6 | Both denied when all media fails | All media fails | Both mic and cam off | HIGH |
| 7 | Name validation: empty → disabled | Empty name | Button disabled | HIGH |
| 8 | Name validation: > 50 → disabled | Name > 50 chars | Button disabled | HIGH |
| 9 | Join navigates to room (authenticated) | Token present | `navigate("/meeting/:id/room")` | HIGH |
| 10 | Join navigates to login (unauthenticated) | No token | `navigate("/login?redirect=...")` | HIGH |
| 11 | Toggle cam/mic from preview | Click toggle | Track enabled/disabled flipped | HIGH |
| 12 | Stream stored in meeting store | Join clicked | `setLocalStream(stream)` called | HIGH |

### 7.5 MeetingRoom

File: `client/src/pages/MeetingRoom.jsx`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders MeetingLayout with all props | Default | Layout rendered with correct props | HIGH |
| 2 | All 6 hooks initialized | Mount | `useWebRTC`, `useChat`, `useParticipants`, `useNotifications`, `useScreenShare`, `useKeyboardShortcuts` called | HIGH |
| 3 | handleToggleMic toggles + emits | Click mic | `toggleMic()` + `emit("participant-media-state")` | HIGH |
| 4 | handleToggleCam toggles + emits | Click cam | `toggleCam()` + emit | HIGH |
| 5 | handleToggleHand toggles + emits raise/lower | Click hand | `toggleHand()` + emit appropriate | HIGH |
| 6 | handleToggleScreenShare calls start/stop | Click screen share | `startScreenShare()` or `stopScreenShare()` | HIGH |
| 7 | handleKickParticipant emits kick | Kick button | `emit("kick-participant", ...)` | HIGH |
| 8 | handleLeave cleans up + navigates | Leave button | Stop tracks, reset stores, `navigate("/")` | HIGH |
| 9 | Protected by ProtectedRoute | No token → redirected | `Navigate to="/login"` | HIGH |

### 7.6 WaitingRoom

File: `client/src/pages/WaitingRoom.jsx`

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Connects socket and emits join-room on connect | Mount | `io(SERVER_URL)`, `emit("join-room", ...)` | HIGH |
| 2 | Displays waiting spinner | Default | Spinner + "Waiting to be admitted" | HIGH |
| 3 | `admitted` event: disconnect + navigate to room | Receives admitted | `socket.disconnect()`, `navigate(.../room)` | HIGH |
| 4 | `denied` event: disconnect + show denial screen | Receives denied | Denial UI rendered | HIGH |
| 5 | Disconnects socket on unmount | Unmount | `socket.disconnect()` | HIGH |

### 7.7 RemovedScreen

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders "You were removed" message | Default | Heading + explanation | HIGH |
| 2 | "Go home" navigates to / | Click button | `navigate("/")` | HIGH |

### 7.8 MeetingNotFound

| # | Test | Scenario | Expected | Priority |
|---|------|----------|----------|----------|
| 1 | Renders "Meeting not found" message | Default | Heading + explanation | HIGH |
| 2 | "Go home" navigates to / | Click button | `navigate("/")` | HIGH |

---

## 8. App Routing

File: `client/src/App.jsx`

| # | Test | Route | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Home page | `/` | `<Home />` rendered | HIGH |
| 2 | Login | `/login` | `<Login />` rendered | HIGH |
| 3 | Register | `/register` | `<Register />` rendered | HIGH |
| 4 | PreJoinLobby | `/meeting/:meetingId` | `<PreJoinLobby />` rendered | HIGH |
| 5 | MeetingRoom (protected) | `/meeting/:meetingId/room` | `<ProtectedRoute>` wraps `<MeetingRoom />` | HIGH |
| 6 | ProtectedRoute redirects to /login when no token | No token | `<Navigate to="/login">` | HIGH |
| 7 | ProtectedRoute renders children when token exists | Has token | Children rendered | HIGH |
| 8 | WaitingRoom | `/waiting/:meetingId` | `<WaitingRoom />` rendered | HIGH |
| 9 | RemovedScreen | `/removed` | `<RemovedScreen />` rendered | HIGH |
| 10 | MeetingNotFound | `/meeting-not-found` | `<MeetingNotFound />` rendered | HIGH |
| 11 | 404 catch-all redirects to / | `/*` | `<Navigate to="/">` | HIGH |

---

## 9. End-to-End Smoke Tests

Run these manually or with Playwright/Cypress.

| # | Test | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | User registers, logs in, creates meeting, shares link | Full auth flow | Meeting created, shareable URL | HIGH |
| 2 | Two users join same meeting, see each other's video | Join with link | Both in video grid | HIGH |
| 3 | Chat message sent by A visible to B | A sends message | B sees it in chat | HIGH |
| 4 | Screen share visible to all participants | User A shares screen | Others see screen | HIGH |
| 5 | Host can kick participant | Kick button | Participant redirected to /removed | HIGH |
| 6 | Waiting room: non-host waits, host admits | Waiting room enabled | Denied → stays out, admitted → enters | HIGH |
| 7 | Raise hand notification visible to all | A raises hand | Notification shown, hand icon visible | HIGH |
| 8 | Meeting ends when last participant leaves | All leave | Meeting marked "ended" | HIGH |
| 9 | Cannot join full meeting (8/8) | 9th tries to join | "room full" error | HIGH |
| 10 | Mic/cam mute state propagates | A mutes → B sees muted icon | Icon updates | HIGH |

---

## Running Tests

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npx vitest run

# All tests
npm test
```
