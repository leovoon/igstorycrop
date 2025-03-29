export interface VideoCropParams {
  /**
   * The source video file
   */
  file: File;
  
  /**
   * The start position of the crop rectangle from the left (0-1)
   */
  x: number;
  
  /**
   * The start position of the crop rectangle from the top (0-1)
   */
  y: number;
  
  /**
   * The width of the crop rectangle (0-1)
   */
  width: number;
  
  /**
   * The height of the crop rectangle (0-1)
   */
  height: number;
}

export interface CropperState {
  /**
   * The current uploaded video file
   */
  videoFile: File | null;
  
  /**
   * The object URL for the uploaded video
   */
  videoUrl: string | null;
  
  /**
   * Is the cropping process happening
   */
  isCropping: boolean;
  
  /**
   * Is the video successfully loaded
   */
  isVideoLoaded: boolean;
  
  /**
   * Is the FFmpeg ready
   */
  isFFmpegReady: boolean;
  
  /**
   * The current progress of the cropping operation (0-100)
   */
  progress: number;
  
  /**
   * The URL of the cropped video
   */
  croppedVideoUrl: string | null;
  
  /**
   * Error message if any
   */
  error: string | null;
} 