# Live Conferencing — Client Design Reference

## Project Goal

A browser-based video conferencing app (Google Meet clone) with real-time audio/video via WebRTC (mesh topology), chat, screen sharing, waiting rooms, participant management, and recording. Built with **React 19**, **Tailwind CSS v4**, **Zustand** stores, and **Vite**.

---

## Route Structure

| Route | Page Component | Auth Required | Purpose |
|---|---|---|---|
| `/` | `Home.jsx` | No | Landing page — create or join a meeting |
| `/login` | `Login.jsx` | No | Sign in |
| `/register` | `Register.jsx` | No | Sign up (auto-login on success) |
| `/meeting/:meetingId` | `PreJoinLobby.jsx` | No | Camera/mic preview + name before joining |
| `/meeting/:meetingId/room` | `MeetingRoom.jsx` | Yes | The live meeting room |
| `/waiting/:meetingId` | `WaitingRoom.jsx` | No | Waiting room if host has admission enabled |
| `/removed` | `RemovedScreen.jsx` | No | Shown when host removes you |
| `/meeting-not-found` | `MeetingNotFound.jsx` | No | Shown when meeting doesn't exist |

---

## Component Tree (Meeting Room)

```
App
└── MeetingRoom (orchestrator — hooks + store wiring)
    └── MeetingLayout
        ├── AdmissionPanel (floating top-center, host-only)
        ├── side-content area:
        │   ├── VideoGrid
        │   │   └── Tile[] (1 per participant)
        │   │       ├── VideoPlayer (when camera on + stream available)
        │   │       ├── AvatarFallback (when camera off)
        │   │       ├── SkeletonTile (when loading)
        │   │       └── overlay indicators (screen share, hand raise, bottom bar)
        │   ├── ChatPanel (slide-out right, absolute)
        │   │   ├── ChatMessage[]
        │   │   └── ChatInput
        │   └── ParticipantsPanel (slide-out right, absolute)
        │       └── ParticipantRow[]
        ├── ControlBar (sticky bottom bar)
        │   └── ControlButton[] (internal helper component)
        ├── NotificationStack (fixed bottom-left)
        └── ConfirmDialog (modal — "Leave meeting?" confirmation)
```

---

## Page-by-Page Layout Structure

### Home (`/`)
- **Nav bar** — logo left (`Meet` + Video icon), auth actions right (Sign in / Get started OR display name + Sign out)
- **Hero** — centered: heading "Video calls for everyone", subtitle, error banner
- **Actions** — "New meeting" button, "or" divider, join form (text input + "Join" button), waiting room checkbox
- **Share URL** — appears after creating a meeting (Copy button)
- **Feature grid** — 4 features in 2x2 grid: HD video, Live chat, Screen share, Raise hand

### Login (`/login`)
- **Branding header** — centered logo + "Meet"
- **Card** — "Welcome back" title, subtitle
- **Form** — Email (with Mail icon), Password (with Lock icon), Sign in button
- **Footer** — "Don't have an account? Create one" link
- **Error display** — inside card above form

### Register (`/register`)
- Same pattern as Login — branding header, card layout
- **Fields** — Display Name (User icon), Email (Mail icon), Password (Lock icon)
- Auto-login after registration

### PreJoinLobby (`/meeting/:meetingId`)
- **2-column grid** (md:grid-cols-2) — camera preview left, join form right
- **Camera preview** — video element with toggle buttons (mic + cam) overlaid at bottom
- **Join form** — "Ready to join?" heading, meeting ID display, media error warning, name input, "Join now" button, terms text

### Meeting Room (`/meeting/:meetingId/room`)
- **Full-screen** — video tiles fill the space, control bar at bottom
- **Layout** — `MeetingLayout` wraps everything:
  - Media error banner (absolute, top-center)
  - Admission panel (absolute, top-center)
  - Main area: VideoGrid (flexible) + side panels (ChatPanel, ParticipantsPanel — absolute right, slide in/out)
  - ControlBar (bottom, sticky)
  - NotificationStack (fixed bottom-left)
  - ConfirmDialog (modal)

### WaitingRoom (`/waiting/:meetingId`)
- **Centered** — spinner icon, "Waiting to be admitted" heading, meeting ID display
- **Denied state** — X icon, "Request denied" heading, "Go home" button

### RemovedScreen (`/removed`)
- **Centered** — ShieldOff icon, "You were removed" heading, "Go home" button

### MeetingNotFound (`/meeting-not-found`)
- **Centered** — VideoOff icon, "Meeting not found" heading, "Go home" button (accent colored)

---

## Component Catalog

### Layout
| Component | File | Purpose |
|---|---|---|
| `MeetingLayout` | `components/layout/MeetingLayout.jsx` | Orchestrates the entire meeting UI — video grid, side panels, control bar, notifications, dialogs |

