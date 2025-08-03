import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import MainAppContent from './MainAppContent'; // Import the new component

// NEW: Define a new function that adds the Authorization header
const apiRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('access_token');
    const headers = {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
    };
    
    if (!token) {
        delete headers['Authorization'];
    }

    const response = await fetch(
        `https://jobtracker-backend-dwwh.onrender.com${url}`,
        {
            ...options,
            headers,
        }
    );

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.reload();
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API request failed');
    }
    return response.json();
};

export { apiRequest }; // Export it so other files can use it

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setIsLoggedIn(true);
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
                <MainAppContent handleLogout={handleLogout} />
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;
