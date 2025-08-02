import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Job } from '@shared/schema';
import { queryClient, apiRequest } from './lib/queryClient';
import { JobForm } from './components/JobForm';
import { JobTable } from './components/JobTable';
import { SearchBar } from './components/SearchBar';
import { Plus, Briefcase, Loader2 } from 'lucide-react';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch jobs from API
  const { data: jobs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: () => apiRequest('/api/jobs'),
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (jobData: any) => apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      refetch(); // Force immediate refetch
      setShowForm(false);
      setEditingJob(undefined);
    },
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      refetch(); // Force immediate refetch
      setShowForm(false);
      setEditingJob(undefined);
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/jobs/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      refetch(); // Force immediate refetch
    },
  });

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    
    const term = searchTerm.toLowerCase();
    return jobs.filter((job: Job) =>
      job.jobNumber.toLowerCase().includes(term) ||
      job.clientName.toLowerCase().includes(term) ||
      job.jobRef.toLowerCase().includes(term)
    );
  }, [jobs, searchTerm]);

  const handleSaveJob = async (formData: any) => {
    // Convert numeric fields to numbers before sending to backend
    const jobData = {
      jobNumber: formData.jobNumber,
      clientName: formData.clientName,
      jobRef: formData.jobRef,
      m2Area: parseFloat(formData.m2Area),
      hoursWorked: parseFloat(formData.hoursWorked),
      designFee: parseFloat(formData.designFee),
    };

    try {
      if (editingJob) {
        await updateJobMutation.mutateAsync({ id: editingJob.id, data: jobData });
        console.log("Job updated successfully");
      } else {
        await createJobMutation.mutateAsync(jobData);
        console.log("Job created successfully");
      }
      setShowForm(false);
      setEditingJob(undefined);
      refetch();
    } catch (error) {
      console.error("Failed to save job:", error);
      alert("Failed to save job. Please check console for details.");
    }
  };

  const handleDeleteJob = (id: number) => {
    if (confirm('Are you sure you want to delete this job?')) {
      deleteJobMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-8 h-8" />
          Job Tracker
        </h1>
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
  );
}

export default App;
