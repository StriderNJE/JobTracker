import { QueryClient } from '@tanstack/react-query';

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

// Default fetcher that works with our backend
export const apiRequest = async (url: string, options?: RequestInit) => {
  // If URL starts with /api, replace with full external URL
  const fullUrl = url.startsWith('/api') ? url.replace('/api', API_BASE_URL) : url;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
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