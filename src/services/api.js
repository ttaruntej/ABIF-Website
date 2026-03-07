export const fetchOpportunities = async () => {
    const res = await fetch(`./data/opportunities.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid data format received');
    return data;
};

export const triggerScraper = async () => {
    const res = await fetch('/api/trigger-sync', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to trigger scraper');
    return data;
};

export const getScraperStatus = async () => {
    const res = await fetch('/api/trigger-sync', { method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch status');
    return await res.json();
};
export const fetchResearchReport = async () => {
    const res = await fetch(`./data/research_report.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
};
