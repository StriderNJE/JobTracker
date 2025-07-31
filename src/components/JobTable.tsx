import React from 'react';
import { Job } from '../types/Job';
import { Edit, Trash2 } from 'lucide-react';

interface JobTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
}

export function JobTable({ jobs, onEdit, onDelete }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No job entries found</p>
        <p className="text-sm">Add your first job entry to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job Ref
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              M² Area
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hours Worked
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Design Fee (£)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {job.jobNumber}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {job.clientName}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {job.jobRef}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {job.m2Area.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {job.hoursWorked.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                £{job.designFee.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(job)}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                    title="Edit job"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(job.id)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                    title="Delete job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}