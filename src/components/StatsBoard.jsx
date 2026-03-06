import React from 'react';

const StatsBoard = ({ stats }) => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50">
                <p className="text-sm font-medium text-slate-400 mb-2">Active Opportunities</p>
                <h2 className="text-4xl font-bold text-blue-400">{stats.active}</h2>
            </div>

            <div className="col-span-1 md:col-span-2 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50">
                <p className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wide">AI Research Briefing</p>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {stats.briefing}
                </p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50">
                <p className="text-sm font-medium text-slate-400 mb-2">Total Tracked</p>
                <h2 className="text-4xl font-bold text-slate-200">{stats.total}</h2>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50 mt-6 lg:mt-0 col-span-1 md:col-span-2 lg:col-span-4 max-w-sm mx-auto w-full lg:max-w-none lg:w-auto lg:hidden">
                <p className="text-sm font-medium text-slate-400 mb-2">Closing Soon</p>
                <h2 className="text-4xl font-bold text-red-500">{stats.closingSoon}</h2>
            </div>

            <div className="hidden lg:block bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50">
                <p className="text-sm font-medium text-slate-400 mb-2">Closing Soon</p>
                <h2 className="text-4xl font-bold text-red-500">{stats.closingSoon}</h2>
            </div>
        </section>
    );
};

export default StatsBoard;
