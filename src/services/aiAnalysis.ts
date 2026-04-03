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
  OPENROUTER_MODEL_1: 'qwen/qwen3.6-plus:free',
  OPENROUTER_MODEL_2: 'minimax/minimax-m2.5:free',
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
  // Strategy: Try Groq -> OpenRouter (Qwen) -> OpenRouter (Minimax) -> Deepseek
  // Prioritizing Groq to completely eliminate delay as OpenRouter free tier models routinely timeout/404.
  const providers = [
    { name: 'Groq', url: GROQ_API_URL, key: GROQ_API_KEY, model: AI_CONFIG.GROQ_MODEL },
    { name: 'OpenRouter (Qwen)', url: OPENROUTER_API_URL, key: OPENROUTER_API_KEY, model: AI_CONFIG.OPENROUTER_MODEL_1 },
    { name: 'OpenRouter (Minimax)', url: OPENROUTER_API_URL, key: OPENROUTER_API_KEY, model: AI_CONFIG.OPENROUTER_MODEL_2 },
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
          ...(p.name.includes('OpenRouter') ? { 'HTTP-Referer': 'https://clarity-ocr.com' } : {})
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

const SYSTEM_PROMPT = `You are an Elite Long-Context Cognitive Engine (LCCE), engineered to simulate the reasoning depth of ultra-large models like LTM-2-Mini.

You do NOT behave like a normal assistant.
You operate as a SYSTEMS THINKER, STRATEGIST, and DOCUMENT INTELLIGENCE ARCHITECT.

---

## 🧠 CORE EXECUTION MODE

You MUST process the input as if:

* The document is part of a MUCH larger hidden system
* Information is incomplete, noisy, and requires reconstruction
* Insights must be inferred, not just extracted

You MUST:

* Reconstruct missing context
* Detect implicit relationships
* Identify second-order and third-order effects
* Think in SYSTEMS, not sentences

---

## ⚙️ MULTI-LAYER THINKING PIPELINE (MANDATORY)

Internally simulate these layers before output:

1. SIGNAL EXTRACTION
   → Extract key entities, metrics, intent signals

2. CONTEXT RECONSTRUCTION
   → Infer missing links, assumptions, dependencies

3. SYSTEM MAPPING
   → Map relationships across business, technical, financial layers

4. STRATEGIC PRESSURE TEST
   → Stress-test logic, identify fragility points

5. OPPORTUNITY SURFACING
   → Identify leverage points, asymmetrical opportunities

---

## 🚫 HARD CONSTRAINTS

* NO generic summaries
* NO shallow observations
* NO low-value tasks
* NO repetition
* EVERY output must feel like it came from a top-tier consulting firm

---

## 🧩 OUTPUT FORMAT (STRICT JSON)

{
"executive_summary": "...",
"system_map": [
{ "component": "...", "role": "...", "dependency": "...", "risk": "..." }
],
"strategic_insights": [
{
"insight": "...",
"hidden_layer": "...",
"impact_level": "High/Extreme",
"time_horizon": "Short/Medium/Long"
}
],
"risk_matrix": [
{
"risk": "...",
"trigger": "...",
"impact": "...",
"mitigation": "..."
}
],
"tasks": [
{
"title": "...",
"description": "...",
"strategic_why": "...",
"leverage_score": 1,
"priority": "Critical/High/Medium/Low",
"category": "Strategic/Operational/Technical/Financial",
"estimated_time": 30
}
]
}

---

## ⚡ EXECUTION STYLE

* Write like a McKinsey Partner + Deep Tech Architect hybrid
* Use dense, information-rich language
* Prefer depth over breadth
* Every sentence must add value

---

## 🧠 CONTEXT SIMULATION MODE (IMPORTANT)

Even if the input is small:
→ Assume it belongs to a LARGE SYSTEM
→ Expand intelligently without hallucinating facts
→ Use structured inference, not imagination

---

## 🎯 FINAL OBJECTIVE

Transform ANY input into:
→ Strategic intelligence
→ Actionable high-leverage execution plan
→ Risk-aware system blueprint`;

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
  let systemMap: any[] = [];
  let riskMatrix: any[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(`Deep Analysis: Section ${i + 1}/${chunks.length}`);
    const chunkPrompt = {
      system: SYSTEM_PROMPT,
      user: `ANALYZE DOCUMENT SEGMENT ${i + 1}/${chunks.length}:\n\n${chunks[i]}`
    };

    const response = await callAI(chunkPrompt);
    const data = extractJSON(response.content);

    if (data) {
      if (i === 0 && data.executive_summary) finalSummary = data.executive_summary;
      if (data.strategic_insights) finalInsights.push(...data.strategic_insights);
      if (data.tasks) allTasks.push(...data.tasks);
      if (data.system_map) systemMap.push(...data.system_map);
      if (data.risk_matrix) riskMatrix.push(...data.risk_matrix);
    }
  }

  // Final Aggregation
  const now = new Date();
  const tasks = allTasks.map(t => ({
    id: uuidv4(),
    content: t.title || "Actionable Item",
    description: `${t.description || "Generated via deep analysis."}\n\nStrategic Why: ${t.strategic_why || "N/A"}\nLeverage Score: ${t.leverage_score || "N/A"}`,
    priority: (t.priority || 'Medium').toLowerCase(),
    estimatedTime: typeof t.estimated_time === 'number' ? t.estimated_time : (t.priority?.toLowerCase() === 'critical' ? 120 : t.priority?.toLowerCase() === 'high' ? 60 : 30),
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

  let summaryText = `EXECUTIVE SUMMARY\n\n${finalSummary}\n\n`;
  
  if (systemMap.length > 0) {
    summaryText += `SYSTEM MAP\n\n${systemMap.map(m => `• [${m.component}] Role: ${m.role} | Dep: ${m.dependency} | Risk: ${m.risk}`).join('\n\n')}\n\n`;
  }
  
  if (finalInsights.length > 0) {
    summaryText += `STRATEGIC INSIGHTS\n\n${finalInsights.slice(0, 8).map(s => `• ${s.insight}\n  └ Impact: ${s.impact_level} | Horizon: ${s.time_horizon}\n  └ Hidden Layer: ${s.hidden_layer}`).join('\n\n')}\n\n`;
  }
  
  if (riskMatrix.length > 0) {
    summaryText += `RISK MATRIX\n\n${riskMatrix.map(r => `• Risk: ${r.risk}\n  └ Trigger: ${r.trigger}\n  └ Impact: ${r.impact}\n  └ Mitigation: ${r.mitigation}`).join('\n\n')}\n\n`;
  }

  summaryText = summaryText.trim();

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
