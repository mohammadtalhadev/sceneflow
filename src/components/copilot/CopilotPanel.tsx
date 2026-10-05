import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  CornerDownLeft,
  Wand2,
  FileCheck
} from 'lucide-react';
import { 
  AVAILABLE_MODELS, 
  type ChatMessage, 
  sendCopilotMessage, 
  extractCopilotAction,
  getSavedModel, 
  saveSelectedModel 
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
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello Director! I am your **AI Copilot** for Seedance 2.5 filmmaking.\n\nI can:\n• **Auto-sync cues** between your video and screenplay\n• **Format Seedance 2.5 Auteur Scripts** with \`[[CAMERA_SETUP]]\` and \`[[STAGING]]\`\n• **Audit prompt fidelity** and spot missed beats\n\nWhat would you like to work on?`,
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSelectModel = (id: string) => {
    setSelectedModel(id);
    saveSelectedModel(id);
    setIsModelDropdownOpen(false);
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
  }, [inputPrompt, isLoading, messages, selectedModel, scriptText, videoDuration, videoName, cues]);

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

  if (!isOpen) return null;

  const currentModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

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
                <h3 className="text-xs font-black uppercase tracking-wider">AI Copilot</h3>
                <span className="text-[8.5px] px-1 py-0.2 rounded font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                  DIRECTOR
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Keys Settings */}
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              title="Configure API Keys (Gemini, OpenAI, Claude, Ollama)"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface border border-transparent hover:border-border-subtle transition-colors"
            >
              <Key size={14} />
            </button>

            {/* Clear Thread */}
            <button
              type="button"
              onClick={() => setMessages([messages[0]])}
              title="Clear Chat History"
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
        <div className="relative px-3.5 py-1.5 border-b border-border-subtle bg-surface flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <span>Model:</span>
          </div>

          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(prev => !prev)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-subtle hover:bg-surface border border-border-subtle text-[11px] font-semibold text-text-main transition-all"
          >
            <span className="truncate max-w-[170px]">{currentModelObj.name}</span>
            <ChevronDown size={11} className={cn("transition-transform", isModelDropdownOpen && "rotate-180")} />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute top-full right-3.5 mt-1 w-64 bg-surface rounded-xl shadow-2xl border border-border-main py-1 z-50 divide-y divide-border-subtle animate-in fade-in zoom-in-95 duration-100">
              {AVAILABLE_MODELS.map(model => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelectModel(model.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[11px] transition-colors flex flex-col",
                    model.id === selectedModel ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" : "hover:bg-surface-subtle text-text-main"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{model.name}</span>
                    {model.id === selectedModel && <Check size={12} />}
                  </div>
                  <span className="text-[9.5px] text-text-muted font-normal mt-0.5">{model.desc}</span>
                </button>
              ))}
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
              <div className="text-[9.5px] font-bold text-text-muted uppercase tracking-wider px-1">
                {msg.role === 'user' ? 'You' : 'Copilot'}
              </div>

              <div
                className={cn(
                  "p-3 rounded-2xl max-w-[92%] leading-relaxed break-words shadow-2xs select-text",
                  msg.role === 'user'
                    ? "bg-blue-600 text-white rounded-br-xs"
                    : "bg-surface-subtle border border-border-subtle text-text-main rounded-bl-xs"
                )}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content}
                </div>

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
                          : "bg-blue-500 hover:bg-blue-600 text-white active:scale-95 cursor-pointer"
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
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface-subtle border border-border-subtle text-text-muted text-xs max-w-[80%] animate-pulse">
              <RefreshCw size={13} className="animate-spin text-blue-500" />
              <span>Analyzing script & video sync...</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex flex-col gap-1">
              <span className="font-bold">Execution Error</span>
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="text-[10px] underline font-bold mt-1 text-left"
              >
                Open API Keys Settings ➔
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-surface-subtle border-t border-border-subtle flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => handleSendMessage("Sync this screenplay with the video timestamps and extract all 8 cue categories.")}
            className="px-2 py-0.5 rounded-full bg-surface hover:bg-surface-muted border border-border-subtle text-[9.5px] font-bold text-text-muted hover:text-text-main whitespace-nowrap transition-colors"
          >
            🎯 Auto-Sync Cues
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("Format this scene into a Seedance 2.5 Auteur Script with [[CAMERA_SETUP]], [[STAGING]], and [<BRIEF>] directives.")}
            className="px-2 py-0.5 rounded-full bg-surface hover:bg-surface-muted border border-border-subtle text-[9.5px] font-bold text-text-muted hover:text-text-main whitespace-nowrap transition-colors"
          >
            🎬 Seedance Script
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("Audit prompt adherence: What instructions or camera motions did Seedance fail to execute in this clip?")}
            className="px-2 py-0.5 rounded-full bg-surface hover:bg-surface-muted border border-border-subtle text-[9.5px] font-bold text-text-muted hover:text-text-main whitespace-nowrap transition-colors"
          >
            🔍 Audit Fidelity
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border-subtle bg-surface shrink-0">
          <div className="relative flex items-end bg-surface-subtle border border-border-main rounded-2xl p-1.5 focus-within:border-blue-500 transition-colors">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask Copilot (e.g. 'Sync this video', 'Add camera cues')..."
              className="w-full px-2.5 py-1 bg-transparent text-xs text-text-main placeholder-text-muted resize-none focus:outline-none"
            />
            <button
              type="button"
              disabled={isLoading || !inputPrompt.trim()}
              onClick={() => handleSendMessage()}
              className={cn(
                "p-2 rounded-xl transition-all shrink-0 flex items-center justify-center",
                inputPrompt.trim() && !isLoading
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-xs"
                  : "text-text-muted opacity-40 cursor-not-allowed"
              )}
            >
              <Send size={13} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1 px-1 text-[9px] text-text-muted">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="font-mono">Local & Private</span>
          </div>
        </div>
      </aside>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </>
  );
};
