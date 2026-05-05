# Requirements Document

## Introduction

This document defines the requirements for a production-quality, Google Meet-like video conferencing application built on the MERN stack. The application extends an existing 1-to-1 WebRTC skeleton into a full-featured, multi-party conferencing platform with real-time chat, screen sharing, participant management, and meeting persistence. The UI targets a polished, dark-themed aesthetic suitable for professional use.

The system is composed of three primary subsystems: the **Client** (React/Vite SPA), the **Signaling_Server** (Node.js/Express/Socket.IO), and the **Database** (MongoDB). Real-time media is exchanged peer-to-peer via WebRTC using a full-mesh topology for MVP (up to ~8 participants), with Socket.IO handling all signaling and chat traffic.

---

## Glossary

- **Client**: The React/Vite single-page application running in the user's browser.
- **Signaling_Server**: The Node.js/Express/Socket.IO backend responsible for WebRTC signaling, meeting management, and real-time event relay.
- **Database**: The MongoDB instance storing meeting records, participant sessions, and chat history.
- **Meeting**: A named, persistent conferencing session identified by a unique Meeting_ID.
- **Meeting_ID**: A short, human-readable alphanumeric code (e.g., `abc-defg-hij`) that uniquely identifies a Meeting.
- **Participant**: A user who has joined a Meeting and is actively connected.
- **Host**: The Participant who created the Meeting. Has elevated controls (kick, mute-all).
- **Display_Name**: The human-readable name a user enters before joining a Meeting.
- **Local_Stream**: The audio/video MediaStream captured from the local user's camera and microphone.
- **Remote_Stream**: An audio/video MediaStream received from a remote Participant via WebRTC.
- **Peer_Connection**: An RTCPeerConnection instance representing the WebRTC link between two Participants.
- **Mesh_Network**: A WebRTC topology where every Participant maintains a direct Peer_Connection to every other Participant.
- **Chat_Message**: A text message sent by a Participant during a Meeting, stored in the Database.
- **Screen_Share_Stream**: A MediaStream captured from the user's screen or application window via `getDisplayMedia`.
- **Waiting_Room**: A pre-join holding area where Participants wait for Host admission.
- **Notification**: A transient in-app alert displayed to all Participants when a user joins, leaves, or raises their hand.
- **Raise_Hand**: A non-audio signal a Participant sends to indicate they wish to speak.
- **Control_Bar**: The persistent bottom toolbar in the Meeting room containing media and meeting controls.
- **Video_Grid**: The responsive layout area displaying all Participant video tiles.
- **Tile**: A single video/avatar card within the Video_Grid representing one Participant.
- **Dominant_Speaker**: The Participant whose audio level is currently the highest, highlighted in the Video_Grid.
- **JWT**: JSON Web Token used for stateless authentication.
- **STUN_Server**: A Session Traversal Utilities for NAT server used during ICE candidate gathering.
- **ICE**: Interactive Connectivity Establishment — the WebRTC process for finding network paths between peers.
- **SDP**: Session Description Protocol — the format used to negotiate media capabilities between peers.

---

## Requirements

### Requirement 1: User Identity and Pre-Join Flow

**User Story:** As a user, I want to enter my display name and preview my camera/microphone before joining a meeting, so that I appear correctly to other participants from the moment I join.

#### Acceptance Criteria

1. THE Client SHALL display a pre-join lobby screen when a user navigates to a meeting URL or clicks "New Meeting".
2. WHEN the pre-join lobby is displayed, THE Client SHALL request camera and microphone permissions and render a live Local_Stream preview.
3. THE Client SHALL require the user to enter a Display_Name of between 1 and 50 characters before enabling the join action.
4. IF the user denies camera or microphone permissions, THEN THE Client SHALL display a descriptive error message and allow the user to join with audio-only or video-only mode.
5. WHEN the user submits the pre-join form, THE Client SHALL store the Display_Name in application state for the duration of the Meeting session.
6. THE Client SHALL display the user's chosen Display_Name on their own Tile within the Video_Grid throughout the Meeting.

---

### Requirement 2: Meeting Creation and Shareable Links

**User Story:** As a host, I want to create a new meeting and share a link with others, so that participants can join without needing to know a separate meeting code.

#### Acceptance Criteria

