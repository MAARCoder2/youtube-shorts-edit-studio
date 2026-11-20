import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const FONT_MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf';

function resolveFont(preferred: string): string {
  if (fs.existsSync(preferred)) return preferred;
  return FONT_BOLD;
}

function runFfmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], {
    stdio: 'pipe',
    maxBuffer: 25 * 1024 * 1024,
  });
}

/**
 * B-Roll #1: Cinematic vertical campus typing lab photo with gentle Ken Burns
 * slow zoom-in, measured contrast scrim, and crisp subtle label.
 */
function renderCampusBoredClip(imagePath: string, outMp4: string): void {
  const dur = 5.4;
  const frames = Math.round(dur * 30);
  const fontBold = resolveFont(FONT_BOLD);
  const filter = [
    `scale=1400:-1:flags=lanczos`,
    `zoompan=z='min(1.0 + 0.09*on/${frames},1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`,
    `eq=contrast=1.08:saturation=0.86:brightness=-0.03`,
    `drawbox=x=0:y=0:w=1080:h=340:color=0x0B0E14@0.55:t=fill`,
    `drawbox=x=0:y=1300:w=1080:h=620:color=0x0B0E14@0.68:t=fill`,
    `drawbox=x=86:y=190:w=476:h=58:color=0x0B0E14@0.82:t=fill`,
    `drawbox=x=86:y=190:w=476:h=58:color=0xF59E0B@0.72:t=2`,
    `drawtext=fontfile='${fontBold}':text='CAMPUS TYPING PRACTICE':x=114:y=207:fontsize=26:fontcolor=0xF8FAFC`,
    `format=yuv420p`,
  ].join(',');

  runFfmpeg([
    '-loop',
    '1',
    '-i',
    imagePath,
    '-t',
    String(dur),
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-an',
    outMp4,
  ]);
}

/**
 * B-Roll #2: Pure animated 1080x1920 Typing Car-Race Game UI.
 * Uses FFmpeg overlay streams with real timestamp expressions so all 3 cars
 * accelerate smoothly across their lanes in sync with live WPM progress.
 */
