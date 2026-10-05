import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { YouTubeProps } from 'react-youtube';

interface UseYouTubePlayerOptions {
  youtubeId: string;
  localVideoUrl?: string | null;
  mediaType?: 'youtube' | 'local';
  onPlay?: () => void;
  onPause?: () => void;
}

export function useYouTubePlayer({ 
  youtubeId, 
  localVideoUrl, 
  mediaType = 'local', 
  onPlay, 
  onPause 
}: UseYouTubePlayerOptions) {
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [playerState, setPlayerState] = useState<number>(-1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const isSeekingWhilePausedRef = useRef<boolean>(false);
  const seekPauseTimeoutRef = useRef<number | null>(null);
  const html5VideoRef = useRef<HTMLVideoElement | null>(null);

  const ytPlayerRef = useRef<any>(null);
  ytPlayerRef.current = ytPlayer;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetPlayback = useCallback(() => {
    stopTimer();
    setCurrentTime(0);
    setPlayerState(-1);
    isSeekingWhilePausedRef.current = false;
    if (seekPauseTimeoutRef.current) {
      clearTimeout(seekPauseTimeoutRef.current);
      seekPauseTimeoutRef.current = null;
    }
    if (mediaType === 'local' && html5VideoRef.current) {
      try {
        html5VideoRef.current.pause();
        html5VideoRef.current.currentTime = 0;
      } catch {
        // Ignore unmounting error
      }
    } else if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
        if (typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(0, true);
        }
      } catch {
        // Player may be unmounting or in an error state
      }
    }
  }, [stopTimer, mediaType]);

  // Reset player instance and timing when video changes
  useEffect(() => {
    resetPlayback();
    if (mediaType === 'youtube') {
      setYtPlayer(null);
      setDuration(0);
    }
  }, [youtubeId, localVideoUrl, mediaType, resetPlayback]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      if (mediaType === 'local' && html5VideoRef.current) {
        setCurrentTime(html5VideoRef.current.currentTime);
      } else if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
      }
    }, 100);
  }, [mediaType]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (seekPauseTimeoutRef.current) {
        clearTimeout(seekPauseTimeoutRef.current);
      }
    };
  }, [stopTimer]);

  // YouTube Callbacks
  const onReady: YouTubeProps['onReady'] = useCallback((event) => {
    if (mediaType === 'youtube') {
      setYtPlayer(event.target);
      setPlayerState(event.target.getPlayerState());
      const dur = event.target.getDuration?.();
      if (dur && typeof dur === 'number') {
        setDuration(dur);
      }
    }
  }, [mediaType]);

  const onStateChange: YouTubeProps['onStateChange'] = useCallback((event) => {
    if (mediaType !== 'youtube') return;
    setPlayerState(event.data);
    if (event.data === 1) { // Playing
      const dur = event.target?.getDuration?.();
      if (dur && typeof dur === 'number') {
        setDuration(dur);
      }
      if (isSeekingWhilePausedRef.current) {
        isSeekingWhilePausedRef.current = false;
        if (seekPauseTimeoutRef.current) {
          clearTimeout(seekPauseTimeoutRef.current);
          seekPauseTimeoutRef.current = null;
        }
        ytPlayer?.pauseVideo();
        return;
      }
      startTimer();
      onPlay?.();
    } else {
      if (event.data === 3 && isSeekingWhilePausedRef.current) {
        if (seekPauseTimeoutRef.current) clearTimeout(seekPauseTimeoutRef.current);
        seekPauseTimeoutRef.current = window.setTimeout(() => {
          isSeekingWhilePausedRef.current = false;
          seekPauseTimeoutRef.current = null;
        }, 1200);
      } else if (event.data !== 3) {
        isSeekingWhilePausedRef.current = false;
        if (seekPauseTimeoutRef.current) {
          clearTimeout(seekPauseTimeoutRef.current);
          seekPauseTimeoutRef.current = null;
        }
      }
      stopTimer();
      onPause?.();
    }
  }, [mediaType, startTimer, stopTimer, onPlay, onPause, ytPlayer]);

  // HTML5 Video Callbacks
  const handleHtml5LoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration;
    if (dur && !isNaN(dur)) {
      setDuration(dur);
    }
  }, []);

  const handleHtml5Play = useCallback(() => {
    setPlayerState(1);
    startTimer();
    onPlay?.();
  }, [startTimer, onPlay]);

  const handleHtml5Pause = useCallback(() => {
    setPlayerState(2);
    stopTimer();
    onPause?.();
  }, [stopTimer, onPause]);

  const handleHtml5TimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  }, []);

  const handleHtml5Ended = useCallback(() => {
    setPlayerState(0);
    stopTimer();
    onPause?.();
  }, [stopTimer, onPause]);

  // Local Player Adapter to emulate YouTube player methods
  const localPlayerAdapter = useMemo(() => {
    if (!localVideoUrl) return null;
    return {
      getCurrentTime: () => html5VideoRef.current?.currentTime ?? 0,
      getDuration: () => html5VideoRef.current?.duration ?? 0,
      getPlayerState: () => (html5VideoRef.current ? (html5VideoRef.current.paused ? 2 : 1) : -1),
      seekTo: (sec: number, _allow = true, autoPlay?: boolean) => {
        if (html5VideoRef.current) {
          html5VideoRef.current.currentTime = sec;
          setCurrentTime(sec);
          if (autoPlay) {
            html5VideoRef.current.play().catch(() => {});
          }
        }
      },
      playVideo: () => {
        html5VideoRef.current?.play().catch(() => {});
      },
      pauseVideo: () => {
        html5VideoRef.current?.pause();
      },
    };
  }, [localVideoUrl]);

  const effectivePlayer = mediaType === 'local' ? localPlayerAdapter : ytPlayer;

  const seekTo = useCallback((seconds: number, allowSeekAhead = true, autoPlay?: boolean) => {
    if (mediaType === 'local') {
      if (html5VideoRef.current) {
        html5VideoRef.current.currentTime = seconds;
        setCurrentTime(seconds);
        if (autoPlay) {
          html5VideoRef.current.play().catch(() => {});
        }
      }
      return;
    }

    if (ytPlayer) {
      const isCurrentlyPlaying = (ytPlayer.getPlayerState?.() === 1) || playerState === 1;
      const shouldPlay = autoPlay !== undefined ? autoPlay : isCurrentlyPlaying;

      if (!shouldPlay) {
        isSeekingWhilePausedRef.current = true;
        if (seekPauseTimeoutRef.current) {
          clearTimeout(seekPauseTimeoutRef.current);
        }
        seekPauseTimeoutRef.current = window.setTimeout(() => {
          isSeekingWhilePausedRef.current = false;
          seekPauseTimeoutRef.current = null;
        }, 600);

        ytPlayer.seekTo(seconds, allowSeekAhead);
      } else {
        isSeekingWhilePausedRef.current = false;
        if (seekPauseTimeoutRef.current) {
          clearTimeout(seekPauseTimeoutRef.current);
          seekPauseTimeoutRef.current = null;
        }
        ytPlayer.seekTo(seconds, allowSeekAhead);
        ytPlayer.playVideo();
      }
      setCurrentTime(seconds);
    }
  }, [mediaType, ytPlayer, playerState]);

  const playVideo = useCallback(() => {
    if (mediaType === 'local' && html5VideoRef.current) {
      html5VideoRef.current.play().catch(() => {});
      return;
    }
    if (ytPlayer) {
      isSeekingWhilePausedRef.current = false;
      if (seekPauseTimeoutRef.current) {
        clearTimeout(seekPauseTimeoutRef.current);
        seekPauseTimeoutRef.current = null;
      }
      ytPlayer.playVideo();
    }
  }, [mediaType, ytPlayer]);

  const pauseVideo = useCallback(() => {
    if (mediaType === 'local' && html5VideoRef.current) {
      html5VideoRef.current.pause();
      return;
    }
    if (ytPlayer) {
      isSeekingWhilePausedRef.current = false;
      if (seekPauseTimeoutRef.current) {
        clearTimeout(seekPauseTimeoutRef.current);
        seekPauseTimeoutRef.current = null;
      }
      ytPlayer.pauseVideo();
    }
  }, [mediaType, ytPlayer]);

  const togglePlayPause = useCallback(() => {
    if (mediaType === 'local') {
      if (html5VideoRef.current) {
        if (html5VideoRef.current.paused) {
          html5VideoRef.current.play().catch(() => {});
        } else {
          html5VideoRef.current.pause();
        }
      }
      return;
    }

    if (!ytPlayer) return;
    isSeekingWhilePausedRef.current = false;
    if (seekPauseTimeoutRef.current) {
      clearTimeout(seekPauseTimeoutRef.current);
      seekPauseTimeoutRef.current = null;
    }
    const currentState = ytPlayer.getPlayerState();
    if (currentState === 1) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  }, [mediaType, ytPlayer]);

  const jumpBy = useCallback((seconds: number) => {
    if (mediaType === 'local' && html5VideoRef.current) {
      const newTime = Math.max(0, html5VideoRef.current.currentTime + seconds);
      seekTo(newTime, true);
      return;
    }
    if (!ytPlayer) return;
    const newTime = Math.max(0, ytPlayer.getCurrentTime() + seconds);
    seekTo(newTime, true);
  }, [mediaType, ytPlayer, seekTo]);

  return {
    player: effectivePlayer,
    playerState,
    currentTime,
    setCurrentTime,
    duration,
    onReady,
    onStateChange,
    seekTo,
    playVideo,
    pauseVideo,
    togglePlayPause,
    jumpBy,
    resetPlayback,
    html5VideoRef,
    handleHtml5LoadedMetadata,
    handleHtml5Play,
    handleHtml5Pause,
    handleHtml5TimeUpdate,
    handleHtml5Ended,
  };
}
