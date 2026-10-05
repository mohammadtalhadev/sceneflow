import type { Cue } from '../types/script';

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama';

export interface AIModelOption {
  id: string;
  name: string;
  provider: AIProvider;
  desc: string;
  isMultimodal?: boolean;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    desc: 'Ultra-fast multimodal video & script sync (Recommended)',
    isMultimodal: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    desc: 'Deep reasoning & long-form screenplay analysis',
    isMultimodal: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (OpenAI)',
    provider: 'openai',
    desc: 'High-precision cinematic writing & dialogue polish',
    isMultimodal: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (OpenAI)',
    provider: 'openai',
    desc: 'Fast, cost-effective scene drafting',
    isMultimodal: false,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    desc: 'Industry standard for screenplays & Auteur staging',
    isMultimodal: true,
  },
  {
    id: 'ollama-local',
    name: 'Ollama / Local LLM',
    provider: 'ollama',
    desc: '100% Free & Private (Runs on your local GPU/CPU)',
    isMultimodal: false,
  },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  action?: {
    type: 'apply_cues' | 'update_script';
    data: any;
    label: string;
    isApplied?: boolean;
  };
}

export interface ApiKeysConfig {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

const STORAGE_KEYS_KEY = 'sceneflow_ai_keys';
const STORAGE_SELECTED_MODEL = 'sceneflow_ai_model';

export function getSavedApiKeys(): ApiKeysConfig {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveApiKeys(keys: ApiKeysConfig): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(keys));
}

export function getSavedModel(): string {
  if (typeof localStorage === 'undefined') return 'gemini-2.0-flash';
  return localStorage.getItem(STORAGE_SELECTED_MODEL) || 'gemini-2.0-flash';
}

export function saveSelectedModel(modelId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_SELECTED_MODEL, modelId);
}

const COPILOT_SYSTEM_PROMPT = `You are the AI Director Copilot inside SceneFlow Studio (Seedance 2.5 Cinema Edition).
You assist AI filmmakers in:
1. Script-to-screen synchronization and prompt adherence tracking.
2. Formulating ByteDance Seedance 2.5 Auteur Scripts with state-driven metadata:
   - [[STAGING]]: 5-part scene blocking (Environment, Blocking, Characters, Light, Sound).
   - [[CAMERA_SETUP]]: 3D coordinates, lens mm, and motion velocity.
   - [[CONTINUITY]]: State-in and state-out anchors.
   - [[LIGHTING]]: Volumetric atmosphere, color temperature, and key/fill ratios.
   - [<BRIEF>]: Multi-camera execution commands.
3. Automatically generating chronological sync cues matching SceneFlow's 8 categories:
   dialogue, action, camera, shot, audio, vfx, transition, environment.

Rules for Cue Generation:
When asked to sync or generate cues, you must ALWAYS provide verbatim selectedText copied strictly from the user's screenplay.
If you output cues, enclose them in a JSON block like:
\`\`\`json
{
  "action": "apply_cues",
  "cues": [
    {
      "id": "cue_001",
      "type": "dialogue|action|camera|shot|audio|vfx|transition|environment",
      "speaker": "CHARACTER NAME or null",
      "selectedText": "Exact verbatim substring from script",
      "startTime": 2.5,
      "endTime": 5.0
    }
  ]
}
\`\`\`

If asked to rewrite or update the screenplay, enclose the full script text in:
\`\`\`json
{
  "action": "update_script",
  "scriptText": "..."
}
\`\`\`

Always be insightful, concise, and focused on cinematic execution.`;

