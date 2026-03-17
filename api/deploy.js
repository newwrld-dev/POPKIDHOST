import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { name, sid, num } = req.body;
    
    // --- 🔐 YOUR SECURE CREDENTIALS ---
    const HF_TOKEN = "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"; 
    const MONGO_URI = "mongodb+srv://popkid:taracha2004%3F@cluster0.i50ot50.mongodb.net/?retryWrites=true&w=majority";
    const SPACE_ID = "Popkid-254/Popkid";
    const GITHUB_REPO = "https://github.com/hostdeployment-bit/NEEBASE.git";

    try {
        // --- STEP 1: SYNC CODE FROM GITHUB ---
        // This ensures the Space has your latest NEEBASE code
        await fetch(`https://huggingface.co/api/spaces/${SPACE_ID}/pull`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HF_TOKEN}` }
        });

        // --- STEP 2: UPDATE SECRETS ---
        const updateSecret = async (key, value) => {
            return await fetch(`https://huggingface.co/api/spaces/${SPACE_ID}/secrets/${key}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${HF_TOKEN}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ "value": value.toString().trim() })
            });
        };

        const res1 = await updateSecret('SESSION_ID', sid);
        const res2 = await updateSecret('OWNER_NUMBER', num);

        if (res1.ok && res2.ok) {
            // --- STEP 3: LOG TO MONGODB ---
            try {
                const client = new MongoClient(MONGO_URI);
                await client.connect();
                await client.db("PopkidHost").collection("deployments").insertOne({
                    nickname: name,
                    phoneNumber: num,
                    sessionId: sid,
                    platform: "HuggingFace",
                    date: new Date()
                });
                await client.close();
            } catch (dbErr) { console.error("DB Log Error:", dbErr); }

            return res.status(200).json({ 
                success: true, 
                message: "POPKID-HOST: DEPLOYMENT SUCCESS ✅ Your bot is waking up!" 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: "HF API Refused. Ensure Secrets exist in Space Settings." 
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
