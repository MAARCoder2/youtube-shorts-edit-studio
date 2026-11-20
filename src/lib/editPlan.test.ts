import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BROLL_BEATS,
  DEFAULT_RENDER_CONFIG,
  TIMELINE_SEGMENTS,
  buildWordCaptionCues,
  compileEditedTimeline,
  findActiveBroll,
  formatAssTimestamp,
  formatTimecode,
  generateAssSubtitles,
  mapEditedToRawTime,
  mapRawToEditedTime,
  validateRenderConfig,
} from './editPlan';

test('compileEditedTimeline compacts raw 86.8s footage into a punchy 44-48s Short', () => {
  const summary = compileEditedTimeline(TIMELINE_SEGMENTS);
  assert.equal(summary.rawDurationSec, 86.8);
  assert.ok(
    summary.editedDurationSec >= 44 && summary.editedDurationSec <= 48,
    `Expected edited duration in 44..48s, got ${summary.editedDurationSec}`,
  );
  assert.ok(summary.timeRemovedSec > 38, 'Should remove >38s of retakes and dead air');
  assert.equal(summary.retakeCount, 5, 'Should identify all 5 retakes/distractions');
  assert.ok(summary.fillerGapCount >= 18, 'Should identify all trimmed dead-air gaps');
  assert.equal(summary.keptSegments.length, 23);
});

test('raw segments are contiguous and monotonically increasing without overlaps', () => {
  for (let i = 0; i < TIMELINE_SEGMENTS.length; i += 1) {
    const seg = TIMELINE_SEGMENTS[i];
    assert.ok(seg.rawEnd > seg.rawStart, `Segment ${seg.id} must have positive duration`);
    if (i > 0) {
      assert.equal(
        seg.rawStart,
        TIMELINE_SEGMENTS[i - 1].rawEnd,
        `Segment ${seg.id} must start cleanly where ${TIMELINE_SEGMENTS[i - 1].id} ends`,
      );
    }
  }
});

test('mapEditedToRawTime and mapRawToEditedTime stay consistent across kept clips', () => {
  const summary = compileEditedTimeline(TIMELINE_SEGMENTS);
  // First word at edited 0.0 -> raw 1.05
  assert.equal(mapEditedToRawTime(0, summary.keptSegments), 1.05);
  // Cut retake region (e.g. 60.0s double stammer) maps to null in edited timeline
  assert.equal(mapRawToEditedTime(60.0, summary.keptSegments), null);
  // Kept punchline ("And the result was still mine.") at raw 83.0 maps inside edited bounds
  const editedPunchline = mapRawToEditedTime(83.0, summary.keptSegments);
  assert.ok(editedPunchline !== null && editedPunchline > 43.0 && editedPunchline < 46.0);
});

test('all B-roll beats fall strictly inside the compiled Short duration', () => {
  const summary = compileEditedTimeline(TIMELINE_SEGMENTS);
  for (const beat of BROLL_BEATS) {
    assert.ok(beat.editedStart >= 0, `${beat.id} start >= 0`);
    assert.ok(beat.editedEnd < summary.editedDurationSec, `${beat.id} end < edited duration`);
    assert.ok(beat.editedEnd > beat.editedStart + 2.0, `${beat.id} has readable hold duration`);
  }
  assert.equal(findActiveBroll(14.5)?.id, 'broll_typing_race');
  assert.equal(findActiveBroll(1.2), null);
});

test('buildWordCaptionCues and generateAssSubtitles produce valid timed ASS events', () => {
  const summary = compileEditedTimeline(TIMELINE_SEGMENTS);
  const cues = buildWordCaptionCues(summary.keptSegments);
  assert.ok(cues.length > 70, `Expected word-level cues, got ${cues.length}`);
  for (const cue of cues) {
    assert.ok(cue.endSec > cue.startSec, `Cue ${cue.id} must have positive duration`);
    assert.ok(cue.activeIndex >= 0 && cue.activeIndex < cue.words.length);
  }
  const ass = generateAssSubtitles(cues);
  assert.ok(ass.includes('PlayResX: 1080'));
  assert.ok(ass.includes('PlayResY: 1920'));
  assert.ok(ass.includes('Dialogue: 0,'));
  assert.equal(formatAssTimestamp(65.43), '0:01:05.43');
  assert.equal(formatTimecode(45.67), '00:45.6');
});

test('validateRenderConfig clamps music dB safely and preserves defaults', () => {
  const defaults = validateRenderConfig({});
  assert.deepEqual(defaults, DEFAULT_RENDER_CONFIG);

  const clampedLoud = validateRenderConfig({ musicVolumeDb: -2 });
  assert.equal(clampedLoud.musicVolumeDb, -14);

  const muted = validateRenderConfig({ musicVolumeDb: -60 });
  assert.equal(muted.musicVolumeDb, -60);

  const zoom = validateRenderConfig({ transitionStyle: 'smooth-zoom', captionsEnabled: false });
  assert.equal(zoom.transitionStyle, 'smooth-zoom');
  assert.equal(zoom.captionsEnabled, false);
});
