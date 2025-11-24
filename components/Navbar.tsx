'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@/lib/types';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          user_metadata: data.user.user_metadata,
        });
      }
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl text-blue-400 hover:text-blue-300">
              📚 StudyPlanner
            </Link>
            {user && (
              <div className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-slate-300 hover:text-white transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/courses"
                  className="text-slate-300 hover:text-white transition"
                >
                  Courses
                </Link>
                <Link
                  href="/tasks"
                  className="text-slate-300 hover:text-white transition"
                >
                  Tasks
                </Link>
                <Link
                  href="/planner"
                  className="text-slate-300 hover:text-white transition"
                >
                  AI Planner
                </Link>
                <Link
                  href="/contribute"
                  className="text-slate-300 hover:text-white transition"
                >
                  Contribute
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <span className="text-sm text-slate-400">{user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-4 py-2 text-slate-300 hover:text-white transition"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
