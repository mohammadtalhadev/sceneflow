import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Key, 
  Film, 
  Check, 
  RefreshCw, 
  Trash2, 
  ChevronDown, 
  Search,
  CornerDownLeft,
  Wand2,
  FileCheck,
  Zap,
  Cpu,
  Layers,
  Music,
  Image as ImageIcon
} from 'lucide-react';
import { 
  getAllAvailableModels, 
  type ChatMessage, 
  sendCopilotMessage, 
  extractCopilotAction,
  getSavedModel, 
  saveSelectedModel,
  fetchModelsForProvider,
  saveCustomModels,
  getSavedCustomModels,
  getSavedApiKeys,
  rankAndGroupModels,
  isProviderConfigured,
  type AIModelOption,
  type AIProvider
} from '../../services/aiService';
import { ApiKeyModal } from './ApiKeyModal';
import { cn } from '../../lib/utils';
import type { Cue } from '../../types/script';

export interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scriptText: string;
  videoDuration?: number;
  videoName?: string;
  cues: Cue[];
  onApplyCues: (newCues: Cue[]) => void;
  onApplyScript: (newScript: string) => void;
}

const PROVIDER_BADGES: Record<AIProvider, { label: string; colorClass: string }> = {
  openrouter: { label: 'OpenRouter', colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  gemini: { label: 'Gemini', colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  openai: { label: 'OpenAI', colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  anthropic: { label: 'Anthropic', colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  ollama: { label: 'Local', colorClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
};

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  isOpen,
  onClose,
  scriptText,
  videoDuration = 0,
  videoName,
  cues,
  onApplyCues,
  onApplyScript,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(() => getSavedModel());
  const [availableModels, setAvailableModels] = useState<AIModelOption[]>(() => getAllAvailableModels());
  const [isAutoOrchestrator, setIsAutoOrchestrator] = useState<boolean>(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | AIProvider>('all');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentModelObj = useMemo(() => {
    return availableModels.find(m => m.id === selectedModel) || availableModels[0];
  }, [availableModels, selectedModel]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello Director! I am your **AI Production Copilot** for Cinema Direction & Virtual Production.

I can:
• **Auto-sync cues** between your video and screenplay
• **Orchestrate specialized AI models** across sound (Google Lyria), visual keyframes (Nano Banana Pro / Imagen), and script sync (Gemini & Claude)
• **Design camera choreography & staging** with 3D blocking and lens focal lengths
• **Audit cinematic continuity** and narrative pacing
• **Access 200+ models** via OpenRouter, Google Gemini, OpenAI, Claude, or local Ollama

You can use **Auto Orchestrator** to automatically assign optimal models for each task, or pick your preferred model above. What would you like to direct?`,
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const reloadModelCatalog = useCallback(() => {
    const all = getAllAvailableModels();
    setAvailableModels(all);
    const keys = getSavedApiKeys();
    const ranked = rankAndGroupModels(all, keys);
    // If current selectedModel has no key but another does, auto-select the top configured model
    const currentIsConfigured = isProviderConfigured(
      all.find(m => m.id === selectedModel)?.provider || 'gemini',
      keys
    );
    if (!currentIsConfigured && ranked.configured.length > 0) {
      setSelectedModel(ranked.configured[0].id);
      saveSelectedModel(ranked.configured[0].id);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (isOpen) {
      reloadModelCatalog();
    }
  }, [isOpen, reloadModelCatalog]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModelDropdownOpen]);

  const handleSelectModel = (id: string) => {
    setSelectedModel(id);
    saveSelectedModel(id);
    setIsModelDropdownOpen(false);
  };

  const handleRefreshAllModels = async () => {
    setIsFetchingModels(true);
    setFetchMessage(null);
    try {
      const keys = getSavedApiKeys();
      let totalFetched = 0;
      let newModels: AIModelOption[] = [];

      // Check OpenRouter
      if (keys.openrouterApiKey) {
        try {
          const orModels = await fetchModelsForProvider('openrouter', keys.openrouterApiKey);
          newModels = [...newModels, ...orModels];
          totalFetched += orModels.length;
        } catch (e: any) {
          console.warn('OpenRouter models fetch warning:', e.message);
        }
      }

      // Check Gemini
      if (keys.geminiApiKey) {
        try {
          const gemModels = await fetchModelsForProvider('gemini', keys.geminiApiKey);
          newModels = [...newModels, ...gemModels];
          totalFetched += gemModels.length;
        } catch (e: any) {
          console.warn('Gemini models fetch warning:', e.message);
        }
      }

      // Check Ollama
      if (keys.ollamaUrl) {
        try {
          const ollamaModels = await fetchModelsForProvider('ollama', undefined, keys.ollamaUrl);
          newModels = [...newModels, ...ollamaModels];
          totalFetched += ollamaModels.length;
        } catch (e: any) {}
      }

      if (newModels.length > 0) {
        const existing = getSavedCustomModels().filter(
          m => !newModels.some(nm => nm.id === m.id)
        );
        saveCustomModels([...existing, ...newModels]);
        reloadModelCatalog();
        setFetchMessage(`✓ Synced ${totalFetched} live models!`);
      } else {
        setFetchMessage('No new models found. Configure your API keys in 🔑 settings.');
      }
    } catch (err: any) {
      setFetchMessage(`Fetch failed: ${err.message}`);
    } finally {
      setIsFetchingModels(false);
      setTimeout(() => setFetchMessage(null), 3000);
    }
  };

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const reply = await sendCopilotMessage({
        messages: newHistory,
        modelId: selectedModel,
        scriptText,
        videoDuration,
        videoName,
        currentCues: cues,
        isAutoOrchestrator,
      });

      const action = extractCopilotAction(reply);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        action: action ? { ...action, isApplied: false } : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing AI request. Please check your API keys.');
    } finally {
      setIsLoading(false);
    }
  }, [inputPrompt, isLoading, messages, selectedModel, scriptText, videoDuration, videoName, cues, isAutoOrchestrator]);

  const handleApplyAction = (msgId: string, action: ChatMessage['action']) => {
    if (!action) return;
    if (action.type === 'apply_cues') {
      onApplyCues(action.data);
    } else if (action.type === 'update_script') {
      onApplyScript(action.data);
    }

    setMessages(prev =>
      prev.map(m =>
        m.id === msgId && m.action
          ? { ...m, action: { ...m.action, isApplied: true } }
          : m
      )
    );
  };

  const groupedRanked = useMemo(() => {
    const keys = getSavedApiKeys();
    const ranked = rankAndGroupModels(availableModels, keys);

    const filterFn = (m: AIModelOption) => {
      const matchesProvider = providerFilter === 'all' || m.provider === providerFilter;
      const q = modelSearch.toLowerCase().trim();
      const matchesQuery = !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
      return matchesProvider && matchesQuery;
    };

    return {
      configured: ranked.configured.filter(filterFn),
      unconfigured: ranked.unconfigured.filter(filterFn),
      totalCount: ranked.allRanked.filter(filterFn).length,
    };
  }, [availableModels, providerFilter, modelSearch]);

  if (!isOpen) return null;

  const currentBadge = PROVIDER_BADGES[currentModelObj.provider] || PROVIDER_BADGES.gemini;

  const renderModelItem = (model: AIModelOption, isConfigured: boolean) => {
    const badge = PROVIDER_BADGES[model.provider] || PROVIDER_BADGES.gemini;
    const isSelected = model.id === selectedModel;
    return (
      <button
        key={model.id}
        type="button"
        onClick={() => handleSelectModel(model.id)}
        className={cn(
          "w-full text-left px-2.5 py-1.5 text-[11px] transition-colors flex flex-col gap-0.5 rounded-lg",
          isSelected ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold" : "hover:bg-surface-subtle text-text-main"
        )}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 truncate">
            {isConfigured && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 shadow-2xs" title="Key Active & Configured" />
            )}
            <span className="truncate font-semibold">{model.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn("text-[8px] px-1 py-0.2 rounded font-mono border font-bold", badge.colorClass)}>
              {badge.label}
            </span>
            {isSelected && <Check size={12} className="text-purple-600 dark:text-purple-400" />}
          </div>
        </div>
        <span className="text-[9.5px] text-text-muted font-normal line-clamp-1">
          {model.desc}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside 
        className="fixed inset-y-0 right-0 z-50 lg:static lg:z-auto w-full sm:w-96 lg:w-96 h-full flex flex-col bg-surface border-l border-border-main shadow-2xl transition-all select-none text-text-main animate-in slide-in-from-right duration-200"
        aria-label="AI Director Copilot"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border-subtle bg-surface-subtle shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider">AI Director</h3>
                <span className="text-[8.5px] px-1.5 py-0.2 rounded font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                  STUDIO
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Keys Settings */}
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              title="Configure API Keys & Fetch Models"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface border border-transparent hover:border-border-subtle transition-colors"
            >
              <Key size={14} />
            </button>

            {/* Clear Thread */}
            <button
              type="button"
              onClick={() => {
                setMessages([
                  {
                    id: `welcome-${Date.now()}`,
                    role: 'assistant',
                    content: `Hello Director! I am your **AI Production Copilot** running on **${currentModelObj.name}** for Cinema Direction & Virtual Production.

I can:
• **Auto-sync cues** between your video and screenplay
• **Orchestrate specialized AI models** across sound (Google Lyria), visual keyframes (Nano Banana Pro / Imagen), and script sync (${currentModelObj.name})
• **Design camera choreography & staging** with 3D blocking and lens focal lengths
• **Audit cinematic continuity** and narrative pacing
• **Access 200+ models** via OpenRouter, Google Gemini, OpenAI, Claude, or local Ollama

What would you like to direct?`,
                    timestamp: Date.now(),
                  },
                ]);
              }}
              title="Reset Conversation"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface border border-transparent hover:border-border-subtle transition-colors"
            >
              <Trash2 size={13} />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="Close Copilot Panel"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface transition-colors ml-1"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Mode Selector Strip: Auto Orchestrator vs Single Model */}
        <div className="px-3 py-1.5 bg-surface-subtle border-b border-border-subtle flex items-center justify-between text-[10px] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-text-muted uppercase tracking-wider text-[9px]">Mode:</span>
            <div className="flex items-center gap-0.5 bg-surface border border-border-subtle rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setIsAutoOrchestrator(true)}
                title="AI automatically analyzes task and assigns Google Lyria (Audio), Nano Banana Pro (Visuals), and Gemini/Claude (Script)"
                className={cn(
                  "px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                  isAutoOrchestrator
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-text-muted hover:text-text-main"
                )}
              >
                <Zap size={10} className={isAutoOrchestrator ? "text-amber-300" : ""} />
                <span>Auto Orchestrator</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAutoOrchestrator(false)}
                title="Direct standard query to selected model only"
                className={cn(
                  "px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                  !isAutoOrchestrator
                    ? "bg-surface-subtle border border-border-main text-text-main shadow-xs"
                    : "text-text-muted hover:text-text-main"
                )}
              >
                <span>Single Model</span>
              </button>
            </div>
          </div>

          <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-bold hidden sm:inline">
            {isAutoOrchestrator ? 'Lyria • Nano Banana' : 'Direct'}
          </span>
        </div>

        {/* Model Selector Bar */}
        <div ref={dropdownRef} className="relative px-3.5 py-1.5 border-b border-border-subtle bg-surface flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <span>Primary Model:</span>
            <span className={cn("text-[8.5px] px-1.5 py-0.2 rounded font-mono border font-bold", currentBadge.colorClass)}>
              {currentBadge.label}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(prev => !prev)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-subtle hover:bg-surface border border-border-subtle text-[11px] font-semibold text-text-main transition-all max-w-[190px]"
          >
            <span className="truncate">{currentModelObj.name}</span>
            <ChevronDown size={11} className={cn("transition-transform shrink-0", isModelDropdownOpen && "rotate-180")} />
          </button>

          {/* Upgraded Multi-Model Dropdown Drawer with Configured-First Ranking */}
          {isModelDropdownOpen && (
            <div className="absolute top-full right-2 left-2 mt-1 bg-surface rounded-xl shadow-2xl border border-border-main p-2 z-50 flex flex-col max-h-[380px] animate-in fade-in zoom-in-95 duration-100">
              {/* Search & Actions Bar */}
              <div className="space-y-1.5 pb-2 border-b border-border-subtle shrink-0">
                <div className="flex items-center gap-1 bg-surface-subtle border border-border-subtle rounded-lg px-2 py-1">
                  <Search size={11} className="text-text-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Search models (e.g. 3.1, 2.0, claude, deepseek)..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="w-full bg-transparent text-[11px] focus:outline-none font-sans"
                    autoFocus
                  />
                  {modelSearch && (
                    <button type="button" onClick={() => setModelSearch('')} className="text-text-muted hover:text-text-main">
                      <X size={10} />
                    </button>
                  )}
                </div>

                {/* Provider Filter Chips & Refresh Button */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
                    {(['all', 'openrouter', 'gemini', 'openai', 'ollama'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProviderFilter(p)}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors shrink-0",
                          providerFilter === p 
                            ? "bg-purple-600 text-white" 
                            : "bg-surface-subtle text-text-muted hover:text-text-main"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isFetchingModels}
                    onClick={handleRefreshAllModels}
                    title="Auto-fetch and refresh models from your configured API keys"
                    className="p-1 rounded-md text-text-muted hover:text-purple-600 hover:bg-surface-subtle transition-colors shrink-0"
                  >
                    <RefreshCw size={11} className={isFetchingModels ? 'animate-spin text-purple-600' : ''} />
                  </button>
                </div>

                {fetchMessage && (
                  <div className="text-[9.5px] font-mono text-purple-600 dark:text-purple-400 font-bold px-1 animate-in fade-in">
                    {fetchMessage}
                  </div>
                )}
              </div>

              {/* Models List: Configured First & Ranked by Version Recency */}
              <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/40 custom-scrollbar mt-1">
                {groupedRanked.totalCount === 0 ? (
                  <div className="py-6 text-center text-text-muted text-[11px]">
                    No models match "{modelSearch}"
                  </div>
                ) : (
                  <>
                    {/* Section 1: Configured Models (Keys Entered) - Enlisted First & Ranked by Recency */}
                    {groupedRanked.configured.length > 0 && (
                      <div className="pb-1">
                        <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center justify-between bg-green-500/10 rounded-lg mx-1 my-1 border border-green-500/20">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span>Ready & Key Active ({groupedRanked.configured.length})</span>
                          </div>
                          <span className="text-[8px] font-mono text-green-700 dark:text-green-300 font-bold">Latest First</span>
                        </div>
                        {groupedRanked.configured.map(model => renderModelItem(model, true))}
                      </div>
                    )}

                    {/* Section 2: Other Models (Key Required) */}
                    {groupedRanked.unconfigured.length > 0 && (
                      <div className="pt-1">
                        <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between mx-1">
                          <span>Other Models (Requires Key)</span>
                          <span className="text-[8px] font-mono text-text-muted">Ranked by Version</span>
                        </div>
                        {groupedRanked.unconfigured.map(model => renderModelItem(model, false))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer info */}
              <div className="pt-1.5 border-t border-border-subtle text-[9px] text-text-muted flex items-center justify-between px-1 shrink-0">
                <span>{groupedRanked.totalCount} models (Enlisted by Key & Version)</span>
                <button 
                  type="button" 
                  onClick={() => { setIsModelDropdownOpen(false); setIsKeyModalOpen(true); }}
                  className="text-purple-500 hover:underline font-bold"
                >
                  Manage Keys 🔑
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Context Status Strip */}
        <div className="px-3.5 py-1 bg-surface-muted/30 border-b border-border-subtle/60 flex items-center justify-between text-[9px] font-mono text-text-muted shrink-0">
          <span className="truncate max-w-[180px]">
            {videoName ? `Clip: ${videoName}` : 'No local video loaded'}
          </span>
          <span>
            {videoDuration > 0 ? `${videoDuration.toFixed(1)}s` : '--'} • {cues.length} Cues
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col space-y-1.5 animate-in fade-in duration-150",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className="text-[9.5px] font-bold text-text-muted uppercase tracking-wider px-1 flex items-center gap-1.5">
                {msg.role === 'user' ? (
                  <span>You</span>
                ) : (
                  <>
                    <span className="text-text-main font-black">AI Director</span>
                    <span className="text-[8px] px-1 py-0.2 rounded font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                      {currentModelObj.name}
                    </span>
                  </>
                )}
              </div>

              <div
                className={cn(
                  "p-3 rounded-2xl max-w-[94%] leading-relaxed break-words shadow-2xs select-text",
                  msg.role === 'user'
                    ? "bg-purple-600 text-white rounded-br-xs"
                    : "bg-surface-subtle border border-border-subtle text-text-main rounded-bl-xs"
                )}
              >
                {/* Formatted Clean Content */}
                <FormattedMessageContent content={msg.content} isUser={msg.role === 'user'} />

                {/* Action Card Button (Apply Cues / Update Script) */}
                {msg.action && (
                  <div className="mt-2.5 pt-2 border-t border-border-subtle/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Wand2 size={11} /> Ready to apply
                    </span>
                    <button
                      type="button"
                      disabled={msg.action.isApplied}
                      onClick={() => handleApplyAction(msg.id, msg.action)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 shadow-2xs",
                        msg.action.isApplied
                          ? "bg-green-500/10 text-green-600 border border-green-500/20 cursor-default"
                          : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95 cursor-pointer"
                      )}
                    >
                      {msg.action.isApplied ? (
                        <>
                          <Check size={11} /> Applied
                        </>
                      ) : (
                        <>
                          <FileCheck size={11} /> {msg.action.label}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-text-muted text-[11px] p-2 animate-pulse">
              <RefreshCw size={13} className="animate-spin text-purple-500" />
              <span>
                {isAutoOrchestrator 
                  ? `Orchestrating Lyria (Sound) + Nano Banana (Visuals) via ${currentModelObj.name}...` 
                  : `Directing scene with ${currentModelObj.name}...`}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] space-y-1">
              <p className="font-bold">Execution Error</p>
              <p>{errorMsg}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Suggestion Chips */}
        <div className="px-3 py-1.5 border-t border-border-subtle bg-surface flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0 text-[10px]">
          <button
            type="button"
            onClick={() => handleSendMessage('Auto-orchestrate this scene: generate Lyria sound cues, Nano Banana visual keyframe prompt, and sync timeline cues.')}
            className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 whitespace-nowrap transition-colors font-bold"
          >
            ⚡ Auto-Orchestrate Scene
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Formulate adaptive Google Lyria audio and sound design cues for this scene.')}
            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface border border-border-subtle text-text-muted hover:text-text-main whitespace-nowrap transition-colors"
          >
            🎵 Google Lyria Audio
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Create a photorealistic cinematic visual keyframe prompt using Nano Banana Pro / Imagen 3.')}
            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface border border-border-subtle text-text-muted hover:text-text-main whitespace-nowrap transition-colors"
          >
            🎨 Nano Banana Pro Visuals
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Auto-sync screenplay cues between script and video timeline.')}
            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface border border-border-subtle text-text-muted hover:text-text-main whitespace-nowrap transition-colors"
          >
            🎬 Auto-Sync Cues
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border-main bg-surface-subtle shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 bg-surface border border-border-main rounded-xl p-2 focus-within:border-purple-500 transition-colors shadow-2xs">
              <textarea
                ref={textareaRef}
                rows={2}
                placeholder={`Ask ${currentModelObj.name} (e.g. 'Generate Lyria audio cues and Nano Banana camera visual')...`}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent resize-none focus:outline-none text-xs text-text-main placeholder:text-text-faint custom-scrollbar leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
              title="Send message (Enter)"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </aside>

      {/* Keys & Models Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onModelsUpdated={reloadModelCatalog}
      />
    </>
  );
};

/**
 * Formats Markdown without raw asterisk artifacts:
 * - Bolds (**text**) render cleanly without asterisks
 * - Bullets (•, -, *) render as sleek dots without asterisks
 * - Inline code blocks render as styled badges
 */
function FormattedMessageContent({ content, isUser }: { content: string; isUser?: boolean }) {
  // Strip raw JSON action blocks if present, since interactive action buttons render underneath
  const cleanContent = content.replace(/```(?:json)?\s*\{\s*"action":\s*(?:"apply_cues"|"update_script")[\s\S]*?\}\s*```/g, '').trim();

  const lines = cleanContent.split('\n');

  return (
    <div className={cn("space-y-1 font-sans text-xs leading-relaxed", isUser && "text-white")}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Section Headers (### or ####)
        if (trimmed.startsWith('### ') || trimmed.startsWith('#### ') || trimmed.startsWith('## ')) {
          const headerText = trimmed.replace(/^#{2,4}\s*/, '');
          const isDelegation = headerText.toLowerCase().includes('delegation') || headerText.toLowerCase().includes('matrix') || headerText.toLowerCase().includes('director');
          return (
            <div 
              key={idx} 
              className={cn(
                "font-black text-[11.5px] uppercase tracking-wider pt-2 pb-0.5 flex items-center gap-1.5",
                isDelegation 
                  ? "text-purple-600 dark:text-purple-400 border-b border-purple-500/20 mb-1" 
                  : (isUser ? "text-white border-b border-white/20" : "text-text-main border-b border-border-subtle/50")
              )}
            >
              <Sparkles size={11} className={cn("shrink-0", isUser ? "text-white" : "text-purple-500")} />
              <span>{renderInlineMarkdown(headerText, isUser)}</span>
            </div>
          );
        }

        // Bullet point lines: •, -, or *
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^(?:•|-|\*)\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 my-0.5">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", isUser ? "bg-white/80" : "bg-purple-500")} />
              <div className="flex-1 text-[11.5px] leading-snug">
                {renderInlineMarkdown(bulletText, isUser)}
              </div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-[11.5px] leading-relaxed">
            {renderInlineMarkdown(line, isUser)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string, isUser?: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Tokenize **bold**, `code`, and *italic*
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      parts.push(
        <strong key={match.index} className={cn("font-bold", isUser ? "text-white" : "text-text-main")}>
          {inner}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const inner = token.slice(1, -1);
      parts.push(
        <code 
          key={match.index} 
          className={cn(
            "px-1 py-0.2 rounded font-mono text-[10.5px] font-semibold border",
            isUser ? "bg-white/20 text-white border-white/30" : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
          )}
        >
          {inner}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const inner = token.slice(1, -1);
      parts.push(
        <em key={match.index} className={cn("italic", isUser ? "text-white/90" : "text-text-muted")}>
          {inner}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