### Video
| Component | File | Purpose |
|---|---|---|
| `VideoGrid` | `components/video/VideoGrid.jsx` | Arranges participant tiles. **Two modes**: (1) Normal grid (auto rows/cols based on count), (2) Screen share layout (main share area + optional PIP self-view + right sidebar) |
| `Tile` | `components/video/Tile.jsx` | Single participant tile — handles video/avatar/loading states, overlay indicators (mic mute, hand raise, screen share, dominant speaker glow, host crown, kick button) |
| `VideoPlayer` | `components/video/VideoPlayer.jsx` | Thin wrapper around `<video>` — attaches MediaStream via `srcObject` |
| `AvatarFallback` | `components/video/AvatarFallback.jsx` | Shows initials on colored circle when camera is off. Stable color per name via hash |

### Controls
| Component | File | Purpose |
|---|---|---|
| `ControlBar` | `components/controls/ControlBar.jsx` | Bottom toolbar with all meeting controls. Two control groups separated by spacers, plus red leave button |
| `ControlButton` | (internal to ControlBar) | Single control button with active/inactive/danger/toggled states, badge support |

### Chat
| Component | File | Purpose |
|---|---|---|
| `ChatPanel` | `components/chat/ChatPanel.jsx` | Slide-out right panel — header, scrollable messages, chat input at bottom. Fetches history on first open |
| `ChatMessage` | `components/chat/ChatMessage.jsx` | Single message bubble — own vs other styling, sender name, timestamp |
| `ChatInput` | `components/chat/ChatInput.jsx` | Textarea with Enter-to-send, character limit (1000), counter at 80%+ |

### Participants
| Component | File | Purpose |
|---|---|---|
| `ParticipantsPanel` | `components/participants/ParticipantsPanel.jsx` | Slide-out right panel — sorted list (host first, then alpha), count badge in header |
| `ParticipantRow` | `components/participants/ParticipantRow.jsx` | Single participant row — avatar initial, name, mute/cam status icons, hand raise, host crown, kick button (hover reveal) |

### Notifications
| Component | File | Purpose |
|---|---|---|
| `NotificationStack` | `components/notifications/NotificationStack.jsx` | Fixed bottom-left stack of toast notifications. Each has dismiss button. Uses `aria-live="polite"` |

### Waiting / Admission
| Component | File | Purpose |
|---|---|---|
| `AdmissionPanel` | `components/waiting/AdmissionPanel.jsx` | Floating top-center panel (host-only). Lists waiting participants with Admit/Deny buttons |

### UI
| Component | File | Purpose |
|---|---|---|
| `SkeletonTile` | `components/ui/SkeletonTile.jsx` | Loading placeholder for tiles — shimmer animation, circle + text skeleton |
| `ConfirmDialog` | `components/ui/ConfirmDialog.jsx` | Modal dialog for "Leave meeting?" confirmation. Escape key, focus trap, backdrop blur |
| `CopyLinkButton` | `components/ui/CopyLinkButton.jsx` | Copy-to-clipboard button with Copied! feedback |

---

## Hooks (used in MeetingRoom)

| Hook | File | Purpose |
|---|---|---|
| `useWebRTC` | `hooks/useWebRTC.js` | Mesh WebRTC — manages peer connections, socket.io signaling, local/remote streams, screen share track replacement |
| `useChat` | `hooks/useChat.js` | Handles socket `chat-message` events, stores messages in `useChatStore` |
| `useParticipants` | `hooks/useParticipants.js` | Tracks join/leave, hand raise/lower, media state, waiting state, host status |
| `useNotifications` | `hooks/useNotifications.js` | Emits toast notifications for join/leave/hand-raise events |
| `useKeyboardShortcuts` | `hooks/useKeyboardShortcuts.js` | M (mic), V (cam), H (hand), Escape (close panels) |
| `useScreenShare` | `hooks/useScreenShare.js` | Starts/stops screen capture via `getDisplayMedia`, replaces video track with screen share |
| `useRecording` | `hooks/useRecording.js` | Starts/stops MediaRecorder (client-side recording) |

---

## Stores (Zustand)

| Store | File | State |
|---|---|---|
| `useAuthStore` | `store/useAuthStore.js` | token, userId, email, displayName, plus persist to localStorage |
| `useMeetingStore` | `store/useMeetingStore.js` | meetingId, localSocketId, participants{}, displayName, localStream, screenShareStream, remoteStreams{}, connectionStates{}, isMicOn, isCamOn, isHandRaised, isScreenSharing, isRecording, isBlurred, isHost, activeScreenShareSocketId, dominantSpeakerSocketId, mediaError, screenShareVersion |
| `useChatStore` | `store/useChatStore.js` | messages[], isChatOpen, unreadCount |
| `useUIStore` | `store/useUIStore.js` | isParticipantsOpen, isConfirmLeaveOpen, notifications[] |

