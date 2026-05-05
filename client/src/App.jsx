import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PreJoinLobby from './pages/PreJoinLobby';
import MeetingRoom from './pages/MeetingRoom';
import WaitingRoom from './pages/WaitingRoom';
import RemovedScreen from './pages/RemovedScreen';
import MeetingNotFound from './pages/MeetingNotFound';

// Guard: redirect to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-blue-500/30">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/meeting/:meetingId" element={<PreJoinLobby />} />
        <Route
          path="/meeting/:meetingId/room"
          element={
            <ProtectedRoute>
              <MeetingRoom />
            </ProtectedRoute>
          }
        />
        <Route path="/waiting/:meetingId" element={<WaitingRoom />} />
        <Route path="/removed" element={<RemovedScreen />} />
        <Route path="/meeting-not-found" element={<MeetingNotFound />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
