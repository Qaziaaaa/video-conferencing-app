import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PreJoinLobby from './pages/PreJoinLobby';
import MeetingRoom from './pages/MeetingRoom';
import WaitingRoom from './pages/WaitingRoom';
import RemovedScreen from './pages/RemovedScreen';
import MeetingNotFound from './pages/MeetingNotFound';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-base text-white font-sans selection:bg-accent/30">
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
