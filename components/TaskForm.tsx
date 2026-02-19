'use client';

import { Task, TaskStatus, TaskPriority, TaskType } from '@/lib/types';
import { useState } from 'react';

interface TaskFormProps {
  courseId: string;
  onSubmit: (data: {
    title: string;
    description?: string;
    type: TaskType;
    priority: TaskPriority;
    due_date?: string;
    estimated_hours?: number;
  }) => Promise<void>;
  initialData?: Partial<Task>;
  isLoading?: boolean;
}

export function TaskForm({
  courseId,
  onSubmit,
  initialData,
  isLoading = false,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<TaskType>(initialData?.type || 'homework');
  const [priority, setPriority] = useState<TaskPriority>(
    initialData?.priority || 'medium'
  );
  const [dueDate, setDueDate] = useState(
    initialData?.due_date ? initialData.due_date.split('T')[0] : ''
  );
  const [estimatedHours, setEstimatedHours] = useState(
    initialData?.estimated_hours?.toString() || ''
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const normalizedEstimatedHours = estimatedHours ? Number(estimatedHours) : undefined;

    if (!trimmedTitle) {
      setError('Task title is required');
      return;
    }

    if (normalizedEstimatedHours !== undefined && normalizedEstimatedHours < 0) {
      setError('Estimated hours must be 0 or greater');
      return;
    }

    try {
      await onSubmit({
        title: trimmedTitle,
        description: trimmedDescription || undefined,
        type,
        priority,
        due_date: dueDate ? new Date(`${dueDate}T00:00:00Z`).toISOString() : undefined,
        estimated_hours: normalizedEstimatedHours,
      });
      if (!initialData) {
        // Reset form after create
        setTitle('');
        setDescription('');
        setType('homework');
        setPriority('medium');
        setDueDate('');
        setEstimatedHours('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">
        {initialData ? 'Edit Task' : 'Create New Task'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-100 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="e.g., Read Chapter 5"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Optional notes..."
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="homework">Homework</option>
              <option value="reading">Reading</option>
              <option value="exam">Exam</option>
              <option value="project">Project</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estimated Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="e.g., 2"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded font-medium transition"
        >
          {isLoading ? 'Saving...' : 'Save Task'}
        </button>
      </div>
    </form>
  );
}
