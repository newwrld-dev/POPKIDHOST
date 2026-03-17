export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { name, sid, num } = req.body;

    try {
        const response = await fetch('https://api.render.com/v1/services', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer rnd_lwaqihFiMRHlcku0qBDNrjMIc6at',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "type": "web_service",
                "name": `pop-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(Math.random()*999)}`,
                "repo": "https://github.com/hostdeployment-bit/NEEBASE",
                "envVars": [
                    { "key": "SESSION_ID", "value": sid },
                    { "key": "OWNER_NUMBER", "value": num },
                    { "key": "PORT", "value": "8080" }
                ],
                "plan": "free"
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, data });
        } else {
            return res.status(response.status).json({ success: false, error: data.message });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: "Cloud Connection Error" });
    }
}
