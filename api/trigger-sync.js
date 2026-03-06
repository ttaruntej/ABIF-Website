/**
 * Serverless Function to trigger GitHub Action
 * This should be hosted on a platform like Vercel or Netlify.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const GH_TOKEN = process.env.GH_TOKEN;
    const REPO_OWNER = 'ttaruntej'; // Your GitHub username
    const REPO_NAME = 'ABIF-Funding-Tracker';
    const WORKFLOW_ID = 'scraper-sync.yml'; // The filename of your workflow

    if (!GH_TOKEN) {
        return res.status(500).json({ error: 'GitHub Token not configured on server' });
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GH_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
                body: JSON.stringify({
                    ref: 'main', // Trigger the main branch
                }),
            }
        );

        if (response.status === 204) {
            return res.status(200).json({ message: 'Scraper triggered successfully!' });
        } else {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.message || 'Failed to trigger workflow' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
