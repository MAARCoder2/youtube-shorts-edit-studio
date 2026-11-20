export type SegmentKind = 'keep' | 'cut';

export type CutCategory = 'retake' | 'distraction' | 'dead-air';

export type BrollType = 'cinematic' | 'motion-graphic' | 'hybrid';

export type TransitionStyle = 'soft-dissolve' | 'smooth-zoom';

export interface TimelineSegmentSpec {
  id: string;
  kind: SegmentKind;
  rawStart: number;
  rawEnd: number;
  transcript: string;
  cutCategory?: CutCategory;
  cutReason?: string;
  zoomFactor?: number;
  emphasizeWords?: string[];
}

export interface CompiledSegment extends TimelineSegmentSpec {
  duration: number;
  editedStart: number | null;
  editedEnd: number | null;
}

export interface BrollBeat {
  id: string;
  title: string;
  subtitle: string;
  type: BrollType;
  editedStart: number;
  editedEnd: number;
  transitionInSec: number;
  transitionOutSec: number;
  sourceAssetPath: string;
  thumbnailUrl: string;
  renderedClipUrl: string;
  storyBeat: string;
}

export interface CaptionWordCue {
  id: string;
  segmentId: string;
  words: string[];
  activeIndex: number;
  startSec: number;
  endSec: number;
  isEmphasis: boolean;
}

export interface RenderConfig {
  captionsEnabled: boolean;
  brollEnabled: boolean;
  colorGradeEnabled: boolean;
  sfxEnabled: boolean;
  musicVolumeDb: number; // -36 to -14, or <= -60 means muted
  transitionStyle: TransitionStyle;
}

export interface AudioAnalysisMetrics {
  rawMeanDb: number;
  rawMaxDb: number;
  masteredLufs: number;
  masteredTruePeakDb: number;
  rawWaveform: number[];
  masteredWaveform: number[];
}

export interface CompiledTimelineSummary {
  segments: CompiledSegment[];
  keptSegments: CompiledSegment[];
  cutSegments: CompiledSegment[];
  rawDurationSec: number;
  editedDurationSec: number;
  timeRemovedSec: number;
  retakeCount: number;
  fillerGapCount: number;
  crossfadeSec: number;
}

export const RAW_VIDEO_PATH =
  '/assets/aistudio/WhatsApp_Video_2026-11-18_at_9.50.29_AM_15814bd8.mp4';

export const RAW_VIDEO_METADATA = {
  filename: 'WhatsApp_Video_2026-11-18_at_9.50.29_AM_15814bd8.mp4',
  durationSec: 86.8,
  width: 478,
  height: 850,
  fps: 30,
  rawMeanDb: -37.3,
  rawMaxDb: -14.8,
} as const;

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  captionsEnabled: true,
  brollEnabled: true,
  colorGradeEnabled: true,
  sfxEnabled: true,
  musicVolumeDb: -24,
  transitionStyle: 'soft-dissolve',
};

export const CROSSFADE_DURATION_SEC = 0.04;

