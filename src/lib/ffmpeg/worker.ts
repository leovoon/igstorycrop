import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

// Worker message handling
self.onmessage = async (e) => {
  const { type, payload } = e.data;
  
  // Add warmup flag to skip initialization if already done
  if (type === 'init' && ffmpeg) {
    self.postMessage({ type: 'init-done' });
    return;
  }
  console.log(`[Worker] Received message: ${type}`);

  try {
    switch (type) {
      case 'init':
        console.log('[Worker] Starting FFmpeg initialization...');
        await initFFmpeg();
        console.log('[Worker] FFmpeg initialization complete, sending init-done');
        self.postMessage({ type: 'init-done' });
        break;

      case 'crop':
        if (!ffmpeg) {
          throw new Error('FFmpeg not initialized');
        }
        const result = await cropVideo(payload);
        self.postMessage({ type: 'crop-done', result });
        break;

      case 'unload':
        unloadFFmpeg();
        self.postMessage({ type: 'unload-done' });
        break;

      default:
        throw new Error(`Unknown command: ${type}`);
    }
  } catch (error) {
    console.error('[Worker] Error:', error);
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Initialize FFmpeg
async function initFFmpeg() {
  try {
    console.log('[Worker] Creating new FFmpeg instance');
    // Create new FFmpeg instance
    ffmpeg = new FFmpeg();

    // Log progress to main thread
    // Add this at the start of the worker file
    const performance = self.performance || Date;
    let lastProgressTime = 0;

    // Modify progress handler
    ffmpeg.on('progress', ({ progress }) => {
      const now = performance.now();
      if (now - lastProgressTime > 100) { // Throttle to 10 updates/sec max
        self.postMessage({
          type: 'progress',
          progress: Math.round(progress * 100)
        });
        lastProgressTime = now;
      }
    });

    console.log('[Worker] Setting up FFmpeg logger');
    // Add logger to help debug
    ffmpeg.on('log', ({ message }) => {
      console.log(`[FFmpeg] ${message}`);
    });

    console.log('[Worker] Preparing to load FFmpeg WASM files');

    try {
      // Try direct loading first (uses bundled version)
      console.log('[Worker] Trying direct loading approach');
      await ffmpeg.load();
      console.log('[Worker] FFmpeg loaded successfully via direct loading');
      return ffmpeg;
    } catch (directError) {
      console.error('[Worker] Direct loading failed:', directError);

      // If direct loading fails, try with local files
      try {
        console.log('[Worker] Trying with local files from node_modules');

        // Import from local node_modules
        const coreURL = await toBlobURL(
          new URL('/node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js', self.location.origin).href,
          'text/javascript'
        );

        const wasmURL = await toBlobURL(
          new URL('/node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm', self.location.origin).href,
          'application/wasm'
        );

        console.log('[Worker] Local files prepared, loading FFmpeg...');

        await ffmpeg.load({
          coreURL,
          wasmURL,
        });

        console.log('[Worker] FFmpeg loaded successfully via local files');
        return ffmpeg;
      } catch (localError) {
        console.error('[Worker] Local files approach failed:', localError);

        // Final fallback to CDN
        console.log('[Worker] Falling back to CDN approach');

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
        console.log(`[Worker] Attempting to load from: ${baseURL}`);

        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

        console.log('[Worker] CDN files fetched, loading FFmpeg...');

        await ffmpeg.load({
          coreURL,
          wasmURL,
        });

        console.log('[Worker] FFmpeg loaded successfully via CDN');
        return ffmpeg;
      }
    }
  } catch (error) {
    console.error('[Worker] Error initializing FFmpeg:', error);
    throw error;
  }
}

// Crop video function
async function cropVideo(params: {
  fileData: ArrayBuffer;
  x: number;
  y: number;
  width: number;
  height: number;
  inputName: string;
  outputName: string;
}) {
  if (!ffmpeg) throw new Error('FFmpeg not initialized');

  // Use direct buffer transfer instead of copying
  const inputBuffer = new Uint8Array(params.fileData);
  const { inputName, outputName } = params;

  await ffmpeg.writeFile(inputName, inputBuffer);
  
  try {
    // Pre-scale optimization with error handling
    // console.log('[Worker] Starting pre-scale optimization');
    // await ffmpeg.writeFile(inputName, new Uint8Array(params.fileData));  // Ensure input exists
    // await ffmpeg.exec([
    //   '-i', inputName,
    //   '-vf', 'scale=720:-2',
    //   '-c:v', 'libx264',
    //   '-preset', 'ultrafast',
    //   '-crf', '28',
    //   '-threads', '2',
    //   '-fps_mode', 'auto',  // Changed from 0 to 'auto'
    //   '-y',
    //   'prescaled.mp4'
    // ]);

    // Verify pre-scale completed
    // const prescaledFile = await ffmpeg.readFile('prescaled.mp4');  // Correct method name
    // if (!prescaledFile) {
    //   throw new Error('Pre-scale operation failed - no output file');
    // }

    try {
      console.log(`[Worker] Running optimized 9:16 conversion`);
      await ffmpeg.exec([
        '-i', inputName,
        '-vf', `scale=720:-2,` + `pad=720:1280:(ow-iw)/2:(oh-ih)/2:black`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',  // Better quality than ultrafast with minimal speed impact
        '-crf', '23',  // Better quality (23 is good for social media)
        '-threads', '0',  // Let FFmpeg automatically determine optimal thread count
        '-x264-params', 'no-scenecut=1:rc-lookahead=10:ref=3:no-deblock=0',  // Balanced quality/speed
        '-fps_mode', 'auto',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        '-vsync', '0',
        '-tune', 'fastdecode',  // Optimize for playback speed
        '-cpu-used', '0',  // Maximum CPU utilization
        '-y',
        outputName
      ]);

      console.log(`[Worker] Crop completed, reading output file`);
      const data = await ffmpeg.readFile(outputName);
      
      // Add validation check
      if (!(data instanceof Uint8Array) || data.length === 0) {
        throw new Error('Output video file is empty or invalid');
      }
      
       return new Blob([data as Uint8Array], { type: 'video/mp4' });
    } catch (mainError) {
      console.error('[Worker] Main approach failed:', mainError);
      
      // Updated fallback command
      // await ffmpeg.exec([
      //   '-i', 'prescaled.mp4',
      //   '-vf', 'scale=720:1280',
      //   '-c:v', 'libx264',
      //   '-preset', 'ultrafast',
      //   '-crf', '28',
      //   '-threads', '2',
      //   '-fps_mode', 'auto',  // Changed from 0 to 'auto'
      //   '-c:a', 'copy',
      //   '-y',
      //   outputName
      // ]);
      // console.log(`[Worker] Crop completed, reading output file`);
      // const data = await ffmpeg.readFile(outputName);
      // return new Blob([data as Uint8Array], { type: 'video/mp4' });
    }

  } catch (error) {
    console.error('[Worker] Error processing video:', error);
    throw error;
  } finally {
    console.log(`[Worker] Cleaning up temporary files`);

    if (ffmpeg) {
      // Batch delete operations
      await Promise.allSettled(
        [inputName, outputName].map(file => 
          ffmpeg!.deleteFile(file).catch(e =>
            console.warn(`[Worker] Error deleting ${file}:`, e)
          )
        )
      );
    }
  }
}

// Unload FFmpeg
function unloadFFmpeg() {
  if (ffmpeg) {
    try {
      ffmpeg.terminate();
      ffmpeg = null;
    } catch (error) {
      console.error('Error terminating FFmpeg:', error);
    }
  }
}