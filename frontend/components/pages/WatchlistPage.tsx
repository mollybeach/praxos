'use client';

export function WatchlistPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Watchlist Coming Soon</h2>
        <p className="text-slate-400">Save and track your favorite vaults here.</p>
      </div>
    </div>
  );
}