export const TIMELINE_SEGMENTS: TimelineSegmentSpec[] = [
  {
    id: 'cut-00',
    kind: 'cut',
    rawStart: 0.0,
    rawEnd: 1.05,
    transcript: '(Opening dead air)',
    cutCategory: 'dead-air',
    cutReason: 'Trimmed 1.05s silent lead-in before first word.',
  },
  {
    id: 'keep-01',
    kind: 'keep',
    rawStart: 1.05,
    rawEnd: 1.54,
    transcript: 'Hi,',
    zoomFactor: 1.0,
    emphasizeWords: ['Hi,'],
  },
  {
    id: 'cut-01',
    kind: 'cut',
    rawStart: 1.54,
    rawEnd: 1.92,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Tightened intro pause between greeting and name.',
  },
  {
    id: 'keep-02',
    kind: 'keep',
    rawStart: 1.92,
    rawEnd: 2.78,
    transcript: "I'm Rafi.",
    zoomFactor: 1.0,
    emphasizeWords: ['Rafi.'],
  },
  {
    id: 'cut-02',
    kind: 'cut',
    rawStart: 2.78,
    rawEnd: 3.46,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Removed 0.68s pause before hook sentence.',
  },
  {
    id: 'keep-03',
    kind: 'keep',
    rawStart: 3.46,
    rawEnd: 4.44,
    transcript: 'Let me tell you',
    zoomFactor: 1.05,
  },
  {
    id: 'cut-03',
    kind: 'cut',
    rawStart: 4.44,
    rawEnd: 4.94,
    transcript: '(Mid-sentence gap)',
    cutCategory: 'dead-air',
    cutReason: 'Closed 0.50s hesitation inside hook.',
  },
  {
    id: 'keep-04',
    kind: 'keep',
    rawStart: 4.94,
    rawEnd: 6.32,
    transcript: 'what I built at my campus.',
    zoomFactor: 1.05,
    emphasizeWords: ['built', 'campus.'],
  },
  {
    id: 'cut-04',
    kind: 'cut',
    rawStart: 6.32,
    rawEnd: 9.2,
    transcript: '"My friend..." (False start & pause)',
    cutCategory: 'retake',
    cutReason: 'Removed repeated false start "My friend..." and 2.2s reset pause.',
  },
  {
    id: 'keep-05',
    kind: 'keep',
    rawStart: 9.2,
    rawEnd: 12.04,
    transcript: 'My friends Firoz, Miraz and Rayhan',
    zoomFactor: 1.0,
    emphasizeWords: ['Firoz,', 'Miraz', 'Rayhan'],
  },
  {
    id: 'cut-05',
    kind: 'cut',
    rawStart: 12.04,
    rawEnd: 12.44,
    transcript: '(Breath gap)',
    cutCategory: 'dead-air',
    cutReason: 'Tightened pause after friend names.',
  },
  {
    id: 'keep-06',
    kind: 'keep',
    rawStart: 12.44,
    rawEnd: 14.94,
    transcript: 'kept saying typing practice was boring.',
    zoomFactor: 1.04,
    emphasizeWords: ['boring.'],
  },
  {
    id: 'cut-06',
    kind: 'cut',
    rawStart: 14.94,
    rawEnd: 15.78,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Trimmed 0.84s silence between sentences.',
  },
  {
    id: 'keep-07',
    kind: 'keep',
    rawStart: 15.78,
    rawEnd: 17.88,
    transcript: "They didn't wanna do it anymore.",
    zoomFactor: 1.04,
    emphasizeWords: ['anymore.'],
  },
  {
    id: 'cut-07',
    kind: 'cut',
    rawStart: 17.88,
    rawEnd: 18.98,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Trimmed 1.10s gap before idea reveal.',
  },
  {
    id: 'keep-08',
    kind: 'keep',
    rawStart: 18.98,
    rawEnd: 20.28,
    transcript: 'Then I had an idea.',
    zoomFactor: 1.08,
    emphasizeWords: ['idea.'],
  },
  {
    id: 'cut-08',
    kind: 'cut',
    rawStart: 20.28,
    rawEnd: 21.52,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Tightened 1.24s pause before concept pitch.',
  },
  {
    id: 'keep-09',
    kind: 'keep',
    rawStart: 21.52,
    rawEnd: 23.38,
    transcript: 'Turn typing into a race.',
    zoomFactor: 1.02,
    emphasizeWords: ['typing', 'race.'],
  },
  {
    id: 'cut-09',
    kind: 'cut',
    rawStart: 23.38,
    rawEnd: 24.58,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Removed 1.20s silence before gameplay rule.',
  },
  {
    id: 'keep-10',
    kind: 'keep',
    rawStart: 24.58,
    rawEnd: 27.94,
    transcript: 'If you type fast and accurate, your car moves forward.',
    zoomFactor: 1.02,
    emphasizeWords: ['fast', 'accurate,', 'forward.'],
  },
  {
    id: 'cut-10',
    kind: 'cut',
    rawStart: 27.94,
    rawEnd: 29.02,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Removed 1.08s silence before build process.',
  },
  {
    id: 'keep-11',
    kind: 'keep',
    rawStart: 29.02,
    rawEnd: 30.92,
    transcript: 'First I made a plan,',
    zoomFactor: 1.06,
    emphasizeWords: ['plan,'],
  },
  {
    id: 'cut-11',
    kind: 'cut',
    rawStart: 30.92,
    rawEnd: 31.34,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Tightened short pause between clauses.',
  },
  {
    id: 'keep-12',
    kind: 'keep',
    rawStart: 31.34,
    rawEnd: 34.68,
    transcript: 'then I used AI to break it into clear steps.',
    zoomFactor: 1.06,
    emphasizeWords: ['AI', 'clear', 'steps.'],
  },
  {
    id: 'cut-12',
    kind: 'cut',
    rawStart: 34.68,
    rawEnd: 38.34,
    transcript: '(3.66s pause + nose rub)',
    cutCategory: 'distraction',
    cutReason: 'Cut long 3.66s off-beat pause and hand-to-face nose rub.',
  },
  {
    id: 'keep-13',
    kind: 'keep',
    rawStart: 38.34,
    rawEnd: 39.52,
    transcript: 'With that help,',
    zoomFactor: 1.01,
  },
  {
    id: 'cut-13',
    kind: 'cut',
    rawStart: 39.52,
    rawEnd: 40.88,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Tightened 1.36s pause mid-sentence.',
  },
  {
    id: 'keep-14',
    kind: 'keep',
    rawStart: 40.88,
    rawEnd: 42.04,
    transcript: 'I built the game.',
    zoomFactor: 1.07,
    emphasizeWords: ['built', 'game.'],
  },
  {
    id: 'cut-14',
    kind: 'cut',
    rawStart: 42.04,
    rawEnd: 42.78,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Trimmed 0.74s pause before payoff.',
  },
  {
    id: 'keep-15',
    kind: 'keep',
    rawStart: 42.78,
    rawEnd: 45.22,
    transcript: 'Soon, my whole class was playing.',
    zoomFactor: 1.02,
    emphasizeWords: ['whole', 'class'],
  },
  {
    id: 'cut-15',
    kind: 'cut',
    rawStart: 45.22,
    rawEnd: 46.28,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Trimmed 1.06s pause between class reaction lines.',
  },
  {
    id: 'keep-16',
    kind: 'keep',
    rawStart: 46.28,
    rawEnd: 49.38,
    transcript: 'Everyone was racing and trying to win.',
    zoomFactor: 1.02,
    emphasizeWords: ['racing', 'win.'],
  },
  {
    id: 'cut-16',
    kind: 'cut',
    rawStart: 49.38,
    rawEnd: 50.12,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Trimmed 0.74s gap before turn.',
  },
  {
    id: 'keep-17',
    kind: 'keep',
    rawStart: 50.12,
    rawEnd: 51.48,
    transcript: 'And suddenly,',
    zoomFactor: 1.06,
    emphasizeWords: ['suddenly,'],
  },
  {
    id: 'cut-17',
    kind: 'cut',
    rawStart: 51.48,
    rawEnd: 52.08,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Tightened pause after "And suddenly".',
  },
  {
    id: 'keep-18',
    kind: 'keep',
    rawStart: 52.08,
    rawEnd: 53.88,
    transcript: "typing wasn't boring anymore.",
    zoomFactor: 1.06,
    emphasizeWords: ["wasn't", 'boring'],
  },
  {
    id: 'cut-18',
    kind: 'cut',
    rawStart: 53.88,
    rawEnd: 55.82,
    transcript: '(Long pause)',
    cutCategory: 'dead-air',
    cutReason: 'Cut 1.94s silence before reflection section.',
  },
  {
    id: 'keep-19',
    kind: 'keep',
    rawStart: 55.82,
    rawEnd: 57.88,
    transcript: 'That taught me something important.',
    zoomFactor: 1.0,
    emphasizeWords: ['important.'],
  },
  {
    id: 'cut-19',
    kind: 'cut',
    rawStart: 57.88,
    rawEnd: 63.82,
    transcript: '"AI didn\'t give..." / "AI didn\'t give me the..." (2x Retakes)',
    cutCategory: 'retake',
    cutReason: 'Removed double stammer retake (5.94s) to jump straight to clean take.',
  },
  {
    id: 'keep-20',
    kind: 'keep',
    rawStart: 63.82,
    rawEnd: 67.68,
    transcript: "AI didn't give me the idea or make the decision.",
    zoomFactor: 1.06,
    emphasizeWords: ['idea', 'decision.'],
  },
  {
    id: 'cut-20',
    kind: 'cut',
    rawStart: 67.68,
    rawEnd: 68.52,
    transcript: '(Pause)',
    cutCategory: 'dead-air',
    cutReason: 'Tightened 0.84s pause before ownership line.',
  },
  {
    id: 'keep-21',
    kind: 'keep',
    rawStart: 68.52,
    rawEnd: 70.78,
    transcript: 'I brought the problem and the plan.',
    zoomFactor: 1.02,
    emphasizeWords: ['problem', 'plan.'],
  },
  {
    id: 'cut-21',
    kind: 'cut',
    rawStart: 70.78,
    rawEnd: 74.22,
    transcript: '"AI just helped me..." (False start)',
    cutCategory: 'retake',
    cutReason: 'Removed 3.44s false start retake before clean phrasing.',
  },
  {
    id: 'keep-22',
    kind: 'keep',
    rawStart: 74.22,
    rawEnd: 76.38,
    transcript: 'AI just helped with the steps.',
    zoomFactor: 1.06,
    emphasizeWords: ['helped', 'steps.'],
  },
  {
    id: 'cut-22',
    kind: 'cut',
    rawStart: 76.38,
    rawEnd: 82.22,
    transcript: '"And..." / "And the result wasn\'t..." (2x Retakes)',
    cutCategory: 'retake',
    cutReason: 'Removed 5.84s double stumble retake before final punchline.',
  },
  {
    id: 'keep-23',
    kind: 'keep',
    rawStart: 82.22,
    rawEnd: 84.72,
    transcript: 'And the result was still mine.',
    zoomFactor: 1.1,
    emphasizeWords: ['result', 'mine.'],
  },
  {
    id: 'cut-23',
    kind: 'cut',
    rawStart: 84.72,
    rawEnd: 86.8,
    transcript: '(Trailing silence)',
    cutCategory: 'dead-air',
    cutReason: 'Trimmed 2.08s dead air after final word with clean fade-out.',
  },
];

