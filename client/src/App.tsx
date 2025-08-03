import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Job } from '@shared/schema';
import { queryClient } from './lib/queryClient'; // The apiRequest function will be modified later
import { JobForm } from './components/JobForm';
import { JobTable } from './components/JobTable';
import { SearchBar } from './components/SearchBar';
import { Plus, Briefcase, Loader2 } from 'lucide-react';
import Login from './components/Login';

// NEW: Define a new function that adds the Authorization header
const apiRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('access_token');
    const headers = {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
    };
    
    // Do not include the Authorization header if there is no token
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
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.reload(); // Force a reload to show the login form
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API request failed');
    }
    return response.json();
};

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | undefined>();
    const [searchTerm, setSearchTerm] = useState('');

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

    // --- All your original app logic will go here now, only if logged in ---
    const { data: jobs = [], isLoading, error, refetch } = useQuery({
        queryKey: ['/api/jobs'],
        queryFn: () => apiRequest('/api/jobs'),
        enabled: isLoggedIn, // Only fetch data if the user is logged in
    });

    const createJobMutation = useMutation({
        mutationFn: (jobData: any) =>
            apiRequest('/api/jobs', {
                method: 'POST',
                body: JSON.stringify(jobData),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
            refetch();
            setShowForm(false);
            setEditingJob(undefined);
        },
    });

    const updateJobMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiRequest(`/api/jobs/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
            refetch();
            setShowForm(false);
            setEditingJob(undefined);
        },
    });

    const deleteJobMutation = useMutation({
        mutationFn: (id: number) =>
            apiRequest(`/api/jobs/${id}`, {
                method: 'DELETE',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
            refetch();
        },
    });

    const filteredJobs = useMemo(() => {
        if (!searchTerm) return jobs;
        const term = searchTerm.toLowerCase();
        return jobs.filter(
            (job: Job) =>
                job.jobNumber.toLowerCase().includes(term) ||
                job.clientName.toLowerCase().includes(term) ||
                job.jobRef.toLowerCase().includes(term)
        );
    }, [jobs, searchTerm]);

    const handleSaveJob = async (formData: any) => {
        const jobData = {
            jobNumber: formData.jobNumber,
            clientName: formData.clientName,
            jobRef: formData.jobRef,
            m2Area: parseFloat(formData.m2Area),
            hoursWorked: parseFloat(formData.hoursWorked),
            designFee: parseFloat(formData.designFee),
        };
        for (const [key, value] of Object.entries(jobData)) {
            if (
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '') ||
                (typeof value === 'number' && isNaN(value))
            ) {
                alert(`Invalid or missing value for ${key}`);
                return;
            }
        }
        try {
            if (editingJob) {
                await updateJobMutation.mutateAsync({ id: editingJob.id, data: jobData });
            } else {
                await createJobMutation.mutateAsync(jobData);
            }
            setShowForm(false);
            setEditingJob(undefined);
            refetch();
        } catch (error) {
            console.error('Failed to save job:', error);
            alert('Failed to save job. Please check console for details.');
        }
    };

    const handleDeleteJob = (id: number) => {
        if (confirm('Are you sure you want to delete this job?')) {
            deleteJobMutation.mutate(id);
        }
    };

    // --- All your original JSX rendering will go here now, only if logged in ---
    const MainAppContent = () => (
        <>
            <div className="min-h-screen bg-gray-50 p-6">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-8 h-8" />
                        Job Tracker
                    </h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                        <button
                            onClick={() => {
                                setEditingJob(undefined);
                                setShowForm(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Job
                        </button>
                    </div>
                </header>

                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : error ? (
                    <p className="text-red-600 text-center">Failed to load jobs.</p>
                ) : (
                    <JobTable
                        jobs={filteredJobs}
                        onEdit={(job) => {
                            setEditingJob(job);
                            setShowForm(true);
                        }}
                        onDelete={handleDeleteJob}
                    />
                )}

                {showForm && (
                    <JobForm
                        job={editingJob}
                        onSave={handleSaveJob}
                        onCancel={() => setShowForm(false)}
                        isLoading={createJobMutation.isLoading || updateJobMutation.isLoading}
                    />
                )}
            </div>
        </>
    );

    return (
        <div className="App">
            {isLoggedIn ? (
                <MainAppContent />
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;
