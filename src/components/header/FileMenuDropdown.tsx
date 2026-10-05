import React, { useRef, memo } from 'react';
import { 
  ChevronDown, 
  FolderOpen, 
  Download, 
  Plus, 
  Sparkles, 
  Book,
  Braces,
  FileText,
  Captions,
  Bookmark,
  Film
} from 'lucide-react';
import { UI_TOKENS } from '../../styles/tokens/ui';
import { cn } from '../../lib/utils';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export interface FileMenuDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJson: () => void;
  onExportSrt?: () => void;
  onExportCsv?: () => void;
  onExportEdl?: () => void;
  onNewProject?: () => void;
  onOpenGuide?: () => void;
  onOpenLibrary: () => void;
  onOpenRawCuesModal?: () => void;
  onOpenRawScriptModal?: () => void;
}

export const FileMenuDropdown: React.FC<FileMenuDropdownProps> = memo(({
  isOpen,
  onToggle,
  onClose,
  onImportJson,
  onExportJson,
  onExportSrt,
  onExportCsv,
  onExportEdl,
  onNewProject,
  onOpenGuide,
  onOpenLibrary,
  onOpenRawCuesModal,
  onOpenRawScriptModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, onClose, isOpen);
  useEscapeKey(onClose, isOpen);

  return (
    <div ref={containerRef} className="relative pl-1">
      <button
        id="app-file-menu-button"
        onClick={onToggle}
        className={cn(
          UI_TOKENS.button.filePill,
          isOpen && UI_TOKENS.button.filePillActive
        )}
        title="Project & File Actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>File</span>
        <ChevronDown 
          size={11} 
          className={cn(
            "text-text-faint transition-transform duration-200", 
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div 
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="app-file-menu-button"
          className="absolute top-full left-0 mt-2 w-60 bg-surface rounded-2xl shadow-2xl border border-border-main overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 text-text-main divide-y divide-border-subtle"
        >
          {/* Section 1: Project I/O (Open, Save & New) */}
          <div className="p-1.5 space-y-0.5">
            <label
              role="menuitem"
              title="Open Project JSON"
              className={cn("cursor-pointer", UI_TOKENS.dropdown.item)}
            >
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-text-muted" />
                <span>Open Project...</span>
              </div>
              <input 
                type="file" 
                accept=".json" 
                onChange={(e) => {
                  onClose();
                  onImportJson(e);
                }} 
                className="hidden" 
              />
            </label>

            <button
              role="menuitem"
              onClick={() => {
                onClose();
                onExportJson();
              }}
              title="Save Project JSON"
              className={UI_TOKENS.dropdown.item}
            >
              <div className="flex items-center gap-2">
                <Download size={14} className="text-text-muted" />
                <span>Save Project</span>
              </div>
            </button>

            {onNewProject && (
              <button
                role="menuitem"
                onClick={() => {
                  onClose();
                  onNewProject();
                }}
                className={UI_TOKENS.dropdown.item}
                title="Create a new blank screenplay project"
              >
                <div className="flex items-center gap-2">
                  <Plus size={14} className="text-text-muted" />
                  <span>New Project</span>
                </div>
              </button>
            )}
          </div>

          {/* Section 1.5: NLE Timeline Marker & Subtitle Export */}
          {(onExportSrt || onExportCsv || onExportEdl) && (
            <div className="p-1.5 space-y-0.5">
              <div className="px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-text-faint">
                Export Timeline Markers
              </div>
              {onExportSrt && (
                <button
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onExportSrt();
                  }}
                  title="Export cues as .SRT subtitle track (DaVinci, Premiere, CapCut)"
                  className={UI_TOKENS.dropdown.item}
                >
                  <div className="flex items-center gap-2">
                    <Captions size={14} className="text-blue-500" />
                    <span>Subtitles (.SRT)</span>
                  </div>
                </button>
              )}
              {onExportCsv && (
                <button
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onExportCsv();
                  }}
                  title="Export markers as CSV table (DaVinci Resolve / Premiere)"
                  className={UI_TOKENS.dropdown.item}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark size={14} className="text-purple-500" />
                    <span>DaVinci Markers (.CSV)</span>
                  </div>
                </button>
              )}
              {onExportEdl && (
                <button
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onExportEdl();
                  }}
                  title="Export CMX 3600 EDL with locator markers"
                  className={UI_TOKENS.dropdown.item}
                >
                  <div className="flex items-center gap-2">
                    <Film size={14} className="text-amber-500" />
                    <span>EDL Locators (.EDL)</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Section 2: Script & Cue Data (Raw Editors) */}
          {(onOpenRawCuesModal || onOpenRawScriptModal) && (
            <div className="p-1.5 space-y-0.5">
              {onOpenRawCuesModal && (
                <button
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onOpenRawCuesModal();
                  }}
                  className={UI_TOKENS.dropdown.item}
                  title="View, edit, or import sync cues JSON & AI prompt schema (Shift+E)"
                >
                  <div className="flex items-center gap-2">
                    <Braces size={14} className="text-text-muted" />
                    <span>Sync Cues (JSON)...</span>
                  </div>
                  <kbd className={UI_TOKENS.badge.shortcut}>Shift+E</kbd>
                </button>
              )}

              {onOpenRawScriptModal && (
                <button
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onOpenRawScriptModal();
                  }}
                  className={UI_TOKENS.dropdown.item}
                  title="Edit source script text (Shift+S)"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-text-muted" />
                    <span>Source Script...</span>
                  </div>
                  <kbd className={UI_TOKENS.badge.shortcut}>Shift+S</kbd>
                </button>
              )}
            </div>
          )}

          {/* Section 3: Reference & Exploration (Starter Guide & Library Catalog) */}
          <div className="p-1.5 space-y-0.5">
            {onOpenGuide && (
              <button
                role="menuitem"
                onClick={() => {
                  onClose();
                  onOpenGuide();
                }}
                className={UI_TOKENS.dropdown.item}
                title="Load official interactive starter guide"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Starter Guide</span>
                </div>
              </button>
            )}

            <button
              role="menuitem"
              onClick={() => {
                onClose();
                onOpenLibrary();
              }}
              title="Explore Screenplay Library"
              className={UI_TOKENS.dropdown.item}
            >
              <div className="flex items-center gap-2">
                <Book size={14} className="text-amber-500" />
                <span>Browse Library...</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

FileMenuDropdown.displayName = 'FileMenuDropdown';
