'use client';

import { Course } from '@/lib/types';
import { useState } from 'react';

interface CourseFormProps {
  onSubmit: (data: {
    name: string;
    code?: string;
    color?: string;
    target_hours_per_week?: number;
  }) => Promise<void>;
  initialData?: Partial<Course>;
  isLoading?: boolean;
}

const colorOptions = [
  { name: 'Blue', value: 'bg-blue-600' },
  { name: 'Purple', value: 'bg-purple-600' },
  { name: 'Pink', value: 'bg-pink-600' },
  { name: 'Red', value: 'bg-red-600' },
  { name: 'Orange', value: 'bg-orange-600' },
  { name: 'Yellow', value: 'bg-yellow-600' },
  { name: 'Green', value: 'bg-green-600' },
  { name: 'Teal', value: 'bg-teal-600' },
  { name: 'Cyan', value: 'bg-cyan-600' },
  { name: 'Indigo', value: 'bg-indigo-600' },
];

export function CourseForm({
  onSubmit,
  initialData,
  isLoading = false,
}: CourseFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [color, setColor] = useState(initialData?.color || 'bg-blue-600');
  const [targetHours, setTargetHours] = useState(
    initialData?.target_hours_per_week?.toString() || ''
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    const normalizedTargetHours = targetHours ? Number(targetHours) : undefined;

    if (!trimmedName) {
      setError('Course name is required');
      return;
    }

    if (normalizedTargetHours !== undefined) {
      if (normalizedTargetHours < 0 || normalizedTargetHours > 168) {
        setError('Target hours must be between 0 and 168');
        return;
      }
    }

    try {
      await onSubmit({
        name: trimmedName,
        code: trimmedCode || undefined,
        color: color || undefined,
        target_hours_per_week: normalizedTargetHours,
      });
      // Reset form
      setName('');
      setCode('');
      setColor('bg-blue-600');
      setTargetHours('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">
        {initialData ? 'Edit Course' : 'Create New Course'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-100 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Course Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="e.g., Econometrics"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Course Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="e.g., ECON 101"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColor(option.value)}
                className={`h-10 rounded border-2 transition ${
                  color === option.value
                    ? 'border-white'
                    : 'border-slate-600'
                } ${option.value}`}
                title={option.name}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Target Hours per Week
          </label>
          <input
            type="number"
            min="0"
            max="168"
            step="0.5"
            value={targetHours}
            onChange={(e) => setTargetHours(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="e.g., 5"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded font-medium transition"
        >
          {isLoading ? 'Saving...' : 'Save Course'}
        </button>
      </div>
    </form>
  );
}
