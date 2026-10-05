import type { Cue } from '../types/script';

export type AIProvider = 'openrouter' | 'gemini' | 'openai' | 'anthropic' | 'ollama';

export interface AIModelOption {
  id: string;
  name: string;
  provider: AIProvider;
  desc: string;
  isMultimodal?: boolean;
  contextLength?: number;
  isCustom?: boolean;
}

export const DEFAULT_MODELS: AIModelOption[] = [
  // --- OpenRouter (Universal Multi-Model Gateway) ---
  {
    id: 'openrouter/anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    desc: 'Cinematic auteur screenwriting & Seedance 2.5 continuity',
    isMultimodal: true,
  },
  {
    id: 'openrouter/deepseek/deepseek-r1',
    name: 'DeepSeek R1 (OpenRouter)',
    provider: 'openrouter',
    desc: 'Deep reasoning for complex multi-camera scene blocking',
    isMultimodal: false,
  },
  {
    id: 'openrouter/google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash (OpenRouter)',
    provider: 'openrouter',
    desc: 'Ultra-fast screenplay cue timing and synchronization',
    isMultimodal: true,
  },
  {
    id: 'openrouter/openai/gpt-4o',
    name: 'GPT-4o (OpenRouter)',
    provider: 'openrouter',
    desc: 'Cinematic dialogue polish and scene beat breakdown',
    isMultimodal: true,
  },
  {
    id: 'openrouter/meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B (OpenRouter)',
    provider: 'openrouter',
    desc: 'High-capability open-weights directorial intelligence',
    isMultimodal: false,
  },
  {
    id: 'openrouter/google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Free (OpenRouter)',
    provider: 'openrouter',
    desc: '100% Free tier on OpenRouter for quick cue generation',
    isMultimodal: true,
  },

  // --- Google Direct ---
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Direct)',
    provider: 'gemini',
    desc: 'Ultra-fast direct Google AI Studio connection',
    isMultimodal: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro (Direct)',
    provider: 'gemini',
    desc: 'Deep reasoning & long-form screenplay analysis',
    isMultimodal: true,
  },

  // --- OpenAI Direct ---
  {
    id: 'gpt-4o',
    name: 'GPT-4o (OpenAI Direct)',
    provider: 'openai',
    desc: 'High-precision cinematic writing & dialogue polish',
    isMultimodal: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (OpenAI Direct)',
    provider: 'openai',
    desc: 'Fast, cost-effective scene drafting',
    isMultimodal: false,
  },

  // --- Anthropic Direct ---
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet (Direct)',
    provider: 'anthropic',
    desc: 'Industry standard for screenplays & Auteur staging',
    isMultimodal: true,
  },

  // --- Ollama Local ---
  {
    id: 'ollama-local',
    name: 'Ollama (Local LLM)',
    provider: 'ollama',
    desc: '100% Free & Private (Runs on your local GPU/CPU)',
    isMultimodal: false,
  },
];

export const AVAILABLE_MODELS = DEFAULT_MODELS;

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
  openrouterApiKey?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

const STORAGE_KEYS_KEY = 'sceneflow_ai_keys';
const STORAGE_SELECTED_MODEL = 'sceneflow_ai_model';
const STORAGE_CUSTOM_MODELS = 'sceneflow_custom_models';

/**
 * Returns environment variables safely injected during Vite build/dev.
 * Enables zero-touch auto-configuration on this local machine.
 */
function getLocalDeviceEnvKeys(): Partial<ApiKeysConfig> {
  const envKeys: Partial<ApiKeysConfig> = {};
  
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.OPENROUTER_API_KEY) envKeys.openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (process.env.GEMINI_API_KEY) envKeys.geminiApiKey = process.env.GEMINI_API_KEY;
    if (process.env.OPENAI_API_KEY) envKeys.openaiApiKey = process.env.OPENAI_API_KEY;
    if (process.env.ANTHROPIC_API_KEY) envKeys.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (process.env.OLLAMA_ENDPOINT) envKeys.ollamaUrl = process.env.OLLAMA_ENDPOINT;
  }

  // Also check Vite's import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_OPENROUTER_API_KEY) envKeys.openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (import.meta.env.VITE_GEMINI_API_KEY) envKeys.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (import.meta.env.VITE_OPENAI_API_KEY) envKeys.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) envKeys.anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (import.meta.env.VITE_OLLAMA_ENDPOINT) envKeys.ollamaUrl = import.meta.env.VITE_OLLAMA_ENDPOINT;
  }

  return envKeys;
}