export const BROLL_BEATS: BrollBeat[] = [
  {
    id: 'broll_campus_bored',
    title: 'Bored Campus Lab',
    subtitle: 'Cinematic 9:16 photo with slow Ken Burns drift',
    type: 'cinematic',
    editedStart: 5.5,
    editedEnd: 10.75,
    transitionInSec: 0.28,
    transitionOutSec: 0.28,
    sourceAssetPath: '/src/assets/images/broll_campus_bored_1795179705355.jpg',
    thumbnailUrl: '/src/assets/images/broll_campus_bored_1795179705355.jpg',
    renderedClipUrl: '/media/broll/broll_campus_bored.mp4',
    storyBeat: 'Friends Firoz, Miraz & Rayhan bored of typing practice',
  },
  {
    id: 'broll_typing_race',
    title: 'Live Typing Car-Race UI',
    subtitle: 'Animated 3-lane race dashboard + live WPM progress',
    type: 'motion-graphic',
    editedStart: 12.6,
    editedEnd: 17.35,
    transitionInSec: 0.26,
    transitionOutSec: 0.26,
    sourceAssetPath: '/media/broll/broll_typing_race_thumb.png',
    thumbnailUrl: '/media/broll/broll_typing_race_thumb.png',
    renderedClipUrl: '/media/broll/broll_typing_race.mp4',
    storyBeat: 'Turn typing into a race — type fast to move your car forward',
  },
  {
    id: 'broll_ai_steps',
    title: 'AI Blueprint Breakdown',
    subtitle: 'Cinematic desk shot + animated 3-step build checklist',
    type: 'hybrid',
    editedStart: 18.1,
    editedEnd: 22.55,
    transitionInSec: 0.28,
    transitionOutSec: 0.28,
    sourceAssetPath: '/src/assets/images/broll_ai_planning_1795179705634.jpg',
    thumbnailUrl: '/src/assets/images/broll_ai_planning_1795179705634.jpg',
    renderedClipUrl: '/media/broll/broll_ai_steps.mp4',
    storyBeat: 'First made a plan, then used AI to break it into clear steps',
  },
  {
    id: 'broll_class_racing',
    title: 'Whole Class Racing + Leaderboard',
    subtitle: 'Cinematic campus competition + animated live standings',
    type: 'hybrid',
    editedStart: 25.1,
    editedEnd: 30.2,
    transitionInSec: 0.28,
    transitionOutSec: 0.28,
    sourceAssetPath: '/src/assets/images/broll_class_racing_1795179706782.jpg',
    thumbnailUrl: '/src/assets/images/broll_class_racing_1795179706782.jpg',
    renderedClipUrl: '/media/broll/broll_class_racing.mp4',
    storyBeat: 'Whole class playing, racing, and trying to win',
  },
];

