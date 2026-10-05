import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Book, 
  Coffee, 
  Info,
  Sparkles,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UI_TOKENS } from '../styles/tokens/ui';
import { EXTERNAL_LINKS } from '../constants/links';
import { XIcon } from './common';
import type { AppThemeMode, AppThemeCategory } from '../hooks/useAppShellTheme';
import type { ScriptWidthPresetId, ScrollFocusPresetId } from '../types/script';
import { 
  FileMenuDropdown, 
  SettingsMenuDropdown, 
  ModeSegmentedControl 
} from './header';

export type HeaderMenuId = 'file' | 'settings';

export interface AppHeaderProps {
  mode: 'playback' | 'edit';
  setMode: (mode: 'playback' | 'edit') => void;
  isLibraryOpen: boolean;
  setIsLibraryOpen: (open: boolean) => void;
  isCopilotOpen?: boolean;
  onToggleCopilot?: () => void;
  isScriptVisible?: boolean;
  onToggleScriptVisibility?: () => void;
  onNewProject?: () => void;
  onOpenGuide?: () => void;
  isColorModalOpen: boolean;
  setIsColorModalOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isInfoModalOpen: boolean;
  setIsInfoModalOpen: (open: boolean) => void;
  importJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportJson: () => void;
  onExportSrt?: () => void;
  onExportCsv?: () => void;
  onExportEdl?: () => void;
  themeMode?: AppThemeMode;
  effectiveThemeCategory?: AppThemeCategory;
  onSetThemeMode?: (mode: AppThemeMode) => void;
  isViewCustomized?: boolean;
  onResetView?: () => void;
  onOpenShortcuts?: () => void;
  scriptWidthPreset?: ScriptWidthPresetId;
  setScriptWidthPreset?: (preset: ScriptWidthPresetId) => void;
  scrollFocusPreset?: ScrollFocusPresetId;
  applyScrollFocus?: (preset: ScrollFocusPresetId) => void;
  isPreferencesCustomized?: boolean;
  onResetAll?: () => void;
  onOpenRawCuesModal?: () => void;
  onOpenRawScriptModal?: () => void;
  isCuesModalOpen?: boolean;
  isScriptModalOpen?: boolean;
  activeMenu?: HeaderMenuId | null;
  onToggleMenu?: (menuId: HeaderMenuId) => void;
  onCloseMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = memo(({
  mode,
  setMode,
  isLibraryOpen,
  setIsLibraryOpen,
  isCopilotOpen = false,
  onToggleCopilot,
  isScriptVisible = true,
  onToggleScriptVisibility,
  onNewProject,
  onOpenGuide,
  isColorModalOpen,
  setIsColorModalOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isInfoModalOpen,
  setIsInfoModalOpen,
  importJson,
  exportJson,
  onExportSrt,
  onExportCsv,
  onExportEdl,
  themeMode = 'auto',
  effectiveThemeCategory = 'light',
  onSetThemeMode,
  isViewCustomized = false,
  onResetView,
  onOpenShortcuts,
  scriptWidthPreset,
  setScriptWidthPreset,
  scrollFocusPreset,
  applyScrollFocus,
  isPreferencesCustomized = false,
  onResetAll,
  onOpenRawCuesModal,
  onOpenRawScriptModal,
  isCuesModalOpen = false,
  isScriptModalOpen = false,
  activeMenu: activeMenuProp,
  onToggleMenu: onToggleMenuProp,
  onCloseMenu: onCloseMenuProp,
}) => {
  const [internalActiveMenu, setInternalActiveMenu] = useState<HeaderMenuId | null>(null);
  const activeMenu = activeMenuProp !== undefined ? activeMenuProp : internalActiveMenu;

  const closeMenu = useCallback(() => {
    if (onCloseMenuProp) onCloseMenuProp();
    setInternalActiveMenu(null);
  }, [onCloseMenuProp]);

  const toggleMenu = useCallback((menuId: HeaderMenuId) => {
    if (onToggleMenuProp) {
      onToggleMenuProp(menuId);
    } else {
      setInternalActiveMenu(prev => (prev === menuId ? null : menuId));
    }
  }, [onToggleMenuProp]);

  // Auto-close open dropdown menus whenever a modal opens
  useEffect(() => {
    if (isColorModalOpen || isSettingsOpen || isInfoModalOpen || isLibraryOpen || isCuesModalOpen || isScriptModalOpen) {
      closeMenu();
    }
  }, [isColorModalOpen, isSettingsOpen, isInfoModalOpen, isLibraryOpen, isCuesModalOpen, isScriptModalOpen, closeMenu]);

  return (
    <header className={cn(UI_TOKENS.layout.appHeader, "hidden lg:flex")}>
      {/* Left Wing: Brand Logo & Tiered File Menu */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <div className="flex items-center gap-2 lg:gap-3">
          <img
            src="/SCENEFLOW_TAG_B.png"
            alt="SceneFlow Logo"
            referrerPolicy="no-referrer"
            className="logo-light h-8 lg:h-9 w-auto object-contain selection:bg-transparent pointer-events-none"
          />
          <img
            src="/SCENEFLOW_TAG_WHITE.png"
            alt="SceneFlow Logo"
            referrerPolicy="no-referrer"
            className="logo-dark h-8 lg:h-9 w-auto object-contain selection:bg-transparent pointer-events-none"
          />
          <div className="hidden xl:flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-main leading-tight">Studio Suite</span>
            <span className="text-[9px] font-semibold tracking-wider text-purple-500 font-mono leading-none">Seedance 2.5</span>
          </div>
        </div>

        {/* File Dropdown Menu */}
        <FileMenuDropdown
          isOpen={activeMenu === 'file'}
          onToggle={() => toggleMenu('file')}
          onClose={closeMenu}
          onImportJson={importJson}
          onExportJson={exportJson}
          onExportSrt={onExportSrt}
          onExportCsv={onExportCsv}
          onExportEdl={onExportEdl}
          onNewProject={onNewProject}
          onOpenGuide={onOpenGuide}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenRawCuesModal={onOpenRawCuesModal}
          onOpenRawScriptModal={onOpenRawScriptModal}
        />
      </div>

      {/* Center Stage: Segmented Workflow Mode Switcher */}
      <ModeSegmentedControl
        mode={mode}
        setMode={setMode}
      />

      {/* Right Wing: Library Gateway, Support, Studio Preferences & Info */}
      <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
        {/* Standalone Library Button */}
        <button
          onClick={() => setIsLibraryOpen(true)}
          title="Explore Screenplay Library & Examples"
          className={cn(
            UI_TOKENS.button.libraryPop,
            isLibraryOpen && UI_TOKENS.button.libraryPopActive
          )}
        >
          <Book size={14} className="text-amber-500 shrink-0" />
          <span className="font-black uppercase tracking-wider text-[10px]">Library</span>
        </button>

        {/* Updates on X */}
        <a
          href={EXTERNAL_LINKS.x}
          target="_blank"
          rel="noopener noreferrer"
          title="Follow @tarumainfo on X for updates"
          className={UI_TOKENS.button.xPill}
        >
          <XIcon size={11} className="shrink-0" />
          <span>Updates</span>
        </a>

        {/* Tip on Ko-fi */}
        <a
          href={EXTERNAL_LINKS.kofi}
          target="_blank"
          rel="noopener noreferrer"
          title="Tip on Ko-fi"
          className={UI_TOKENS.button.supportPill}
        >
          <Coffee size={12} />
          <span>Tip</span>
        </a>

        {/* Screenplay / Script Preview Toggle Button */}
        {onToggleScriptVisibility && (
          <button
            type="button"
            onClick={onToggleScriptVisibility}
            title={isScriptVisible ? "Hide Script Preview (Cinema Full Width) [Shift+P]" : "Show Script Preview [Shift+P]"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 border select-none active:scale-95 shrink-0",
              isScriptVisible
                ? "bg-surface text-text-main border-border-main hover:bg-surface-subtle shadow-2xs"
                : "bg-surface/50 text-text-muted hover:text-text-main border-border-subtle hover:border-border-main"
            )}
          >
            <FileText size={12} className={cn("shrink-0", isScriptVisible ? "text-blue-500" : "text-text-faint")} />
            <span>Script</span>
            {!isScriptVisible && (
              <span className="text-[8px] px-1 py-0.2 rounded font-mono bg-blue-500/10 text-blue-500 font-bold">
                OFF
              </span>
            )}
          </button>
        )}

        {/* AI Director Copilot Button */}
        {onToggleCopilot && (
          <button
            type="button"
            onClick={onToggleCopilot}
            title={isCopilotOpen ? "Close AI Director Copilot" : "Open AI Director Copilot (Shift+A)"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-150 border select-none active:scale-95 shrink-0",
              isCopilotOpen
                ? "bg-purple-500/20 border-purple-500/50 text-purple-600 dark:text-purple-300 shadow-sm shadow-purple-500/20"
                : "bg-surface hover:bg-surface-subtle border-border-subtle hover:border-purple-500/40 text-text-muted hover:text-text-main"
            )}
          >
            <Sparkles size={12} className={cn("shrink-0", isCopilotOpen ? "text-purple-500 animate-pulse" : "text-purple-400")} />
            <span>Copilot</span>
          </button>
        )}

        {/* Studio Preferences Dropdown Menu */}
        <SettingsMenuDropdown
          isOpen={activeMenu === 'settings'}
          onToggle={() => toggleMenu('settings')}
          onClose={closeMenu}
          themeMode={themeMode}
          effectiveThemeCategory={effectiveThemeCategory}
          onSetThemeMode={onSetThemeMode}
          onOpenColors={() => setIsColorModalOpen(true)}
          onOpenTiming={() => setIsSettingsOpen(true)}
          isViewCustomized={isViewCustomized}
          onResetView={onResetView}
          onOpenShortcuts={onOpenShortcuts}
          scriptWidthPreset={scriptWidthPreset}
          setScriptWidthPreset={setScriptWidthPreset}
          scrollFocusPreset={scrollFocusPreset}
          applyScrollFocus={applyScrollFocus}
          isPreferencesCustomized={isPreferencesCustomized}
          onResetAll={onResetAll}
          isScriptVisible={isScriptVisible}
          onToggleScriptVisibility={onToggleScriptVisibility}
        />

        {/* Standalone Info Button */}
        <button
          onClick={() => setIsInfoModalOpen(true)}
          className={cn(
            UI_TOKENS.button.headerIconButton,
            isInfoModalOpen && UI_TOKENS.button.headerIconButtonActive
          )}
          title="About SceneFlow, Article & Documentation"
          aria-label="About SceneFlow, Article & Documentation"
        >
          <Info size={16} />
        </button>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';
