import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    // Only allow POST requests from your website
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { name, sid, num } = req.body;
    
    // --- SECURE CREDENTIALS ---
    const HF_TOKEN = "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"; 
    const MONGO_URI = "mongodb+srv://popkid:taracha2004%3F@cluster0.i50ot50.mongodb.net/?retryWrites=true&w=majority";
    const SPACE_ID = "Popkid-254/Popkid";

    try {
        // --- STEP 1: UPDATE SESSION_ID SECRET ---
        // This tells Hugging Face to update the Session ID for the bot
        const res1 = await fetch(`https://huggingface.co/api/spaces/${SPACE_ID}/secrets/SESSION_ID`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${HF_TOKEN}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ "value": sid })
        });

        // --- STEP 2: UPDATE OWNER_NUMBER SECRET ---
        const res2 = await fetch(`https://huggingface.co/api/spaces/${SPACE_ID}/secrets/OWNER_NUMBER`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${HF_TOKEN}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ "value": num })
        });

        if (res1.ok && res2.ok) {
            // --- STEP 3: LOG DEPLOYMENT TO MONGODB ---
            try {
                const client = new MongoClient(MONGO_URI);
                await client.connect();
                await client.db("PopkidHost").collection("deployments").insertOne({
                    nickname: name,
                    phoneNumber: num,
                    sessionId: sid,
                    platform: "HuggingFace",
                    status: "Deployed",
                    date: new Date()
                });
                await client.close();
            } catch (dbErr) {
                console.error("Database logging failed:", dbErr);
            }

            return res.status(200).json({ 
                success: true, 
                message: "POPKID-MD IS NOW DEPLOYING! ✅ Check your Space logs to see it connect." 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: "HF Secret Update Failed. Make sure SESSION_ID and OWNER_NUMBER exist in Space Settings." 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: "Bridge Error: " + error.message 
        });
    }
}
