export const fetchOpportunities = async () => {
    const res = await fetch(`./data/opportunities.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid data format received');
    return data;
};

export const triggerScraper = async () => {
    // Note: This only works if hosted on a platform supporting /api routes (Vercel/Netlify)
    const res = await fetch('/api/trigger-sync', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to trigger scraper');
    return data;
};
