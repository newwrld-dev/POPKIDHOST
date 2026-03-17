import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { name, sid, num } = req.body;
    const HF_TOKEN = "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"; 
    const MONGO_URI = "mongodb+srv://popkid:taracha2004%3F@cluster0.i50ot50.mongodb.net/?retryWrites=true&w=majority";
    const GITHUB_REPO = "https://github.com/hostdeployment-bit/NEEBASE"; // Your bot code source
    const SPACE_ID = "Popkid-254/Popkid";

    try {
        // --- STEP 1: SYNC GITHUB REPO TO HF SPACE ---
        // This tells Hugging Face to pull the latest code from your GitHub
        const syncRes = await fetch(`https://huggingface.co/api/spaces/${SPACE_ID}/pull`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ "repo": GITHUB_REPO })
        });

        // --- STEP 2: SET USER CREDENTIALS (SECRETS) ---
        // This restarts the bot with the user's unique Session ID
        const secretRes = await fetch(`https://huggingface.co/api/spaces/${SPACE_ID}/secrets`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ "SESSION_ID": sid, "OWNER_NUMBER": num })
        });

        if (secretRes.ok) {
            // --- STEP 3: LOG TO MONGODB ---
            const client = new MongoClient(MONGO_URI);
            await client.connect();
            await client.db("PopkidHost").collection("deployments").insertOne({
                nickname: name, phoneNumber: num, sessionId: sid, platform: "HuggingFace", date: new Date()
            });
            await client.close();

            return res.status(200).json({ success: true, message: "POPKID-MD IS LIVE ON HF! ✅" });
        } else {
            return res.status(400).json({ success: false, error: "Hugging Face Setup Failed" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
