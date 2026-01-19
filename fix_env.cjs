const fs = require('fs');
try { fs.unlinkSync('.env'); } catch (e) { }
const content = `VITE_GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
VITE_DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY_HERE
VITE_HUGGINGFACE_API_KEY=YOUR_HUGGINGFACE_API_KEY_HERE
VITE_GROQ_MODEL=meta-llama/llama-3.1-8b-instant
VITE_GROQ_MAX_TOKENS=8000
`;
fs.writeFileSync('.env', content, 'utf8');
console.log('.env recreatd with clean UTF-8');
