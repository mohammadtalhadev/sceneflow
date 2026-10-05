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
  Image as ImageIcon,
  FileText,
  Copy,
  Paperclip,
  AlertTriangle,
  AlertCircle,
  Eye
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
  isHighDemandOrQuotaError,
  isModelBusy,
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
  onSwitchToScript?: () => void;
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
  onSwitchToScript,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(() => getSavedModel());
  const [availableModels, setAvailableModels] = useState<AIModelOption[]>(() => getAllAvailableModels());
  const [isAutoOrchestrator, setIsAutoOrchestrator] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | AIProvider>('all');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Copying & multimodal attachment states
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isThreadCopied, setIsThreadCopied] = useState<boolean>(false);
  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const currentModelObj = useMemo(() => {
    return availableModels.find(m => m.id === selectedModel) || availableModels[0];
  }, [availableModels, selectedModel]);

  // Recommended fallback model when current model hits high demand or quota limits
  const recommendedFallbackModel = useMemo(() => {
    const keys = getSavedApiKeys();
    const workingCandidates = availableModels.filter(
      m => m.id !== selectedModel && isProviderConfigured(m.provider, keys) && !isModelBusy(m.id)
    );
    if (workingCandidates.length === 0) {
      // Any non-busy model as fallback suggestion
      const anyWorking = availableModels.filter(m => m.id !== selectedModel && !isModelBusy(m.id));
      return anyWorking[0] || null;
    }
    const ranked = rankAndGroupModels(workingCandidates, keys);
    return ranked.configured[0] || workingCandidates[0];
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

  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  const handleCopyFullThread = async () => {
    try {
      const threadText = messages
        .map(m => {
          const roleLabel = m.role === 'user' ? 'DIRECTOR' : `AI PRODUCTION COPILOT (${currentModelObj.name})`;
          const timestamp = new Date(m.timestamp).toLocaleTimeString();
          return `[${timestamp}] ${roleLabel}:\n${m.content}\n`;
        })
        .join('\n---\n\n');
      await navigator.clipboard.writeText(threadText);
      setIsThreadCopied(true);
      setTimeout(() => setIsThreadCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy thread:', e);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image file size exceeds 8MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage({
          dataUrl: reader.result,
          mimeType: file.type,
          name: file.name,
        });
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if ((!text && !attachedImage) || isLoading) return;

    const currentImage = attachedImage;
    setErrorMsg(null);
    setInputPrompt('');
    setAttachedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text || (currentImage ? `[Attached Reference Image: ${currentImage.name}] Analyze this visual keyframe for cinematic direction.` : ''),
      timestamp: Date.now(),
      imageUrl: currentImage?.dataUrl,
      imageMimeType: currentImage?.mimeType,
      imageName: currentImage?.name,
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
  }, [inputPrompt, attachedImage, isLoading, messages, selectedModel, scriptText, videoDuration, videoName, cues, isAutoOrchestrator]);

  const handleSwitchAndRetry = (newModelId: string) => {
    setSelectedModel(newModelId);
    saveSelectedModel(newModelId);
    setErrorMsg(null);
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleRetrySameModel = () => {
    setErrorMsg(null);
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleApplyAction = (msgId: string, action: ChatMessage['action']) => {
    if (!action) return;
    if (action.type === 'apply_cues' || action.type === 'autopilot') {
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
    const isBusy = isModelBusy(model.id);

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
            {isBusy && (
              <span 
                className="text-[8px] px-1 py-0.2 rounded font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold flex items-center gap-0.5"
                title="Model currently experiencing high demand / traffic spikes"
              >
                <AlertTriangle size={8} /> High Demand
              </span>
            )}
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
        className="fixed inset-y-0 right-0 z-50 lg:static lg:z-auto w-full sm:w-96 lg:w-[420px] xl:w-[460px] shrink-0 h-full flex flex-col bg-surface border-l border-border-main shadow-2xl transition-all select-none text-text-main animate-in slide-in-from-right duration-200 relative"
        aria-label="AI Director Copilot"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          if (e.dataTransfer.files?.[0]) {
            handleImageFile(e.dataTransfer.files[0]);
          }
        }}
      >
        {/* Drag and Drop Visual Target Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-purple-950/85 backdrop-blur-xs z-50 flex flex-col items-center justify-center border-2 border-dashed border-purple-400 p-6 text-center text-white pointer-events-none animate-in fade-in duration-150">
            <ImageIcon size={38} className="text-purple-300 mb-2 animate-bounce" />
            <p className="font-black text-sm">Drop Reference Image Here</p>
            <p className="text-xs text-purple-200 mt-1 max-w-xs">Uploads storyboard, keyframe or camera visual reference to Copilot</p>
          </div>
        )}

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
            {/* Copy Full Directorial Log */}
            <button
              type="button"
              onClick={handleCopyFullThread}
              title={isThreadCopied ? "Thread Copied to Clipboard!" : "Copy Full Directorial Thread"}
              className={cn(
                "p-1.5 rounded-lg border transition-all",
                isThreadCopied 
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                  : "text-text-muted hover:text-text-main hover:bg-surface border-transparent hover:border-border-subtle"
              )}
            >
              {isThreadCopied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>

            {/* Switch to Script Preview Button */}
            {onSwitchToScript && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToScript();
                }}
                title="Switch back to Script Preview"
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[9.5px] font-bold text-text-muted hover:text-text-main hover:bg-surface border border-transparent hover:border-border-subtle transition-colors"
              >
                <FileText size={11} className="text-blue-500" />
                <span>Script</span>
              </button>
            )}

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


        {/* Model Selector Bar */}
        <div ref={dropdownRef} className="relative px-3.5 py-1.5 border-b border-border-subtle bg-surface flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <span>Primary Model:</span>
            <span className={cn("text-[8.5px] px-1.5 py-0.2 rounded font-mono border font-bold", currentBadge.colorClass)}>
              {currentBadge.label}
            </span>
            {isModelBusy(selectedModel) && (
              <span 
                className="text-[8px] px-1.5 py-0.2 rounded font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold flex items-center gap-0.5 animate-pulse"
                title="This model is currently experiencing high demand / spikes"
              >
                <AlertTriangle size={8} /> High Demand
              </span>
            )}
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
              <div className="text-[9.5px] font-bold text-text-muted uppercase tracking-wider px-1 flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
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

                {/* Copy Single Message Button */}
                <button
                  type="button"
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  title={copiedMsgId === msg.id ? "Copied!" : "Copy message"}
                  className={cn(
                    "p-0.5 rounded text-text-muted hover:text-text-main transition-colors",
                    copiedMsgId === msg.id && "text-green-500 font-bold"
                  )}
                >
                  {copiedMsgId === msg.id ? (
                    <span className="flex items-center gap-0.5 text-[8.5px] text-green-500">
                      <Check size={10} /> Copied
                    </span>
                  ) : (
                    <Copy size={10} />
                  )}
                </button>
              </div>

              <div
                className={cn(
                  "p-3 rounded-2xl max-w-[94%] leading-relaxed break-words shadow-2xs select-text",
                  msg.role === 'user'
                    ? "bg-purple-600 text-white rounded-br-xs"
                    : "bg-surface-subtle border border-border-subtle text-text-main rounded-bl-xs"
                )}
              >
                {/* User attached reference image preview */}
                {msg.imageUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[260px] bg-black/40 shadow-xs">
                    <img 
                      src={msg.imageUrl} 
                      alt={msg.imageName || 'Reference'} 
                      className="w-full max-h-48 object-cover rounded-lg" 
                    />
                    {msg.imageName && (
                      <div className="p-1 px-2 text-[9px] font-mono text-white/90 bg-black/60 truncate flex items-center gap-1">
                        <ImageIcon size={9} />
                        <span className="truncate">{msg.imageName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Formatted Clean Content */}
                <FormattedMessageContent content={msg.content} isUser={msg.role === 'user'} />

                {/* Action Card: Film Autopilot Approval Deck or Screenplay Update */}
                {msg.action && (msg.action.type === 'apply_cues' || msg.action.type === 'autopilot') && (
                  <div className="mt-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-purple-500" />
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-300">
                          Film Autopilot Sync Deck
                        </span>
                      </div>
                      <span className="text-[8.5px] font-mono bg-purple-500/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold">
                        {Array.isArray(msg.action.data) ? `${msg.action.data.length} Cues` : 'Cues Ready'}
                      </span>
                    </div>

                    {/* Metric Pills */}
                    <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                      <div className="bg-surface/90 border border-border-subtle p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                        <span className="text-text-muted font-bold uppercase text-[8px]">Camera</span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          🎥 {msg.action.stats?.cameraCount ?? (Array.isArray(msg.action.data) ? msg.action.data.filter((c: any) => c.type === 'camera').length : 0)} Setups
                        </span>
                      </div>
                      <div className="bg-surface/90 border border-border-subtle p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                        <span className="text-text-muted font-bold uppercase text-[8px]">Sound & Lyria</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          🎵 {msg.action.stats?.audioCount ?? (Array.isArray(msg.action.data) ? msg.action.data.filter((c: any) => c.type === 'audio').length : 0)} Cues
                        </span>
                      </div>
                      <div className="bg-surface/90 border border-border-subtle p-1.5 rounded-lg flex flex-col items-center justify-center text-center">
                        <span className="text-text-muted font-bold uppercase text-[8px]">Dialogue</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          💬 {msg.action.stats?.dialogueCount ?? (Array.isArray(msg.action.data) ? msg.action.data.filter((c: any) => c.type === 'dialogue').length : 0)} Beats
                        </span>
                      </div>
                    </div>

                    {/* Big 1-Click Approve Button */}
                    <button
                      type="button"
                      disabled={msg.action.isApplied}
                      onClick={() => handleApplyAction(msg.id, msg.action)}
                      className={cn(
                        "w-full py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer",
                        msg.action.isApplied
                          ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 cursor-default"
                          : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20 active:scale-98"
                      )}
                    >
                      {msg.action.isApplied ? (
                        <>
                          <Check size={13} className="text-green-500" />
                          <span>Timeline Cues Synchronized & Active</span>
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          <span>✅ Approve All & Sync to Timeline</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Screenplay Revision Card */}
                {msg.action && msg.action.type === 'update_script' && (
                  <div className="mt-2.5 pt-2 border-t border-border-subtle/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <FileText size={11} /> Screenplay Revision Ready
                    </span>
                    <button
                      type="button"
                      disabled={msg.action.isApplied}
                      onClick={() => handleApplyAction(msg.id, msg.action)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer",
                        msg.action.isApplied
                          ? "bg-green-500/10 text-green-600 border border-green-500/20 cursor-default"
                          : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
                      )}
                    >
                      {msg.action.isApplied ? (
                        <>
                          <Check size={11} /> Screenplay Applied
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
                Directing scene with {currentModelObj.name}...
              </span>
            </div>
          )}

          {/* Error Card with High Demand Alert & 1-Click Fallback Switch */}
          {errorMsg && (
            <div className="animate-in fade-in slide-in-from-top duration-200">
              {isHighDemandOrQuotaError(errorMsg) ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-text-main space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={15} className="shrink-0 animate-bounce" />
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      Model High Demand / Capacity Spike
                    </span>
                  </div>
                  <p className="text-[10.5px] text-text-muted leading-relaxed">
                    Google/Provider servers are currently experiencing temporary traffic spikes for <strong className="text-text-main">{currentModelObj.name}</strong>.
                  </p>

                  <div className="pt-1 flex flex-wrap gap-2">
                    {recommendedFallbackModel && (
                      <button
                        type="button"
                        onClick={() => handleSwitchAndRetry(recommendedFallbackModel.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10.5px] flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Zap size={12} className="text-amber-300" />
                        <span>⚡ Switch to {recommendedFallbackModel.name} & Retry</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRetrySameModel}
                      className="px-2.5 py-1.5 rounded-lg bg-surface border border-border-main hover:bg-surface-subtle text-text-main font-semibold text-[10.5px] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RefreshCw size={11} />
                      <span>Retry Again</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle size={13} />
                    <span>Execution Error</span>
                  </div>
                  <p>{errorMsg}</p>
                  <button
                    type="button"
                    onClick={handleRetrySameModel}
                    className="mt-1 px-2 py-0.5 rounded bg-surface border border-red-500/30 text-[10px] font-semibold text-text-main hover:bg-surface-subtle flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={10} /> Retry
                  </button>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Suggestion Chips */}
        <div className="px-3 py-1.5 border-t border-border-subtle bg-surface flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0 text-[10px]">
          <button
            type="button"
            onClick={() => handleSendMessage('Run full Film Autopilot: break down screenplay into frame-accurate camera setups, Google Lyria audio and sound design, and photorealistic Nano Banana visual prompts ready for 1-click timeline sync.')}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 whitespace-nowrap transition-all font-black flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Sparkles size={11} /> 🚀 Run Film Autopilot
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Auto-orchestrate this scene: generate Lyria sound cues, Nano Banana visual keyframe prompt, and sync timeline cues.')}
            className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 whitespace-nowrap transition-colors font-bold cursor-pointer"
          >
            ⚡ Auto-Orchestrate Scene
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Formulate adaptive Google Lyria audio and sound design cues for this scene.')}
            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface border border-border-subtle text-text-muted hover:text-text-main whitespace-nowrap transition-colors cursor-pointer"
          >
            🎵 Google Lyria Audio
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Create a photorealistic cinematic visual keyframe prompt using Nano Banana Pro / Imagen 3.')}
            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface border border-border-subtle text-text-muted hover:text-text-main whitespace-nowrap transition-colors cursor-pointer"
          >
            🎨 Nano Banana Pro Visuals
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Auto-sync screenplay cues between script and video timeline.')}
            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface border border-border-subtle text-text-muted hover:text-text-main whitespace-nowrap transition-colors cursor-pointer"
          >
            🎬 Auto-Sync Cues
          </button>
        </div>

        {/* Input Bar with Image Attachment Support */}
        <div className="p-3 border-t border-border-main bg-surface-subtle shrink-0">
          {/* Hidden File Input for Image Attachments */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImageFile(e.target.files[0]);
              }
            }}
          />

          {/* Attached Image Thumbnail Chip */}
          {attachedImage && (
            <div className="flex items-center justify-between bg-surface border border-purple-500/30 rounded-lg px-2 py-1 mb-2 animate-in fade-in">
              <div className="flex items-center gap-2 truncate">
                <img 
                  src={attachedImage.dataUrl} 
                  alt="Thumbnail" 
                  className="w-6 h-6 object-cover rounded shrink-0 border border-border-subtle" 
                />
                <span className="text-[10px] font-mono text-text-main truncate max-w-[200px]">
                  {attachedImage.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  if (imageInputRef.current) imageInputRef.current.value = '';
                }}
                className="p-1 text-text-muted hover:text-red-500 rounded transition-colors cursor-pointer"
                title="Remove attached image"
              >
                <X size={12} />
              </button>
            </div>
          )}

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
                placeholder={attachedImage ? "Add directorial instruction for this image..." : `Ask ${currentModelObj.name} (e.g. 'Generate Lyria audio cues and Nano Banana camera visual')...`}
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

            {/* Paperclip Image Attachment Button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Attach Reference Image / Storyboard Keyframe"
              className={cn(
                "p-2.5 rounded-xl border transition-all cursor-pointer shrink-0",
                attachedImage 
                  ? "border-purple-500 text-purple-600 bg-purple-500/10 shadow-xs" 
                  : "border-border-main text-text-muted hover:text-text-main hover:bg-surface"
              )}
            >
              <Paperclip size={15} />
            </button>

            <button
              type="submit"
              disabled={isLoading || (!inputPrompt.trim() && !attachedImage)}
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