1. WHEN a user clicks "New Meeting", THE Client SHALL send a POST request to the Signaling_Server to create a new Meeting record.
2. WHEN a Meeting is created, THE Signaling_Server SHALL generate a unique Meeting_ID and persist a Meeting document to the Database containing the Meeting_ID, creation timestamp, and Host identifier.
3. WHEN a Meeting is created, THE Client SHALL display the full shareable meeting URL (e.g., `https://app.domain/meeting/{Meeting_ID}`) with a one-click copy-to-clipboard button.
4. THE Client SHALL support direct URL navigation to `/meeting/{Meeting_ID}`, routing the user to the pre-join lobby for that specific Meeting.
5. IF a user navigates to a Meeting_ID that does not exist in the Database, THEN THE Signaling_Server SHALL return a 404 response and THE Client SHALL display a "Meeting not found" error page.
6. THE Signaling_Server SHALL expose a GET `/api/meetings/:meetingId` endpoint that returns Meeting metadata (status, participant count) without requiring authentication.

---

### Requirement 3: Multi-Party WebRTC Media (Mesh)

**User Story:** As a participant, I want to see and hear all other participants simultaneously, so that the meeting feels like a real group conversation.

#### Acceptance Criteria

1. WHEN a Participant joins a Meeting with existing Participants, THE Client SHALL establish a Peer_Connection to every existing Participant using the Mesh_Network topology.
2. THE Client SHALL use the STUN_Server addresses `stun:stun.l.google.com:19302` and `stun:stun1.l.google.com:19302` for ICE candidate gathering.
3. WHEN a new Participant joins, THE Signaling_Server SHALL relay the join event to all existing Participants in the room so each can initiate a new Peer_Connection to the newcomer.
4. THE Client SHALL add all Local_Stream tracks to each Peer_Connection before creating an SDP offer.
5. WHEN a Participant leaves, THE Client SHALL close the Peer_Connection associated with that Participant and remove their Tile from the Video_Grid.
6. THE Client SHALL support a minimum of 8 simultaneous Participants in a single Meeting using the Mesh_Network topology.
7. IF an ICE candidate is received before the remote SDP description is set, THEN THE Client SHALL buffer the ICE candidate and apply it after the remote description is set.
8. WHEN a Peer_Connection ICE state transitions to `failed`, THE Client SHALL attempt one automatic ICE restart before displaying a connection error on the affected Tile.

---

### Requirement 4: Video Grid Layout

**User Story:** As a participant, I want the video grid to adapt to the number of participants, so that all tiles are visible and well-proportioned regardless of meeting size.

#### Acceptance Criteria

1. THE Client SHALL render all active Participant Tiles in the Video_Grid using a responsive CSS grid layout.
2. WHEN there is 1 Participant (local only), THE Client SHALL display the local Tile centered and full-width.
3. WHEN there are 2 Participants, THE Client SHALL display tiles in a 1×2 side-by-side layout.
4. WHEN there are 3 to 4 Participants, THE Client SHALL display tiles in a 2×2 grid layout.
5. WHEN there are 5 to 6 Participants, THE Client SHALL display tiles in a 2×3 grid layout.
6. WHEN there are 7 to 8 Participants, THE Client SHALL display tiles in a 2×4 grid layout.
7. WHEN a Participant's camera is disabled, THE Client SHALL display the Participant's Display_Name initials on a colored avatar background in place of the video feed.
8. THE Client SHALL display the Participant's Display_Name label on each Tile at all times.
9. WHEN a Participant is the Dominant_Speaker, THE Client SHALL apply a highlighted border to their Tile.

---

### Requirement 5: Audio and Video Controls

**User Story:** As a participant, I want to mute my microphone and turn off my camera during a meeting, so that I can control my own media presence.

#### Acceptance Criteria

