export default function ContributePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl bg-slate-900 border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Contribute</h1>
        <p className="text-slate-300 mb-4">Thanks for wanting to contribute! You can help by:</p>
        <ul className="list-disc pl-5 text-slate-300 space-y-2">
          <li>Opening issues for bugs or feature requests.</li>
          <li>Sending small PRs: docs, UI tweaks, accessibility fixes.</li>
          <li>Improving tests or adding migrations (see <code>db/</code>).</li>
        </ul>
        <p className="text-slate-400 mt-4">This page exists to avoid a broken link and give contributors guidance.</p>
      </div>
    </main>
  );
}
