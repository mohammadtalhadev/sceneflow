import type { Cue } from '../types/script';
import type { VideoKeyframe } from './videoVisionService';

export type { VideoKeyframe };
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
  // --- Google Direct (Fastest / Native Multimodal) ---
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Direct)',
    provider: 'gemini',
    desc: 'Ultra-fast direct Google AI Studio connection (Recommended)',
    isMultimodal: true,
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite (Direct)',
    provider: 'gemini',
    desc: 'Lightweight rapid response scene timing & cue extraction',
    isMultimodal: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro (Direct)',
    provider: 'gemini',
    desc: 'Deep cinematic reasoning & long-form screenplay analysis',
    isMultimodal: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash (Direct)',
    provider: 'gemini',
    desc: 'High-speed script parsing & timeline synchronization',
    isMultimodal: true,
  },

  // --- OpenRouter (Universal Multi-Model Gateway) ---
  {
    id: 'openrouter/anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet (OpenRouter)',
    provider: 'openrouter',
    desc: 'Latest flagship hybrid reasoning for cinematic auteur direction',
    isMultimodal: true,
  },
  {
    id: 'openrouter/anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    desc: 'Cinematic screenplay subtext and scene continuity',
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

  // --- Anthropic Direct ---
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet (Direct)',
    provider: 'anthropic',
    desc: 'Latest hybrid thinking model for intricate screenwriting',
    isMultimodal: true,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet (Direct)',
    provider: 'anthropic',
    desc: 'Industry standard for screenplays & auteur staging',
    isMultimodal: true,
  },

  // --- OpenAI Direct ---
  {
    id: 'o3-mini',
    name: 'o3-mini (OpenAI Direct)',
    provider: 'openai',
    desc: 'High-speed reasoning model for temporal cue precision',
    isMultimodal: false,
  },
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
  imageUrl?: string;
  imageMimeType?: string;
  imageName?: string;
  action?: {
    type: 'apply_cues' | 'update_script' | 'autopilot';
    data: any;
    label: string;
    isApplied?: boolean;
    stats?: {
      totalCues?: number;
      cameraCount?: number;
      audioCount?: number;
      dialogueCount?: number;
    };
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

export function isProviderConfigured(provider: AIProvider, keys: ApiKeysConfig): boolean {
  if (provider === 'openrouter') return Boolean(keys.openrouterApiKey);
  if (provider === 'gemini') return Boolean(keys.geminiApiKey);
  if (provider === 'openai') return Boolean(keys.openaiApiKey);
  if (provider === 'anthropic') return Boolean(keys.anthropicApiKey);
  if (provider === 'ollama') return Boolean(keys.ollamaUrl);
  return false;
}

const BUSY_MODELS_CACHE = new Map<string, number>();

export function markModelBusy(modelId: string): void {
  BUSY_MODELS_CACHE.set(modelId, Date.now());
}

export function unmarkModelBusy(modelId: string): void {
  BUSY_MODELS_CACHE.delete(modelId);
}

export function isModelBusy(modelId: string): boolean {
  const ts = BUSY_MODELS_CACHE.get(modelId);
  if (!ts) return false;
  // Mark busy expires after 3 minutes to auto-recover
  if (Date.now() - ts > 3 * 60 * 1000) {
    BUSY_MODELS_CACHE.delete(modelId);
    return false;
  }
  return true;
}

export function isHighDemandOrQuotaError(errorMsg?: string | null): boolean {
  if (!errorMsg) return false;
  const lower = errorMsg.toLowerCase();
  return (
    lower.includes('high demand') ||
    lower.includes('spikes in demand') ||
    lower.includes('resource_exhausted') ||
    lower.includes('capacity') ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('overloaded') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('try again later')
  );
}

/**
 * Computes a numeric recency/version priority score for a model.
 * Models with higher version numbers (e.g. 3.7 > 3.5 > 3.1 > 2.5 > 2.0 > 1.5) rank higher.
 * Flagship tiers (Flash, Pro, Sonnet, o3, R1) receive recency boosts.
 */
export function getModelRecencyScore(model: AIModelOption): number {
  let score = 1000;
  const text = `${model.id} ${model.name}`.toLowerCase();

  // Extract explicit version numbers (e.g. 3.7, 3.5, 3.1, 2.5, 2.0, 1.5, 4.0)
  const versionMatch = text.match(/(\d+\.\d+)/);
  if (versionMatch) {
    const v = parseFloat(versionMatch[1]);
    score += v * 10000;
  } else {
    // Single digit version matching (e.g. gpt-4, llama-3, o1, o3)
    const singleV = text.match(/(?:gpt-|llama-|claude-|gemini-|o)(\d+)/);
    if (singleV) {
      score += parseInt(singleV[1], 10) * 8000;
    }
  }

  // Recency boosts for current-gen flagship architectures
  if (text.includes('3.7')) score += 15000;
  if (text.includes('3.5')) score += 10000;
  if (text.includes('3.1')) score += 9000;
  if (text.includes('2.5')) score += 8000;
  if (text.includes('2.0') || text.includes('2-0')) score += 7000;
  if (text.includes('flash')) score += 3000;
  if (text.includes('r1')) score += 4000;
  if (text.includes('4o')) score += 4000;
  if (text.includes('o3')) score += 5000;
  if (text.includes('exp') || text.includes('preview') || text.includes('latest')) score += 2000;

  // Penalties for older/deprecated versions
  if (text.includes('3.5-turbo')) score -= 15000;
  if (text.includes('1.0') || text.includes('001-deprecated')) score -= 10000;

  // Temporary demotion for models undergoing provider high-demand traffic spikes
  if (isModelBusy(model.id)) score -= 25000;

  return score;
}

/**
 * Intelligent Model Ranking Engine:
 * 1. Configured providers (where an API key has been entered) rank FIRST!
 * 2. Within configured models, sort by highest recency/version score (latest models on top).
 * 3. Unconfigured models are listed below, also sorted by recency.
 */
export function rankAndGroupModels(
  models: AIModelOption[],
  keys: ApiKeysConfig
): {
  configured: AIModelOption[];
  unconfigured: AIModelOption[];
  allRanked: AIModelOption[];
} {
  const configured: AIModelOption[] = [];
  const unconfigured: AIModelOption[] = [];

  models.forEach(m => {
    if (isProviderConfigured(m.provider, keys)) {
      configured.push(m);
    } else {
      unconfigured.push(m);
    }
  });

  // Sort both arrays by recency score descending (highest version first)
  configured.sort((a, b) => getModelRecencyScore(b) - getModelRecencyScore(a));
  unconfigured.sort((a, b) => getModelRecencyScore(b) - getModelRecencyScore(a));

  return {
    configured,
    unconfigured,
    allRanked: [...configured, ...unconfigured],
  };
}

export function getSavedModel(): string {
  const keys = getSavedApiKeys();
  const allModels = getAllAvailableModels();
  const { configured, allRanked } = rankAndGroupModels(allModels, keys);

  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_SELECTED_MODEL);
    if (saved && allModels.some(m => m.id === saved)) {
      return saved;
    }
  }

  // If user has configured keys, default to the top-ranked configured model!
  if (configured.length > 0) {
    return configured[0].id;
  }

  return allRanked[0]?.id || 'gemini-2.0-flash';
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

    const fetched = list.map(item => ({
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

    // Sort by recency score
    fetched.sort((a, b) => getModelRecencyScore(b) - getModelRecencyScore(a));
    return fetched;
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

    const fetched = models
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

    fetched.sort((a, b) => getModelRecencyScore(b) - getModelRecencyScore(a));
    return fetched;
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

    const fetched = list
      .filter(m => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'))
      .map(m => ({
        id: m.id,
        name: m.id.toUpperCase(),
        provider: 'openai' as AIProvider,
        desc: `OpenAI ${m.id} model`,
        isMultimodal: m.id.includes('4o'),
        isCustom: true,
      }));

    fetched.sort((a, b) => getModelRecencyScore(b) - getModelRecencyScore(a));
    return fetched;
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

const COPILOT_SYSTEM_PROMPT = `You are the AI Production Director & Multi-Model Orchestrator inside SceneFlow Studio.
You serve as Lead Director & Showrunner, collaborating with specialized AI creative departments to achieve cinematic fidelity:

MULTI-MODEL TASK DELEGATION MATRIX:
When analyzing creative requests, orchestrate and delegate specialized sub-tasks to the optimal models:
1. AUDIO & SOUND DESIGN (Google Lyria / AudioCraft):
   - Generates tempo, key, instrumentation, acoustic space, and emotional leitmotifs.
   - Formulates Foley, environmental ambience, and precise audio cues with timestamps.
2. VISUAL CONCEPT ART & KEYFRAMING (Nano Banana Pro / Imagen 3 / FLUX.1 Pro):
   - Formulates photorealistic scene prompts with camera lens (e.g. 35mm anamorphic, f/1.8), lighting ratios, color temperature, and volumetric depth.
3. SCRIPT, DIALOGUE & CUE SYNCHRONIZATION:
   - Formulates screenplay pacing, subtextual dialogue beats, and frame-accurate timeline cues across SceneFlow's 8 categories: dialogue, action, camera, shot, audio, vfx, transition, environment.
4. CAMERA CHOREOGRAPHY & CONTINUITY:
   - 3D spatial staging, lens focal length, dolly/pan motion velocity, and continuity anchors.
5. AUTOPILOT AI FILM MAKER PROTOCOL (ELEVENLABS / RUNWAY STYLE):
   - When asked to "Run Film Autopilot", "Make Movie", or autonomously direct a scene, behave like an end-to-end autonomous filmmaker:
   - Break down every scene beat into camera angles, lighting, dialogue pacing, and Foley sound design.
   - Formulate a ready-to-render Google Lyria musical score prompt (tempo, key, instrumentation).
   - Formulate visual keyframe art prompts for image generators (Nano Banana Pro / Midjourney / FLUX).
   - Package all timeline cues into a unified 1-click approval block so the director only has to click "Approve All & Sync to Timeline"!

CANONICAL FILMMAKING ANALYSIS & OUTPUT FORMATS:
When asked for a frame-by-frame analysis, scene breakdown, or script generation, always support and format output into these two production standards:

FORMAT 1: AUTEUR SCRIPT BREAKDOWN FORMAT
Editing Rhythm: <Detailed breakdown of narrative momentum, tempo, and emotional arc>
🔒 CONTINUITY BIBLE UPDATES (New Locks)
[CHARACTER-NAME] lock: <Specific visual anchors, armor/attire, color palettes, wounds or accessories>
[ENV: LOCATION] lock: <Architectural details, lighting direction, volumetric haze, atmospheric elements>
🎥 FRAME-BY-FRAME SHOT BREAKDOWN
SHOT N | MM:SS–MM:SS | <SHOT TITLE>
ACTION: <Detailed physical character/creature blocking, movement velocity, and staging>
CAMERA: <Focal length, camera movement (handheld, tracking, crane, static), lighting angles>
VFX: <Visual effects, particles, energy beams, magic glyphs, volumetric light shafts>
DIALOGUE (Subtitle): "<Exact spoken dialogue or burned-in subtitles>"
🔗 FLOW PROTOCOL (<Transition Junction>)
Audio Bridge: <Acoustic transition, musical tone shift, sound fx carryover>
Visual Anchor: <Key focal object, weapon, prop, or gaze lock to match next shot>
Prop Lock: <State of critical entities, items, and environment>

FORMAT 2: AI GENERATION PROMPTS FORMAT
🤖 AI GENERATION PROMPTS — PART/SCENE N
S1: <Direct generation prompt for AI video/image generator, e.g. Midjourney, Runway, Seedance, Pika>. Camera: <camera movement, angle>. VFX: <effects>.
S2: ...
Director's Note: <Tactical directorial advice, emotional inflection points, audio cues, and continuity warnings>.

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

/**
 * Builds runtime system prompt with dynamic model identity contract
 * to completely eliminate hallucinations regarding model identity.
 */
function buildRuntimeSystemPrompt(
  modelConfig: AIModelOption,
  isAutoOrchestrator: boolean,
  videoName?: string,
  videoDuration?: number,
  scriptText?: string
): string {
  const orchestrationDirectives = isAutoOrchestrator ? `
MULTI-MODEL PRODUCTION DELEGATION DIRECTIVE (ACTIVE):
You are functioning as the Lead AI Director orchestrating specialized AI models for maximum cinematic output:
- Sound Generation & Foley: Delegate to Google Lyria (music tempo, key, acoustic layers, audio cue timestamps).
- Visual Keyframes & Concept Art: Delegate to Nano Banana Pro / Imagen 3 (photorealistic camera prompts, lens mm, lighting setup).
- Screenplay & Timeline Cues: Executed with precision on this active model (dialogue beats, verbatim cues).

At the start of your response, state the "🎬 Director Delegation Matrix" clearly:
### 🎬 Director Delegation Matrix
• 🎵 **Sound & Score**: Google Lyria (Adaptive music, tempo & ambient design)
• 🎨 **Visual Keyframes**: Nano Banana Pro (Photorealistic camera & lighting prompts)
• 📐 **Script & Cues**: ${modelConfig.name} (Screenplay cues & temporal pacing)

Then present each department's assets and timeline cues ready to apply!` : '';

  return `${COPILOT_SYSTEM_PROMPT}

[STRICT RUNTIME IDENTITY CONTRACT]
Your active model runtime is: "${modelConfig.name}" (Model ID: "${modelConfig.id}", Provider: "${modelConfig.provider.toUpperCase()}").
- You MUST identify yourself strictly as "${modelConfig.name}".
- When asked what model you are running or what your version is, state: "I am running as ${modelConfig.name} in SceneFlow Studio".
- NEVER claim you are Claude if your active model is Gemini, and NEVER claim you are Gemini if your active model is Claude or OpenAI.
- NEVER claim you are running on "Seedance 2.5" or "2.5 Cinema Edition". You are the SceneFlow Studio Cinema Production Copilot.
- Speak with the highest factual accuracy, grounded in the screenplay text.

${orchestrationDirectives}

CURRENT ACTIVE FILM CONTEXT:
- Video Clip: ${videoName || 'Loaded clip'} (${videoDuration ? `${videoDuration.toFixed(1)}s` : 'unknown duration'})
- Screenplay Text:
<ScriptText>
${scriptText || '(No script currently loaded)'}
</ScriptText>`;
}

export async function sendCopilotMessage({
  messages,
  modelId,
  scriptText,
  videoDuration,
  videoName,
  currentCues,
  isAutoOrchestrator = false,
  videoKeyframes,
}: {
  messages: ChatMessage[];
  modelId: string;
  scriptText: string;
  videoDuration?: number;
  videoName?: string;
  currentCues?: Cue[];
  isAutoOrchestrator?: boolean;
  videoKeyframes?: VideoKeyframe[];
}): Promise<string> {
  const allModels = getAllAvailableModels();
  const modelConfig = allModels.find(m => m.id === modelId) || allModels[0];
  const keys = getSavedApiKeys();

  const executeProviderCall = async (targetModel: AIModelOption): Promise<string> => {
    // 1. OpenRouter Universal Gateway
    if (targetModel.provider === 'openrouter' || targetModel.id.startsWith('openrouter/')) {
      const key = keys.openrouterApiKey;
      if (!key) throw new Error('Please configure your OpenRouter API key in Copilot Settings (click 🔑).');
      return callOpenRouterDirect(key, targetModel, messages, scriptText, videoDuration, videoName, isAutoOrchestrator, videoKeyframes);
    }

    // 2. Google Gemini Direct
    if (targetModel.provider === 'gemini') {
      const key = keys.geminiApiKey;
      if (!key) throw new Error('Please configure your Google Gemini API key in Copilot Settings (click 🔑).');
      return callGeminiDirect(key, targetModel, messages, scriptText, videoDuration, videoName, isAutoOrchestrator, videoKeyframes);
    }

    // 3. OpenAI Direct
    if (targetModel.provider === 'openai') {
      const key = keys.openaiApiKey;
      if (!key) throw new Error('Please configure your OpenAI API key in Copilot Settings (click 🔑).');
      return callOpenAIDirect(key, targetModel, messages, scriptText, videoDuration, videoName, isAutoOrchestrator, videoKeyframes);
    }

    // 4. Anthropic Claude Direct
    if (targetModel.provider === 'anthropic') {
      const key = keys.anthropicApiKey;
      if (!key) {
        if (keys.openrouterApiKey) {
          return callOpenRouterDirect(keys.openrouterApiKey, targetModel, messages, scriptText, videoDuration, videoName, isAutoOrchestrator, videoKeyframes);
        }
        throw new Error('Please configure your Anthropic or OpenRouter API key in Copilot Settings (click 🔑).');
      }
      return callAnthropicDirect(key, targetModel, messages, scriptText, videoDuration, videoName, isAutoOrchestrator, videoKeyframes);
    }

    // 5. Ollama Local
    if (targetModel.provider === 'ollama') {
      const url = keys.ollamaUrl || 'http://localhost:11434';
      return callOllamaDirect(url, targetModel, messages, scriptText, isAutoOrchestrator);
    }

    throw new Error(`Provider for ${targetModel.name} is not configured. Please check your API keys.`);
  };

  try {
    const result = await executeProviderCall(modelConfig);
    unmarkModelBusy(modelConfig.id);
    return result;
  } catch (err: any) {
    if (isHighDemandOrQuotaError(err.message)) {
      markModelBusy(modelConfig.id);
    }
    throw err;
  }
}

/**
 * OpenRouter direct caller with cinematic system framing and action extraction
 */
async function callOpenRouterDirect(
  apiKey: string,
  modelConfig: AIModelOption,
  messages: ChatMessage[],
  scriptText: string,
  videoDuration?: number,
  videoName?: string,
  isAutoOrchestrator: boolean = false,
  videoKeyframes?: VideoKeyframe[]
): Promise<string> {
  const cleanModelId = modelConfig.id.replace(/^openrouter\//, '');
  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  const systemContent = buildRuntimeSystemPrompt(modelConfig, isAutoOrchestrator, videoName, videoDuration, scriptText);

  const payloadMessages = [
    { role: 'system', content: systemContent },
    ...messages.map((m, idx) => {
      const isLastUser = idx === messages.length - 1 && m.role === 'user';
      if (m.imageUrl || (isLastUser && videoKeyframes && videoKeyframes.length > 0)) {
        const contentParts: any[] = [{ type: 'text', text: m.content }];
        if (m.imageUrl) {
          contentParts.push({ type: 'image_url', image_url: { url: m.imageUrl } });
        }
        if (isLastUser && videoKeyframes) {
          contentParts.push({
            type: 'text',
            text: `\n[SENSORY INPUT: ${videoKeyframes.length} REAL FRAMES CAPTURED FROM VIDEO "${videoName || 'Loaded Video'}"]`
          });
          for (const kf of videoKeyframes) {
            contentParts.push({
              type: 'image_url',
              image_url: { url: kf.dataUrl }
            });
          }
        }
        return {
          role: m.role,
          content: contentParts,
        };
      }
      return { role: m.role, content: m.content };
    }),
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
      top_p: 0.95,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `OpenRouter returned status ${res.status}`;
    if (isHighDemandOrQuotaError(message)) markModelBusy(modelConfig.id);
    throw new Error(message);
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
  modelConfig: AIModelOption,
  messages: ChatMessage[],
  scriptText: string,
  videoDuration?: number,
  videoName?: string,
  isAutoOrchestrator: boolean = false,
  videoKeyframes?: VideoKeyframe[]
): Promise<string> {
  const cleanModelId = modelConfig.id.replace(/^models\//, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelId}:generateContent?key=${apiKey}`;

  const systemContent = buildRuntimeSystemPrompt(modelConfig, isAutoOrchestrator, videoName, videoDuration, scriptText);

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemContent }],
    },
    ...messages.map((m, idx) => {
      const parts: any[] = [{ text: m.content }];
      if (m.imageUrl) {
        const base64Data = m.imageUrl.includes(',') ? m.imageUrl.split(',')[1] : m.imageUrl;
        parts.push({
          inlineData: {
            mimeType: m.imageMimeType || 'image/jpeg',
            data: base64Data,
          },
        });
      }

      // If last user message and videoKeyframes are provided, inject actual frames
      if (idx === messages.length - 1 && m.role === 'user' && videoKeyframes && videoKeyframes.length > 0) {
        parts.push({
          text: `\n\n[DIRECTOR SENSORY VISION: ${videoKeyframes.length} REAL FRAMES CAPTURED ACROSS THE TIMELINE FROM VIDEO "${videoName || 'Loaded Video'}" (${videoDuration ? `${videoDuration.toFixed(1)}s` : ''})]\n` +
                `You have true multimodal visual perception. Inspect each frame image below with full optical scrutiny (examine characters, dragons, armor, costumes, environments, on-screen titles, burned-in subtitles, blocking, and VFX):\n`
        });

        for (const kf of videoKeyframes) {
          const kfBase64 = kf.dataUrl.includes(',') ? kf.dataUrl.split(',')[1] : kf.dataUrl;
          parts.push({
            text: `[KEYFRAME @ ${kf.time.toFixed(1)}s - ${kf.label}]`
          });
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: kfBase64,
            }
          });
        }

        parts.push({
          text: `\n[MANDATORY THREE-PHASE VISUAL & SCRIPT AUDIT PROTOCOL]:\n` +
                `1. 🎬 PHASE 1: FRAME-BY-FRAME VISUAL AUDIT - Analyze and extract the actual visual events, characters, creatures (e.g. dragons), armor/costumes, environments, on-screen titles, burned-in subtitles/dialogue, camera setups, and physical blocking.\n` +
                `2. ⚖️ PHASE 2: SCRIPT COMPARISON & CONTINUITY AUDIT - Compare what actually occurs in the video frames against the screenplay text in the editor. State what matches, what was unscripted, and call out any discrepancies or hallucinations in the script.\n` +
                `3. 📜 PHASE 3: CANONICAL OUTPUT FORMATS - Output both Format 1 (Auteur Script Breakdown with Editing Rhythm, Continuity Bible Locks, Frame-by-Frame Shot Breakdown, Flow Protocol) and Format 2 (AI Generation Prompts S1..S10 + Director's Note). Provide timeline cues in a JSON action block so the director can 1-click sync to timeline!`
        });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    }),
  ];

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `Gemini API returned status ${res.status}`;
    if (isHighDemandOrQuotaError(message)) markModelBusy(modelConfig.id);
    throw new Error(message);
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
  modelConfig: AIModelOption,
  messages: ChatMessage[],
  scriptText: string,
  videoDuration?: number,
  videoName?: string,
  isAutoOrchestrator: boolean = false,
  videoKeyframes?: VideoKeyframe[]
): Promise<string> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const systemContent = buildRuntimeSystemPrompt(modelConfig, isAutoOrchestrator, videoName, videoDuration, scriptText);

  const payloadMessages = [
    { role: 'system', content: systemContent },
    ...messages.map((m, idx) => {
      const isLastUser = idx === messages.length - 1 && m.role === 'user';
      if (m.imageUrl || (isLastUser && videoKeyframes && videoKeyframes.length > 0)) {
        const contentParts: any[] = [{ type: 'text', text: m.content }];
        if (m.imageUrl) {
          contentParts.push({ type: 'image_url', image_url: { url: m.imageUrl } });
        }
        if (isLastUser && videoKeyframes) {
          contentParts.push({
            type: 'text',
            text: `\n[SENSORY INPUT: ${videoKeyframes.length} REAL FRAMES EXTRACTED FROM VIDEO "${videoName || 'Loaded Video'}"]`
          });
          for (const kf of videoKeyframes) {
            contentParts.push({
              type: 'image_url',
              image_url: { url: kf.dataUrl }
            });
          }
        }
        return {
          role: m.role,
          content: contentParts,
        };
      }
      return { role: m.role, content: m.content };
    }),
  ];

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelConfig.id === 'gpt-4o-mini' ? 'gpt-4o-mini' : (modelConfig.id === 'o3-mini' ? 'o3-mini' : 'gpt-4o'),
      messages: payloadMessages,
      temperature: 0.7,
      top_p: 0.95,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `OpenAI API returned status ${res.status}`;
    if (isHighDemandOrQuotaError(message)) markModelBusy(modelConfig.id);
    throw new Error(message);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response returned from OpenAI.';
}

