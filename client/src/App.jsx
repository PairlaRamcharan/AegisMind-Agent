import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Telemetry from './pages/Telemetry';
import Quarantine from './pages/Quarantine';
import Remediation from './pages/Remediation';
import Settings from './pages/Settings';
import { authApi } from './services/api';

function ProtectedLayout({ user, onLogout, zeroTrustActive, onToggleZeroTrust }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        user={user}
        onLogout={onLogout}
        zeroTrustActive={zeroTrustActive}
        onToggleZeroTrust={onToggleZeroTrust}
      />
      <div className="flex flex-1">
        <Sidebar threatCount={3} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/telemetry" element={<Telemetry />} />
            <Route path="/quarantine" element={<Quarantine />} />
            <Route path="/remediation" element={<Remediation />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [zeroTrustActive, setZeroTrustActive] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      authApi.me()
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={(u) => setUser(u)} />}
        />
        <Route
          path="/*"
          element={
            <ProtectedLayout
              user={user}
              onLogout={handleLogout}
              zeroTrustActive={zeroTrustActive}
              onToggleZeroTrust={() => setZeroTrustActive(!zeroTrustActive)}
            />
          }
        />
      </Routes>
    </Router>
  );
}
