// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import jwt_decode from "jwt-decode";
import Login from "./components/login";
import MainAppContent from "./MainAppContent";

interface JwtPayload {
  exp: number;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwt_decode<JwtPayload>(token);
        if (decoded.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          return;
        }
      } catch {
        // Invalid token
      }
    }
    setIsAuthenticated(false);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />
        <Route
          path="/data-entry"
          element={
            <RequireAuth>
              <MainAppContentWrapper />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function LoginWrapper() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate("/data-entry", { replace: true });
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

function MainAppContentWrapper() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  };

  return <MainAppContent isLoggedIn={true} handleLogout={handleLogout} />;
}

export default App;
