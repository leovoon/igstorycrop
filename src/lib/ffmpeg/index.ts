import type { VideoCropParams } from '@/types/video';

type ProgressCallback = (progress: number) => void;

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initializes FFmpeg by loading its WASM module through a Web Worker
 * @param onProgress Callback function for loading progress updates
 */
export const loadFFmpeg = async (onProgress: ProgressCallback): Promise<void> => {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error('FFmpeg initialization timeout');
      reject(new Error('FFmpeg initialization timed out after 60 seconds'));
      worker?.terminate();
      worker = null;
      initPromise = null;
    }, 60000); // Increased to 60 seconds

    try {
      console.log('Starting FFmpeg worker initialization...');
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        clearTimeout(timeoutId);
        reject(new Error(`Worker initialization failed: ${error.message}`));
        worker = null;
        initPromise = null;
      };
      
      worker.onmessage = (e) => {
        const { type, progress, error } = e.data;
        console.log('Worker message:', type, progress, error);
        
        switch (type) {
          case 'init-done':
            console.log('FFmpeg initialization complete');
            clearTimeout(timeoutId);
            resolve();
            break;
            
          case 'progress':
            onProgress(progress);
            break;
            
          case 'error':
            console.error('Worker reported error:', error);
            clearTimeout(timeoutId);
            reject(new Error(error));
            worker?.terminate();
            worker = null;
            initPromise = null;
            break;
        }
      };
      
      console.log('Sending init message to worker');
      worker.postMessage({ type: 'init' });
      
    } catch (error) {
      console.error('Error during worker creation:', error);
      clearTimeout(timeoutId);
      initPromise = null;
      worker = null;
      reject(error);
    }
  });
  
  return initPromise;
};

/**
 * Crops a video file based on the provided parameters
 * @param params Parameters for cropping the video
 * @returns A promise that resolves to a Blob containing the cropped video
 */
export const cropVideo = async (params: VideoCropParams): Promise<Blob> => {
  if (!worker) {
    throw new Error('FFmpeg worker not initialized. Call loadFFmpeg first.');
  }
  
  const { file, x, y, width, height } = params;
  
  // Read the file as ArrayBuffer
  const fileData = await file.arrayBuffer();
  
  // Create unique input/output names
  const timestamp = Date.now();
  const inputName = `input_${timestamp}.mp4`;
  const outputName = `output_${timestamp}.mp4`;
  
  return new Promise((resolve, reject) => {
    // We already checked worker is not null above
    const currentWorker = worker!;
    
    // Set up temporary message handler for this operation
    const messageHandler = (e: MessageEvent) => {
      const { type, result, error } = e.data;
      
      if (type === 'crop-done') {
        currentWorker.removeEventListener('message', messageHandler);
        resolve(result);
      } else if (type === 'error') {
        currentWorker.removeEventListener('message', messageHandler);
        reject(new Error(error));
      }
      // Let the main handler handle progress events
    };
    
    currentWorker.addEventListener('message', messageHandler);
    
    // Send crop command to worker
    currentWorker.postMessage({
      type: 'crop',
      payload: {
        fileData,
        x,
        y,
        width,
        height,
        inputName,
        outputName
      }
    });
  });
};

/**
 * Unloads FFmpeg and terminates the worker
 */
export const unloadFFmpeg = (): void => {
  if (worker) {
    worker.postMessage({ type: 'unload' });
    worker.terminate();
    worker = null;
  }
  
  initPromise = null;
};