1. THE Client SHALL display a Control_Bar at the bottom of the Meeting room containing mute, camera toggle, screen share, raise hand, chat toggle, participants toggle, and leave buttons.
2. WHEN the user clicks the mute button, THE Client SHALL toggle the enabled state of all audio tracks in the Local_Stream and update the mute button's visual state.
3. WHEN the user clicks the camera toggle button, THE Client SHALL toggle the enabled state of all video tracks in the Local_Stream and update the camera button's visual state.
4. WHEN a Participant mutes their microphone, THE Client SHALL emit a `participant-media-state` event to the Signaling_Server containing the Participant's socket ID and updated audio state.
5. WHEN THE Signaling_Server receives a `participant-media-state` event, THE Signaling_Server SHALL relay it to all other Participants in the room.
6. WHEN a remote Participant's audio state changes, THE Client SHALL display a mute indicator icon on that Participant's Tile.
7. WHEN a remote Participant's video state changes, THE Client SHALL display the avatar fallback on that Participant's Tile.
8. THE Client SHALL persist the user's mute and camera state across Peer_Connection renegotiations within the same session.

---

### Requirement 6: Real-Time Chat

**User Story:** As a participant, I want to send and receive text messages during a meeting, so that I can communicate without interrupting the audio.

#### Acceptance Criteria

1. THE Client SHALL display a collapsible chat panel that slides in from the right side of the Meeting room.
2. WHEN the user sends a Chat_Message, THE Client SHALL emit a `chat-message` event to the Signaling_Server containing the Meeting_ID, sender Display_Name, message text (1–1000 characters), and UTC timestamp.
3. WHEN THE Signaling_Server receives a `chat-message` event, THE Signaling_Server SHALL relay the message to all Participants in the room and persist the Chat_Message document to the Database.
4. WHEN a Chat_Message is received, THE Client SHALL append it to the chat panel with the sender's Display_Name, message text, and formatted timestamp.
5. WHEN a new Chat_Message arrives and the chat panel is closed, THE Client SHALL display an unread message badge count on the chat toggle button.
6. WHEN the chat panel is opened, THE Client SHALL clear the unread message badge count.
7. WHEN a user opens the chat panel for a Meeting they have joined mid-session, THE Client SHALL fetch and display the prior Chat_Message history for that Meeting from the Signaling_Server.
8. THE Signaling_Server SHALL expose a GET `/api/meetings/:meetingId/chat` endpoint that returns the Chat_Message history for a Meeting, ordered by ascending timestamp.
9. IF a Chat_Message text exceeds 1000 characters, THEN THE Client SHALL prevent submission and display a character-limit error.

---

### Requirement 7: Screen Sharing

**User Story:** As a participant, I want to share my screen with others in the meeting, so that I can present content without a separate tool.

#### Acceptance Criteria

