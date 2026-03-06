import React, { useState, useEffect, useRef } from 'react';
import './index.css';

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
    { key: 'all', label: 'All', icon: '🌐' },
    { key: 'national', label: 'National', icon: '🇮🇳' },
    { key: 'international', label: 'International', icon: '🌍' },
    { key: 'state', label: 'State Specific', icon: '🏛️' },
    { key: 'csr', label: 'CSR', icon: '🤝' },
];

// ── Status section definitions ────────────────────────────────────────────────
const SECTIONS = [
    {
        key: 'closing-soon',
        label: '🔴 Closing Soon',
        subtitle: 'Apply before the deadline passes',
        borderColor: '#ff6b6b',
        filter: o => o.status === 'Closing Soon',
    },
    {
        key: 'open',
        label: '🟢 Open — Fixed Deadline',
        subtitle: 'Active calls with specific closing dates',
        borderColor: '#64ffda',
        filter: o => o.status === 'Open',
    },
    {
        key: 'rolling',
        label: '🔵 Rolling Opportunities',
        subtitle: 'Apply anytime — no fixed deadline',
        borderColor: '#4299e1',
        filter: o => o.status === 'Rolling',
    },
    {
        key: 'coming-soon',
        label: '🟡 Coming Soon',
        subtitle: 'Watch these — cycle expected to open',
        borderColor: '#f6c90e',
        filter: o => o.status === 'Coming Soon',
    },
];

// ── Category color map ─────────────────────────────────────────────────────────
const CAT_COLORS = {
    national: { bg: 'rgba(66,153,225,0.12)', border: 'rgba(66,153,225,0.45)', text: '#63b3ed' },
    international: { bg: 'rgba(159,122,234,0.12)', border: 'rgba(159,122,234,0.45)', text: '#b794f4' },
    state: { bg: 'rgba(237,137,54,0.12)', border: 'rgba(237,137,54,0.45)', text: '#f6a65a' },
    csr: { bg: 'rgba(56,178,172,0.12)', border: 'rgba(56,178,172,0.45)', text: '#4fd1c5' },
};