export function compileEditedTimeline(
  segments: TimelineSegmentSpec[] = TIMELINE_SEGMENTS,
  crossfadeSec: number = CROSSFADE_DURATION_SEC,
): CompiledTimelineSummary {
  let cursor = 0;
  let keptIndex = 0;
  const compiled: CompiledSegment[] = [];

  for (const seg of segments) {
    const duration = Math.max(0, Number((seg.rawEnd - seg.rawStart).toFixed(3)));
    if (seg.kind === 'keep') {
      const start = keptIndex === 0 ? 0 : Math.max(0, Number((cursor - crossfadeSec).toFixed(3)));
      const end = Number((start + duration).toFixed(3));
      compiled.push({
        ...seg,
        duration,
        editedStart: start,
        editedEnd: end,
      });
      cursor = end;
      keptIndex += 1;
    } else {
      compiled.push({
        ...seg,
        duration,
        editedStart: null,
        editedEnd: null,
      });
    }
  }

  const keptSegments = compiled.filter((s) => s.kind === 'keep');
  const cutSegments = compiled.filter((s) => s.kind === 'cut');
  const rawDurationSec =
    segments.length > 0 ? Number(segments[segments.length - 1].rawEnd.toFixed(2)) : 0;
  const editedDurationSec = Number(cursor.toFixed(2));
  const timeRemovedSec = Number(Math.max(0, rawDurationSec - editedDurationSec).toFixed(2));
  const retakeCount = cutSegments.filter(
    (s) => s.cutCategory === 'retake' || s.cutCategory === 'distraction',
  ).length;
  const fillerGapCount = cutSegments.filter((s) => s.cutCategory === 'dead-air').length;

  return {
    segments: compiled,
    keptSegments,
    cutSegments,
    rawDurationSec,
    editedDurationSec,
    timeRemovedSec,
    retakeCount,
    fillerGapCount,
    crossfadeSec,
  };
}

