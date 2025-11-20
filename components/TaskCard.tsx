'use client';

import { Task } from '@/lib/types';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  courseName?: string;
  onStatusChange?: (taskId: string, newStatus: Task['status']) => Promise<void>;
}

const statusColors: Record<Task['status'], string> = {
  todo: 'bg-slate-700',
  in_progress: 'bg-yellow-700',
  done: 'bg-green-700',
};

const priorityColors: Record<Task['priority'], string> = {
  low: 'text-blue-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const statusLabels: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export function TaskCard({
  task,
  courseName,
  onStatusChange,
}: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!onStatusChange) return;
    setIsLoading(true);
    try {
      await onStatusChange(task.id, newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString()
    : 'No due date';

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-white flex-1">{task.title}</h3>
        <span className={`text-xs font-bold ${priorityColors[task.priority]}`}>
          {task.priority.toUpperCase()}
        </span>
      </div>

      {courseName && (
        <p className="text-sm text-slate-400 mb-2">{courseName}</p>
      )}

      {task.description && (
        <p className="text-sm text-slate-300 mb-3">{task.description}</p>
      )}

      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-slate-400">{dueDate}</span>
        {task.estimated_hours && (
          <span className="text-xs text-slate-400">
            ⏱ {task.estimated_hours}h
          </span>
        )}
      </div>

      {onStatusChange && (
        <div className="flex gap-2">
          {(['todo', 'in_progress', 'done'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isLoading || task.status === status}
              className={`flex-1 text-xs py-1 rounded transition ${
                task.status === status
                  ? `${statusColors[status]} text-white font-semibold`
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              } disabled:opacity-50`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
