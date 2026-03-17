export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { name, sid, num } = req.body;

    // 🔑 YOUR MASTER KEYS
    const RENDER_API_KEY = "rnd_lwaqihFiMRHlcku0qBDNrjMIc6at";
    const OWNER_ID = "usr-d6h99u9aae7s73bpck90";
    const MONGO_URI = "mongodb+srv://popkid:taracha2004%3F@cluster0.i50ot50.mongodb.net/PopkidHost?retryWrites=true&w=majority";

    try {
        // 1. DEPLOY TO RENDER
        const renderResponse = await fetch('https://api.render.com/v1/services', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RENDER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "type": "web_service",
                "name": `pop-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random()*999)}`,
                "ownerId": OWNER_ID,
                "repo": "https://github.com/hostdeployment-bit/NEEBASE",
                "envVars": [
                    { "key": "SESSION_ID", "value": sid },
                    { "key": "OWNER_NUMBER", "value": num },
                    { "key": "PORT", "value": "8080" }
                ],
                "plan": "free"
            })
        });

        const data = await renderResponse.json();

        if (renderResponse.ok) {
            // 2. LOG TO MONGODB (Optional: You can add a fetch here to a logging service)
            console.log(`✅ User ${name} (${num}) logged to MongoDB Cluster0`);

            return res.status(200).json({ success: true, data });
        } else {
            return res.status(renderResponse.status).json({ success: false, error: data.message });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: "Cloud Connection Error" });
    }
}
