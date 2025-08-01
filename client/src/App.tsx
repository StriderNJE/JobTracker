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
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: () => apiRequest('/api/jobs'),
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (jobData: any) => apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
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

  const handleSaveJob = (jobData: any) => {
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, data: jobData });
    } else {
      createJobMutation.mutate(jobData);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleDeleteJob = (id: number) => {
    if (window.confirm('Are you sure you want to delete this job entry?')) {
      deleteJobMutation.mutate(id);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingJob(undefined);
  };

  // Calculate totals - handle decimal fields properly
  const totalDesignFees = jobs.reduce((sum: number, job: Job) => sum + parseFloat(job.designFee || '0'), 0);
  const totalHours = jobs.reduce((sum: number, job: Job) => sum + parseFloat(job.hoursWorked || '0'), 0);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Jobs</h1>
          <p className="text-gray-600">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Job Entry Tracker</h1>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Total Jobs</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : jobs.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Total Hours</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalHours.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Total Design Fees</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `£${totalDesignFees.toFixed(2)}`}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={createJobMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {createJobMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add New Job
          </button>
        </div>

        {/* Job Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading jobs...</span>
            </div>
          ) : (
            <JobTable
              jobs={filteredJobs}
              onEdit={handleEditJob}
              onDelete={handleDeleteJob}
              isDeleting={(id: number) => deleteJobMutation.isPending && deleteJobMutation.variables === id}
            />
          )}
        </div>

        {/* Job Form Modal */}
        {showForm && (
          <JobForm
            job={editingJob}
            onSave={handleSaveJob}
            onCancel={handleCancelForm}
            isLoading={createJobMutation.isPending || updateJobMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

export default App;