async function callAnthropicDirect(
  apiKey: string,
  modelConfig: AIModelOption,
  messages: ChatMessage[],
  scriptText: string,
  videoDuration?: number,
  videoName?: string,
  isAutoOrchestrator: boolean = false,
  videoKeyframes?: VideoKeyframe[]
): Promise<string> {
  const endpoint = 'https://api.anthropic.com/v1/messages';

  const systemContent = buildRuntimeSystemPrompt(modelConfig, isAutoOrchestrator, videoName, videoDuration, scriptText);

  const payloadMessages = messages.map((m, idx) => {
    const isLastUser = idx === messages.length - 1 && m.role === 'user';
    if (m.imageUrl || (isLastUser && videoKeyframes && videoKeyframes.length > 0)) {
      const contentParts: any[] = [{ type: 'text', text: m.content }];
      if (m.imageUrl) {
        const base64Data = m.imageUrl.includes(',') ? m.imageUrl.split(',')[1] : m.imageUrl;
        contentParts.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: m.imageMimeType || 'image/jpeg',
            data: base64Data,
          },
        });
      }
      if (isLastUser && videoKeyframes) {
        contentParts.push({
          type: 'text',
          text: `\n[SENSORY INPUT: ${videoKeyframes.length} REAL FRAMES EXTRACTED FROM VIDEO "${videoName || 'Loaded Video'}"]`
        });
        for (const kf of videoKeyframes) {
          const kfBase64 = kf.dataUrl.includes(',') ? kf.dataUrl.split(',')[1] : kf.dataUrl;
          contentParts.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: kfBase64,
            },
          });
        }
      }
      return {
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: contentParts,
      };
    }
    return {
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    };
  });

  const modelId = modelConfig.id.includes('3-7') 
    ? 'claude-3-7-sonnet-20250219' 
    : 'claude-3-5-sonnet-20241022';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      system: systemContent,
      messages: payloadMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `Anthropic returned status ${res.status}`;
    if (isHighDemandOrQuotaError(message)) markModelBusy(modelConfig.id);
    throw new Error(message);
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'No response returned from Anthropic.';
}

