document.addEventListener('DOMContentLoaded', () => {
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const inputArea = document.getElementById('input-area');
const resultArea = document.getElementById('result-area');
const verdict = document.getElementById('verdict');
const textInput = document.getElementById('textInput');
const wordCountDisplay = document.getElementById('wordCount');

// !!! IMPORTANT: Replace this URL with your actual Vercel project URL
const PROXY_URL = "https://red-spin1-github-94t83w12a-redspin1s-projects.vercel.app";

// Optimized Whitelist
const whitelist = new Set([
'mr', 'mrs', 'ms', 'dr', 'st', 'sr', 'jr',
'txt', 'rtx', 'ntx', 'gtx', 'sql', 'css', 'html', 'http', 'https', 'ftp', 'sftp', 'ssh',
'tls', 'ssl', 'dns', 'dhcp', 'tcp', 'udp', 'sdk', 'hdd', 'ssd', 'cdn', 'cms', 'crm', 'nfc', 'sms', 'mms',
'llc', 'plc', 'lp', 'ltd', 'pvt', 'svc', 'bldg', 'atty', 'rsvp', 'vs',
'ft', 'lb', 'lbs', 'mph', 'rpm', 'rps', 'hr', 'hrs',
'ppl', 'pls', 'plz', 'srs', 'thx', 'thxss', 'kthx', 'kthxthx', 'brb', 'btw', 'smh', 'tbh',
'tv', 'dvd', 'cd', 'dj', 'bc', 'nth', 'jkr', 'mjk', 'blm', 'cnn', 'bbc', 'mtv'
]);

function isRealWord(str) {
const lower = str.toLowerCase();
if (/(.)\1\1\1/.test(lower)) return false;
if (/^\d+$/.test(str)) return true;
if (whitelist.has(lower)) return true;
if (str.length === 1) return /^[ia]$/i.test(str);
return /[aeiouy]/i.test(lower);
}

function getWordCount(text) {
const words = text.match(/\b[a-zA-Z0-9']+\b/g) || [];
return words.filter(isRealWord).length;
}

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
const response = await fetch(PROXY_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ text: textInput.value })
});

// Check if server sent an error (403, 500, etc.)
if (!response.ok) {
const errorData = await response.json().catch(() => ({ error: 'Unknown Error' }));
throw new Error(`Server Error (${response.status}): ${errorData.error || response.statusText}`);
}

const data = await response.json();

// Success: Reset style and show response
verdict.style.fontSize = "";
verdict.style.color = "";
verdict.innerText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No AI response.";

} catch (e) {
// Error Display: Big and Red
verdict.style.fontSize = "24px";
verdict.style.color = "red";
verdict.innerText = "ERROR: " + e.message;
}
});

resetBtn.addEventListener('click', () => {
inputArea.classList.remove('hidden');
resultArea.classList.add('hidden');
textInput.value = "";
wordCountDisplay.innerText = "Min. 50 words: 0";
wordCountDisplay.className = "count-red";

// Reset verdict style for next use
verdict.style.fontSize = "";
verdict.style.color = "";

textInput.focus();
});
});