function renderTypingRaceClip(outMp4: string, thumbPng: string): void {
  const dur = 5.0;
  const fontBold = resolveFont(FONT_BOLD);
  const fontMono = resolveFont(FONT_MONO);
  const fontReg = resolveFont(FONT_REG);

  const bgFilter = [
    // Sleek studio race dashboard card
    `drawbox=x=56:y=200:w=968:h=1040:color=0x111723@0.98:t=fill`,
    `drawbox=x=56:y=200:w=968:h=1040:color=0x263248@1.0:t=3`,
    // Header
    `drawbox=x=56:y=200:w=968:h=104:color=0x161E2E@1.0:t=fill`,
    `drawtext=fontfile='${fontBold}':text='TYPE RACER  -  CAMPUS RACE':x=100:y=238:fontsize=34:fontcolor=0xF8FAFC`,
    `drawtext=fontfile='${fontMono}':text='LIVE':x=894:y=242:fontsize=28:fontcolor=0xF59E0B`,
    // Metric cards (WPM + Accuracy)
    `drawbox=x=96:y=340:w=424:h=136:color=0x0B0E14@1.0:t=fill`,
    `drawbox=x=96:y=340:w=424:h=136:color=0x232F44@1.0:t=2`,
    `drawtext=fontfile='${fontReg}':text='TYPING SPEED':x=128:y=364:fontsize=24:fontcolor=0x94A3B8`,
    `drawtext=fontfile='${fontMono}':text='%{eif\\:62+min(34,t*7.2)\\:d} WPM':x=128:y=404:fontsize=46:fontcolor=0xF59E0B`,
    `drawbox=x=560:y=340:w=424:h=136:color=0x0B0E14@1.0:t=fill`,
    `drawbox=x=560:y=340:w=424:h=136:color=0x232F44@1.0:t=2`,
    `drawtext=fontfile='${fontReg}':text='ACCURACY':x=592:y=364:fontsize=24:fontcolor=0x94A3B8`,
    `drawtext=fontfile='${fontMono}':expansion=none:text='99.2%':x=592:y=404:fontsize=46:fontcolor=0x22C55E`,

    // Lane 1: RAFI
    `drawtext=fontfile='${fontBold}':text='01  RAFI (YOU)':x=100:y=520:fontsize=28:fontcolor=0xF8FAFC`,
    `drawbox=x=96:y=564:w=888:h=76:color=0x0B0E14@1.0:t=fill`,
    `drawbox=x=96:y=564:w=888:h=76:color=0x232F44@1.0:t=2`,
    `drawbox=x=942:y=566:w=14:h=72:color=0xF8FAFC@0.45:t=fill`,

    // Lane 2: FIROZ
    `drawtext=fontfile='${fontBold}':text='02  FIROZ':x=100:y=680:fontsize=28:fontcolor=0xCBD5E1`,
    `drawbox=x=96:y=724:w=888:h=76:color=0x0B0E14@1.0:t=fill`,
    `drawbox=x=96:y=724:w=888:h=76:color=0x232F44@1.0:t=2`,
    `drawbox=x=942:y=726:w=14:h=72:color=0xF8FAFC@0.35:t=fill`,

    // Lane 3: MIRAZ
    `drawtext=fontfile='${fontBold}':text='03  MIRAZ':x=100:y=840:fontsize=28:fontcolor=0xCBD5E1`,
    `drawbox=x=96:y=884:w=888:h=76:color=0x0B0E14@1.0:t=fill`,
    `drawbox=x=96:y=884:w=888:h=76:color=0x232F44@1.0:t=2`,
    `drawbox=x=942:y=886:w=14:h=72:color=0xF8FAFC@0.35:t=fill`,

    // Prompt bar
    `drawbox=x=96:y=1010:w=888:h=186:color=0x0B0E14@1.0:t=fill`,
    `drawbox=x=96:y=1010:w=888:h=186:color=0xF59E0B@0.75:t=2`,
    `drawtext=fontfile='${fontReg}':text='ACTIVE PROMPT':x=128:y=1036:fontsize=22:fontcolor=0x94A3B8`,
    `drawtext=fontfile='${fontMono}':text='type fast and accurate':x=128:y=1082:fontsize=38:fontcolor=0x22C55E`,
    `drawtext=fontfile='${fontMono}':text='to push your car ahead_':x=128:y=1132:fontsize=38:fontcolor=0xF8FAFC`,
  ].join(',');

  // Sleek car sprites overlaid with genuine real-time timestamp `t` motion
  const filterComplex = [
    `[0:v]${bgFilter}[bg]`,
    `[1:v]drawbox=x=24:y=10:w=52:h=36:color=0x0B0E14@0.85:t=fill,drawtext=fontfile='${fontMono}':text='>>':x=34:y=16:fontsize=22:fontcolor=0xF59E0B[car1]`,
    `[2:v]drawbox=x=24:y=10:w=52:h=36:color=0x0B0E14@0.85:t=fill,drawtext=fontfile='${fontMono}':text='>>':x=34:y=16:fontsize=22:fontcolor=0x60A5FA[car2]`,
    `[3:v]drawbox=x=24:y=10:w=52:h=36:color=0x0B0E14@0.85:t=fill,drawtext=fontfile='${fontMono}':text='>>':x=34:y=16:fontsize=22:fontcolor=0x34D399[car3]`,
    `[bg][car1]overlay=x='110+min(700,t*155)':y=574[m1]`,
    `[m1][car2]overlay=x='110+min(610,t*130)':y=734[m2]`,
    `[m2][car3]overlay=x='110+min(535,t*112)':y=894,format=yuv420p[vout]`,
  ].join(';');

  runFfmpeg([
    '-f',
    'lavfi',
    '-i',
    `color=c=0x090C12:s=1080x1920:r=30:d=${dur}`,
    '-f',
    'lavfi',
    '-i',
    `color=c=0xF59E0B:s=124x56:r=30:d=${dur}`,
    '-f',
    'lavfi',
    '-i',
    `color=c=0x3B82F6:s=124x56:r=30:d=${dur}`,
    '-f',
    'lavfi',
    '-i',
    `color=c=0x10B981:s=124x56:r=30:d=${dur}`,
    '-filter_complex',
    filterComplex,
    '-map',
    '[vout]',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-an',
    outMp4,
  ]);

  // Extract sharp mid-race thumbnail frame for UI preview
  runFfmpeg(['-ss', '2.5', '-i', outMp4, '-vframes', '1', '-q:v', '2', thumbPng]);
}

