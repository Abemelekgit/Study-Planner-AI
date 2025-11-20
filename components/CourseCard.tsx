'use client';

import { Course } from '@/lib/types';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
  taskCount?: number;
}

export function CourseCard({ course, taskCount = 0 }: CourseCardProps) {
  const bgColor = course.color || 'bg-blue-600';

  return (
    <Link href={`/courses/${course.id}`}>
      <div className={`${bgColor} rounded-lg p-6 cursor-pointer hover:shadow-lg transition transform hover:scale-105`}>
        <h3 className="text-xl font-bold text-white mb-2">{course.name}</h3>
        {course.code && <p className="text-sm text-gray-200 mb-2">{course.code}</p>}
        <div className="flex justify-between items-end">
          <p className="text-sm text-gray-100">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </p>
          {course.target_hours_per_week && (
            <p className="text-xs text-gray-200">
              {course.target_hours_per_week}h/week
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