// ── SchemeCard ─────────────────────────────────────────────────────────────────
const SchemeCard = ({ scheme, showCategoryBadge }) => {
    const isVerified = scheme.linkStatus === 'verified';
    const isProbable = scheme.linkStatus === 'probable';
    let buttonLabel = 'Apply Now';
    if (scheme.status === 'Coming Soon') buttonLabel = 'View Details';
    if (scheme.status === 'Closed' || scheme.status === 'Verify Manually') buttonLabel = 'Archived / Closed';

    const catColor = CAT_COLORS[scheme.category] || CAT_COLORS.national;
    const catMeta = CATEGORIES.find(c => c.key === scheme.category);

    const isArchived = scheme.status === 'Closed' || scheme.status === 'Verify Manually';

    return (
        <div className={`scheme-card ${isArchived ? 'archived-card' : ''}`}>
            <span className={`status-badge status-${scheme.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {scheme.status}
            </span>

            {showCategoryBadge && scheme.category && scheme.category !== 'all' && (
                <span
                    className="category-badge-card"
                    style={{ background: catColor.bg, border: `1px solid ${catColor.border}`, color: catColor.text }}
                >
                    {catMeta?.icon} {catMeta?.label ?? scheme.category}
                </span>
            )}

            <h3 className="scheme-title">{scheme.name}</h3>
            <p className="scheme-body" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                {scheme.body}
            </p>

            {(scheme.sectors || scheme.stages) && (
                <div className="pill-container">
                    {scheme.stages?.map(s => <span key={s} className="pill-tag">{s}</span>)}
                    {scheme.sectors?.map(s => <span key={s} className="pill-tag" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>{s}</span>)}
                </div>
            )}

            <p className="scheme-body" style={{ marginTop: '0.5rem' }}>{scheme.description}</p>

            <div className="scheme-footer">
                <span className="award-amount">{scheme.maxAward}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    {isVerified && !isArchived && <span className="badge-verified">✅ Verified Link</span>}
                    {isProbable && !isArchived && <span className="badge-probable">⚠️ Probable Link</span>}
                    <a
                        href={scheme.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-apply"
                        style={isArchived ? { opacity: 0.6, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
                    >
                        {buttonLabel}
                    </a>
                </div>
            </div>

            <div className="deadline">
                📅 Deadline: <strong>{scheme.deadline}</strong>
            </div>
        </div>
    );
};

// ── Dashboard ──────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, active: 0, closingSoon: 0, briefing: "Generating insights..." });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshSuccess, setRefreshSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [activeAudience, setActiveAudience] = useState('startup'); // 'startup' | 'incubator' | 'all'
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeSector, setActiveSector] = useState('All Sectors');
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'archive'
    const [lastUpdated, setLastUpdated] = useState(
        `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    );
    const sectionRefs = useRef({});

    // Generate AI Briefing string dynamically
    const generateBriefing = (data) => {
        if (!data || data.length === 0) return "No opportunities currently tracked.";

        const activeData = data.filter(s => ['Open', 'Rolling', 'Closing Soon'].includes(s.status));

        const providerCounts = {};
        activeData.forEach(s => {
            if (s.body) {
                const provider = s.body.split('/')[0].trim();
                providerCounts[provider] = (providerCounts[provider] || 0) + 1;
            }
        });

        const topProviders = Object.entries(providerCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([name]) => name);

        const highValueOp = activeData.find(s => s.maxAward && /(Crore|Cr)/i.test(s.maxAward));

        let briefing = `Currently tracking ${activeData.length} active funding opportunities. `;

        if (topProviders.length > 0) {
            briefing += `Major calls are driven by ${topProviders.join(' & ')}. `;
        }

        if (highValueOp) {
            briefing += `Notable high-value funding includes '${highValueOp.name}' offering ${highValueOp.maxAward}.`;
        } else {
            briefing += `Continuous rolling funding for MSMEs and startups remains highly active.`;
        }

        return briefing;
    };

    // Fetch from the static JSON file
    const fetchData = () => {
        // v=${Date.now()} ensures we break the browser cache to get the absolute latest from GitHub
        fetch(`./data/opportunities.json?v=${Date.now()}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                return res.json();
            })
            .then(data => {
                if (!Array.isArray(data)) throw new Error('Invalid data format received');
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

                // Show success state briefly before hiding
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

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        let timer;
        // Simulating the network fetch delay to show the UI
        if (isRefreshing && !refreshSuccess && countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (isRefreshing && !refreshSuccess && countdown === 0) {
            fetchData();
        }
        return () => clearTimeout(timer);
    }, [isRefreshing, countdown, refreshSuccess]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setRefreshSuccess(false);
        setCountdown(3); // Reduced from 8s to 3s since it's just fetching the latest JSON now
    };

    const scrollToSection = (key) => {
        const el = sectionRefs.current[key];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleExportCSV = () => {
        const headers = ['Name', 'Provider', 'Category', 'Target Audience', 'Sectors', 'Stages', 'Max Award', 'Deadline', 'Status', 'Link'];
        const csvRows = [headers.join(',')];

        filtered.forEach(o => {
            const row = [
                `"${o.name.replace(/"/g, '""')}"`,
                `"${(o.body || '').replace(/"/g, '""')}"`,
                o.category,
                `"${(o.targetAudience || []).join(', ')}"`,
                `"${(o.sectors || []).join(', ')}"`,
                `"${(o.stages || []).join(', ')}"`,
                `"${(o.maxAward || '').replace(/"/g, '""')}"`,
                `"${(o.deadline || '').replace(/"/g, '""')}"`,
                o.status,
                `"${o.link}"`
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `abif_funding_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (loading) return (
        <div style={{ backgroundColor: '#020c1b', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64ffda', fontFamily: 'Inter' }}>
            Loading ABIF Funding Tracker...
        </div>
    );

    // Filtered set based on Audience Toggle
    const filteredByAudience = activeAudience === 'all'
        ? opportunities
        : opportunities.filter(o => o.targetAudience && o.targetAudience.includes(activeAudience));

    // Get available sectors for the Nav Bar
    const availableSectors = Array.from(new Set(filteredByAudience.flatMap(o => o.sectors || []))).sort();

    // Filter by Sector
    const filteredBySector = activeSector === 'All Sectors'
        ? filteredByAudience
        : filteredByAudience.filter(o => o.sectors && o.sectors.includes(activeSector));

    // Filter by Category Tab
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

    // Visible status sections (with items)
    const visibleSections = SECTIONS.map(s => ({
        ...s,
        items: filtered.filter(s.filter),
    })).filter(s => s.items.length > 0);

    return (
        <div className="dashboard-container animate-in">

            {/* ── Error banner ─────────────────────────────────── */}
            {error && (
                <div style={{ background: '#2a0a0a', border: '1px solid #ff6b6b', borderRadius: '8px', padding: '1rem 1.5rem', marginBottom: '1rem', color: '#ff6b6b', fontSize: '0.9rem' }}>
                    ⚠️ <strong>Could not load latest data:</strong> {error}.
                    <button onClick={fetchData} style={{ marginLeft: '1rem', background: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', borderRadius: '4px', padding: '0.2rem 0.75rem', cursor: 'pointer' }}>Retry</button>
                </div>
            )}

            {/* ── Refresh overlay (Toast styling) ────────────────── */}
            {isRefreshing && (
                <div className="refresh-overlay">
                    <div className="refresh-toast animate-toast">
                        {refreshSuccess ? (
                            <div className="toast-content animate-success">
                                <div className="success-icon-small">✓</div>
                                <div className="toast-text">
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--secondary)' }}>Dashboard Updated!</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Successfully synced latest data.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="toast-content">
                                    <div className="spinner-small"></div>
                                    <div className="toast-text">
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Updating Dashboard...</h3>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Fetching latest data</p>
                                    </div>
                                    <span className="timer-text-small">{countdown}s</span>
                                </div>
                                <div className="countdown-container-small">
                                    <div className="countdown-bar" style={{ width: `${(3 - countdown) / 3 * 100}%`, transition: 'width 1s linear' }}></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Header ───────────────────────────────────────── */}
            <header>
                <div className="logo">
                    <h1>ABIF</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Opportunities Tracker</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-refresh"
                        onClick={() => setCurrentView(currentView === 'dashboard' ? 'archive' : 'dashboard')}
                        style={{ marginRight: '0.5rem', background: currentView === 'dashboard' ? 'rgba(255,107,107,0.1)' : 'rgba(100,255,218,0.1)', color: currentView === 'dashboard' ? '#ff6b6b' : '#64ffda', borderColor: currentView === 'dashboard' ? '#ff6b6b' : '#64ffda' }}
                    >
                        {currentView === 'dashboard' ? '🗄️ View Archive' : '📊 Back to Dashboard'}
                    </button>
                    <button className="btn-refresh" onClick={handleExportCSV} style={{ marginRight: '0.5rem', borderColor: 'var(--text-dim)', color: 'var(--text-main)' }}>
                        📥 Export to CSV
                    </button>
                    <button className="btn-refresh" onClick={handleRefresh} disabled={isRefreshing}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Update Dashboard
                    </button>
                    <div className="last-updated-text" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                        Last Refreshed: {lastUpdated}
                    </div>
                </div>
            </header>

            {/* ── Main Dashboard View ────────────────────────────── */}
            {currentView === 'dashboard' ? (
                <>
                    {/* ── Audience Toggle ───────────────────────────────── */}
                    <div className="audience-toggle">
                        <button
                            className={`audience-btn ${activeAudience === 'startup' ? 'active' : ''}`}
                            onClick={() => { setActiveAudience('startup'); setActiveSector('All Sectors'); }}
                        >
                            🚀 For My Startups
                        </button>
                        <button
                            className={`audience-btn ${activeAudience === 'incubator' ? 'active' : ''}`}
                            onClick={() => { setActiveAudience('incubator'); setActiveSector('All Sectors'); }}
                        >
                            🏢 For My Incubator
                        </button>
                        <button
                            className={`audience-btn ${activeAudience === 'all' ? 'active' : ''}`}
                            onClick={() => { setActiveAudience('all'); setActiveSector('All Sectors'); }}
                        >
                            🌐 All Grants
                        </button>
                    </div>

                    {/* ── Stats row ─────────────────────────────────────── */}
                    <section className="stats-grid">
                        <div className="stat-card">
                            <p className="scheme-body">Active Opportunities</p>
                            <h2 className="stat-value">{stats.active}</h2>
                        </div>
                        <div className="stat-card" style={{ gridColumn: 'span 2', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p className="scheme-body" style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>AI Research Briefing</p>
                            <p className="scheme-body" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                {stats.briefing}
                            </p>
                        </div>
                        <div className="stat-card">
                            <p className="scheme-body">Total Tracked</p>
                            <h2 className="stat-value">{stats.total}</h2>
                        </div>
                        <div className="stat-card">
                            <p className="scheme-body">Closing Soon</p>
                            <h2 className="stat-value" style={{ color: '#ff6b6b' }}>{stats.closingSoon}</h2>
                        </div>
                    </section>

                    {/* ── Category Nav Bar ──────────────────────────────── */}
                    <nav className="category-nav">
                        <div className="category-nav-inner">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.key}
                                    className={`category-tab cat-${cat.key}${activeCategory === cat.key ? ' active' : ''}`}
                                    onClick={() => setActiveCategory(cat.key)}
                                >
                                    <span className="cat-icon">{cat.icon}</span>
                                    <span className="cat-label">{cat.label}</span>
                                    <span className="cat-count">{catCounts[cat.key]}</span>
                                </button>
                            ))}
                        </div>

                        {/* Sector specific filters */}
                        <div className="sector-nav">
                            <button
                                className={`sector-tab ${activeSector === 'All Sectors' ? 'active' : ''}`}
                                onClick={() => setActiveSector('All Sectors')}
                            >
                                All Sectors
                            </button>
                            {availableSectors.map(sec => (
                                <button
                                    key={sec}
                                    className={`sector-tab ${activeSector === sec ? 'active' : ''}`}
                                    onClick={() => setActiveSector(sec)}
                                >
                                    {sec}
                                </button>
                            ))}
                        </div>

                        {/* Quick-jump anchors for visible sections */}
                        {visibleSections.length > 0 && (
                            <div className="section-jumps">
                                <span className="jump-label">Jump to:</span>
                                {visibleSections.map(s => (
                                    <button
                                        key={s.key}
                                        className="jump-btn"
                                        onClick={() => scrollToSection(s.key)}
                                    >
                                        {s.label.split(' ').slice(0, 2).join(' ')}
                                        <span className="jump-count">{s.items.length}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </nav>

                    {/* ── Link verification legend ─────────────────────── */}
                    {(verifiedCount > 0 || probableCount > 0) && (
                        <div className="link-legend">
                            <span><span className="badge-verified">✅ Verified Link</span> — confirmed URL is reachable ({verifiedCount})</span>
                            <span><span className="badge-probable">⚠️ Probable Link</span> — may redirect to portal homepage ({probableCount})</span>
                        </div>
                    )}

                    {/* ── Empty state ───────────────────────────────────── */}
                    {filtered.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">🔍</div>
                            <h3>No Opportunities Found</h3>
                            <p>No {CATEGORIES.find(c => c.key === activeCategory)?.label} opportunities are tracked yet. Check back soon!</p>
                            <button className="btn-apply" onClick={() => setActiveCategory('all')} style={{ marginTop: '1rem' }}>
                                View All Opportunities
                            </button>
                        </div>
                    )}

                    {/* ── Sectioned scheme cards ───────────────────────── */}
                    {visibleSections.map(section => (
                        <div
                            key={section.key}
                            id={section.key}
                            ref={el => { sectionRefs.current[section.key] = el; }}
                            className="section-block"
                        >
                            <div className="section-header" style={{ borderLeftColor: section.borderColor }}>
                                <h2 className="section-title">{section.label}</h2>
                                <span className="section-subtitle">{section.subtitle}</span>
                                <span className="section-count">{section.items.length}</span>
                            </div>
                            <section className="schemes-grid">
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
                </>
            ) : (
                /* ── Archive Subpage View ────────────────────────────── */
                <div className="archive-view">
                    <div className="section-header" style={{ borderLeftColor: '#ff6b6b', marginTop: '1rem' }}>
                        <h2 className="section-title">🗄️ Closed & Archived Opportunities</h2>
                        <span className="section-subtitle">Past funding programs kept for reference. Applying is no longer possible.</span>
                        <span className="section-count">{opportunities.filter(o => ['Closed', 'Verify Manually'].includes(o.status)).length}</span>
                    </div>

                    {opportunities.filter(o => ['Closed', 'Verify Manually'].includes(o.status)).length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">✨</div>
                            <h3>No Archived Opportunities</h3>
                            <p>All tracked funding programs are currently active or upcoming.</p>
                        </div>
                    ) : (
                        <section className="schemes-grid">
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
    );
};

export default Dashboard;