export function mapEditedToRawTime(
  editedTimeSec: number,
  keptSegments: CompiledSegment[],
): number {
  if (keptSegments.length === 0) return 0;
  const clamped = Math.max(0, editedTimeSec);
  for (const seg of keptSegments) {
    if (seg.editedStart !== null && seg.editedEnd !== null && clamped <= seg.editedEnd) {
      const offset = Math.max(0, clamped - seg.editedStart);
      return Number(Math.min(seg.rawEnd, seg.rawStart + offset).toFixed(3));
    }
  }
  return keptSegments[keptSegments.length - 1].rawEnd;
}

export function mapRawToEditedTime(
  rawTimeSec: number,
  keptSegments: CompiledSegment[],
): number | null {
  for (const seg of keptSegments) {
    if (
      seg.editedStart !== null &&
      rawTimeSec >= seg.rawStart &&
      rawTimeSec <= seg.rawEnd
    ) {
      return Number((seg.editedStart + (rawTimeSec - seg.rawStart)).toFixed(3));
    }
  }
  return null;
}

export function findActiveBroll(
  editedTimeSec: number,
  beats: BrollBeat[] = BROLL_BEATS,
): BrollBeat | null {
  return (
    beats.find((b) => editedTimeSec >= b.editedStart && editedTimeSec <= b.editedEnd) ?? null
  );
}

/**
 * Expands kept dialogue segments into punchy 2-3 word dynamic creator caption cues,
 * highlighting one active word at a time proportional to word syllable/character weight.
 */