export async function sendCopilotMessage({
  messages,
  modelId,
  scriptText,
  videoDuration,
  videoName,
  currentCues,
}: {
  messages: ChatMessage[];
  modelId: string;
  scriptText: string;
  videoDuration?: number;
  videoName?: string;
  currentCues?: Cue[];
}): Promise<string> {
  const modelConfig = AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];
  const keys = getSavedApiKeys();

  // Try local backend proxy first (which uses local server environment without exposing keys to frontend)
  try {
    const proxyRes = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId,
        provider: modelConfig.provider,
        messages,
        context: {
          scriptText,
          videoDuration,
          videoName,
          cuesCount: currentCues?.length ?? 0,
        },
        clientKeys: keys,
      }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.reply) {
        return data.reply;
      }
    }
  } catch {
    // Fall back to direct browser client call below
  }

  // Direct client-side calls
  if (modelConfig.provider === 'gemini') {
    const key = keys.geminiApiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    if (!key) {
      throw new Error('Please configure your Google Gemini API key in Copilot Settings (click 🔑).');
    }
    return callGeminiDirect(key, modelId, messages, scriptText, videoDuration, videoName);
  }

  if (modelConfig.provider === 'openai') {
    const key = keys.openaiApiKey;
    if (!key) {
      throw new Error('Please configure your OpenAI API key in Copilot Settings (click 🔑).');
    }
    return callOpenAIDirect(key, modelId, messages, scriptText, videoDuration);
  }

  if (modelConfig.provider === 'ollama') {
    const url = keys.ollamaUrl || 'http://localhost:11434';
    const model = keys.ollamaModel || 'llama3';
    return callOllamaDirect(url, model, messages, scriptText);
  }

  throw new Error(`Provider for ${modelConfig.name} is not configured or unsupported in direct mode. Please provide an API key.`);
}

async function callGeminiDirect(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  scriptText: string,
  videoDuration?: number,
  videoName?: string
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `${COPILOT_SYSTEM_PROMPT}

CURRENT ACTIVE FILM CONTEXT:
- Video Clip: ${videoName || 'Loaded clip'} (${videoDuration ? `${videoDuration.toFixed(1)}s` : 'unknown duration'})
- Screenplay Text:
<ScriptText>
${scriptText || '(No script currently loaded)'}
</ScriptText>`,
        },
      ],
    },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API returned status ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response text received from Gemini.');
  }
  return text;
}

async function callOpenAIDirect(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  scriptText: string,
  videoDuration?: number
): Promise<string> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const systemContent = `${COPILOT_SYSTEM_PROMPT}

CURRENT ACTIVE FILM CONTEXT:
- Video Duration: ${videoDuration ? `${videoDuration.toFixed(1)}s` : 'unknown'}
- Screenplay Text:
<ScriptText>
${scriptText || '(No script currently loaded)'}
</ScriptText>`;

  const payloadMessages = [
    { role: 'system', content: systemContent },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o',
      messages: payloadMessages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API returned status ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response returned from OpenAI.';
}

async function callOllamaDirect(
  ollamaUrl: string,
  model: string,
  messages: ChatMessage[],
  scriptText: string
): Promise<string> {
  const endpoint = `${ollamaUrl.replace(/\/$/, '')}/api/chat`;

  const payloadMessages = [
    {
      role: 'system',
      content: `${COPILOT_SYSTEM_PROMPT}\n\nCURRENT SCRIPT:\n${scriptText}`,
    },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: payloadMessages,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed (${res.status}). Ensure Ollama is running at ${ollamaUrl}`);
  }

  const data = await res.json();
  return data.message?.content || 'No response returned from Ollama.';
}

/**
 * Parses action payloads (e.g. apply_cues or update_script) from model markdown outputs.
 */
export function extractCopilotAction(content: string): {
  type: 'apply_cues' | 'update_script';
  data: any;
  label: string;
} | null {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.action === 'apply_cues' && Array.isArray(parsed.cues)) {
      return {
        type: 'apply_cues',
        data: parsed.cues,
        label: `Apply ${parsed.cues.length} Cues to Timeline`,
      };
    }
    if (parsed.action === 'update_script' && typeof parsed.scriptText === 'string') {
      return {
        type: 'update_script',
        data: parsed.scriptText,
        label: 'Apply Script Changes to Editor',
      };
    }
  } catch {
    // Not valid JSON action
  }
  return null;
}
