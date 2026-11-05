import { Navigate, Route, Routes } from 'react-router-dom';
import { hasSession } from './lib/api';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={hasSession() ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
