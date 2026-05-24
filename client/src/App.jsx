import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { AppLayout } from './pages/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RoomPage } from './pages/RoomPage';
import { SignupPage } from './pages/SignupPage';
import { WelcomePage } from './pages/WelcomePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<WelcomePage />} />
          <Route path="rooms/:roomId" element={<RoomPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
