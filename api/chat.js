// api/chat.js (Runs securely on Vercel's servers, NOT in the browser)
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // We pull the secret key from the secure environment, not the code!
        const GROQ_KEY = process.env.GROQ_API_KEY; 
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body) // Pass the prompt from your frontend
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to communicate with AI' });
    }
}