export function getSavedApiKeys(): ApiKeysConfig {
  let saved: ApiKeysConfig = {};
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}
  }

  // Merge with local environment (.env.local) so local user has keys entered automatically!
  const envKeys = getLocalDeviceEnvKeys();
  return {
    openrouterApiKey: saved.openrouterApiKey || envKeys.openrouterApiKey || '',
    geminiApiKey: saved.geminiApiKey || envKeys.geminiApiKey || '',
    openaiApiKey: saved.openaiApiKey || envKeys.openaiApiKey || '',
    anthropicApiKey: saved.anthropicApiKey || envKeys.anthropicApiKey || '',
    ollamaUrl: saved.ollamaUrl || envKeys.ollamaUrl || 'http://localhost:11434',
    ollamaModel: saved.ollamaModel || 'llama3',
  };
}

export function saveApiKeys(keys: ApiKeysConfig): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(keys));
}

export function getSavedModel(): string {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_SELECTED_MODEL);
    if (saved) return saved;
  }
  // Default to OpenRouter if an OpenRouter key exists, else Gemini 2.0 Flash
  const keys = getSavedApiKeys();
  if (keys.openrouterApiKey) {
    return 'openrouter/anthropic/claude-3.5-sonnet';
  }
  return 'gemini-2.0-flash';
}

export function saveSelectedModel(modelId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_SELECTED_MODEL, modelId);
}

/**
 * Custom models cached from dynamic API queries
 */
