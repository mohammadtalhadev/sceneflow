/**
 * Video Vision Service for SceneFlow Studio
 * Enables Copilot to extract and visually inspect actual video frames across the runtime
 * using in-memory HTML5 Canvas and feed them directly into Multimodal AI models.
 */

export interface VideoKeyframe {
  time: number;
  dataUrl: string;
  label: string;
}

/**
 * Captures evenly-spaced keyframe snapshots from an HTMLVideoElement across its duration.
 * Uses an offscreen canvas to convert frames to optimized JPEG base64 data URLs.
 */
export async function captureVideoKeyframes(
  video: HTMLVideoElement | null,
  count: number = 8,
  onProgress?: (current: number, total: number) => void
): Promise<VideoKeyframe[]> {
  if (!video || !video.duration || isNaN(video.duration) || video.duration <= 0) {
    return [];
  }

  const duration = video.duration;
  const originalTime = video.currentTime;
  const wasPlaying = !video.paused;

  if (wasPlaying) {
    try {
      video.pause();
    } catch {}
  }

  const canvas = document.createElement('canvas');
  // 640x360 is optimal: sharp enough for dragon scales, armor crests & subtitles, token-efficient for LLM
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  // Calculate evenly distributed timestamps across runtime
  const step = duration / (count + 1);
  const timestamps: number[] = [];
  for (let i = 1; i <= count; i++) {
    const t = Math.min(duration - 0.1, Math.max(0.2, i * step));
    timestamps.push(t);
  }

  const keyframes: VideoKeyframe[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const targetTime = timestamps[i];
    onProgress?.(i + 1, timestamps.length);

    await new Promise<void>((resolve) => {
      let isResolved = false;
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          resolve();
        }
      }, 750); // 750ms timeout per seek

      const onSeeked = () => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeout);
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      video.currentTime = targetTime;
    });

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      keyframes.push({
        time: targetTime,
        dataUrl,
        label: `Frame ${i + 1} (${targetTime.toFixed(1)}s)`,
      });
    } catch (err) {
      console.warn('Canvas frame capture warning for timestamp', targetTime, err);
    }
  }

  // Restore previous playback position
  try {
    video.currentTime = originalTime;
    if (wasPlaying) {
      video.play().catch(() => {});
    }
  } catch {}

  return keyframes;
}
