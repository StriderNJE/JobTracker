import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import MainAppContent from './MainAppContent'; // Import the new component
import { apiRequest } from './lib/queryClient'; // Import apiRequest from the centralized location

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // Use a useEffect hook to check for the token when the component mounts
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    // Callback function to set isLoggedIn to true after a successful login
    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    // Callback function to handle logout
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        setIsLoggedIn(false);
    };

    return (
        <div className="App">
            {isLoggedIn ? (
                // If logged in, render the main application content
                <MainAppContent isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
            ) : (
                // If not logged in, render the login form
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;
