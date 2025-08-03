import { QueryClient } from '@tanstack/react-query';

// Make sure the API_BASE_URL is correct
const API_BASE_URL = "https://jobtracker-backend-dwwh.onrender.com/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 0, // Always refetch when data is requested
      gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
    },
  },
});

/**
 * A custom fetch wrapper that adds the Authorization header to all requests.
 * It also handles 401 Unauthorized responses by clearing the token and reloading the page.
 * @param url The API endpoint URL.
 * @param options The fetch options (method, body, etc.).
 * @returns The JSON response.
 */
export const apiRequest = async (url: string, options: RequestInit = {}) => {
    // Retrieve the token from local storage
    const token = localStorage.getItem('access_token');
    
    // Create headers object and add the Authorization header if a token exists
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
    };
    
    // If no token exists, remove the Authorization header to prevent sending an empty header
    if (!token) {
        delete headers['Authorization'];
    }

    // If URL starts with /api, replace with full external URL
    const fullUrl = url.startsWith('/api') ? url.replace('/api', API_BASE_URL) : url;

    const response = await fetch(fullUrl, {
        ...options,
        headers,
    });

    // If the response is not okay, handle specific errors
    if (!response.ok) {
        // If the status is 401 Unauthorized, clear the token and force a page reload
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.reload();
        }
        // Parse the error and throw it
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response.json();
};

// Set up default query function
queryClient.setQueryDefaults(['default'], {
  queryFn: ({ queryKey }) => {
    const [url] = queryKey as [string, ...any[]];
    return apiRequest(url);
  },
});
