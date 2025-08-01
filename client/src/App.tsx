import React from 'react';
import { useState, useMemo } from 'react';
import { Job } from './types/Job';
import { useLocalStorage } from './hooks/useLocalStorage';
import { JobForm } from './components/JobForm';
import { JobTable } from './components/JobTable';
import { SearchBar } from './components/SearchBar';
import { Plus, Briefcase } from 'lucide-react';

function App() {
  const [jobs, setJobs] = useLocalStorage<Job[]>('yourwebsite-jobTracker', []);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    
    const term = searchTerm.toLowerCase();
    return jobs.filter(job =>
      job.jobNumber.toLowerCase().includes(term) ||
      job.clientName.toLowerCase().includes(term) ||
      job.jobRef.toLowerCase().includes(term)
    );
  }, [jobs, searchTerm]);

  const handleSaveJob = (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    
    if (editingJob) {
      // Update existing job
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === editingJob.id
            ? { ...jobData, id: editingJob.id, createdAt: editingJob.createdAt, updatedAt: now }
            : job
        )
      );
    } else {
      // Add new job
      const newJob: Job = {
        ...jobData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setJobs(prevJobs => [...prevJobs, newJob]);
    }
    
    setShowForm(false);
    setEditingJob(undefined);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleDeleteJob = (id: string) => {
    if (window.confirm('Are you sure you want to delete this job entry?')) {
      setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingJob(undefined);
  };

  const totalDesignFees = jobs.reduce((sum, job) => sum + job.designFee, 0);
  const totalHours = jobs.reduce((sum, job) => sum + job.hoursWorked, 0);

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
              <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Total Hours</div>
              <div className="text-2xl font-bold text-gray-900">{totalHours.toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Total Design Fees</div>
              <div className="text-2xl font-bold text-gray-900">£{totalDesignFees.toFixed(2)}</div>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add New Job
          </button>
        </div>

        {/* Job Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <JobTable
            jobs={filteredJobs}
            onEdit={handleEditJob}
            onDelete={handleDeleteJob}
          />
        </div>

        {/* Job Form Modal */}
        {showForm && (
          <JobForm
            job={editingJob}
            onSave={handleSaveJob}
            onCancel={handleCancelForm}
          />
        )}
      </div>
    </div>
  );
}

export default App;
