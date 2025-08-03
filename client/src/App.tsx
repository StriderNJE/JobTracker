import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import MainAppContent from './MainAppContent'; // Import the new component

/**
 * A custom fetch wrapper that adds the Authorization header to all requests.
 * It also handles 401 Unauthorized responses by clearing the token and reloading the page.
 * @param url The API endpoint URL.
 * @param options The fetch options (method, body, etc.).
 * @returns The JSON response.
 */
const apiRequest = async (url: string, options: RequestInit = {}) => {
    // Retrieve the token from local storage
    const token = localStorage.getItem('access_token');
    
    // Create headers object and add the Authorization header if a token exists
    const headers = {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
    };
    
    // If no token exists, remove the Authorization header to prevent sending an empty header
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

    // If the response is not okay, handle specific errors
    if (!response.ok) {
        // If the status is 401 Unauthorized, clear the token and force a page reload
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.reload();
        }
        // Parse the error and throw it
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API request failed');
    }
    
    return response.json();
};

export { apiRequest }; // Export it so other files (like MainAppContent) can use it

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