/**
 * B-Roll #3: Hybrid cinematic desk planning shot + animated 3-step AI build blueprint
 * revealing steps sequentially while Rafi explains planning + AI breakdown.
 */
function renderAiStepsClip(imagePath: string, outMp4: string): void {
  const dur = 4.8;
  const frames = Math.round(dur * 30);
  const fontBold = resolveFont(FONT_BOLD);
  const fontMono = resolveFont(FONT_MONO);
  const fontReg = resolveFont(FONT_REG);

  const filter = [
    `scale=1400:-1:flags=lanczos`,
    `zoompan=z='min(1.0 + 0.08*on/${frames},1.09)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`,
    `eq=contrast=1.08:brightness=-0.04:saturation=1.05`,
    `drawbox=x=0:y=0:w=1080:h=1920:color=0x0B0E14@0.42:t=fill`,
    // Blueprint card anchored cleanly above captions safe zone
    `drawbox=x=78:y=220:w=924:h=590:color=0x0F1522@0.90:t=fill`,
    `drawbox=x=78:y=220:w=924:h=590:color=0x2B374E@1.0:t=2`,
    `drawtext=fontfile='${fontBold}':text='PLAN TO BUILD ROADMAP':x=122:y=266:fontsize=34:fontcolor=0xF59E0B`,
    `drawbox=x=122:y=324:w=836:h=2:color=0x263248@1.0:t=fill`,

    // Step 1 appears immediately
    `drawbox=x=122:y=356:w=836:h=118:color=0x162033@0.95:t=fill:enable='gte(t,0.2)'`,
    `drawtext=fontfile='${fontMono}':text='01':x=154:y=396:fontsize=36:fontcolor=0xF59E0B:enable='gte(t,0.2)'`,
    `drawtext=fontfile='${fontBold}':text='Track Typing Speed & Accuracy':x=236:y=386:fontsize=32:fontcolor=0xF8FAFC:enable='gte(t,0.2)'`,
    `drawtext=fontfile='${fontReg}':text='Measure real-time WPM and clean keystrokes':x=236:y=428:fontsize=24:fontcolor=0x94A3B8:enable='gte(t,0.2)'`,

    // Step 2 reveals at 1.2s
    `drawbox=x=122:y=500:w=836:h=118:color=0x162033@0.95:t=fill:enable='gte(t,1.2)'`,
    `drawtext=fontfile='${fontMono}':text='02':x=154:y=540:fontsize=36:fontcolor=0x3B82F6:enable='gte(t,1.2)'`,
    `drawtext=fontfile='${fontBold}':text='Map Speed to Car Movement':x=236:y=530:fontsize=32:fontcolor=0xF8FAFC:enable='gte(t,1.2)'`,
    `drawtext=fontfile='${fontReg}':text='Faster accurate typing accelerates your lane':x=236:y=572:fontsize=24:fontcolor=0x94A3B8:enable='gte(t,1.2)'`,

    // Step 3 reveals at 2.3s
    `drawbox=x=122:y=644:w=836:h=118:color=0x162033@0.95:t=fill:enable='gte(t,2.3)'`,
    `drawtext=fontfile='${fontMono}':text='03':x=154:y=684:fontsize=36:fontcolor=0x22C55E:enable='gte(t,2.3)'`,
    `drawtext=fontfile='${fontBold}':text='Launch Live Class Races':x=236:y=674:fontsize=32:fontcolor=0xF8FAFC:enable='gte(t,2.3)'`,
    `drawtext=fontfile='${fontReg}':text='Instant leaderboard turns practice into play':x=236:y=716:fontsize=24:fontcolor=0x94A3B8:enable='gte(t,2.3)'`,

    // Bottom contrast scrim for captions
    `drawbox=x=0:y=1260:w=1080:h=660:color=0x0B0E14@0.68:t=fill`,
    `format=yuv420p`,
  ].join(',');

  runFfmpeg([
    '-loop',
    '1',
    '-i',
    imagePath,
    '-t',
    String(dur),
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-an',
    outMp4,
  ]);
}

