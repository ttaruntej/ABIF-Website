export default async function handler(req, res) {
    const GH_TOKEN = process.env.GH_TOKEN;
    const REPO_OWNER = 'ttaruntej';
    const REPO_NAME = 'ABIF-Funding-Tracker';
    const WORKFLOW_ID = 'send-email.yml';

    if (!GH_TOKEN) {
        return res.status(500).json({ error: 'GitHub Token not configured' });
    }

    const headers = {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };

    if (req.method === 'POST') {
        const { target_emails } = req.body || {};

        try {
            const response = await fetch(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        ref: 'main',
                        inputs: {
                            target_emails: target_emails || ''
                        }
                    }),
                }
            );

            if (response.status === 204) {
                return res.status(200).json({ message: 'Email Action Triggered' });
            }
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.message });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to trigger email action' });
        }
    }

    if (req.method === 'GET') {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/runs?per_page=1`,
                { headers }
            );
            const data = await response.json();
            const lastRun = data.workflow_runs?.[0];

            if (!lastRun) {
                return res.status(200).json({ status: 'unknown' });
            }

            return res.status(200).json({
                status: lastRun.status,
                conclusion: lastRun.conclusion,
                updated_at: lastRun.updated_at,
                run_id: lastRun.id
            });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch status' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