export function buildWordCaptionCues(keptSegments: CompiledSegment[]): CaptionWordCue[] {
  const cues: CaptionWordCue[] = [];
  let cueCounter = 1;

  for (const seg of keptSegments) {
    if (seg.editedStart === null || seg.editedEnd === null) continue;
    const rawWords = seg.transcript
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (rawWords.length === 0) continue;

    // Partition into punchy 2-3 word chunks for Shorts readability
    const chunks: string[][] = [];
    let i = 0;
    while (i < rawWords.length) {
      const remaining = rawWords.length - i;
      const chunkSize = remaining === 4 ? 2 : Math.min(3, remaining);
      chunks.push(rawWords.slice(i, i + chunkSize));
      i += chunkSize;
    }

    const totalWeight = rawWords.reduce((sum, w) => sum + Math.max(2, w.replace(/[^a-zA-Z0-9]/g, '').length), 0);
    const segDur = Math.max(0.15, seg.editedEnd - seg.editedStart);
    let wordCursor = seg.editedStart;
    const emphasisSet = new Set((seg.emphasizeWords ?? []).map((w) => w.toLowerCase()));

    for (const chunk of chunks) {
      for (let activeIdx = 0; activeIdx < chunk.length; activeIdx += 1) {
        const word = chunk[activeIdx];
        const weight = Math.max(2, word.replace(/[^a-zA-Z0-9]/g, '').length);
        const wordDur = (weight / totalWeight) * segDur;
        const startSec = Number(wordCursor.toFixed(3));
        const endSec = Number(Math.min(seg.editedEnd, wordCursor + wordDur).toFixed(3));
        wordCursor = endSec;

        cues.push({
          id: `cue-${cueCounter++}`,
          segmentId: seg.id,
          words: chunk,
          activeIndex: activeIdx,
          startSec,
          endSec: Math.max(startSec + 0.05, endSec),
          isEmphasis: emphasisSet.has(word.toLowerCase()),
        });
      }
    }
  }

  return cues;
}

export function formatAssTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const centis = Math.min(99, Math.floor((safe - Math.floor(safe)) * 100));
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function escapeAssText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

/**
 * Generates broadcast-ready 1080x1920 ASS subtitle markup for dynamic word-by-word
 * YouTube Shorts captions in the safe lower-middle zone (Y ~ 1420px).
 */
export function generateAssSubtitles(cues: CaptionWordCue[]): string {
  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1080',
    'PlayResY: 1920',
    'ScaledBorderAndShadow: yes',
    'WrapStyle: 2',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: ShortsWord,DejaVu Sans,76,&H00FFFFFF,&H000B9EF5,&H000B0E14,&H88000000,-1,0,0,0,100,100,1.5,0,1,7,4,2,80,80,390,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const lines = cues.map((cue) => {
    const renderedWords = cue.words
      .map((word, idx) => {
        const clean = escapeAssText(word.toUpperCase());
        if (idx === cue.activeIndex) {
          // Warm amber (#F59E0B -> BGR 0B9EF5) with subtle pop scale for active spoken word
          const highlightColor = cue.isEmphasis ? '&H000B9EF5&' : '&H0024BFFA&';
          return `{\\c${highlightColor}\\fscx110\\fscy110\\bord8}${clean}{\\c&H00FFFFFF&\\fscx100\\fscy100\\bord7}`;
        }
        return `{\\c&H00E8EEF5&}${clean}`;
      })
      .join(' ');

    return `Dialogue: 0,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},ShortsWord,,0,0,0,,${renderedWords}`;
  });

  return `${header.join('\n')}\n${lines.join('\n')}\n`;
}

export function validateRenderConfig(input: Partial<RenderConfig>): RenderConfig {
  const rawMusic =
    typeof input.musicVolumeDb === 'number' && Number.isFinite(input.musicVolumeDb)
      ? input.musicVolumeDb
      : DEFAULT_RENDER_CONFIG.musicVolumeDb;

  // <= -60 represents muted music, otherwise clamp to [-36, -14] dB so voice always dominates
  const musicVolumeDb = rawMusic <= -50 ? -60 : Math.max(-36, Math.min(-14, Math.round(rawMusic)));

  const transitionStyle: TransitionStyle =
    input.transitionStyle === 'smooth-zoom' ? 'smooth-zoom' : 'soft-dissolve';

  return {
    captionsEnabled:
      typeof input.captionsEnabled === 'boolean'
        ? input.captionsEnabled
        : DEFAULT_RENDER_CONFIG.captionsEnabled,
    brollEnabled:
      typeof input.brollEnabled === 'boolean'
        ? input.brollEnabled
        : DEFAULT_RENDER_CONFIG.brollEnabled,
    colorGradeEnabled:
      typeof input.colorGradeEnabled === 'boolean'
        ? input.colorGradeEnabled
        : DEFAULT_RENDER_CONFIG.colorGradeEnabled,
    sfxEnabled:
      typeof input.sfxEnabled === 'boolean'
        ? input.sfxEnabled
        : DEFAULT_RENDER_CONFIG.sfxEnabled,
    musicVolumeDb,
    transitionStyle,
  };
}

export function formatTimecode(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const tenths = Math.floor((safe - Math.floor(safe)) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}
