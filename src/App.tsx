import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AudioAnalysisMetrics,
  BrollBeat,
  CaptionWordCue,
  CompiledSegment,
  CompiledTimelineSummary,
  DEFAULT_RENDER_CONFIG,
  RAW_VIDEO_METADATA,
  RAW_VIDEO_PATH,
  RenderConfig,
  findActiveBroll,
  formatTimecode,
} from './lib/editPlan';
import { InspectorPanel } from './components/InspectorPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { InspectorTab, TopBar } from './components/TopBar';
import { StageMode, VideoStage } from './components/VideoStage';

interface MasterRenderInfo {
  renderId: string;
  videoUrl: string;
  posterUrl: string;
  fileSizeBytes: number;
  durationSec: number;
  width: number;
  height: number;
  config: RenderConfig;
  audioMetrics: AudioAnalysisMetrics;
  renderedAt: string;
}

interface ProjectPayload {
  rawVideoUrl: string;
  rawMetadata: typeof RAW_VIDEO_METADATA;
  timeline: CompiledTimelineSummary;
  brollBeats: BrollBeat[];
  captionCues: CaptionWordCue[];
  masterRender: MasterRenderInfo;
}

export default function App() {
  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InspectorTab>('controls');
  const [stageMode, setStageMode] = useState<StageMode>('edited');
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [seekRequest, setSeekRequest] = useState<{ timeSec: number; nonce: number } | null>(null);

  const [draftConfig, setDraftConfig] = useState<RenderConfig>(DEFAULT_RENDER_CONFIG);
  const [currentRender, setCurrentRender] = useState<MasterRenderInfo | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderStatusMessage, setRenderStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/project')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load edited Short project.');
        return (await res.json()) as ProjectPayload;
      })
      .then((data) => {
        if (!active) return;
        setProject(data);
        setCurrentRender(data.masterRender);
        setDraftConfig(data.masterRender.config);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to load project.');
      });
    return () => {
      active = false;
    };
  }, []);

  const triggerSeek = useCallback((timeSec: number) => {
    setSeekRequest({ timeSec, nonce: Date.now() + Math.random() });
  }, []);

  const handleSelectKeptSegment = useCallback(
    (seg: CompiledSegment) => {
      if (seg.editedStart === null) return;
      if (stageMode === 'raw') setStageMode('edited');
      triggerSeek(seg.editedStart + 0.02);
    },
    [stageMode, triggerSeek],
  );

  const handleSelectCutSegment = useCallback(
    (seg: CompiledSegment) => {
      setStageMode('raw');
      setTimeout(() => triggerSeek(seg.rawStart + 0.05), 40);
    },
    [triggerSeek],
  );

  const handleSelectBrollBeat = useCallback(
    (beat: BrollBeat) => {
      if (stageMode === 'raw') setStageMode('edited');
      triggerSeek(beat.editedStart + 0.15);
    },
    [stageMode, triggerSeek],
  );

  const handleFocusTimeline = useCallback(() => {
    const el = document.getElementById('studio-timeline');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleRenderCustom = useCallback(async () => {
    if (isRendering) return;
    setIsRendering(true);
    setRenderError(null);
    setRenderStatusMessage(null);

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftConfig),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Custom render failed.');
      }
      setCurrentRender(payload as MasterRenderInfo);
      setStageMode('edited');
      setRenderStatusMessage(
        `Rendered ${formatTimecode(payload.durationSec)} MP4 (${(
          payload.fileSizeBytes /
          (1024 * 1024)
        ).toFixed(1)} MB) ready for download.`,
      );
      triggerSeek(0);
    } catch (err: unknown) {
      setRenderError(err instanceof Error ? err.message : 'Render failed.');
    } finally {
      setIsRendering(false);
    }
  }, [draftConfig, isRendering, triggerSeek]);

  const activeBroll = useMemo(() => {
    if (!project || stageMode === 'raw' || !currentRender?.config.brollEnabled) return null;
    return findActiveBroll(currentTimeSec, project.brollBeats);
  }, [project, stageMode, currentTimeSec, currentRender]);

  const activeSegment = useMemo(() => {
    if (!project) return null;
    if (stageMode === 'raw') {
      return (
        project.timeline.segments.find(
          (s) => currentTimeSec >= s.rawStart && currentTimeSec <= s.rawEnd,
        ) ?? null
      );
    }
    return (
      project.timeline.keptSegments.find(
        (s) =>
          s.editedStart !== null &&
          s.editedEnd !== null &&
          currentTimeSec >= s.editedStart &&
          currentTimeSec <= s.editedEnd,
      ) ?? null
    );
  }, [project, stageMode, currentTimeSec]);

  const activeCue = useMemo(() => {
    if (!project || stageMode === 'raw') return null;
    return (
      project.captionCues.find(
        (c) => currentTimeSec >= c.startSec && currentTimeSec <= c.endSec,
      ) ?? null
    );
  }, [project, stageMode, currentTimeSec]);

  const downloadUrl = currentRender
    ? `/api/download?renderId=${encodeURIComponent(currentRender.renderId)}`
    : '/api/download?renderId=master';

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-[#222A38] bg-[#131822] p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-100">Unable to load studio</h1>
          <p className="mt-2 text-sm text-slate-400">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!project || !currentRender) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-200">
            Preparing mastered YouTube Short…
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Loading timeline, normalized audio metrics, and 1080×1920 preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="top" className="min-h-screen bg-[#0B0E14] text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onFocusTimeline={handleFocusTimeline}
        downloadUrl={downloadUrl}
        isRendering={isRendering}
      />

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-5">
        {/* Compact Project Summary Strip (Clean unboxed typography, zero pill spam) */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1C2331] pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">
              Rafi&apos;s Campus Typing Race — YouTube Short
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Raw 86.8s footage refined to {currentRender.durationSec.toFixed(1)}s with surgical retake cuts, soft transitions, {currentRender.audioMetrics.masteredLufs} dB voice leveling, 4 contextual B-roll beats, and dynamic word captions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-mono tabular-nums text-slate-300">
            <div>
              <span className="block text-[11px] font-sans text-slate-500">Raw → Edited</span>
              <span>
                {project.timeline.rawDurationSec.toFixed(1)}s →{' '}
                <strong className="text-amber-400">{currentRender.durationSec.toFixed(1)}s</strong>
              </span>
            </div>
            <div className="h-7 w-px bg-[#222A38]" aria-hidden="true" />
            <div>
              <span className="block text-[11px] font-sans text-slate-500">Audio Level</span>
              <span>
                {currentRender.audioMetrics.rawMeanDb} dB →{' '}
                <strong className="text-emerald-400">
                  {currentRender.audioMetrics.masteredLufs} dB
                </strong>
              </span>
            </div>
            <div className="h-7 w-px bg-[#222A38]" aria-hidden="true" />
            <div>
              <span className="block text-[11px] font-sans text-slate-500">Cuts Cleaned</span>
              <span>
                {project.timeline.retakeCount} retakes · {project.timeline.fillerGapCount} gaps
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-5 items-stretch">
          <VideoStage
            mode={stageMode}
            onModeChange={setStageMode}
            editedVideoUrl={currentRender.videoUrl}
            editedPosterUrl={currentRender.posterUrl}
            rawVideoUrl={project.rawVideoUrl || RAW_VIDEO_PATH}
            editedDurationSec={currentRender.durationSec}
            rawDurationSec={project.timeline.rawDurationSec}
            currentTimeSec={currentTimeSec}
            isPlaying={isPlaying}
            isMuted={isMuted}
            isRendering={isRendering}
            fileSizeBytes={currentRender.fileSizeBytes}
            masteredLufs={currentRender.audioMetrics.masteredLufs}
            rawMeanDb={currentRender.audioMetrics.rawMeanDb}
            activeBroll={activeBroll}
            activeSegment={activeSegment}
            activeCue={activeCue}
            seekRequest={seekRequest}
            onTimeUpdate={setCurrentTimeSec}
            onPlayStateChange={setIsPlaying}
            onToggleMute={() => setIsMuted((m) => !m)}
            onSeek={triggerSeek}
          />

          <InspectorPanel
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            config={draftConfig}
            appliedConfig={currentRender.config}
            onConfigChange={setDraftConfig}
            onRenderCustom={handleRenderCustom}
            isRendering={isRendering}
            renderError={renderError}
            renderStatusMessage={renderStatusMessage}
            timeline={project.timeline}
            brollBeats={project.brollBeats}
            audioMetrics={currentRender.audioMetrics}
            onSelectKeptSegment={handleSelectKeptSegment}
            onSelectCutSegment={handleSelectCutSegment}
            onSelectBrollBeat={handleSelectBrollBeat}
          />
        </div>

        {/* Full-Width Interactive Multi-Track Timeline */}
        <TimelinePanel
          timeline={project.timeline}
          brollBeats={project.brollBeats}
          mode={stageMode}
          currentTimeSec={currentTimeSec}
          brollEnabled={currentRender.config.brollEnabled}
          onSelectKeptSegment={handleSelectKeptSegment}
          onSelectCutSegment={handleSelectCutSegment}
          onSelectBrollBeat={handleSelectBrollBeat}
        />
      </main>
    </div>
  );
}
