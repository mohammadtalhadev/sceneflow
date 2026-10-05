import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Trash2, Check } from 'lucide-react';
import { getSavedApiKeys, saveApiKeys, type ApiKeysConfig } from '../../services/aiService';
import { UI_TOKENS } from '../../styles/tokens/ui';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ApiKeysConfig>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getSavedApiKeys());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiKeys(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    saveApiKeys({});
    setConfig({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-surface border border-border-main rounded-2xl shadow-2xl overflow-hidden flex flex-col text-text-main"
        role="dialog"
        aria-labelledby="api-keys-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-surface-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Key size={15} />
            </div>
            <div>
              <h2 id="api-keys-title" className="text-xs font-black uppercase tracking-wider">
                Copilot Model Keys
              </h2>
              <span className="text-[10px] text-text-muted">Configure your personal AI providers</span>
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
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-xs">
          {/* Security Alert Badge */}
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 flex items-start gap-2.5">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <p className="font-bold">Device-Only Storage Security</p>
              <p className="opacity-90">
                Your keys remain strictly in your browser's private local storage. They are <strong>never</strong> committed to Git, pushed to GitHub, or sent to any central server.
              </p>
            </div>
          </div>

          {/* Google Gemini */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-[10px] text-text-muted">
                Google Gemini API Key (Recommended)
              </label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-0.5"
              >
                Get Free Key <ExternalLink size={9} />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={config.geminiApiKey || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-main rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors"
            />
          </div>

          {/* OpenAI */}
          <div className="space-y-1">
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
                Get Key <ExternalLink size={9} />
              </a>
            </div>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={config.openaiApiKey || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-main rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors"
            />
          </div>

          {/* Anthropic Claude */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-[10px] text-text-muted">
                Anthropic API Key (Claude)
              </label>
              <a 
                href="https://console.anthropic.com/settings/keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink size={9} />
              </a>
            </div>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={config.anthropicApiKey || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, anthropicApiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-main rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors"
            />
          </div>

          {/* Ollama Local */}
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <label className="font-bold uppercase tracking-wider text-[10px] text-text-muted">
              Local Ollama / LM Studio (Offline & Free)
            </label>
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-[11px] shadow-sm transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check size={13} /> Saved!
                </>
              ) : (
                'Save Keys'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
