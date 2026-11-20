import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  BROLL_BEATS,
  DEFAULT_RENDER_CONFIG,
  RAW_VIDEO_METADATA,
  RAW_VIDEO_PATH,
  TIMELINE_SEGMENTS,
  buildWordCaptionCues,
  compileEditedTimeline,
  validateRenderConfig,
} from './src/lib/editPlan';
import { RenderResult, renderYouTubeShort } from './server/videoRenderer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = __dirname;
const PORT = Number(process.env.PORT ?? 3000);

let activeRenderPromise: Promise<RenderResult> | null = null;
let latestMasterResult: RenderResult | null = null;

function getOrBuildMaster(): RenderResult {
  if (!latestMasterResult || !fs.existsSync(latestMasterResult.filePath)) {
    latestMasterResult = renderYouTubeShort(PROJECT_ROOT, DEFAULT_RENDER_CONFIG, false);
  }
  return latestMasterResult;
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Serve rendered shorts, B-roll clips, and raw media with byte-range streaming support
  app.use('/media', express.static(path.join(PROJECT_ROOT, 'public/media')));
  app.use('/assets', express.static(path.join(PROJECT_ROOT, 'public/assets')));
  app.use('/src/assets', express.static(path.join(PROJECT_ROOT, 'src/assets')));

  // Project payload: compiled EDL, B-roll catalog, captions, and current master MP4 metadata
  app.get('/api/project', (_req, res) => {
    try {
      const master = getOrBuildMaster();
      const timeline = compileEditedTimeline(TIMELINE_SEGMENTS);
      const captionCues = buildWordCaptionCues(timeline.keptSegments);

      res.json({
        rawVideoUrl: RAW_VIDEO_PATH,
        rawMetadata: RAW_VIDEO_METADATA,
        timeline,
        brollBeats: BROLL_BEATS,
        captionCues,
        masterRender: {
          renderId: master.renderId,
          videoUrl: master.videoUrl,
          posterUrl: master.posterUrl,
          fileSizeBytes: master.fileSizeBytes,
          durationSec: master.durationSec,
          width: master.width,
          height: master.height,
          config: master.config,
          audioMetrics: master.audioMetrics,
          renderedAt: master.renderedAt,
        },
      });
    } catch (error) {
      console.error('Failed to prepare project data:', error);
      res.status(500).json({
        error: 'Unable to prepare the edited Short master. Please retry.',
      });
    }
  });

  // Live FFmpeg custom re-render endpoint
  app.post('/api/render', async (req, res) => {
    try {
      if (activeRenderPromise) {
        res.status(409).json({ error: 'A render is already in progress. Please wait a few seconds.' });
        return;
      }

      const config = validateRenderConfig(req.body ?? {});
      const forceRebuild = Boolean(req.body?.forceRebuild);

      activeRenderPromise = Promise.resolve().then(() =>
        renderYouTubeShort(PROJECT_ROOT, config, forceRebuild),
      );
      const result = await activeRenderPromise;
      activeRenderPromise = null;

      res.json({
        renderId: result.renderId,
        videoUrl: `${result.videoUrl}?v=${Date.now()}`,
        posterUrl: `${result.posterUrl}?v=${Date.now()}`,
        fileSizeBytes: result.fileSizeBytes,
        durationSec: result.durationSec,
        width: result.width,
        height: result.height,
        config: result.config,
        audioMetrics: result.audioMetrics,
        renderedAt: result.renderedAt,
      });
    } catch (error) {
      activeRenderPromise = null;
      console.error('Custom FFmpeg render error:', error);
      res.status(500).json({
        error: 'Video render failed on server. Check FFmpeg settings and try again.',
      });
    }
  });

  // Direct MP4 attachment download endpoint
  app.get('/api/download', (req, res) => {
    try {
      const requestedId = String(req.query.renderId ?? 'master').replace(/[^a-zA-Z0-9_-]/g, '');
      const rendersDir = path.join(PROJECT_ROOT, 'public/media/renders');
      const targetPath = path.join(rendersDir, `short-${requestedId}.mp4`);

      const finalPath = fs.existsSync(targetPath) ? targetPath : getOrBuildMaster().filePath;
      const downloadName =
        requestedId === 'master'
          ? 'rafi-typing-race-youtube-short.mp4'
          : `rafi-typing-race-short-${requestedId}.mp4`;

      res.download(finalPath, downloadName);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Unable to download rendered MP4.' });
    }
  });

  // Mount Vite middleware in dev, or serve compiled dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(PROJECT_ROOT, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShortCut Studio running on http://0.0.0.0:${PORT}`);
    // Warm up master Short in background if not pre-built yet
    setImmediate(() => {
      try {
        getOrBuildMaster();
      } catch (err) {
        console.error('Startup master warmup error:', err);
      }
    });
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