/**
 * B-Roll #4: Whole class competing in campus computer lab + animated live leaderboard card.
 */
function renderClassRacingClip(imagePath: string, outMp4: string): void {
  const dur = 5.4;
  const frames = Math.round(dur * 30);
  const fontBold = resolveFont(FONT_BOLD);
  const fontMono = resolveFont(FONT_MONO);

  const filter = [
    `scale=1400:-1:flags=lanczos`,
    `zoompan=z='min(1.0 + 0.10*on/${frames},1.11)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`,
    `eq=contrast=1.08:saturation=1.12:brightness=0.01`,
    `drawbox=x=0:y=0:w=1080:h=460:color=0x0B0E14@0.55:t=fill`,
    `drawbox=x=0:y=1280:w=1080:h=640:color=0x0B0E14@0.72:t=fill`,
    // Compact top standings overlay card
    `drawbox=x=86:y=168:w=908:h=264:color=0x0F1522@0.88:t=fill:enable='gte(t,0.35)'`,
    `drawbox=x=86:y=168:w=908:h=264:color=0xF59E0B@0.70:t=2:enable='gte(t,0.35)'`,
    `drawtext=fontfile='${fontBold}':text='CLASS RACE LEADERBOARD':x=122:y=198:fontsize=28:fontcolor=0xF59E0B:enable='gte(t,0.35)'`,
    `drawtext=fontfile='${fontMono}':text='1ST   RAYHAN       96 WPM':x=122:y=252:fontsize=30:fontcolor=0xF8FAFC:enable='gte(t,0.65)'`,
    `drawtext=fontfile='${fontMono}':text='2ND   FIROZ        91 WPM':x=122:y=302:fontsize=30:fontcolor=0xCBD5E1:enable='gte(t,1.05)'`,
    `drawtext=fontfile='${fontMono}':text='3RD   MIRAZ        88 WPM':x=122:y=352:fontsize=30:fontcolor=0x94A3B8:enable='gte(t,1.45)'`,
    `format=yuv420p`,
  ].join(',');

  runFfmpeg([
    '-loop',
    '1',
    '-i',
    imagePath,
    '-t',
    String(dur),
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-an',
    outMp4,
  ]);
}

export interface RenderedBrollPaths {
  broll_campus_bored: string;
  broll_typing_race: string;
  broll_ai_steps: string;
  broll_class_racing: string;
}

export function ensureBrollClips(projectRoot: string, mediaDir: string): RenderedBrollPaths {
  const brollDir = path.join(mediaDir, 'broll');
  fs.mkdirSync(brollDir, { recursive: true });

  const paths: RenderedBrollPaths = {
    broll_campus_bored: path.join(brollDir, 'broll_campus_bored.mp4'),
    broll_typing_race: path.join(brollDir, 'broll_typing_race.mp4'),
    broll_ai_steps: path.join(brollDir, 'broll_ai_steps.mp4'),
    broll_class_racing: path.join(brollDir, 'broll_class_racing.mp4'),
  };

  const thumbPath = path.join(brollDir, 'broll_typing_race_thumb.png');

  if (!fs.existsSync(paths.broll_campus_bored)) {
    renderCampusBoredClip(
      path.join(projectRoot, 'src/assets/images/broll_campus_bored_1795179705355.jpg'),
      paths.broll_campus_bored,
    );
  }
  if (!fs.existsSync(paths.broll_typing_race) || !fs.existsSync(thumbPath)) {
    renderTypingRaceClip(paths.broll_typing_race, thumbPath);
  }
  if (!fs.existsSync(paths.broll_ai_steps)) {
    renderAiStepsClip(
      path.join(projectRoot, 'src/assets/images/broll_ai_planning_1795179705634.jpg'),
      paths.broll_ai_steps,
    );
  }
  if (!fs.existsSync(paths.broll_class_racing)) {
    renderClassRacingClip(
      path.join(projectRoot, 'src/assets/images/broll_class_racing_1795179706782.jpg'),
      paths.broll_class_racing,
    );
  }

  return paths;
}
