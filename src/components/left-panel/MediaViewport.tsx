import React, { memo, useMemo, useRef } from 'react';
import YouTube, { type YouTubeProps } from 'react-youtube';
import { Upload, Film } from 'lucide-react';
import { extractYoutubeId, cn } from '../../lib/utils';
import type { MediaSourceType } from '../../types/script';

export const YOUTUBE_PLAYER_OPTS: YouTubeProps['opts'] = {
  playerVars: {
    controls: 1,
    modestbranding: 1,
    rel: 0,
    playsinline: 1,
  },
};

export interface MediaViewportProps {
  mediaSourceType?: MediaSourceType;
  youtubeId: string;
  localVideoUrl?: string | null;
  localVideoName?: string;
  videoHeight: number;
  isVideoCollapsed: boolean;
  isDesktop: boolean;
  onReady: (event: any) => void;
  onStateChange: (event: any) => void;
  html5VideoRef?: React.RefObject<HTMLVideoElement | null>;
  onHtml5LoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onHtml5Play?: () => void;
  onHtml5Pause?: () => void;
  onHtml5TimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onHtml5Ended?: () => void;
  onSelectLocalFile?: (file: File) => void;
  onTogglePlayPause?: () => void;
}

/**
 * Isolated, memoized Video Viewport.
 * Supports both high-speed local disk video playback (HTML5 Video) and YouTube embeds.
 * Stays permanently mounted across Playback and Edit modes to ensure seamless playback continuity.
 */
export const MediaViewport: React.FC<MediaViewportProps> = memo(({
  mediaSourceType = 'local',
  youtubeId,
  localVideoUrl,
  localVideoName,
  videoHeight,
  isVideoCollapsed,
  isDesktop,
  onReady,
  onStateChange,
  html5VideoRef,
  onHtml5LoadedMetadata,
  onHtml5Play,
  onHtml5Pause,
  onHtml5TimeUpdate,
  onHtml5Ended,
  onSelectLocalFile,
  onTogglePlayPause,
}) => {
  const extractedVideoId = useMemo(() => extractYoutubeId(youtubeId), [youtubeId]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLocal = mediaSourceType === 'local';

  return (
    <div 
      className={cn(
        "bg-black overflow-hidden shadow-2xl ring-1 ring-border-main relative group pointer-events-auto rounded-none lg:rounded-2xl transition-[height,opacity,box-shadow] duration-200 flex items-center justify-center shrink-0",
        isVideoCollapsed && "h-0 min-h-0 max-h-0 opacity-0 pointer-events-none ring-0 shadow-none border-none !m-0 !p-0 overflow-hidden"
      )}
      style={!isVideoCollapsed ? (isDesktop ? { 
        height: `${videoHeight}px`, 
        maxWidth: '100%', 
        aspectRatio: '16 / 9', 
        margin: '0 auto' 
      } : { 
        aspectRatio: '16 / 9',
        width: '100%' 
      }) : { 
        height: 0, 
        minHeight: 0, 
        maxHeight: 0, 
        margin: 0, 
        padding: 0, 
        opacity: 0, 
        overflow: 'hidden', 
        pointerEvents: 'none' 
      }}
      aria-hidden={isVideoCollapsed}
    >
      {isLocal ? (
        localVideoUrl ? (
          <video
            ref={html5VideoRef as any}
            key={localVideoUrl}
            src={localVideoUrl}
            playsInline
            className="w-full h-full object-contain bg-black cursor-pointer"
            onClick={onTogglePlayPause}
            onLoadedMetadata={onHtml5LoadedMetadata}
            onPlay={onHtml5Play}
            onPause={onHtml5Pause}
            onTimeUpdate={onHtml5TimeUpdate}
            onEnded={onHtml5Ended}
          />
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                onSelectLocalFile?.(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-subtle hover:border-blue-500/60 bg-surface-muted/20 hover:bg-surface-muted/40 transition-all cursor-pointer group text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onSelectLocalFile?.(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Upload size={22} />
            </div>
            <span className="text-xs font-bold text-text-main">
              Drop Seedance 2.5 Video Here
            </span>
            <span className="text-[10px] text-text-muted mt-1 font-mono">
              or click to browse from local disk (.mp4, .mov, .webm)
            </span>
          </div>
        )
      ) : (
        <YouTube
          key={extractedVideoId}
          videoId={extractedVideoId}
          opts={YOUTUBE_PLAYER_OPTS}
          onReady={onReady}
          onStateChange={onStateChange}
          className="w-full h-full bg-black"
          iframeClassName="w-full h-full block border-0 bg-black"
        />
      )}
    </div>
  );
});

MediaViewport.displayName = 'MediaViewport';
