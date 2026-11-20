import { useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import {
  BrollBeat,
  CaptionWordCue,
  CompiledSegment,
  formatTimecode,
} from '../lib/editPlan';

export type StageMode = 'edited' | 'raw' | 'compare';

interface VideoStageProps {
  mode: StageMode;
  onModeChange: (mode: StageMode) => void;
  editedVideoUrl: string;
  editedPosterUrl: string;
  rawVideoUrl: string;
  editedDurationSec: number;
  rawDurationSec: number;
  currentTimeSec: number;
  isPlaying: boolean;
  isMuted: boolean;
  isRendering: boolean;
  fileSizeBytes: number;
  masteredLufs: number;
  rawMeanDb: number;
  activeBroll: BrollBeat | null;
  activeSegment: CompiledSegment | null;
  activeCue: CaptionWordCue | null;
  seekRequest: { timeSec: number; nonce: number } | null;
  onTimeUpdate: (timeSec: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onToggleMute: () => void;
  onSeek: (timeSec: number) => void;
}

function formatBytesMb(bytes: number): string {
  if (!bytes || bytes <= 0) return '—';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VideoStage({
  mode,
  onModeChange,
  editedVideoUrl,
  editedPosterUrl,
  rawVideoUrl,
  editedDurationSec,
  rawDurationSec,
  currentTimeSec,
  isPlaying,
  isMuted,
  isRendering,
  fileSizeBytes,
  masteredLufs,
  rawMeanDb,
  activeBroll,
  activeSegment,
  activeCue,
  seekRequest,
  onTimeUpdate,
  onPlayStateChange,
  onToggleMute,
  onSeek,
}: VideoStageProps) {
  const editedRef = useRef<HTMLVideoElement | null>(null);
  const rawRef = useRef<HTMLVideoElement | null>(null);

  const primaryRef = mode === 'raw' ? rawRef : editedRef;
  const activeDuration = mode === 'raw' ? rawDurationSec : editedDurationSec;

  // Apply explicit seek requests to active video element
  useEffect(() => {
    if (!seekRequest) return;
    const vid = primaryRef.current;
    if (vid && Number.isFinite(seekRequest.timeSec)) {
      const clamped = Math.max(0, Math.min(activeDuration || 90, seekRequest.timeSec));
      vid.currentTime = clamped;
      onTimeUpdate(clamped);
    }
  }, [seekRequest, activeDuration, primaryRef, onTimeUpdate]);

  // Keep muted state synchronized
  useEffect(() => {
    if (editedRef.current) editedRef.current.muted = isMuted;
    if (rawRef.current) rawRef.current.muted = mode === 'compare' ? true : isMuted;
  }, [isMuted, mode]);

  // Pause non-active players when switching stage modes
  useEffect(() => {
    if (mode === 'edited' && rawRef.current) {
      rawRef.current.pause();
    } else if (mode === 'raw' && editedRef.current) {
      editedRef.current.pause();
    }
    onPlayStateChange(false);
  }, [mode, onPlayStateChange]);

  const handleTogglePlay = async () => {
    const vid = primaryRef.current;
    if (!vid) return;

    if (vid.paused) {
      try {
        await vid.play();
        if (mode === 'compare' && rawRef.current) {
          rawRef.current.muted = true;
          rawRef.current.play().catch(() => {});
        }
        onPlayStateChange(true);
      } catch {
        onPlayStateChange(false);
      }
    } else {
      vid.pause();
      if (mode === 'compare' && rawRef.current) {
        rawRef.current.pause();
      }
      onPlayStateChange(false);
    }
  };

  const handleSkip = (deltaSec: number) => {
    const next = Math.max(0, Math.min(activeDuration, currentTimeSec + deltaSec));
    onSeek(next);
  };

  return (
    <section
      aria-label="Video preview stage"
      className="flex flex-col rounded-xl border border-[#222A38] bg-[#131822] p-5"
    >
      {/* Top Stage Header: Mode Switcher + Clean Unboxed Metadata */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Preview mode"
          className="inline-flex items-center gap-1 rounded-lg bg-[#0B0E14] p-1 border border-[#222A38]"
        >
          {(
            [
              { id: 'edited', label: 'Edited Short' },
              { id: 'raw', label: 'Raw Footage' },
              { id: 'compare', label: 'Compare' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              onClick={() => onModeChange(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === item.id
                  ? 'bg-[#1D2536] text-slate-50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
          <span>1080×1920</span>
          <span aria-hidden="true">·</span>
          <span>30 fps</span>
          <span aria-hidden="true">·</span>
          <span>{formatBytesMb(fileSizeBytes)}</span>
        </div>
      </div>

      {/* Vertical 9:16 Cinema Frame(s) */}
      <div
        className={`relative flex items-center justify-center rounded-lg bg-[#090C12] border border-[#1E2635] p-4 min-h-[470px] ${
          mode === 'compare' ? 'gap-4 flex-col sm:flex-row' : ''
        }`}
      >
        {mode !== 'raw' && (
          <div className="flex flex-col items-center">
            {mode === 'compare' && (
              <span className="mb-2 text-xs font-medium text-amber-400">
                Edited Short · {formatTimecode(editedDurationSec)} · {masteredLufs} dB
              </span>
            )}
            <div
              data-testid="edited-video-frame"
              className={`relative overflow-hidden rounded-lg bg-black border border-[#263042] shadow-lg ${
                mode === 'compare' ? 'w-[215px] aspect-[9/16]' : 'w-[268px] aspect-[9/16]'
              }`}
            >
              <video
                ref={editedRef}
                key={editedVideoUrl}
                src={editedVideoUrl}
                poster={editedPosterUrl}
                playsInline
                preload="auto"
                aria-label="Edited YouTube Short video player"
                onClick={handleTogglePlay}
                onTimeUpdate={(e) => {
                  onTimeUpdate(e.currentTarget.currentTime);
                }}
                onEnded={() => onPlayStateChange(false)}
                className="h-full w-full object-cover cursor-pointer"
              />
              {isRendering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0E14]/85 px-5 text-center backdrop-blur-xs">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <p className="mt-3 text-sm font-medium text-slate-100">
                    Rendering custom edit…
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Applying cuts, audio leveling, B-roll &amp; captions
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {mode !== 'edited' && (
          <div className="flex flex-col items-center">
            {mode === 'compare' && (
              <span className="mb-2 text-xs font-medium text-slate-400">
                Raw Footage · {formatTimecode(rawDurationSec)} · {rawMeanDb} dB
              </span>
            )}
            <div
              data-testid="raw-video-frame"
              className={`relative overflow-hidden rounded-lg bg-black border border-[#263042] ${
                mode === 'compare' ? 'w-[215px] aspect-[9/16]' : 'w-[268px] aspect-[9/16]'
              }`}
            >
              <video
                ref={rawRef}
                src={rawVideoUrl}
                playsInline
                preload="metadata"
                aria-label="Raw original footage video player"
                onClick={mode === 'raw' ? handleTogglePlay : undefined}
                onTimeUpdate={(e) => {
                  if (mode === 'raw') onTimeUpdate(e.currentTarget.currentTime);
                }}
                onEnded={() => {
                  if (mode === 'raw') onPlayStateChange(false);
                }}
                className="h-full w-full object-cover cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transport & Scrubber Controls */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-14 text-xs font-mono tabular-nums text-slate-200">
            {formatTimecode(currentTimeSec)}
          </span>
          <input
            type="range"
            aria-label="Seek video timeline"
            min={0}
            max={Math.max(1, activeDuration)}
            step={0.05}
            value={Math.min(activeDuration, currentTimeSec)}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="studio-slider flex-1"
          />
          <span className="w-14 text-right text-xs font-mono tabular-nums text-slate-400">
            {formatTimecode(activeDuration)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1D2536] px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-[#273248] cursor-pointer whitespace-nowrap shrink-0"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSkip(-5)}
              aria-label="Skip back 5 seconds"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#222A38] bg-[#0F141D] text-slate-300 transition-colors hover:bg-[#1B2231] hover:text-slate-100 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => handleSkip(5)}
              aria-label="Skip forward 5 seconds"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#222A38] bg-[#0F141D] text-slate-300 transition-colors hover:bg-[#1B2231] hover:text-slate-100 cursor-pointer"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#222A38] bg-[#0F141D] text-slate-300 transition-colors hover:bg-[#1B2231] hover:text-slate-100 cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-red-400" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Live Beat Context Readout (Clean unboxed text) */}
          <div className="hidden sm:flex flex-col items-end text-right min-w-0">
            <span className="text-xs text-slate-400 truncate max-w-[260px]">
              {mode === 'raw'
                ? activeSegment?.kind === 'cut'
                  ? `Removed · ${activeSegment.transcript}`
                  : activeSegment?.transcript ?? 'Raw recording'
                : activeBroll
                  ? `B-Roll active · ${activeBroll.title}`
                  : activeCue
                    ? `Caption · "${activeCue.words.join(' ')}"`
                    : 'Talking head · Normalized voice'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
