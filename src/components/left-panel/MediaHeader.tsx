import React, { memo, useRef } from 'react';
import { Video, VideoOff, Play, Pause, RotateCcw, Plus, Edit2, Film, FolderOpen, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UI_TOKENS } from '../../styles/tokens/ui';
import { LiveTimecodeBadge } from '../edit/LiveTimecodeBadge';
import type { AppMode, MediaSourceType } from '../../types/script';

export interface MediaHeaderProps {
  mode: AppMode;
  mediaSourceType?: MediaSourceType;
  onChangeMediaSourceType?: (type: MediaSourceType) => void;
  localVideoName?: string;
  onSelectLocalFile?: (file: File) => void;
  youtubeId: string;
  extractedId?: string;
  hasPlayer: boolean;
  isSourceInputOpen?: boolean;
  onToggleSourceInput?: () => void;
  isPlaying: boolean;
  onTogglePlayPause?: () => void;
  onReplay?: () => void;
  isVideoCollapsed?: boolean;
  onToggleVideoCollapsed?: () => void;
  currentTime: number;
  duration: number;
  isFullWidthMode?: boolean;
  onRestoreScript?: () => void;
}

export const MediaHeader: React.FC<MediaHeaderProps> = memo(({
  mode,
  mediaSourceType = 'local',
  onChangeMediaSourceType,
  localVideoName,
  onSelectLocalFile,
  youtubeId,
  extractedId,
  hasPlayer,
  isSourceInputOpen = false,
  onToggleSourceInput,
  isPlaying,
  onTogglePlayPause,
  onReplay,
  isVideoCollapsed = false,
  onToggleVideoCollapsed,
  currentTime,
  duration,
  isFullWidthMode = false,
  onRestoreScript,
}) => {
  const localFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn(
      "flex items-center justify-between px-3 pt-2 pb-1 lg:px-0 lg:pt-0 lg:pb-0.5 gap-2 min-w-0",
      mode === 'playback' ? "media-header-playback" : "media-header-edit"
    )}>
      <div className="flex items-center gap-1.5 min-w-0 shrink-0">
        <h2 
          className={cn(UI_TOKENS.layout.sectionTitle, "flex items-center gap-1.5 shrink-0")}
          title={mode === 'playback' ? 'Playback' : 'Media Preview'}
        >
          {mediaSourceType === 'local' ? (
            <Film size={13} className="text-blue-500 shrink-0" />
          ) : (
            <Video size={13} className="text-red-500 shrink-0" />
          )}
          <span className="media-preview-title hidden sm:inline">
            {mode === 'playback' ? 'Playback' : 'Media'}
          </span>
        </h2>

        {/* Media Source Switcher: Local Disk vs YouTube */}
        {onChangeMediaSourceType && (
          <div className="inline-flex items-center p-0.5 rounded-lg bg-surface-subtle border border-border-subtle shrink-0">
            <button
              type="button"
              onClick={() => onChangeMediaSourceType('local')}
              className={cn(
                "px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                mediaSourceType === 'local'
                  ? "bg-surface text-blue-600 dark:text-blue-400 shadow-2xs font-black"
                  : "text-text-muted hover:text-text-main"
              )}
              title="Play local video files from your disk (.mp4, .mov, .webm)"
            >
              <Film size={10} /> Local
            </button>
            <button
              type="button"
              onClick={() => onChangeMediaSourceType('youtube')}
              className={cn(
                "px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                mediaSourceType === 'youtube'
                  ? "bg-surface text-red-600 dark:text-red-400 shadow-2xs font-black"
                  : "text-text-muted hover:text-text-main"
              )}
              title="Stream from YouTube"
            >
              <Video size={10} /> YouTube
            </button>
          </div>
        )}

        {/* Local Disk Video Picker Pill */}
        {mediaSourceType === 'local' && (
          <>
            <input
              ref={localFileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onSelectLocalFile?.(e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              onClick={() => localFileInputRef.current?.click()}
              title={localVideoName ? `Loaded: ${localVideoName} (Click to change)` : "Choose video file from local disk"}
              className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono transition-all duration-150 border border-border-subtle hover:border-border-main bg-surface-subtle hover:bg-surface text-text-muted hover:text-text-main shadow-2xs select-none active:scale-95 shrink-0"
            >
              <FolderOpen size={10} className="text-blue-500 shrink-0" />
              <span className="truncate max-w-[100px] font-sans text-[9px] font-bold">
                {localVideoName || "Choose Video..."}
              </span>
            </button>
          </>
        )}

        {/* Collapsible YouTube Source Pill (When in YouTube mode) */}
        {mediaSourceType === 'youtube' && onToggleSourceInput && (
          <button
            type="button"
            onClick={onToggleSourceInput}
            aria-expanded={isSourceInputOpen}
            aria-label={youtubeId ? "Edit YouTube video source URL" : "Set YouTube video source URL"}
            title={
              isSourceInputOpen
                ? "Hide YouTube source input"
                : (youtubeId ? `Video ID: ${extractedId || youtubeId} (Click to change URL)` : "Set YouTube video source URL")
            }
            className={cn(
              "group flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono transition-all duration-150 border shadow-2xs select-none active:scale-95 shrink-0",
              isSourceInputOpen
                ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold shadow-blue-500/10"
                : "bg-surface-subtle hover:bg-surface border-border-subtle hover:border-border-main text-text-muted hover:text-text-main"
            )}
          >
            <span className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300",
              youtubeId
                ? (hasPlayer ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]")
                : "bg-red-400"
            )} />
            {youtubeId ? (
              <>
                <span className="truncate max-w-[85px] youtube-pill-text">{extractedId || youtubeId}</span>
                <Edit2 size={9} className="shrink-0 text-text-faint group-hover:text-text-main transition-colors opacity-70" />
              </>
            ) : (
              <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-blue-500 flex items-center gap-0.5">
                <Plus size={10} className="shrink-0" />
                <span className="youtube-pill-text">Video</span>
              </span>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Live Precision Timecode Display */}
        {hasPlayer && (
          <LiveTimecodeBadge
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
          />
        )}

        {/* Playback Transport Controls: Replay & Play/Pause */}
        {(onReplay || onTogglePlayPause) && (
          <div className="flex items-center p-0.5 bg-surface-subtle border border-border-subtle rounded-lg shadow-xs">
            {onReplay && (
              <button
                type="button"
                onClick={onReplay}
                aria-label="Replay from beginning"
                title="Replay from start (0:00)"
                className="group flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-150 text-text-muted hover:text-text-main hover:bg-surface active:scale-95 select-none"
              >
                <RotateCcw size={11} className="shrink-0 transition-transform duration-200 group-hover:-rotate-45" />
                <span className="media-btn-label">Replay</span>
              </button>
            )}

            {onReplay && onTogglePlayPause && (
              <div className="w-px h-3 bg-border-subtle mx-0.5" aria-hidden="true" />
            )}

            {onTogglePlayPause && (
              <button
                type="button"
                onClick={onTogglePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause playback [Space]" : "Start playback [Space]"}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-150 select-none active:scale-95",
                  isPlaying
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-xs"
                    : "text-text-muted hover:text-text-main hover:bg-surface"
                )}
              >
                {isPlaying ? (
                  <>
                    <Pause size={11} className="shrink-0 fill-current" />
                    <span className="media-btn-label">Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={11} className="shrink-0 fill-current ml-0.5" />
                    <span className="media-btn-label">Play</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Separator between transport and collapse controls */}
        {onToggleVideoCollapsed && (
          <div className="w-px h-3.5 bg-border-subtle mx-0.5" aria-hidden="true" />
        )}

        {onToggleVideoCollapsed && (
          <button
            type="button"
            onClick={onToggleVideoCollapsed}
            aria-expanded={!isVideoCollapsed}
            aria-label={isVideoCollapsed ? "Show Video Player" : "Hide Video Player"}
            title={
              isVideoCollapsed 
                ? "Show Video Player [V]" 
                : (mode === 'playback' ? "Hide Video Player (Collapse for timeline screen recording) [V]" : "Hide Video Player (Collapse for full cue list) [V]")
            }
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 border shadow-xs active:scale-95 select-none",
              isVideoCollapsed
                ? "bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold"
                : "bg-surface hover:bg-surface-subtle border-border-subtle text-text-muted hover:text-text-main"
            )}
          >
            {isVideoCollapsed ? (
              <>
                <Video size={12} className="text-blue-500 shrink-0" />
                <span className="media-btn-label">Show</span>
              </>
            ) : (
              <>
                <VideoOff size={12} className="text-text-faint shrink-0" />
                <span className="media-btn-label">Hide</span>
              </>
            )}
          </button>
        )}

        {/* Full-Width Cinema Restore Script Button */}
        {isFullWidthMode && onRestoreScript && (
          <>
            <div className="w-px h-3.5 bg-border-subtle mx-0.5 hidden sm:block" aria-hidden="true" />
            <button
              type="button"
              onClick={onRestoreScript}
              title="Show Script Preview [Shift+P]"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-xs active:scale-95 select-none shrink-0"
            >
              <FileText size={11} className="shrink-0 text-blue-500" />
              <span className="media-btn-label">Show Script</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
});

MediaHeader.displayName = 'MediaHeader';
