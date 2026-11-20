import { BrollBeat, CompiledSegment, CompiledTimelineSummary, formatTimecode } from '../lib/editPlan';
import { StageMode } from './VideoStage';

interface TimelinePanelProps {
  timeline: CompiledTimelineSummary;
  brollBeats: BrollBeat[];
  mode: StageMode;
  currentTimeSec: number;
  brollEnabled: boolean;
  onSelectKeptSegment: (seg: CompiledSegment) => void;
  onSelectCutSegment: (seg: CompiledSegment) => void;
  onSelectBrollBeat: (beat: BrollBeat) => void;
}

export function TimelinePanel({
  timeline,
  brollBeats,
  mode,
  currentTimeSec,
  brollEnabled,
  onSelectKeptSegment,
  onSelectCutSegment,
  onSelectBrollBeat,
}: TimelinePanelProps) {
  const editedDur = Math.max(1, timeline.editedDurationSec);
  const rawDur = Math.max(1, timeline.rawDurationSec);
  const playheadPct =
    mode === 'raw'
      ? Math.min(100, Math.max(0, (currentTimeSec / rawDur) * 100))
      : Math.min(100, Math.max(0, (currentTimeSec / editedDur) * 100));

  const rulerMarks = [0, 10, 20, 30, 40, Math.floor(editedDur)];

  return (
    <section
      id="studio-timeline"
      aria-label="Multi-track edit timeline"
      className="rounded-xl border border-[#222A38] bg-[#131822] p-5"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Multi-Track Edit Timeline</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Click any kept clip or B-roll beat to scrub the edited Short, or click a removed retake to inspect the raw source.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono tabular-nums">
          <span>
            Edited: <strong className="text-slate-100">{formatTimecode(timeline.editedDurationSec)}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Removed: <strong className="text-red-400">-{timeline.timeRemovedSec.toFixed(1)}s</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>{timeline.retakeCount} retakes cut</span>
          <span aria-hidden="true">·</span>
          <span>{timeline.fillerGapCount} gaps tightened</span>
        </div>
      </div>

      {/* Ruler */}
      <div className="mb-2 flex items-center justify-between pl-28 pr-1 text-[11px] font-mono tabular-nums text-slate-500">
        {rulerMarks.map((sec, idx) => (
          <span key={`${sec}-${idx}`}>{formatTimecode(sec)}</span>
        ))}
      </div>

      <div className="space-y-2.5">
        {/* Track 1: B-Roll Overlays */}
        <div className="grid grid-cols-[108px_1fr] items-center gap-3">
          <div className="text-xs font-medium text-slate-300 truncate">B-Roll Layer</div>
          <div className="relative h-9 rounded-md bg-[#0B0E14] border border-[#1E2635] overflow-hidden">
            {brollBeats.map((beat) => {
              const leftPct = (beat.editedStart / editedDur) * 100;
              const widthPct = ((beat.editedEnd - beat.editedStart) / editedDur) * 100;
              return (
                <button
                  key={beat.id}
                  type="button"
                  onClick={() => onSelectBrollBeat(beat)}
                  title={`${beat.title} (${formatTimecode(beat.editedStart)} – ${formatTimecode(beat.editedEnd)})`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={`absolute top-1 bottom-1 rounded px-2 text-left text-[11px] font-medium truncate transition-colors cursor-pointer ${
                    brollEnabled
                      ? 'bg-blue-600/25 border border-blue-500/60 text-blue-100 hover:bg-blue-600/40'
                      : 'bg-slate-800/50 border border-slate-700 text-slate-500'
                  }`}
                >
                  {beat.title}
                </button>
              );
            })}
            {mode !== 'raw' && (
              <div
                aria-hidden="true"
                style={{ left: `${playheadPct}%` }}
                className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-amber-400"
              />
            )}
          </div>
        </div>

        {/* Track 2: Kept Dialogue Clips */}
        <div className="grid grid-cols-[108px_1fr] items-center gap-3">
          <div className="text-xs font-medium text-slate-300 truncate">Dialogue (Kept)</div>
          <div className="relative h-10 rounded-md bg-[#0B0E14] border border-[#1E2635] overflow-hidden">
            {timeline.keptSegments.map((seg) => {
              if (seg.editedStart === null || seg.editedEnd === null) return null;
              const leftPct = (seg.editedStart / editedDur) * 100;
              const widthPct = Math.max(0.8, ((seg.editedEnd - seg.editedStart) / editedDur) * 100);
              const isCurrent =
                mode !== 'raw' &&
                currentTimeSec >= seg.editedStart &&
                currentTimeSec <= seg.editedEnd;
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => onSelectKeptSegment(seg)}
                  title={`${seg.transcript} (${formatTimecode(seg.editedStart)} – ${formatTimecode(seg.editedEnd)})`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={`absolute top-1 bottom-1 rounded-xs border px-1.5 text-left text-[11px] truncate transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500/30 border-amber-400 text-amber-100'
                      : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-100 hover:bg-emerald-600/35'
                  }`}
                >
                  {seg.transcript}
                </button>
              );
            })}
            {mode !== 'raw' && (
              <div
                aria-hidden="true"
                style={{ left: `${playheadPct}%` }}
                className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-amber-400"
              />
            )}
          </div>
        </div>

        {/* Track 3: Raw Source Map (Highlights Removed Retakes & Dead Air) */}
        <div className="grid grid-cols-[108px_1fr] items-center gap-3">
          <div className="text-xs font-medium text-slate-400 truncate">Raw Cuts Map</div>
          <div className="relative h-9 rounded-md bg-[#0B0E14] border border-[#1E2635] overflow-hidden">
            {timeline.segments.map((seg) => {
              const leftPct = (seg.rawStart / rawDur) * 100;
              const widthPct = Math.max(0.6, ((seg.rawEnd - seg.rawStart) / rawDur) * 100);
              const isCut = seg.kind === 'cut';
              const isRetake = seg.cutCategory === 'retake' || seg.cutCategory === 'distraction';
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() =>
                    isCut ? onSelectCutSegment(seg) : onSelectKeptSegment(seg)
                  }
                  title={
                    isCut
                      ? `Removed (${seg.duration.toFixed(2)}s): ${seg.cutReason ?? seg.transcript}`
                      : `Kept (${seg.duration.toFixed(2)}s): ${seg.transcript}`
                  }
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={`absolute top-1 bottom-1 rounded-xs transition-colors cursor-pointer ${
                    isRetake
                      ? 'bg-red-500/50 border border-red-400/70 hover:bg-red-500/75'
                      : isCut
                        ? 'bg-red-900/35 border border-red-800/50 hover:bg-red-800/60'
                        : 'bg-slate-700/45 border border-slate-600/40 hover:bg-slate-600/60'
                  }`}
                  aria-label={
                    isCut
                      ? `Inspect removed ${seg.cutCategory ?? 'cut'} at ${formatTimecode(seg.rawStart)}`
                      : `Jump to kept line at ${formatTimecode(seg.rawStart)}`
                  }
                />
              );
            })}
            {mode === 'raw' && (
              <div
                aria-hidden="true"
                style={{ left: `${playheadPct}%` }}
                className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-amber-400"
              />
            )}
          </div>
        </div>
      </div>

      {/* Quiet legend */}
      <div className="mt-3 flex flex-wrap items-center gap-5 pl-28 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500/60" aria-hidden="true" />
          Kept speech (23 clips)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-blue-500/60" aria-hidden="true" />
          Contextual B-roll (4 beats)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-red-500/70" aria-hidden="true" />
          Removed retakes &amp; nose rub (5 cuts)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-red-900/60" aria-hidden="true" />
          Trimmed dead-air gaps
        </span>
      </div>
    </section>
  );
}