1. WHEN the user clicks the screen share button, THE Client SHALL call `navigator.mediaDevices.getDisplayMedia` to capture a Screen_Share_Stream.
2. WHEN a Screen_Share_Stream is captured, THE Client SHALL replace the video track in all active Peer_Connections with the screen share video track.
3. WHEN screen sharing is active, THE Client SHALL display the Screen_Share_Stream in a prominent, enlarged tile in the Video_Grid and reduce other Participant Tiles to a sidebar strip.
4. WHEN the user stops screen sharing (via the browser's native stop button or the in-app stop button), THE Client SHALL replace the screen share video track in all Peer_Connections with the original camera video track.
5. WHEN a Participant begins screen sharing, THE Client SHALL emit a `screen-share-started` event to the Signaling_Server, which SHALL relay it to all other Participants.
6. WHEN a Participant stops screen sharing, THE Client SHALL emit a `screen-share-stopped` event to the Signaling_Server, which SHALL relay it to all other Participants.
7. IF `getDisplayMedia` is rejected by the user, THEN THE Client SHALL silently cancel the screen share action without displaying an error.
8. THE Client SHALL allow only one Participant to share their screen at a time; if a second Participant attempts to share, THE Client SHALL display a notification that screen sharing is already active.

---

### Requirement 8: Participants Panel

**User Story:** As a participant, I want to see a list of everyone in the meeting with their status, so that I know who is present and whether they are muted.

#### Acceptance Criteria

1. THE Client SHALL display a collapsible participants panel that slides in from the right side of the Meeting room.
2. THE Client SHALL list every active Participant in the panel with their Display_Name, audio state (muted/unmuted icon), video state (camera on/off icon), and a Host badge for the Meeting Host.
3. WHEN a Participant joins or leaves, THE Client SHALL update the participants panel in real time without requiring a page refresh.
4. WHEN a Participant raises their hand, THE Client SHALL display a raised-hand indicator next to their name in the participants panel.
5. THE Client SHALL display the total Participant count in the participants panel header and on the participants toggle button in the Control_Bar.
6. WHERE the current user is the Host, THE Client SHALL display a "Remove" action button next to each non-Host Participant in the participants panel.

---

### Requirement 9: Join and Leave Notifications

**User Story:** As a participant, I want to see brief notifications when someone joins or leaves, so that I am aware of changes in the meeting without being distracted.

#### Acceptance Criteria

1. WHEN a Participant joins the Meeting, THE Client SHALL display a Notification toast at the bottom of the screen with the text "{Display_Name} joined the meeting".
2. WHEN a Participant leaves the Meeting, THE Client SHALL display a Notification toast with the text "{Display_Name} left the meeting".
3. THE Client SHALL automatically dismiss each Notification after 4 seconds.
4. THE Client SHALL stack multiple simultaneous Notifications vertically without overlapping.
5. WHEN a Participant raises their hand, THE Client SHALL display a Notification toast with the text "{Display_Name} raised their hand".

---

### Requirement 10: Raise Hand Feature

**User Story:** As a participant, I want to raise my hand to signal that I want to speak, so that I can get the host's attention without interrupting.

#### Acceptance Criteria

1. WHEN the user clicks the raise hand button in the Control_Bar, THE Client SHALL emit a `raise-hand` event to the Signaling_Server containing the Participant's socket ID and Display_Name.
2. WHEN THE Signaling_Server receives a `raise-hand` event, THE Signaling_Server SHALL relay it to all other Participants in the room.
3. WHEN the raise hand button is active, THE Client SHALL display a visual indicator (highlighted button state and a hand icon overlay) on the local user's Tile.
4. WHEN the user clicks the raise hand button again, THE Client SHALL emit a `lower-hand` event and remove the raised-hand indicators.
5. THE Client SHALL display a raised-hand icon overlay on the Tile of any remote Participant who has raised their hand.

---

### Requirement 11: Meeting Persistence and Database Integration

**User Story:** As a developer, I want meeting data and chat history to be stored in MongoDB, so that the system has a persistent record and can support future features like history and analytics.

#### Acceptance Criteria

1. THE Signaling_Server SHALL connect to the Database on startup using the connection string provided in the `MONGODB_URI` environment variable.
2. IF the Database connection fails on startup, THEN THE Signaling_Server SHALL log the error and exit with a non-zero status code.
3. THE Database SHALL store Meeting documents with the fields: `meetingId` (string, unique), `hostSocketId` (string), `createdAt` (Date), `endedAt` (Date, nullable), and `participantCount` (number).
4. THE Database SHALL store Chat_Message documents with the fields: `meetingId` (string), `senderName` (string), `text` (string), `timestamp` (Date), and `_id` (ObjectId).
5. WHEN a Meeting ends (all Participants have left), THE Signaling_Server SHALL update the Meeting document's `endedAt` field with the current UTC timestamp.
6. THE Signaling_Server SHALL expose a GET `/api/meetings/:meetingId` endpoint that queries the Database and returns the Meeting document or a 404 if not found.
7. FOR ALL Chat_Message documents written to the Database, reading them back via the `/api/meetings/:meetingId/chat` endpoint SHALL return the same `meetingId`, `senderName`, `text`, and `timestamp` values (round-trip property).

---

### Requirement 12: Leave Meeting and Cleanup

**User Story:** As a participant, I want to leave a meeting cleanly, so that my media tracks are stopped and other participants are notified immediately.

#### Acceptance Criteria

1. WHEN the user clicks the "Leave" button, THE Client SHALL stop all tracks in the Local_Stream, close all active Peer_Connections, and disconnect the Socket.IO connection.
2. WHEN the user clicks the "Leave" button, THE Client SHALL navigate back to the application home screen.
3. WHEN a Participant disconnects (intentionally or due to network loss), THE Signaling_Server SHALL emit a `user-left` event with the Participant's socket ID to all remaining Participants in the room.
4. WHEN THE Client receives a `user-left` event, THE Client SHALL close the corresponding Peer_Connection, remove the Participant's Tile from the Video_Grid, and remove the Participant from the participants panel.
5. IF the Host leaves the Meeting, THEN THE Signaling_Server SHALL designate the next connected Participant as the new Host and emit a `host-changed` event to all remaining Participants.

---

### Requirement 13: Host Admin Controls

**User Story:** As a host, I want to remove disruptive participants from the meeting, so that I can maintain a productive environment.

#### Acceptance Criteria

1. WHERE the current user is the Host, THE Client SHALL display a "Remove" button for each non-Host Participant in the participants panel.
2. WHEN the Host clicks "Remove" for a Participant, THE Client SHALL emit a `kick-participant` event to the Signaling_Server containing the target Participant's socket ID.
3. WHEN THE Signaling_Server receives a `kick-participant` event from the Host's socket, THE Signaling_Server SHALL emit a `you-were-removed` event to the target Participant's socket.
4. WHEN THE Client receives a `you-were-removed` event, THE Client SHALL stop all media tracks, close all Peer_Connections, disconnect from the Signaling_Server, and navigate to a "You were removed from this meeting" screen.
5. WHEN a Participant is removed, THE Signaling_Server SHALL emit a `user-left` event to all remaining Participants so their UI updates correctly.

---

### Requirement 14: Waiting Room

**User Story:** As a host, I want participants to wait for my approval before entering the meeting, so that I can control who joins.

#### Acceptance Criteria

1. WHERE the Waiting_Room feature is enabled for a Meeting, THE Client SHALL display a "Waiting for host to admit you" screen to joining Participants instead of immediately entering the Video_Grid.
2. WHERE the Waiting_Room feature is enabled, THE Signaling_Server SHALL notify the Host when a Participant is waiting, including the Participant's Display_Name and socket ID.
3. WHERE the Waiting_Room feature is enabled, THE Client SHALL display an admission request panel to the Host listing all waiting Participants with "Admit" and "Deny" buttons.
4. WHEN the Host clicks "Admit", THE Signaling_Server SHALL emit an `admitted` event to the waiting Participant's socket, allowing them to proceed to the Meeting room.
5. WHEN the Host clicks "Deny", THE Signaling_Server SHALL emit a `denied` event to the waiting Participant's socket and THE Client SHALL display a "Your request to join was denied" message.

---

### Requirement 15: JWT Authentication

**User Story:** As a registered user, I want to log in with my credentials so that my identity is verified and my meetings are associated with my account.

#### Acceptance Criteria

1. THE Signaling_Server SHALL expose a POST `/api/auth/register` endpoint that accepts `email` and `password`, hashes the password using bcrypt with a minimum cost factor of 12, and stores the user in the Database.
2. THE Signaling_Server SHALL expose a POST `/api/auth/login` endpoint that validates credentials and returns a signed JWT with a 24-hour expiry.
3. WHEN a JWT is issued, THE Client SHALL store it in memory (not localStorage) and attach it as a Bearer token in the `Authorization` header of all authenticated API requests.
4. IF a request to a protected endpoint is made without a valid JWT, THEN THE Signaling_Server SHALL return a 401 Unauthorized response.
5. WHEN a JWT expires, THE Client SHALL redirect the user to the login screen and clear the stored token.
6. THE Signaling_Server SHALL validate the JWT on Socket.IO connection using a middleware function before allowing the socket to join any room.

---

### Requirement 16: Polished Dark UI and Accessibility

**User Story:** As a user, I want a visually polished, accessible interface, so that the application is pleasant and usable for everyone.

#### Acceptance Criteria

1. THE Client SHALL use a dark color scheme with a primary background of `#0a0a0f` or equivalent near-black, consistent with the existing Tailwind CSS v4 design system.
2. THE Client SHALL display all interactive Control_Bar buttons with a minimum touch target size of 44×44 CSS pixels.
3. THE Client SHALL provide `aria-label` attributes on all icon-only Control_Bar buttons describing their action and current state (e.g., "Mute microphone", "Unmute microphone").
4. THE Client SHALL support keyboard navigation for all primary actions: mute (M), camera toggle (V), raise hand (H), leave meeting (Escape with confirmation dialog).
5. WHEN the user presses Escape in the Meeting room, THE Client SHALL display a confirmation dialog before leaving the Meeting.
6. THE Client SHALL display loading skeleton states for Tiles while Peer_Connections are being established.
7. THE Client SHALL be responsive and usable on viewport widths from 375px (mobile) to 2560px (large desktop).

