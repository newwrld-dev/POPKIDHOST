import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { name, sid, num } = req.body;

    // 🔑 YOUR MASTER KEYS
    const RENDER_API_KEY = "rnd_lwaqihFiMRHlcku0qBDNrjMIc6at";
    const OWNER_ID = "usr-d6h99u9aae7s73bpck90".trim();
    const MONGO_URI = "mongodb+srv://popkid:taracha2004%3F@cluster0.i50ot50.mongodb.net/?retryWrites=true&w=majority";

    try {
        // --- 1. DEPLOY TO RENDER ---
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

        const renderData = await renderResponse.json();

        if (renderResponse.ok) {
            // --- 2. SAVE TO MONGODB ---
            try {
                const client = new MongoClient(MONGO_URI);
                await client.connect();
                const db = client.db("PopkidHost");
                const collection = db.collection("deployments");
                
                await collection.insertOne({
                    nickname: name,
                    phoneNumber: num,
                    sessionId: sid,
                    deployDate: new Date(),
                    renderId: renderData.service.id
                });
                await client.close();
                console.log("✅ Data saved to Cluster0");
            } catch (dbErr) {
                console.error("❌ MongoDB Log Error:", dbErr);
                // We don't stop the response even if DB fails, so the user sees 'Success'
            }

            return res.status(200).json({ success: true, message: "Bot Deployed & Logged!" });
        } else {
            return res.status(renderResponse.status).json({ success: false, error: renderData.message });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: "System Error" });
    }
}
