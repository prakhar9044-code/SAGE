export default async function handler(req, res) {
    // Only allow GET requests for searching
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { q } = req.query; // Grab the search term from the URL

    if (!q) {
        return res.status(400).json({ error: 'Search query is missing' });
    }

    try {
        // Pull your secret key from Vercel Environment Variables
        const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY; 

        if (!YOUTUBE_KEY) {
            return res.status(500).json({ error: 'YouTube API key is missing on the server' });
        }

        // Make the secure request to Google
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(q)}&type=video&videoEmbeddable=true&key=${YOUTUBE_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        // If Google sends back an error, forward it to the console
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        // Send the video data back to your frontend!
        res.status(200).json(data);

    } catch (error) {
        console.error("Backend YouTube Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
