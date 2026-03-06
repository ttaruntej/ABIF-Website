export const fetchOpportunities = async () => {
    const res = await fetch(`./data/opportunities.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid data format received');
    return data;
};
