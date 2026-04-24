document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resetBtn = document.getElementById('resetBtn');
    const inputArea = document.getElementById('input-area');
    const resultArea = document.getElementById('result-area');
    const verdict = document.getElementById('verdict');
    const textInput = document.getElementById('textInput');
    const wordCountDisplay = document.getElementById('wordCount');

    // PASTE YOUR NEW API KEY HERE
    const API_KEY = "AIzaSyA6QEFAXnR9yquKlLPwgi-QbDdPWQqyppU"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

    // Optimized Whitelist: Only contains words without standard vowels (a, e, i, o, u, y)
    const whitelist = new Set([
        // Titles & Names
        'mr', 'mrs', 'ms', 'dr', 'st', 'sr', 'jr',
        // Tech & Computing (No-Vowel only)
        'txt', 'rtx', 'ntx', 'gtx', 'sql', 'css', 'html', 'http', 'https', 'ftp', 'sftp', 'ssh', 
        'tls', 'ssl', 'dns', 'dhcp', 'tcp', 'udp', 'sdk', 'hdd', 'ssd', 'cdn', 'cms', 'crm', 'nfc', 'sms', 'mms',
        // Business & Legal
        'llc', 'plc', 'lp', 'ltd', 'pvt', 'svc', 'bldg', 'atty', 'rsvp', 'vs',
        // Measurements & Units
        'ft', 'lb', 'lbs', 'mph', 'rpm', 'rps', 'hr', 'hrs',
        // Texting & Slang
        'ppl', 'pls', 'plz', 'srs', 'thx', 'thxss', 'kthx', 'kthxthx', 'brb', 'btw', 'smh', 'tbh',
        // Miscellaneous
        'tv', 'dvd', 'cd', 'dj', 'bc', 'nth', 'jkr', 'mjk', 'blm', 'cnn', 'bbc', 'mtv'
    ]);

    // Helper: Validates if a string is a "real" word
    function isRealWord(str) {
        const lower = str.toLowerCase();

        // 1. Filter out words with 4+ consecutive identical characters (spam protection)
        if (/(.)\1\1\1/.test(lower)) return false;

        // 2. If it's a number, it's a word
        if (/^\d+$/.test(str)) return true;
        
        // 3. Check the whitelist
        if (whitelist.has(lower)) return true;

        // 4. Single character logic: only "I" or "A" allowed
        if (str.length === 1) {
            return /^[ia]$/i.test(str);
        }
        
        // 5. Must contain at least one vowel (a,e,i,o,u,y)
        return /[aeiouy]/i.test(lower);
    }

    // Main count logic
    function getWordCount(text) {
        // Regex matches sequences of letters and numbers, ignores symbols/punctuation
        const words = text.match(/\b[a-zA-Z0-9']+\b/g) || [];
        return words.filter(isRealWord).length;
    }

    // Event Listeners
    textInput.addEventListener('input', () => {
        const count = getWordCount(textInput.value);
        wordCountDisplay.innerText = `Min. 50 words: ${count}`;
        wordCountDisplay.className = count >= 50 ? 'count-green' : 'count-red';
    });

    analyzeBtn.addEventListener('click', async () => {
        const count = getWordCount(textInput.value);
        
        inputArea.classList.add('hidden');
        resultArea.classList.remove('hidden');

        if (count < 50) {
            verdict.innerText = "Please enter at least 50 words.";
            return;
        }
        
        verdict.innerText = "Analyzing content...";

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Act as a forensic writing expert. Analyze this text for signs of AI generation. Provide a verdict (Human or AI), a percentage likelihood, and a one-sentence justification: ${textInput.value}` }] }]
                })
            });
            const data = await response.json();
            verdict.innerText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error retrieving analysis.";
        } catch (e) { 
            verdict.innerText = "Network Error. Please check your connection."; 
        }
    });

    resetBtn.addEventListener('click', () => {
        inputArea.classList.remove('hidden');
        resultArea.classList.add('hidden');
        textInput.value = "";
        wordCountDisplay.innerText = "Min. 50 words: 0";
        wordCountDisplay.className = "count-red";
        textInput.focus();
    });
});