---

## Current Design Tokens

Defined in `index.css` as CSS custom properties:

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#1a1a2e` | Page/screen backgrounds |
| `--color-surface` | `#232340` | Card, panel, tile backgrounds |
| `--color-surface-2` | `#2a2a4a` | (unused in most places) |
| `--color-elevated` | `#30305a` | (unused in most places) |
| `--color-border` | `rgba(255,255,255,0.08)` | Subtle borders on cards/panels |
| `--color-accent` | `#6366f1` | Primary buttons, active states, links |
| `--color-accent-hover` | `#4f46e5` | Button hover states |
| `--color-accent-soft` | `rgba(99,102,241,0.15)` | Subtle accent backgrounds |
| `--color-accent-muted` | `rgba(99,102,241,0.4)` | Disabled/less prominent accent |
| `--color-danger` | `#ef4444` | Leave button, mute indicators, errors |
| `--color-success` | `#22c55e` | (used in screen share indicator) |
| `--color-warning` | `#f59e0b` | Hand raise, admission panel |

Other Tailwind classes used directly:
- **Surfaces**: `bg-[#232340]` for cards/panels, `bg-[#1a1a2e]` for page bg, `bg-white/[0.08]` for subtle highlights
- **Borders**: `border-white/[0.06]`, `border-white/[0.08]`, `border-white/[0.1]`
- **Text**: `text-white`, `text-slate-300`, `text-slate-400`, `text-slate-500`, `text-slate-600`
- **Accent**: `bg-[#6366f1]`, `text-[#6366f1]`, `hover:bg-[#4f46e5]`
- **Rings**: `focus:ring-[#6366f1]/50`, `focus-visible:ring-[#6366f1]`, `ring-offset-[#1a1a2e]`
- **Shadows**: `shadow-lg shadow-[#6366f1]/25` for accent buttons, `shadow-2xl` for modals

---

## Screen Share Layout (Google Meet-inspired)

When someone shares their screen:

```
┌─────────────────────┬────────────┐
│                     │  Sidebar   │
│   Main screen       │  ┌──────┐  │
│   share area        │  │Tile  │  │
│   (flex-1)          │  │      │  │
│                     │  └──────┘  │
│   ┌──────────┐     │  ┌──────┐  │
│   │ PIP      │     │  │Tile  │  │
│   │ self-view│     │  │      │  │
│   └──────────┘     │  └──────┘  │
│   (bottom-right)   │  (w-52)    │
└─────────────────────┴────────────┘
```

- **Main area**: 70%+ of width, shows the screen share tile
- **PIP**: `w-44 h-28` self-view overlay when local user is sharing (absolute positioned bottom-right of main area)
- **Sidebar**: `w-52` (208px) vertical list of other participants' tiles, each `h-28`

When no screen share: standard CSS grid (`grid-cols-1` to `grid-cols-2` based on count).

---

## Design Patterns & Conventions

1. **Zustand over prop drilling** — Stores accessed directly in components that need them
2. **No comments** — Codebase convention is zero comments in JSX components
3. **Inline Tailwind** — No CSS modules or styled-components; everything is Tailwind utility classes
4. **Hardcoded color values** — Colors use `bg-[#232340]` etc. directly; CSS custom properties exist but are not consistently referenced
5. **Lucide icons** — All icons from `lucide-react`
6. **No TypesScript** — Plain JSX throughout
7. **Vitest + testing-library** — Unit tests co-located in `__tests__/` dirs
8. **Toast notifications** — Managed via `useUIStore.notifications[]` with auto-dismiss in `useNotifications` hook
9. **Slide-out panels** — Chat and Participants panels use `translate-x` transitions with `duration-300 ease-out`
10. **Backdrop blur** — `backdrop-blur-xl` on control bar, `backdrop-blur-sm` on dialog overlays

---

## Areas Open for Redesign

You have full freedom to redesign any/all of these:

1. **Color system** — Entire palette can change (navy-indigo was my choice, replace freely)
2. **Typography** —font, sizes, weights, letter-spacing
3. **Spacing & sizing** — Tile sizes, panel widths, padding/margin scale, border radii
4. **Layout** — Grid arrangements, sidebar behavior, PIP placement, control bar design
5. **Component styling** — Button shapes, hover effects, transitions, glassmorphism, shadows
6. **Animation system** - Entry/exit animations, tile transitions, panel slides
7. **Tile design** - Overlay style (current gradient bottom bar), indicator placements, aspect ratios
8. **Home page** — Hero section, feature grid, call-to-action styling
9. **Auth pages** — Card design, form field styling

**Constraints that must be preserved**:
- Tailwind CSS v4 (no CSS modules, no styled-components)
- Zustand stores (same API / state shape)
- Same component structure and props (if renaming, update all references)
- All routes and page components must remain functional
- Tests must pass (Vitest)
