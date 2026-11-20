import { useState } from 'react';
import { Check, Film, Play, RefreshCw, Scissors, Sliders, Volume2 } from 'lucide-react';
import {
  AudioAnalysisMetrics,
  BrollBeat,
  CompiledSegment,
  CompiledTimelineSummary,
  RenderConfig,
  TransitionStyle,
  formatTimecode,
} from '../lib/editPlan';
import { InspectorTab } from './TopBar';

interface InspectorPanelProps {
  activeTab: InspectorTab;
  onSelectTab: (tab: InspectorTab) => void;
  config: RenderConfig;
  appliedConfig: RenderConfig;
  onConfigChange: (next: RenderConfig) => void;
  onRenderCustom: () => void;
  isRendering: boolean;
  renderError: string | null;
  renderStatusMessage: string | null;
  timeline: CompiledTimelineSummary;
  brollBeats: BrollBeat[];
  audioMetrics: AudioAnalysisMetrics;
  onSelectKeptSegment: (seg: CompiledSegment) => void;
  onSelectCutSegment: (seg: CompiledSegment) => void;
  onSelectBrollBeat: (beat: BrollBeat) => void;
}

type CutFilter = 'all' | 'keep' | 'cut';

export function InspectorPanel({
  activeTab,
  onSelectTab,
  config,
  appliedConfig,
  onConfigChange,
  onRenderCustom,
  isRendering,
  renderError,
  renderStatusMessage,
  timeline,
  brollBeats,
  audioMetrics,
  onSelectKeptSegment,
  onSelectCutSegment,
  onSelectBrollBeat,
}: InspectorPanelProps) {
  const [cutFilter, setCutFilter] = useState<CutFilter>('all');
  const [failedThumbs, setFailedThumbs] = useState<Record<string, boolean>>({});

  const hasPendingChanges = JSON.stringify(config) !== JSON.stringify(appliedConfig);

  const filteredSegments = timeline.segments.filter((seg) => {
    if (cutFilter === 'keep') return seg.kind === 'keep';
    if (cutFilter === 'cut') return seg.kind === 'cut';
    return true;
  });

  const toggleField = (
    field: 'captionsEnabled' | 'brollEnabled' | 'colorGradeEnabled' | 'sfxEnabled',
  ) => {
    onConfigChange({ ...config, [field]: !config[field] });
  };

  return (
    <aside
      aria-label="Studio edit inspector"
      className="flex flex-col rounded-xl border border-[#222A38] bg-[#131822]"
    >
      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="Inspector sections"
        className="flex items-center border-b border-[#222A38] px-4 pt-3 gap-2"
      >
        {(
          [
            { id: 'controls', label: 'Edit Controls', icon: Sliders },
            { id: 'cuts', label: 'Cut & Retake Log', icon: Scissors },
            { id: 'audio', label: 'Audio & B-Roll', icon: Volume2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => onSelectTab(id)}
            className={`inline-flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === id
                ? 'border-amber-500 text-slate-50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[650px]">
        {activeTab === 'controls' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Master Pipeline Settings
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Adjust any layer below and run a fresh FFmpeg export to customize your downloadable MP4.
              </p>
            </div>

            {/* Feature Toggles */}
            <div className="divide-y divide-[#1E2635] border-y border-[#1E2635]">
              {(
                [
                  {
                    field: 'captionsEnabled' as const,
                    title: 'Dynamic Word-by-Word Captions',
                    desc: 'High-contrast active-word creator subtitles in the YouTube Shorts safe zone.',
                  },
                  {
                    field: 'brollEnabled' as const,
                    title: 'Contextual B-Roll Overlays',
                    desc: '4 story beats mixing cinematic campus scenes and animated typing-race graphics.',
                  },
                  {
                    field: 'colorGradeEnabled' as const,
                    title: 'Balanced Color Grade',
                    desc: 'Warm contrast lift, clarity sharpening, and gentle cinematic vignette.',
                  },
                  {
                    field: 'sfxEnabled' as const,
                    title: 'Soft Transition Whoosh SFX',
                    desc: 'Subtle air-whoosh accents timed cleanly to B-roll entrances.',
                  },
                ] as const
              ).map((item) => {
                const enabled = config[item.field];
                return (
                  <div
                    key={item.field}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <label
                        htmlFor={`toggle-${item.field}`}
                        className="block text-sm font-medium text-slate-100 cursor-pointer"
                      >
                        {item.title}
                      </label>
                      <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      id={`toggle-${item.field}`}
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={item.title}
                      onClick={() => toggleField(item.field)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                        enabled ? 'bg-amber-500' : 'bg-[#253042]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-[#0B0E14] transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Transition Style Selector */}
            <div className="space-y-2">
              <span className="block text-sm font-medium text-slate-100">
                Cut Transition Style
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'soft-dissolve' as TransitionStyle,
                      label: 'Soft Dissolve',
                      detail: 'Silky micro-fades to eliminate hard jump cuts',
                    },
                    {
                      id: 'smooth-zoom' as TransitionStyle,
                      label: 'Smooth Punch-In',
                      detail: 'Alternating subtle zoom cuts for tighter energy',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onConfigChange({ ...config, transitionStyle: opt.id })}
                    className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                      config.transitionStyle === opt.id
                        ? 'border-amber-500/80 bg-amber-500/10 text-slate-50'
                        : 'border-[#222A38] bg-[#0F141D] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{opt.detail}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lo-Fi Music Mix Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="music-level-slider"
                  className="text-sm font-medium text-slate-100"
                >
                  Lo-Fi Tech Background Music
                </label>
                <span className="text-xs font-mono tabular-nums text-amber-400">
                  {config.musicVolumeDb <= -50 ? 'Muted' : `${config.musicVolumeDb} dB`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="music-level-slider"
                  type="range"
                  min={-36}
                  max={-14}
                  step={2}
                  value={config.musicVolumeDb <= -50 ? -36 : config.musicVolumeDb}
                  onChange={(e) =>
                    onConfigChange({ ...config, musicVolumeDb: Number(e.target.value) })
                  }
                  className="studio-slider flex-1"
                />
                <button
                  type="button"
                  onClick={() =>
                    onConfigChange({
                      ...config,
                      musicVolumeDb: config.musicVolumeDb <= -50 ? -24 : -60,
                    })
                  }
                  className="rounded-md border border-[#222A38] bg-[#0F141D] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {config.musicVolumeDb <= -50 ? 'Enable' : 'Mute Bed'}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Recommended -24 dB keeps warm lo-fi rhythm underneath while Rafi&apos;s normalized voice stays 100% clear.
              </p>
            </div>

            {/* Action Footer */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={onRenderCustom}
                disabled={isRendering}
                className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRendering ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>
                  {isRendering
                    ? 'Rendering MP4 via FFmpeg…'
                    : hasPendingChanges
                      ? 'Render Updated Short'
                      : 'Re-Render Master Short'}
                </span>
              </button>

              {renderError && (
                <p role="alert" className="text-xs text-red-400">
                  {renderError}
                </p>
              )}
              {renderStatusMessage && !renderError && (
                <p
                  role="status"
                  className="flex items-center gap-1.5 text-xs text-emerald-400"
                >
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{renderStatusMessage}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cuts' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Surgical Cut &amp; Retake Log
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {timeline.keptSegments.length} kept lines · {timeline.retakeCount} retakes &amp; distractions removed · {timeline.fillerGapCount} gaps tightened
                </p>
              </div>

              <div className="inline-flex items-center gap-1 rounded-lg bg-[#0B0E14] p-1 border border-[#222A38]">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'keep', label: 'Kept' },
                    { id: 'cut', label: 'Removed' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCutFilter(item.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      cutFilter === item.id
                        ? 'bg-[#1D2536] text-slate-50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#1E2635] border-y border-[#1E2635]">
              {filteredSegments.map((seg) => {
                const isCut = seg.kind === 'cut';
                const isRetake =
                  seg.cutCategory === 'retake' || seg.cutCategory === 'distraction';
                return (
                  <div
                    key={seg.id}
                    className="flex items-start justify-between gap-3 py-2.5 hover:bg-[#181F2C]/60 px-2 -mx-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                        <span className="text-slate-400">
                          {formatTimecode(seg.rawStart)}–{formatTimecode(seg.rawEnd)}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span
                          className={
                            isRetake
                              ? 'text-red-400 font-medium'
                              : isCut
                                ? 'text-slate-500'
                                : 'text-emerald-400 font-medium'
                          }
                        >
                          {isRetake ? 'Retake Removed' : isCut ? 'Gap Trimmed' : 'Kept'}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="text-slate-500">{seg.duration.toFixed(2)}s</span>
                      </div>
                      <p
                        className={`mt-1 text-sm ${
                          isCut ? 'text-slate-400 line-through decoration-red-500/60' : 'text-slate-100'
                        }`}
                      >
                        {seg.transcript}
                      </p>
                      {seg.cutReason && (
                        <p className="mt-0.5 text-xs text-slate-500">{seg.cutReason}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        isCut ? onSelectCutSegment(seg) : onSelectKeptSegment(seg)
                      }
                      aria-label={
                        isCut
                          ? `Preview removed cut at ${formatTimecode(seg.rawStart)}`
                          : `Jump to kept line at ${formatTimecode(seg.editedStart ?? 0)}`
                      }
                      className="mt-0.5 inline-flex items-center gap-1 rounded-md border border-[#222A38] bg-[#0F141D] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-amber-500/50 hover:text-amber-300 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Play className="h-3 w-3" aria-hidden="true" />
                      <span>{isCut ? 'Raw' : 'Play'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-6">
            {/* Audio Loudness Leveling Proof */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-100">
                  Voice Volume Normalization
                </h2>
                <span className="text-xs font-mono tabular-nums text-emerald-400">
                  {audioMetrics.rawMeanDb} dB → {audioMetrics.masteredLufs} dB
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Measured RMS loudness across the full video. High-pass filtering, FFT denoise, dynamic vocal leveling, and EBU R128 mastering lift the quiet intro to match the rest of the Short.
              </p>

              {/* Raw Waveform */}
              <div className="rounded-lg border border-[#222A38] bg-[#0B0E14] p-3 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Raw Original Audio (uneven &amp; quiet)</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      Mean {audioMetrics.rawMeanDb} dB · Peak {audioMetrics.rawMaxDb} dB
                    </span>
                  </div>
                  <div
                    aria-label="Raw audio loudness waveform"
                    className="flex h-12 items-end gap-[2px]"
                  >
                    {audioMetrics.rawWaveform.map((val, idx) => (
                      <div
                        key={`raw-${idx}`}
                        style={{ height: `${Math.max(6, val)}%` }}
                        className="flex-1 rounded-t-[1px] bg-slate-600/75"
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#1C2331] pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-medium">
                      Mastered Short Audio (consistent flow)
                    </span>
                    <span className="font-mono tabular-nums text-emerald-400">
                      Mean {audioMetrics.masteredLufs} dB · Peak {audioMetrics.masteredTruePeakDb} dB
                    </span>
                  </div>
                  <div
                    aria-label="Mastered audio loudness waveform"
                    className="flex h-12 items-end gap-[2px]"
                  >
                    {audioMetrics.masteredWaveform.map((val, idx) => (
                      <div
                        key={`mst-${idx}`}
                        style={{ height: `${Math.max(8, val)}%` }}
                        className="flex-1 rounded-t-[1px] bg-emerald-500/80"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* B-Roll Storyboard Grid */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Contextual B-Roll Placements
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Each B-roll fades in and out over 0.28s with a subtle whoosh SFX while your voice stays locked in sync.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brollBeats.map((beat) => {
                  const thumbBroken = failedThumbs[beat.id];
                  return (
                    <div
                      key={beat.id}
                      className="flex flex-col overflow-hidden rounded-lg border border-[#222A38] bg-[#0F141D]"
                    >
                      <div className="relative h-36 w-full bg-[#090C12] overflow-hidden">
                        {!thumbBroken ? (
                          <img
                            src={beat.thumbnailUrl}
                            alt={beat.title}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedThumbs((prev) => ({ ...prev, [beat.id]: true }))
                            }
                            className={`h-full w-full object-cover ${
                              beat.type === 'motion-graphic' ? 'object-top' : 'object-center'
                            }`}
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#141B29] to-[#0B0E14] text-slate-400">
                            <Film className="h-6 w-6 mb-1.5 text-amber-500" aria-hidden="true" />
                            <span className="text-xs font-medium">{beat.title}</span>
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0B0E14]/95 via-[#0B0E14]/75 to-transparent" />
                        <span className="absolute bottom-2 left-2.5 text-[11px] font-mono tabular-nums text-slate-100">
                          {formatTimecode(beat.editedStart)} – {formatTimecode(beat.editedEnd)}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-100">
                            {beat.title}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">{beat.storyBeat}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectBrollBeat(beat)}
                          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-[#263042] bg-[#161D2B] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-amber-500/60 hover:text-amber-300 cursor-pointer"
                        >
                          <Play className="h-3 w-3" aria-hidden="true" />
                          <span>Preview Beat</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
