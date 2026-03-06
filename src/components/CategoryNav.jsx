import React from 'react';
import { CATEGORIES, CAT_STYLES } from '../constants/tracker';

const CategoryNav = ({
    activeCategory,
    setActiveCategory,
    catCounts,
    activeSector,
    setActiveSector,
    availableSectors,
    visibleSections,
    scrollToSection
}) => {
    return (
        <nav className="sticky top-6 z-50 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 md:p-5 mb-8 flex flex-col gap-4 shadow-2xl">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map(cat => {
                    const isActive = activeCategory === cat.key;
                    const activeStyle = CAT_STYLES[cat.key] || CAT_STYLES.all;

                    return (
                        <button
                            key={cat.key}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${isActive
                                ? activeStyle
                                : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800/70 hover:-translate-y-0.5'
                                }`}
                            onClick={() => setActiveCategory(cat.key)}
                        >
                            <span className="text-base">{cat.icon}</span>
                            <span className="font-semibold">{cat.label}</span>
                            <span className="bg-slate-800 border border-slate-700 text-[0.65rem] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center ml-1">
                                {catCounts[cat.key]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Sector Filters */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700/50 border-dashed">
                <button
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-300 ${activeSector === 'All Sectors'
                        ? 'bg-slate-700/50 text-slate-200 border-slate-500'
                        : 'bg-transparent border-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                    onClick={() => setActiveSector('All Sectors')}
                >
                    All Sectors
                </button>
                {availableSectors.map(sec => (
                    <button
                        key={sec}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-300 ${activeSector === sec
                            ? 'bg-slate-700/50 text-slate-200 border-slate-500'
                            : 'bg-transparent border-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                            }`}
                        onClick={() => setActiveSector(sec)}
                    >
                        {sec}
                    </button>
                ))}
            </div>

            {/* Quick Jumps */}
            {visibleSections.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-700/50">
                    <span className="text-[0.7rem] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                        Jump to:
                    </span>
                    {visibleSections.map(s => (
                        <button
                            key={s.key}
                            className="inline-flex items-center gap-1.5 bg-transparent border border-slate-700/50 text-slate-400 text-xs font-medium px-3 py-1 rounded-full cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10"
                            onClick={() => scrollToSection(s.key)}
                        >
                            {s.label.split(' ').slice(0, 2).join(' ')}
                            <span className="bg-slate-800 border border-slate-700 text-[0.6rem] font-bold px-1.5 py-0.5 rounded-md ml-1">
                                {s.items.length}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default CategoryNav;
