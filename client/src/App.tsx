import React, { useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';
import Login from './components/login';
import MainAppContent from './MainAppContent';

interface JwtPayload {
  exp: number;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (token) {
      try {
        const decoded = jwt_decode<JwtPayload>(token);
        // Check if token is expired (exp is in seconds)
        if (decoded.exp * 1000 > Date.now()) {
          setIsLoggedIn(true);
        } else {
          // Token expired
          localStorage.removeItem('access_token');
          setIsLoggedIn(false);
        }
      } catch (error) {
        // Invalid token format
        localStorage.removeItem('access_token');
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <MainAppContent isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