async function callOllamaDirect(
  ollamaUrl: string,
  modelConfig: AIModelOption,
  messages: ChatMessage[],
  scriptText: string,
  isAutoOrchestrator: boolean = true
): Promise<string> {
  const endpoint = `${ollamaUrl.replace(/\/$/, '')}/api/chat`;

  const systemContent = buildRuntimeSystemPrompt(modelConfig, isAutoOrchestrator, undefined, undefined, scriptText);

  const payloadMessages = [
    {
      role: 'system',
      content: systemContent,
    },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const rawModel = modelConfig.id.replace(/^ollama\//, '') || 'llama3';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: rawModel,
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
  type: 'apply_cues' | 'update_script' | 'autopilot';
  data: any;
  label: string;
  stats?: {
    totalCues?: number;
    cameraCount?: number;
    audioCount?: number;
    dialogueCount?: number;
  };
} | null {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    const cues = parsed.cues || (Array.isArray(parsed) ? parsed : null);

    if (Array.isArray(cues) && cues.length > 0) {
      const cameraCount = cues.filter((c: any) => c.type === 'camera' || c.type === 'shot').length;
      const audioCount = cues.filter((c: any) => c.type === 'audio').length;
      const dialogueCount = cues.filter((c: any) => c.type === 'dialogue').length;

      const isAutopilot = Boolean(parsed.scriptText || parsed.action === 'autopilot' || parsed.action === 'autopilot_production');

      return {
        type: isAutopilot ? 'autopilot' : 'apply_cues',
        data: isAutopilot ? { cues, scriptText: parsed.scriptText } : cues,
        label: isAutopilot
          ? `Approve All & Sync ${cues.length} Cues to Timeline`
          : `Apply ${cues.length} Cues to Timeline`,
        stats: {
          totalCues: cues.length,
          cameraCount,
          audioCount,
          dialogueCount,
        },
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
