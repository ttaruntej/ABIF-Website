import React from 'react';

const Header = ({
    currentView,
    setCurrentView,
    handleExportCSV,
    handleRefresh,
    isRefreshing,
    lastUpdated
}) => {
    return (
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <div className="flex flex-col text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    ABIF
                </h1>
                <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase mt-1">
                    Opportunities Tracker
                </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full">
                    {/* View Toggle */}
                    <button
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 border ${currentView === 'dashboard'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                        onClick={() => setCurrentView(currentView === 'dashboard' ? 'archive' : 'dashboard')}
                    >
                        {currentView === 'dashboard' ? '🗄️ View Archive' : '📊 Back to Dashboard'}
                    </button>

                    {/* Export */}
                    <button
                        className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 border bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        onClick={handleExportCSV}
                    >
                        📥 Export CSV
                    </button>

                    {/* Refresh */}
                    <button
                        className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Update
                    </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                    Last Refreshed: {lastUpdated}
                </div>
            </div>
        </header>
    );
};

export default Header;
