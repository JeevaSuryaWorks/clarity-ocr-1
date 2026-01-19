import axios from 'axios';
import { AnalysisResult, TaskGroup } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

// --- Configuration ---
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

// Diagnostic Logs (Safe)
console.log("[AI Analysis] API Key Availability:");
console.log(`- GROQ: ${GROQ_API_KEY ? 'DETECTED' : 'MISSING'}`);
console.log(`- OPENROUTER: ${OPENROUTER_API_KEY ? 'DETECTED' : 'MISSING'}`);
console.log(`- DEEPSEEK: ${DEEPSEEK_API_KEY ? 'DETECTED' : 'MISSING'}`);

const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const AI_CONFIG = {
  GROQ_MODEL: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
  OPENROUTER_MODEL: 'google/gemini-2.0-flash-exp:free',
  DEEPSEEK_MODEL: 'deepseek-chat',

  TIMEOUT_MS: 60000,
  CHUNK_SIZE: 40000,
  MAX_TOTAL_CHARS: 1500000,
};

interface AIPrompt {
  system: string;
  user: string;
}

interface AIResponse {
  content: string;
  provider: string;
}

// --- Extraction Helpers ---

const extractJSON = (content: string): any => {
  try {
    let cleaned = content.trim();
    const jsonBlockStart = cleaned.indexOf('```json');
    if (jsonBlockStart !== -1) {
      cleaned = cleaned.substring(jsonBlockStart + 7);
      const jsonBlockEnd = cleaned.lastIndexOf('```');
      if (jsonBlockEnd !== -1) cleaned = cleaned.substring(0, jsonBlockEnd);
    }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.substring(start, end + 1));
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("[AI Analysis] JSON Extraction Failed", e);
    return null;
  }
};

// --- API Clients ---

const callAI = async (prompt: AIPrompt): Promise<AIResponse> => {
  // Strategy: Try OpenRouter -> Groq -> Deepseek
  // The user specifically requested: "If Openrouter is failed,use Groq automatically"
  const providers = [
    { name: 'OpenRouter', url: OPENROUTER_API_URL, key: OPENROUTER_API_KEY, model: AI_CONFIG.OPENROUTER_MODEL },
    { name: 'Groq', url: GROQ_API_URL, key: GROQ_API_KEY, model: AI_CONFIG.GROQ_MODEL },
    { name: 'Deepseek', url: DEEPSEEK_API_URL, key: DEEPSEEK_API_KEY, model: AI_CONFIG.DEEPSEEK_MODEL }
  ];

  for (const p of providers) {
    if (!p.key) {
      console.warn(`[AI Analysis] Skipping ${p.name}: Key not found in environment.`);
      continue;
    }

    try {
      console.log(`[AI Analysis] Attempting ${p.name} (${p.model})...`);
      const response = await axios.post(p.url, {
        model: p.model,
        messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
        temperature: 0.2,
        response_format: p.name !== 'Deepseek' ? { type: "json_object" } : undefined
      }, {
        headers: {
          'Authorization': `Bearer ${p.key}`,
          'Content-Type': 'application/json',
          ...(p.name === 'OpenRouter' ? { 'HTTP-Referer': 'https://clarity-ocr.com' } : {})
        },
        timeout: AI_CONFIG.TIMEOUT_MS
      });
      return { content: response.data.choices[0].message.content, provider: p.name };
    } catch (err: any) {
      let errorDetail = err.message;
      if (err.response?.status === 429) errorDetail = "Rate limited (429)";
      if (err.response?.status === 402) errorDetail = "Payment required (402)";
      console.warn(`[AI Analysis] ${p.name} failed: ${errorDetail}`);
      // Continue to next provider
    }
  }
  throw new Error("All prioritized AI Providers failed. Please check your API keys or rate limits.");
};

// --- Prompts ---

