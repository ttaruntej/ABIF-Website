import React, { useState, useEffect, useRef } from 'react';
import './index.css';

import { fetchOpportunities, triggerScraper, getScraperStatus } from './services/api';
import { exportToCSV } from './utils/csvExporter';
import { generateBriefing } from './utils/aiBriefing';
import { SECTIONS, CATEGORIES } from './constants/tracker';

import Header from './components/Header';
import StatsBoard from './components/StatsBoard';
import CategoryNav from './components/CategoryNav';
import SchemeCard from './components/SchemeCard';
import EmptyState from './components/EmptyState';

const Dashboard = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, active: 0, closingSoon: 0, briefing: "Generating insights..." });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshSuccess, setRefreshSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [activeAudience, setActiveAudience] = useState('startup');
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeSector, setActiveSector] = useState('All Sectors');
    const [currentView, setCurrentView] = useState('dashboard');
    const [lastUpdated, setLastUpdated] = useState(
        `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    );
    const [serverStatus, setServerStatus] = useState(null); // 'in_progress', 'completed', etc.
    const [syncStartTime, setSyncStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const sectionRefs = useRef({});

    const loadData = () => {
        fetchOpportunities()
            .then(data => {
                setOpportunities(data);
                const active = data.filter(o => ['Open', 'Rolling', 'Coming Soon'].includes(o.status)).length;
                const closing = data.filter(o => o.status === 'Closing Soon').length;
                const dynamicBriefing = generateBriefing(data);
                setStats({ total: data.length, active, closingSoon: closing, briefing: dynamicBriefing });
                setError(null);
                setLoading(false);
                setLastUpdated(
                    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                );

                setRefreshSuccess(true);
                setTimeout(() => {
                    setIsRefreshing(false);
                    setRefreshSuccess(false);
                }, 1500);
            })
            .catch(err => {
                console.error('Failed to fetch opportunities:', err);
                setError(err.message);
                setLoading(false);
                setIsRefreshing(false);
                setRefreshSuccess(false);
            });
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        let timer;
        if (isRefreshing && !refreshSuccess && countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (isRefreshing && !refreshSuccess && countdown === 0) {
            loadData();
        }
        return () => clearTimeout(timer);
    }, [isRefreshing, countdown, refreshSuccess]);

    useEffect(() => {
        let interval;
        if (isRefreshing && !refreshSuccess) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - syncStartTime) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [isRefreshing, refreshSuccess, syncStartTime]);

    const handleRefresh = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        setRefreshSuccess(false);
        setServerStatus('queued');
        setSyncStartTime(Date.now());

        try {
            await triggerScraper();

            // Poll for real status
            const pollInterval = setInterval(async () => {
                try {
                    const statusData = await getScraperStatus();
                    setServerStatus(statusData.status);

                    if (statusData.status === 'completed') {
                        clearInterval(pollInterval);
                        loadData();
                    }
                } catch (e) {
                    console.error('Polling error:', e);
                }
            }, 5000);

            setTimeout(() => clearInterval(pollInterval), 600000);

        } catch (err) {
            console.error('Trigger failed:', err.message);
            setIsRefreshing(false);
        }
    };

    const scrollToSection = (key) => {
        const el = sectionRefs.current[key];
        if (el) {
            const yOffset = -120; // Offset for sticky nav
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-emerald-400 font-medium">
            Loading ABIF Funding Tracker...
        </div>
    );

    // Filter by Audience Toggle
    const filteredByAudience = activeAudience === 'all'
        ? opportunities
        : opportunities.filter(o => o.targetAudience?.includes(activeAudience));

    const availableSectors = Array.from(new Set(filteredByAudience.flatMap(o => o.sectors || []))).sort();

    // Filter by Sector Dropdown/Pills
    const filteredBySector = activeSector === 'All Sectors'
        ? filteredByAudience
        : filteredByAudience.filter(o => o.sectors?.includes(activeSector));

    // Filter by Category Nav
    const filtered = activeCategory === 'all'
        ? filteredBySector
        : filteredBySector.filter(o => (o.category || '').toLowerCase() === activeCategory);

    const verifiedCount = filtered.filter(o => o.linkStatus === 'verified').length;
    const probableCount = filtered.filter(o => o.linkStatus === 'probable').length;
    const showCategoryBadge = activeCategory === 'all';

    const catCounts = {};
    CATEGORIES.forEach(c => {
        catCounts[c.key] = c.key === 'all'
            ? filteredBySector.length
            : filteredBySector.filter(o => o.category === c.key).length;
    });

    const visibleSections = SECTIONS.map(s => ({
        ...s,
        items: filtered.filter(s.filter),
    })).filter(s => s.items.length > 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6 pb-20 relative">

                {error && (
                    <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 mb-6 text-red-400 text-sm flex items-center justify-between z-50 relative">
                        <div>⚠️ <strong>Could not load latest data:</strong> {error}</div>
                        <button onClick={loadData} className="px-3 py-1 border border-red-500/50 rounded hover:bg-red-500/10 transition-colors">Retry</button>
                    </div>
                )}

                {isRefreshing && (
                    <div className="fixed top-8 right-8 z-[100]">
                        <div className="bg-slate-800 border border-slate-700/80 shadow-2xl rounded-2xl p-5 w-[320px] transition-all animate-in slide-in-from-right-8 fade-in duration-300">
                            {refreshSuccess ? (
                                <div className="flex items-center gap-4 animate-in zoom-in-95 duration-300">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">✓</div>
                                    <div>
                                        <h3 className="font-bold text-emerald-400 m-0">Sync Commanded!</h3>
                                        <p className="text-xs text-slate-400 m-0">The scraper is starting on the server. Updates will appear in ~5 mins.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-4 text-slate-200">
                                        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin"></div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sm m-0">
                                                {serverStatus === 'in_progress' ? 'Scraping Live Data...' : 'Initializing Server...'}
                                            </h3>
                                            <p className="text-xs text-slate-400 m-0">
                                                {serverStatus === 'in_progress'
                                                    ? 'Reading BIRAC & DST Portals (~2-4 mins)'
                                                    : 'Connecting to GitHub Infrastructure...'}
                                            </p>
                                        </div>
                                        <span className="font-mono text-emerald-500 text-sm">
                                            {elapsedTime}s
                                        </span>
                                    </div>
                                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]`}
                                            style={{ width: serverStatus === 'in_progress' ? '75%' : '25%' }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Header
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    handleExportCSV={() => exportToCSV(filtered)}
                    handleRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    lastUpdated={lastUpdated}
                />

                {currentView === 'dashboard' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* Audience Toggle */}
                        <div className="flex justify-center gap-2 mb-10 p-1.5 bg-slate-900 border border-slate-800 rounded-full w-fit mx-auto shadow-lg">
                            <button
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeAudience === 'startup' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                onClick={() => { setActiveAudience('startup'); setActiveSector('All Sectors'); }}
                            >
                                🚀 For My Startups
                            </button>
                            <button
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeAudience === 'incubator' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                onClick={() => { setActiveAudience('incubator'); setActiveSector('All Sectors'); }}
                            >
                                🏢 For My Incubator
                            </button>
                            <button
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeAudience === 'all' ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'text-slate-500 hover:text-slate-300'}`}
                                onClick={() => { setActiveAudience('all'); setActiveSector('All Sectors'); }}
                            >
                                <span className={activeAudience === 'all' ? 'text-emerald-400' : 'text-slate-500'}>🌐</span> All Grants
                            </button>
                        </div>

                        <StatsBoard stats={stats} />

                        <CategoryNav
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            catCounts={catCounts}
                            activeSector={activeSector}
                            setActiveSector={setActiveSector}
                            availableSectors={availableSectors}
                            visibleSections={visibleSections}
                            scrollToSection={scrollToSection}
                        />

                        {/* Link Legend */}
                        {(verifiedCount > 0 || probableCount > 0) && (
                            <div className="flex flex-wrap items-center gap-6 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-400 mb-8 max-w-fit mt-8 shadow-inner">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block px-1.5 py-0.5 rounded border bg-emerald-900/20 border-emerald-500/40 text-emerald-400">✅ Verified</span>
                                    <span>— confirmed URL is reachable ({verifiedCount})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block px-1.5 py-0.5 rounded border bg-amber-900/20 border-amber-500/40 text-amber-400">⚠️ Probable</span>
                                    <span>— may redirect to portal homepage ({probableCount})</span>
                                </div>
                            </div>
                        )}

                        {filtered.length === 0 ? (
                            <EmptyState
                                title="No Opportunities Found"
                                message={`No ${CATEGORIES.find(c => c.key === activeCategory)?.label} opportunities are tracked yet. Check back soon!`}
                                actionLabel="View All Opportunities"
                                onAction={() => setActiveCategory('all')}
                            />
                        ) : (
                            <div className="space-y-16">
                                {visibleSections.map(section => (
                                    <div
                                        key={section.key}
                                        id={section.key}
                                        ref={el => { sectionRefs.current[section.key] = el; }}
                                        className="scroll-mt-36"
                                    >
                                        <div className={`flex flex-wrap items-center gap-4 mb-6 border-l-4 pl-4 ${section.borderColor}`}>
                                            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{section.label}</h2>
                                            <span className="text-sm font-medium text-slate-500 flex-1">{section.subtitle}</span>
                                            <span className="bg-slate-800 border border-slate-700 text-blue-400 text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                                                {section.items.length}
                                            </span>
                                        </div>
                                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {section.items.map((scheme, i) => (
                                                <SchemeCard
                                                    key={`${section.key}-${i}`}
                                                    scheme={scheme}
                                                    showCategoryBadge={showCategoryBadge}
                                                />
                                            ))}
                                        </section>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6 pt-10">
                        <div className="flex flex-wrap items-center gap-4 mb-8 border-l-4 border-slate-600 pl-4">
                            <h2 className="text-2xl font-bold text-slate-300">🗄️ Closed & Archived Opportunities</h2>
                            <span className="text-sm text-slate-500 flex-1">Past funding programs kept for reference.</span>
                            <span className="bg-slate-800 border border-slate-700 text-slate-400 text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                                {opportunities.filter(o => ['Closed', 'Verify Manually'].includes(o.status)).length}
                            </span>
                        </div>

                        {opportunities.filter(o => ['Closed', 'Verify Manually'].includes(o.status)).length === 0 ? (
                            <EmptyState
                                title="No Archived Opportunities"
                                message="All tracked funding programs are currently active or upcoming."
                                icon="✨"
                            />
                        ) : (
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {opportunities
                                    .filter(o => ['Closed', 'Verify Manually'].includes(o.status))
                                    .map((scheme, i) => (
                                        <SchemeCard
                                            key={`archive-${i}`}
                                            scheme={scheme}
                                            showCategoryBadge={true}
                                        />
                                    ))
                                }
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
