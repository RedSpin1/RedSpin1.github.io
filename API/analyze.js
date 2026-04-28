export default async function handler(req, res) {
// 1. Explicitly allow your domain
res.setHeader('Access-Control-Allow-Origin', 'https://truthai.online');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

// 2. Handle the "Preflight" request (OPTIONS) immediately
if (req.method === 'OPTIONS') {
return res.status(200).end();
}

// 3. Your existing logic
const { text } = req.body;
const apiKey = process.env.GEMINI_API_KEY;

try {
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
contents: [{ parts: [{ text: `Act as a forensic writing expert. Analyze this text for signs of AI generation: ${text}` }] }]
})
});

const data = await response.json();
res.status(200).json(data);
} catch (error) {
res.status(500).json({ error: "Failed to connect to AI" });
}
}
