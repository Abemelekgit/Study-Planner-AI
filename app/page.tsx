import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-slate-950 min-h-screen">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              AI-Powered Study Planner
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Organize your courses, manage your tasks, and let AI help you create
              the perfect study schedule. Build better study habits with our intelligent planner.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
              >
                Log In
              </Link>
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-bold text-white mb-2">Organize Courses</h3>
              <p className="text-slate-400">
                Create courses for all your classes and assign color tags for easy tracking.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-white mb-2">Manage Tasks</h3>
              <p className="text-slate-400">
                Break down assignments into actionable tasks with priorities and due dates.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-lg font-bold text-white mb-2">AI Planning</h3>
              <p className="text-slate-400">
                Generate optimized weekly study plans powered by AI based on your tasks.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
