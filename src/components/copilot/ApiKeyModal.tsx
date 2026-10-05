import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  Trash2, 
  Check, 
  RefreshCw, 
  Cpu, 
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  getSavedApiKeys, 
  saveApiKeys, 
  fetchModelsForProvider,
  saveCustomModels,
  getSavedCustomModels,
  type ApiKeysConfig, 
  type AIProvider 
} from '../../services/aiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelsUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose,
  onModelsUpdated 
}) => {
  const [config, setConfig] = useState<ApiKeysConfig>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [fetchingProvider, setFetchingProvider] = useState<AIProvider | null>(null);
  const [fetchStatus, setFetchStatus] = useState<Record<string, { success?: boolean; msg: string }>>({});

  useEffect(() => {
    if (isOpen) {
      setConfig(getSavedApiKeys());
      setSavedSuccess(false);
      setFetchStatus({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiKeys(config);
    setSavedSuccess(true);
    if (onModelsUpdated) onModelsUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const handleClear = () => {
    saveApiKeys({});
    setConfig({
      openrouterApiKey: '',
      geminiApiKey: '',
      openaiApiKey: '',
      anthropicApiKey: '',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3',
    });
    setFetchStatus({});
  };

  const handleFetchModels = async (provider: AIProvider) => {
    setFetchingProvider(provider);
    setFetchStatus(prev => ({ ...prev, [provider]: { msg: 'Connecting to API...' } }));

    try {
      const key = 
        provider === 'openrouter' ? config.openrouterApiKey :
        provider === 'gemini' ? config.geminiApiKey :
        provider === 'openai' ? config.openaiApiKey :
        provider === 'anthropic' ? config.anthropicApiKey : '';

      const models = await fetchModelsForProvider(provider, key, config.ollamaUrl);
      
      // Merge with existing custom models
      const existing = getSavedCustomModels().filter(m => m.provider !== provider);
      const combined = [...existing, ...models];
      saveCustomModels(combined);

      // Auto-save the key as well so it persists
      saveApiKeys(config);

      setFetchStatus(prev => ({
        ...prev,
        [provider]: { 
          success: true, 
          msg: `✓ Loaded ${models.length} ${provider} models!` 
        }
      }));

      if (onModelsUpdated) onModelsUpdated();
    } catch (err: any) {
      setFetchStatus(prev => ({
        ...prev,
        [provider]: { 
          success: false, 
          msg: err.message || 'Failed to fetch models.' 
        }
      }));
    } finally {
      setFetchingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-surface border border-border-main rounded-2xl shadow-2xl overflow-hidden flex flex-col text-text-main"
        role="dialog"
        aria-labelledby="api-keys-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-surface-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Key size={15} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="api-keys-title" className="text-xs font-black uppercase tracking-wider">
                  Copilot Model & API Keys
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-blue-500/10 text-blue-500 font-bold">
                  Multi-Provider
                </span>
              </div>
              <span className="text-[10px] text-text-muted">Auto-fetch live models and configure private endpoints</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-main hover:bg-surface transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4.5 max-h-[72vh] overflow-y-auto custom-scrollbar text-xs">
          {/* Security Alert Badge */}
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 flex items-start gap-2.5">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <div className="flex items-center gap-2">
                <span className="font-bold">Zero-Disclosure Local Security</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-green-500/20 text-green-700 dark:text-green-300 font-bold">
                  Active
                </span>
              </div>
              <p className="opacity-90">
                Your keys remain strictly on this device (in browser <code>localStorage</code> or local <code>.env.local</code>). They are <strong>never</strong> committed to Git, pushed to GitHub, or sent to any telemetry server.
              </p>
            </div>
          </div>

          {/* 1. OpenRouter (Universal Multi-Model Gateway) */}
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="text-purple-500" />
                <label className="font-bold uppercase tracking-wider text-[10.5px] text-purple-600 dark:text-purple-400">
                  OpenRouter API Key (Recommended)
                </label>
              </div>
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-[9.5px] text-purple-500 hover:underline flex items-center gap-0.5"
              >
                Get OpenRouter Key <ExternalLink size={9} />
              </a>
            </div>
            
            <p className="text-[10px] text-text-muted leading-tight">
              One universal key for Claude 3.5/3.7 Sonnet, DeepSeek R1, GPT-4o, Gemini 2.0, and 200+ models.
            </p>

            <div className="flex items-center gap-1.5">
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={config.openrouterApiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, openrouterApiKey: e.target.value }))}
                className="flex-1 px-3 py-2 bg-surface border border-border-main rounded-xl focus:outline-none focus:border-purple-500 font-mono text-xs transition-colors"
              />
              <button
                type="button"
                disabled={fetchingProvider === 'openrouter'}
                onClick={() => handleFetchModels('openrouter')}
                title="Auto-fetch and extract available models from OpenRouter"
                className="px-2.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-2xs"
              >
                <RefreshCw size={12} className={fetchingProvider === 'openrouter' ? 'animate-spin' : ''} />
                <span>Fetch Models</span>
              </button>
            </div>

            {fetchStatus.openrouter && (
              <div className={`text-[10px] font-mono px-1 ${fetchStatus.openrouter.success ? 'text-green-500 font-bold' : 'text-amber-500'}`}>
                {fetchStatus.openrouter.msg}
              </div>
            )}
          </div>

          {/* 2. Google Gemini */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-[10px] text-text-muted">
                Google Gemini API Key
              </label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-0.5"
              >
                Get Gemini Key <ExternalLink size={9} />
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={config.geminiApiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                className="flex-1 px-3 py-2 bg-surface-subtle border border-border-main rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors"
              />
              <button
                type="button"
                disabled={fetchingProvider === 'gemini' || !config.geminiApiKey}
                onClick={() => handleFetchModels('gemini')}
                title="Fetch models from Google AI Studio"
                className="px-2.5 py-2 bg-surface hover:bg-surface-subtle border border-border-main text-text-main rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-40 shrink-0"
              >
                <RefreshCw size={11} className={fetchingProvider === 'gemini' ? 'animate-spin' : ''} />
                <span>Fetch</span>
              </button>
            </div>
            {fetchStatus.gemini && (
              <div className={`text-[10px] font-mono px-1 ${fetchStatus.gemini.success ? 'text-green-500 font-bold' : 'text-amber-500'}`}>
                {fetchStatus.gemini.msg}
              </div>
            )}
          </div>

          {/* 3. OpenAI */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-[10px] text-text-muted">
                OpenAI API Key (ChatGPT)
              </label>
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-0.5"
              >
                Get OpenAI Key <ExternalLink size={9} />
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="password"
                placeholder="sk-proj-..."
                value={config.openaiApiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                className="flex-1 px-3 py-2 bg-surface-subtle border border-border-main rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors"
              />
              <button
                type="button"
                disabled={fetchingProvider === 'openai' || !config.openaiApiKey}
                onClick={() => handleFetchModels('openai')}
                title="Fetch models from OpenAI API"
                className="px-2.5 py-2 bg-surface hover:bg-surface-subtle border border-border-main text-text-main rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-40 shrink-0"
              >
                <RefreshCw size={11} className={fetchingProvider === 'openai' ? 'animate-spin' : ''} />
                <span>Fetch</span>
              </button>
            </div>
            {fetchStatus.openai && (
              <div className={`text-[10px] font-mono px-1 ${fetchStatus.openai.success ? 'text-green-500 font-bold' : 'text-amber-500'}`}>
                {fetchStatus.openai.msg}
              </div>
            )}
          </div>

          {/* 4. Anthropic Claude Direct */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-[10px] text-text-muted">
                Anthropic API Key (Claude Direct)
              </label>
              <a 
                href="https://console.anthropic.com/settings/keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-0.5"
              >
                Get Anthropic Key <ExternalLink size={9} />
              </a>
            </div>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={config.anthropicApiKey || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, anthropicApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-main rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors"
            />
            <span className="text-[9.5px] text-text-muted">Tip: OpenRouter also gives full access to Claude without CORS restrictions.</span>
          </div>

          {/* 5. Ollama Local */}
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu size={13} className="text-green-500" />
                <label className="font-bold uppercase tracking-wider text-[10px] text-text-muted">
                  Local Ollama / LM Studio (Offline & Free)
                </label>
              </div>
              <button
                type="button"
                disabled={fetchingProvider === 'ollama'}
                onClick={() => handleFetchModels('ollama')}
                title="Fetch local models installed in Ollama"
                className="text-[9.5px] text-green-600 dark:text-green-400 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw size={10} className={fetchingProvider === 'ollama' ? 'animate-spin' : ''} />
                Scan Local Models
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="http://localhost:11434"
                value={config.ollamaUrl || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border-main rounded-xl font-mono text-[11px]"
              />
              <input
                type="text"
                placeholder="llama3"
                value={config.ollamaModel || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, ollamaModel: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border-main rounded-xl font-mono text-[11px]"
              />
            </div>
            {fetchStatus.ollama && (
              <div className={`text-[10px] font-mono px-1 ${fetchStatus.ollama.success ? 'text-green-500 font-bold' : 'text-amber-500'}`}>
                {fetchStatus.ollama.msg}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle bg-surface-subtle">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 text-[11px] font-bold transition-colors"
          >
            <Trash2 size={13} /> Clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-border-subtle text-text-muted hover:text-text-main text-[11px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-sm transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check size={13} /> Saved & Synced!
                </>
              ) : (
                'Save & Sync Keys'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
