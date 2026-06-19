# MeetSpace Video Conferencing App - Testing Plan

## Table of Contents
1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Automated Tests](#automated-tests)
4. [Manual Testing Checklist](#manual-testing-checklist)
5. [Bug Fixes Applied](#bug-fixes-applied)

---

## Overview

This document provides a comprehensive testing plan for the MeetSpace video conferencing application, including automated test suites and manual testing procedures for end-user verification.

### Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Zustand, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, MongoDB with Mongoose
- **Testing**: Vitest (client), Jest (server), fast-check (property-based testing)

---

## Test Environment Setup

### Prerequisites
```bash
# Install MongoDB locally or use MongoDB Atlas
# Node.js 18+ required

# 1. Install root dependencies
npm install

# 2. Install server dependencies
cd server && npm install

# 3. Install client dependencies
cd client && npm install

# 4. Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

### Environment Variables (server/.env)
```env
MONGODB_URI=mongodb://localhost:27017/videoconf
JWT_SECRET=your_secure_jwt_secret_here
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

---

## Automated Tests

### Running All Tests

```bash
# Run server tests (Jest)
cd server && npm test

# Run client tests (Vitest)
cd client && npm test

# Run client tests with UI
cd client && npx vitest --ui
```

### Server Test Suite (Jest)

| Test File | Coverage | Description |
|-----------|----------|-------------|
| `routes/__tests__/auth.integration.test.js` | Auth flow | Register → Login → Protected Route → Unauthorized block |
| `routes/__tests__/chat.integration.test.js` | Chat API | Chat message persistence and retrieval |

**Run server tests:**
```bash
cd server
npm test
```

**Expected Output:**
```
✓ Auth Integration Flow (201 ms)
  ✓ registers, logs in, accesses protected route, and blocks unauthorized access
✓ GET /api/meetings/:id/chat (45 ms)
  ✓ reads chat messages belonging to the meeting
```

### Client Test Suite (Vitest)

| Test File | Coverage | Description |
|-----------|----------|-------------|
| `components/video/__tests__/AvatarFallback.test.jsx` | Unit | Initials extraction from display names |
| `components/video/__tests__/VideoGrid.test.jsx` | Property-Based | Grid layout algorithm for all participant counts (1-8) |

**Run client tests:**
```bash
cd client
npm test
```

**Expected Output:**
```
✓ AvatarFallback - getInitials
  ✓ extracts initial from single name
  ✓ extracts initials from two names
  ✓ extracts initials from names with extra spaces
  ✓ extracts first and last initial for multi-word names
  ✓ returns ? for empty string or only spaces
✓ getGridLayout PBT
  ✓ for all n in [1, 8], cols * rows >= n and layout is valid
```

### Property-Based Testing (fast-check)

The VideoGrid component uses property-based testing to verify:
- Grid capacity always accommodates participant count (1-8)
- Only valid layout configurations are returned
- Edge cases (1, 2, 4, 6, 8 participants) are handled correctly

---

## Manual Testing Checklist

Use this checklist to verify the application works correctly from an end-user perspective.

### 1. Authentication Flow

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.1 | User Registration | 1. Navigate to `/register`<br>2. Enter display name, email, password<br>3. Submit form | Account created and auto-logged in, redirected to home | [ ] |
| 1.2 | User Login | 1. Navigate to `/login`<br>2. Enter valid credentials<br>3. Submit | Logged in, token stored, redirected to home | [ ] |
| 1.3 | Invalid Login | 1. Enter wrong password<br>2. Submit | Error message displayed, no redirect | [ ] |
| 1.4 | Logout | 1. Click Sign out button | Token cleared, UI updates to show Sign in button | [ ] |
| 1.5 | Protected Routes | 1. Log out<br>2. Try to access `/meeting/:id/room` directly | Redirected to login, then back to meeting after login | [ ] |

### 2. Meeting Creation & Joining

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 2.1 | Create Meeting (Logged In) | 1. Click "New meeting" | Meeting created, redirected to pre-join lobby | [ ] |
| 2.2 | Create Meeting (Logged Out) | 1. Log out<br>2. Click "New meeting" | Redirected to login, then back to create flow | [ ] |
| 2.3 | Join with Code | 1. Enter meeting code<br>2. Click Join | Redirected to pre-join lobby | [ ] |
| 2.4 | Join with Full URL | 1. Paste full meeting URL<br>2. Click Join | Redirected to pre-join lobby | [ ] |
| 2.5 | Non-existent Meeting | 1. Enter invalid meeting code<br>2. Try to join | Redirected to "Meeting not found" page | [ ] |
| 2.6 | Waiting Room Creation | 1. Check "Enable Waiting Room"<br>2. Create meeting | Meeting created with waiting room enabled | [ ] |

### 3. Pre-Join Lobby

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 3.1 | Camera Preview | 1. Join lobby<br>2. Grant camera permission | Camera preview visible, mirrored | [ ] |
| 3.2 | Camera Toggle | 1. Click camera button | Preview shows/hides, button state updates | [ ] |
| 3.3 | Microphone Toggle | 1. Click mic button | Button state updates (no audio preview) | [ ] |
| 3.4 | Media Permission Denied | 1. Deny camera/mic permissions | Error message shown, can still join | [ ] |
| 3.5 | Name Validation | 1. Try to join with empty name | Join button disabled | [ ] |
| 3.6 | Name Max Length | 1. Enter 50+ character name | Input limited to 50 characters | [ ] |
| 3.7 | Join Flow (Logged In) | 1. Enter name<br>2. Click Join now | Redirected to meeting room | [ ] |
| 3.8 | Join Flow (Logged Out) | 1. Enter name<br>2. Click Join now | Redirected to login, preserves meeting context | [ ] |

### 4. Meeting Room - Core Features

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4.1 | Join Meeting | 1. Join as host | Local video visible, host badge shown | [ ] |
| 4.2 | Multiple Participants | 1. Join with 2+ browsers | All participants visible in grid | [ ] |
| 4.3 | Participant Limit | 1. Try to join as 9th participant | "Room full" error displayed | [ ] |
| 4.4 | Host Transfer | 1. Host leaves<br>2. Another participant remains | Host badge transfers to remaining participant | [ ] |
| 4.5 | Participant Leave | 1. Click Leave<br>2. Confirm | Redirected to home, participant removed from others' view | [ ] |

### 5. Media Controls

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 5.1 | Mute/Unmute (Button) | 1. Click mic button<br>2. Click again | Mic icon changes, status reflected to others | [ ] |
| 5.2 | Mute/Unmute (Keyboard) | 1. Press 'M' key | Mic toggles, status reflected to others | [ ] |
| 5.3 | Camera On/Off (Button) | 1. Click camera button<br>2. Click again | Video shows/hides, avatar appears when off, status to others | [ ] |
| 5.4 | Camera On/Off (Keyboard) | 1. Press 'V' key | Camera toggles, status reflected to others | [ ] |
| 5.5 | Media State Sync | 1. Participant A mutes<br>2. Check Participant B's view | Mute icon appears on Participant A's tile | [ ] |

### 6. Screen Sharing

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 6.1 | Start Screen Share | 1. Click screen share button | Screen share indicator appears, large tile layout | [ ] |
| 6.2 | Stop Screen Share (Button) | 1. Click stop button | Returns to normal grid, camera restored | [ ] |
| 6.3 | Stop Screen Share (Native) | 1. Click browser's "Stop sharing" | Screen share stops automatically | [ ] |
| 6.4 | Single Sharer Enforcement | 1. Participant A sharing<br>2. Participant B tries to share | Error message: "Screen sharing is already active" | [ ] |
| 6.5 | Screen Share View | 1. Someone sharing<br>2. Join as new participant | Screen share visible in large tile | [ ] |

### 7. Chat System

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.1 | Send Message | 1. Open chat panel<br>2. Type message<br>3. Send | Message appears in chat, unread badge cleared | [ ] |
| 7.2 | Receive Message | 1. Keep chat closed<br>2. Have another participant send message | Unread badge increments | [ ] |
| 7.3 | Message History | 1. Close and reopen chat | Previous messages visible | [ ] |
| 7.4 | Empty Message | 1. Try to send empty message | Message not sent | [ ] |
| 7.5 | Long Message | 1. Enter 1000+ character message | Blocked or truncated with error | [ ] |
| 7.6 | Special Characters | 1. Send message with emojis, URLs | Renders correctly | [ ] |

### 8. Raise Hand Feature

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.1 | Raise Hand (Button) | 1. Click raise hand button | Hand icon appears on tile, notification sent | [ ] |
| 8.2 | Raise Hand (Keyboard) | 1. Press 'H' key | Hand icon appears | [ ] |
| 8.3 | Lower Hand | 1. Click button again (or press 'H') | Hand icon disappears | [ ] |
| 8.4 | Raise Hand Notification | 1. Participant A raises hand<br>2. Check Participant B | Notification: "✋ [Name] raised their hand" | [ ] |
| 8.5 | Persistent State | 1. Raise hand<br>2. New participant joins | New participant sees hand raised status | [ ] |

### 9. Participant Management (Host Only)

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.1 | View Participants | 1. Click participants button | Panel opens with participant list | [ ] |
| 9.2 | Kick Participant | 1. As host, click Remove on participant<br>2. Confirm | Participant removed, sees "You were removed" page | [ ] |
| 9.3 | Non-Host Kick Attempt | 1. As non-host, look for kick button | Kick button not visible | [ ] |
| 9.4 | Self-Kick Prevention | 1. As host, try to kick self | Kick button not shown on own tile | [ ] |

### 10. Waiting Room

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 10.1 | Wait for Admission | 1. Join meeting with waiting room enabled<br>2. As guest | Sees "Waiting to be admitted" page | [ ] |
| 10.2 | Admit Participant | 1. As host, see admission notification<br>2. Click Admit | Participant joins meeting | [ ] |
| 10.3 | Deny Participant | 1. As host, click Deny | Participant sees "Request denied" page | [ ] |
| 10.4 | Host Absent | 1. Join waiting room when no host present | Let in automatically after brief wait | [ ] |

### 11. Keyboard Shortcuts

| # | Shortcut | Action | Expected Result | Status |
|---|----------|--------|-----------------|--------|
| 11.1 | M | Toggle microphone | Mic state flips, icon updates | [ ] |
| 11.2 | V | Toggle camera | Camera state flips, video/avatar toggles | [ ] |
| 11.3 | H | Toggle raise hand | Hand state flips, notification may show | [ ] |
| 11.4 | Escape | Show leave dialog | Confirmation dialog appears | [ ] |
| 11.5 | (typing) | Shortcuts disabled | While typing in input, shortcuts don't fire | [ ] |

### 12. Notifications

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 12.1 | Join Notification | 1. Participant joins | Toast: "[Name] joined the meeting" | [ ] |
| 12.2 | Leave Notification | 1. Participant leaves | Toast: "[Name] left the meeting" | [ ] |
| 12.3 | Auto-Dismiss | 1. Wait after notification | Notification disappears after 4 seconds | [ ] |
| 12.4 | Multiple Notifications | 1. Trigger multiple events quickly | Notifications stack properly, no overflow | [ ] |

### 13. Responsive Design

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 13.1 | Mobile Layout | 1. Open on mobile device or small viewport | Single column grid, controls accessible | [ ] |
| 13.2 | Tablet Layout | 1. Open on tablet | 2-column grid where appropriate | [ ] |
| 13.3 | Desktop Layout | 1. Open on desktop | Optimal grid layout for participant count | [ ] |
| 13.4 | Panel Behavior | 1. Open chat/participants on mobile | Panels take appropriate screen space | [ ] |

### 14. Error Handling & Edge Cases

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 14.1 | Network Disconnection | 1. Disconnect network<br>2. Reconnect | Graceful handling, reconnection attempt | [ ] |
| 14.2 | Server Offline | 1. Stop server<br>2. Try to create meeting | Error message: "Network error. Is the server running?" | [ ] |
| 14.3 | Invalid Meeting ID Format | 1. Enter malformed meeting ID | Handled gracefully or error shown | [ ] |
| 14.4 | Browser Refresh | 1. Join meeting<br>2. Refresh page | Rejoins meeting if token valid | [ ] |
| 14.5 | Camera Unplugged | 1. Join with camera<br>2. Unplug camera | Graceful fallback, camera shows as off | [ ] |

---

## Bug Fixes Applied

### Fixed Issues

| # | Issue | Location | Fix Description |
|---|-------|----------|-----------------|
| 1 | Missing `uuid` dependency | `server/package.json` | Added `uuid: ^9.0.1` to dependencies |
| 2 | `isAuthenticated` always false | `client/src/store/useAuthStore.js` | Implemented proper computed property using `get()` |
| 3 | Keyboard shortcuts media state bug | `client/src/hooks/useKeyboardShortcuts.js` | Fixed state timing - emit correct values after toggle |
| 4 | PreJoinLobby loses meeting context | `client/src/pages/PreJoinLobby.jsx` | Store meeting info before redirecting to login |
| 5 | Root package.json test script | `package.json` | Replaced placeholder with proper test commands |
| 6 | Missing CLIENT_ORIGIN in example | `server/.env.example` | Added CLIENT_ORIGIN documentation |
| 7 | useWebRTC stale socket reference | `client/src/hooks/useWebRTC.js` | Return socket getter instead of stale ref |

---

## Performance Testing

### WebRTC Connection Quality

| Metric | Target | Test Method |
|--------|--------|-------------|
| Connection establishment | < 3 seconds | Join meeting, measure time to first frame |
| Audio latency | < 200ms | Clap test between two participants |
| Video sync | < 100ms delay | Observe lip sync |
| ICE restart | < 5 seconds | Trigger network change, measure recovery |

### Load Testing

| Scenario | Target | Test Method |
|----------|--------|-------------|
| 8 participants | All connected | Join with 8 browsers/tabs |
| Chat history | < 1s load | Load 100+ messages |
| Reconnection | < 5s recovery | Drop and restore connection |

---

## Sign-Off Checklist

Before deploying to production, verify:

- [ ] All automated tests pass (server + client)
- [ ] Manual testing checklist 100% complete
- [ ] No console errors in browser
- [ ] Server logs show no unhandled errors
- [ ] Tested on Chrome, Firefox, Safari, Edge
- [ ] Mobile testing completed (iOS Safari, Android Chrome)
- [ ] Accessibility audit passed (keyboard navigation, screen readers)
- [ ] Security review completed (JWT handling, input validation)

---

## Appendix: Quick Reference Commands

```bash
# Start development
npm run dev          # Start both client and server (if configured)
cd server && npm run dev    # Server only (nodemon)
cd client && npm run dev    # Client only (vite)

# Run tests
cd server && npm test       # Server tests
cd client && npm test       # Client tests

# Production build
cd client && npm run build  # Build for production
```
