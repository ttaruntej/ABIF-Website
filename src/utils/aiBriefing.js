export const generateBriefing = (data) => {
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
