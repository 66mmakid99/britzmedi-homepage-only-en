/**
 * Client-side video compression using FFmpeg.wasm
 * Dynamically imports FFmpeg so it's only loaded when needed.
 */

export interface VideoOptimizeResult {
  blob: Blob;
  file: File;
  originalSize: number;
  optimizedSize: number;
  durationMs: number;
}

export type ProgressCallback = (pct: number, message: string) => void;

let ffmpegInstance: any = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { toBlobURL } = await import('@ffmpeg/util');

  const ffmpeg = new FFmpeg();

  // Load single-threaded core (most compatible)
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Compress a video file using FFmpeg.wasm.
 * Target: H.264, CRF 28, max 1280px width, 30fps, no audio, faststart.
 */
export async function optimizeVideo(
  file: File,
  onProgress?: ProgressCallback
): Promise<VideoOptimizeResult> {
  const startTime = Date.now();
  onProgress?.(0, 'Loading FFmpeg...');

  const ffmpeg = await getFFmpeg();

  // Set up progress callback
  ffmpeg.on('progress', ({ progress }: { progress: number }) => {
    const pct = Math.min(Math.round(progress * 100), 99);
    onProgress?.(pct, 'Compressing video...');
  });

  onProgress?.(5, 'Reading video file...');

  // Write input file
  const { fetchFile } = await import('@ffmpeg/util');
  await ffmpeg.writeFile('input.mp4', await fetchFile(file));

  onProgress?.(10, 'Compressing video...');

  // Run FFmpeg: H.264, CRF 28, max 1280 width, 30fps, no audio, faststart
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'medium',
    '-vf', "scale='min(1280,iw)':-2",
    '-r', '30',
    '-an',
    '-movflags', '+faststart',
    '-y', 'output.mp4',
  ]);

  onProgress?.(95, 'Reading output...');

  // Read output
  const data = await ffmpeg.readFile('output.mp4');
  const blob = new Blob([data], { type: 'video/mp4' });
  const optimizedFile = new File([blob], file.name, { type: 'video/mp4' });

  // Cleanup
  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp4');

  onProgress?.(100, 'Done!');

  return {
    blob,
    file: optimizedFile,
    originalSize: file.size,
    optimizedSize: blob.size,
    durationMs: Date.now() - startTime,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
