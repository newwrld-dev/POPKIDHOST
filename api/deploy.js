import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { name, sid, num } = req.body;
    const RENDER_API_KEY = "rnd_lwaqihFiMRHlcku0qBDNrjMIc6at";
    const MONGO_URI = "mongodb+srv://popkid:taracha2004%3F@cluster0.i50ot50.mongodb.net/?retryWrites=true&w=majority";

    try {
        // --- STEP 1: AUTO-FIND OWNER ID ---
        const ownerRes = await fetch('https://api.render.com/v1/owners', {
            headers: { 'Authorization': `Bearer ${RENDER_API_KEY}` }
        });
        const owners = await ownerRes.json();
        const REAL_OWNER_ID = owners[0].owner.id;

        // --- STEP 2: DEPLOY WITH ENV-SPECIFIC DETAILS ---
        const renderResponse = await fetch('https://api.render.com/v1/services', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RENDER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "type": "web_service",
                "name": `pop-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random()*999)}`,
                "ownerId": REAL_OWNER_ID,
                "repo": "https://github.com/hostdeployment-bit/NEEBASE",
                "autoDeploy": "yes",
                "serviceDetails": {
                    "env": "node",
                    "plan": "free",
                    "region": "oregon",
                    "numInstances": 1,
                    "envSpecificDetails": {
                        "buildCommand": "npm install",
                        "startCommand": "node index.js"
                    }
                },
                "envVars": [
                    { "key": "SESSION_ID", "value": sid },
                    { "key": "OWNER_NUMBER", "value": num },
                    { "key": "PORT", "value": "8080" }
                ]
            })
        });

        const renderData = await renderResponse.json();

        if (renderResponse.ok) {
            // --- STEP 3: LOG TO MONGODB ---
            try {
                const client = new MongoClient(MONGO_URI);
                await client.connect();
                await client.db("PopkidHost").collection("deployments").insertOne({
                    nickname: name, phoneNumber: num, sessionId: sid, date: new Date()
                });
                await client.close();
            } catch (dbErr) { console.error("DB Error:", dbErr); }

            return res.status(200).json({ success: true, message: "POPKID-HOST: DEPLOYMENT SUCCESS ✅" });
        } else {
            return res.status(renderResponse.status).json({ success: false, error: renderData.message });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