export function getSavedCustomModels(): AIModelOption[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_MODELS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomModels(models: AIModelOption[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_CUSTOM_MODELS, JSON.stringify(models));
}

/**
 * Returns merged model catalog (default presets + dynamically fetched models)
 */
export function getAllAvailableModels(): AIModelOption[] {
  const custom = getSavedCustomModels();
  const mergedMap = new Map<string, AIModelOption>();

  // Add defaults first
  DEFAULT_MODELS.forEach(m => mergedMap.set(m.id, m));

  // Overlay/append fetched models
  custom.forEach(m => mergedMap.set(m.id, m));

  return Array.from(mergedMap.values());
}

/**
 * Dynamically queries the provider's API using the provided key and extracts all available models.
 */
export async function fetchModelsForProvider(
  provider: AIProvider,
  apiKey?: string,
  ollamaUrl?: string
): Promise<AIModelOption[]> {
  const effectiveKeys = getSavedApiKeys();
  const key = apiKey || (
    provider === 'openrouter' ? effectiveKeys.openrouterApiKey :
    provider === 'gemini' ? effectiveKeys.geminiApiKey :
    provider === 'openai' ? effectiveKeys.openaiApiKey :
    provider === 'anthropic' ? effectiveKeys.anthropicApiKey : ''
  );

  if (provider === 'openrouter') {
    const headers: Record<string, string> = {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'SceneFlow Studio',
    };
    if (key) {
      headers['Authorization'] = `Bearer ${key}`;
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error(`OpenRouter returned status ${res.status}. Check your API key.`);
    }

    const json = await res.json();
    const list: any[] = json.data || [];

    return list.map(item => ({
      id: `openrouter/${item.id}`,
      name: item.name || item.id,
      provider: 'openrouter' as AIProvider,
      desc: item.description 
        ? item.description.slice(0, 95) + '...' 
        : `Context: ${item.context_length ? item.context_length.toLocaleString() : 'N/A'} tokens`,
      isMultimodal: Boolean(item.architecture?.modality?.includes('image')),
      contextLength: item.context_length,
      isCustom: true,
    }));
  }

  if (provider === 'gemini') {
    if (!key) throw new Error('Gemini API key is required to fetch models.');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetch(endpoint);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API returned status ${res.status}`);
    }

    const json = await res.json();
    const models: any[] = json.models || [];

    return models
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => {
        const cleanId = m.name.replace(/^models\//, '');
        return {
          id: cleanId,
          name: m.displayName || cleanId,
          provider: 'gemini' as AIProvider,
          desc: m.description ? m.description.slice(0, 95) + '...' : 'Google Gemini model',
          isMultimodal: true,
          isCustom: true,
        };
      });
  }

  if (provider === 'openai') {
    if (!key) throw new Error('OpenAI API key is required to fetch models.');
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API returned status ${res.status}`);
    }

    const json = await res.json();
    const list: any[] = json.data || [];

    return list
      .filter(m => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'))
      .map(m => ({
        id: m.id,
        name: m.id.toUpperCase(),
        provider: 'openai' as AIProvider,
        desc: `OpenAI ${m.id} model`,
        isMultimodal: m.id.includes('4o'),
        isCustom: true,
      }));
  }

  if (provider === 'ollama') {
    const targetUrl = (ollamaUrl || effectiveKeys.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
    const res = await fetch(`${targetUrl}/api/tags`);
    if (!res.ok) {
      throw new Error(`Failed to reach Ollama at ${targetUrl}. Status: ${res.status}`);
    }

    const json = await res.json();
    const models: any[] = json.models || [];

    return models.map(m => ({
      id: `ollama/${m.name}`,
      name: `${m.name} (Local)`,
      provider: 'ollama' as AIProvider,
      desc: `Local Ollama model • Size: ${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB`,
      isMultimodal: false,
      isCustom: true,
    }));
  }

  return [];
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
  const allModels = getAllAvailableModels();
  const modelConfig = allModels.find(m => m.id === modelId) || allModels[0];
  const keys = getSavedApiKeys();

  // 1. OpenRouter Universal Gateway
  if (modelConfig.provider === 'openrouter' || modelId.startsWith('openrouter/')) {
    const key = keys.openrouterApiKey;
    if (!key) {
      throw new Error('Please configure your OpenRouter API key in Copilot Settings (click 🔑).');
    }
    return callOpenRouterDirect(key, modelId, messages, scriptText, videoDuration, videoName);
  }

  // 2. Google Gemini Direct
  if (modelConfig.provider === 'gemini') {
    const key = keys.geminiApiKey;
    if (!key) {
      throw new Error('Please configure your Google Gemini API key in Copilot Settings (click 🔑).');
    }
    return callGeminiDirect(key, modelId, messages, scriptText, videoDuration, videoName);
  }

  // 3. OpenAI Direct
  if (modelConfig.provider === 'openai') {
    const key = keys.openaiApiKey;
    if (!key) {
      throw new Error('Please configure your OpenAI API key in Copilot Settings (click 🔑).');
    }
    return callOpenAIDirect(key, modelId, messages, scriptText, videoDuration, videoName);
  }

  // 4. Anthropic Claude Direct
  if (modelConfig.provider === 'anthropic') {
    const key = keys.anthropicApiKey;
    if (!key) {
      // If no Anthropic key, check if OpenRouter key is present as seamless fallback!
      if (keys.openrouterApiKey) {
        return callOpenRouterDirect(keys.openrouterApiKey, 'anthropic/claude-3.5-sonnet', messages, scriptText, videoDuration, videoName);
      }
      throw new Error('Please configure your Anthropic or OpenRouter API key in Copilot Settings (click 🔑).');
    }
    return callAnthropicDirect(key, modelId, messages, scriptText, videoDuration, videoName);
  }

  // 5. Ollama Local
  if (modelConfig.provider === 'ollama') {
    const url = keys.ollamaUrl || 'http://localhost:11434';
    const rawModel = modelId.replace(/^ollama\//, '') || keys.ollamaModel || 'llama3';
    return callOllamaDirect(url, rawModel, messages, scriptText);
  }

  throw new Error(`Provider for ${modelConfig.name} is not configured. Please check your API keys.`);
}

/**
 * OpenRouter direct caller with cinematic system framing and action extraction
 */
async function callOpenRouterDirect(
  apiKey: string,
  modelId: string,
  messages: ChatMessage[],
  scriptText: string,
  videoDuration?: number,
  videoName?: string
): Promise<string> {
  const cleanModelId = modelId.replace(/^openrouter\//, '');
  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  const systemContent = `${COPILOT_SYSTEM_PROMPT}

CURRENT ACTIVE FILM CONTEXT:
- Video Clip: ${videoName || 'Loaded clip'} (${videoDuration ? `${videoDuration.toFixed(1)}s` : 'unknown duration'})
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
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'SceneFlow Cinema Studio',
    },
    body: JSON.stringify({
      model: cleanModelId,
      messages: payloadMessages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenRouter returned status ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('No response text received from OpenRouter.');
  }
  return text;
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
  videoDuration?: number,
  videoName?: string
): Promise<string> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const systemContent = `${COPILOT_SYSTEM_PROMPT}

CURRENT ACTIVE FILM CONTEXT:
- Video Clip: ${videoName || 'Loaded clip'} (${videoDuration ? `${videoDuration.toFixed(1)}s` : 'unknown duration'})
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

async function callAnthropicDirect(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  scriptText: string,
  videoDuration?: number,
  videoName?: string
): Promise<string> {
  const endpoint = 'https://api.anthropic.com/v1/messages';

  const systemContent = `${COPILOT_SYSTEM_PROMPT}

CURRENT ACTIVE FILM CONTEXT:
- Video Clip: ${videoName || 'Loaded clip'} (${videoDuration ? `${videoDuration.toFixed(1)}s` : 'unknown duration'})
- Screenplay Text:
<ScriptText>
${scriptText || '(No script currently loaded)'}
</ScriptText>`;

  const payloadMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemContent,
      messages: payloadMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic returned status ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'No response returned from Anthropic.';
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
