'use client';

export function TradingPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Trading Coming Soon</h2>
        <p className="text-slate-400">Advanced trading features will be available here.</p>
      </div>
    </div>
  );
}