const SYSTEM_PROMPT = `You are the world's most elite Document Intelligence Architect & Strategic Consultant.
Your mission is to perform a HYPER-DEEP, AGGRESSIVE, and MULTI-LAYERED analysis. 

GENERAL DIRECTIVES:
- DO NOT provide generic, simple, or surface-level summaries.
- DO NOT suggest obvious tasks like "Read document" or "Review section".
- THINK like a McKinsey Partner or a Lead Systems Architect.
- IDENTIFY hidden risks, cross-document dependencies, and latent opportunities that a human might miss.

CORE ANALYSIS PILLARS:
1. **Strategic Synthesis**: Connect disparate pieces of data into a unified visionary narrative.
2. **Hyper-Impact Tasks**: Generate tasks that represent *meaningful progress*. Every task must have a "Strategic Why".
   - *Weak*: "Check financial table."
   - *Strong*: "Perform a multi-variable sensitivity analysis on the Q3 revenue projections to identify breakage points in the supply chain."
3. **Risk Matrix**: Highlight critical vulnerabilities or compliance gaps.

JSON OUTPUT REQUIREMENTS (EXHAUSTIVE):
- "executive_summary": A high-level, sophisticated summary (150-200 words) using professional lexicon.
- "strategic_insights": At least 5 profound observations with their corresponding strategic weight.
- "tasks": A minimum of 10-15 highly detailed, "exciting" tasks. Each title must be punchy and professional.

JSON STRUCTURE:
{
  "executive_summary": "High-impact visionary summary...",
  "strategic_insights": [{ "insight": "The core observation", "significance": "Why this matters at a CEO level" }],
  "tasks": [
    { 
      "title": "High-Impact Action Title", 
      "description": "Step-by-step strategic approach and expected outcome.", 
      "priority": "Critical/High/Medium/Low", 
      "category": "Strategic/Operational/Technical/Creative/Financial" 
    }
  ]
}`;

// --- Main Service ---

export const analyzeDocument = async (fileContent: string, onProgress?: (msg: string) => void): Promise<AnalysisResult> => {
  const fullText = fileContent.slice(0, AI_CONFIG.MAX_TOTAL_CHARS);
  const chunks: string[] = [];

  for (let i = 0; i < fullText.length; i += AI_CONFIG.CHUNK_SIZE) {
    chunks.push(fullText.slice(i, i + AI_CONFIG.CHUNK_SIZE));
  }

  console.log(`[AI Analysis] Processing ${chunks.length} segments...`);

  let finalSummary = "";
  let finalInsights: any[] = [];
  let allTasks: any[] = [];
  let providerUsed = "Unknown";

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(`Deep Analysis: Section ${i + 1}/${chunks.length}`);
    const chunkPrompt = {
      system: SYSTEM_PROMPT,
      user: `ANALYZE DOCUMENT SEGMENT ${i + 1}/${chunks.length}:\n\n${chunks[i]}`
    };

    const response = await callAI(chunkPrompt);
    providerUsed = response.provider;
    const data = extractJSON(response.content);

    if (data) {
      if (i === 0) finalSummary = data.executive_summary;
      if (data.strategic_insights) finalInsights.push(...data.strategic_insights);
      if (data.tasks) allTasks.push(...data.tasks);
    }
  }

  // Final Aggregation
  const now = new Date();
  const tasks = allTasks.map(t => ({
    id: uuidv4(),
    content: t.title || "Actionable Item",
    description: t.description || "Generated via deep analysis.",
    priority: (t.priority || 'Medium').toLowerCase(),
    completed: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    groupId: `group-${(t.category || 'General').toLowerCase().replace(/\s+/g, '-')}`
  }));

  const groupsMap = new Map<string, TaskGroup>();
  tasks.forEach((task: any) => {
    const categoryName = task.groupId.replace('group-', '').toUpperCase();
    if (!groupsMap.has(task.groupId)) {
      groupsMap.set(task.groupId, { id: task.groupId, name: categoryName, expanded: true, tasks: [] });
    }
    groupsMap.get(task.groupId)!.tasks.push(task);
  });

  const summaryText = `EXECUTIVE SUMMARY\n${finalSummary}\n\nSTRATEGIC INSIGHTS\n${finalInsights.slice(0, 8).map(s => `• ${s.insight}`).join('\n')}\n\n[Analyzed via ${providerUsed} Intelligence]`;

  return {
    analysisId: uuidv4(),
    totalTasks: tasks.length,
    groups: Array.from(groupsMap.values()),
    summary: {
      projectDescription: summaryText,
      milestones: [],
      resources: []
    }
  };
};
