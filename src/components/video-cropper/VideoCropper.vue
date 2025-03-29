<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, AlertTriangle, RefreshCw } from 'lucide-vue-next'
import VideoUploader from './VideoUploader.vue'
import VideoPlayer from './VideoPlayer.vue'
import { loadFFmpeg, cropVideo, unloadFFmpeg } from '@/lib/ffmpeg'
import type { VideoCropParams, CropperState } from '@/types/video'

const { toast } = useToast()

// State management
const state = ref<CropperState>({
  videoFile: null,
  videoUrl: null,
  isCropping: false,
  isVideoLoaded: false,
  isFFmpegReady: false,
  progress: 0,
  croppedVideoUrl: null,
  error: null
})

// Check browser support
const isWebWorkerSupported = typeof Worker !== 'undefined'
const isSharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined'
const isBrowserSupported = isWebWorkerSupported && isSharedArrayBufferSupported

// Load FFmpeg on component mount
onMounted(async () => {
  if (!isBrowserSupported) {
    state.value.error = 'Your browser does not support the required features. Please use Chrome 92+, Edge 92+, Firefox 79+, or Safari 15.2+.'
    return
  }

  try {
    console.log('Starting FFmpeg initialization...')
    await loadFFmpeg(updateProgress)
    console.log('FFmpeg initialization successful!')
    state.value.isFFmpegReady = true
  } catch (error) {
    console.error('FFmpeg initialization error:', error)
    state.value.error = error instanceof Error 
      ? `Failed to load video processing engine: ${error.message}` 
      : 'Failed to load video processing engine.'
    
    toast({
      title: 'Initialization Error',
      description: 'Could not load the video processing engine. Please refresh and try again.',
      variant: 'destructive'
    })
  }
})

// Clean up resources on unmount
onUnmounted(() => {
  cleanupResources()
  unloadFFmpeg()
})

// Handle file upload
const handleFileSelected = (file: File) => {
  // Clean up previous video if it exists
  cleanupResources()
  
  state.value.videoFile = file
  state.value.videoUrl = URL.createObjectURL(file)
  state.value.isVideoLoaded = true
  state.value.error = null
}

// Handle video conversion
const handleCrop = async (params: VideoCropParams) => {
  if (!state.value.isFFmpegReady) {
    toast({
      title: 'Processing engine not ready',
      description: 'Please wait for the video processing engine to initialize',
      variant: 'destructive'
    })
    return
  }
  
  try {
    state.value.isCropping = true
    state.value.progress = 0
    state.value.error = null
    
    console.log('Starting video conversion operation...')
    const croppedBlob = await cropVideo(params)
    
    // Create URL for the converted video
    state.value.croppedVideoUrl = URL.createObjectURL(croppedBlob)
    console.log('Conversion operation completed successfully!')
    
    toast({
      title: 'Success!',
      description: 'Your video has been converted to 9:16 ratio',
      variant: 'default'
    })
  } catch (error) {
    console.error('Conversion error:', error)
    state.value.error = error instanceof Error 
      ? `Failed to convert video: ${error.message}` 
      : 'Failed to convert video. Please try again.'
    
    toast({
      title: 'Conversion failed',
      description: 'There was an error while processing your video',
      variant: 'destructive'
    })
  } finally {
    state.value.isCropping = false
  }
}

// Handle reset
const handleReset = () => {
  cleanupResources()
  state.value.videoFile = null
  state.value.videoUrl = null
  state.value.isVideoLoaded = false
  state.value.croppedVideoUrl = null
  state.value.error = null
}

// Download converted video
const downloadCroppedVideo = () => {
  if (!state.value.croppedVideoUrl) return
  
  const a = document.createElement('a')
  a.href = state.value.croppedVideoUrl
  a.download = 'instagram-story.mp4'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// Update progress
const updateProgress = (progress: number) => {
  state.value.progress = progress
}

// Clean up resources
const cleanupResources = () => {
  if (state.value.videoUrl) {
    URL.revokeObjectURL(state.value.videoUrl)
  }
  
  if (state.value.croppedVideoUrl) {
    URL.revokeObjectURL(state.value.croppedVideoUrl)
  }
}

// Force reload the app
const handleReload = () => {
  window.location.reload()
}
</script>

<template>
  <div class="w-full max-w-4xl mx-auto p-1">
    <div class="flex flex-col gap-6">
      <!-- Browser compatibility warning -->
      <div v-if="!isBrowserSupported" class="p-4 bg-destructive/10 border border-destructive rounded-md">
        <div class="flex items-start gap-3">
          <AlertTriangle class="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="font-semibold text-destructive">Browser not supported</h3>
            <p class="text-sm text-muted-foreground mt-1">
              This app requires modern browser features like SharedArrayBuffer and Web Workers.
              Please use a recent version of Chrome, Edge, Firefox, or Safari.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Upload section -->
      <div v-if="!state.videoUrl && isBrowserSupported" class="w-full">
        <VideoUploader 
          :is-loading="state.isCropping" 
          @file-selected="handleFileSelected" 
        />
      </div>
      
      <!-- Video player and conversion -->
      <div v-if="state.videoUrl && !state.croppedVideoUrl" class="w-full">
        <VideoPlayer 
          :video-url="state.videoUrl" 
          :is-processing="state.isCropping"
          @crop="handleCrop"
          @reset="handleReset"
        />
        
        <!-- Processing indicator -->
        <div v-if="state.isCropping" class="mt-6">
          <div class="text-center mb-2">
            <p class="text-sm font-medium">Processing video: {{ state.progress }}%</p>
          </div>
          <div class="w-full bg-muted rounded-full h-2.5">
            <div 
              class="bg-primary h-2.5 rounded-full" 
              :style="`width: ${state.progress}%`"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Result section -->
      <div v-if="state.croppedVideoUrl" class="w-full">
        <div class="flex flex-col items-center gap-4">
          <h3 class="text-xl font-semibold">Your 9:16 video is ready!</h3>
          
          <div class="w-full max-w-md aspect-[9/16] bg-muted rounded-lg overflow-hidden">
            <video 
              controls 
              class="w-full h-full object-cover" 
              :src="state.croppedVideoUrl"
            ></video>
          </div>
          
          <div class="flex gap-4 flex-wrap justify-center">
            <Button @click="downloadCroppedVideo" variant="default">
              <Download class="mr-2 h-4 w-4" />
              Download Video
            </Button>
            
            <Button @click="handleReset" variant="outline">
              Convert Another Video
            </Button>
          </div>
        </div>
      </div>
      
      <!-- Error message -->
      <div v-if="state.error" class="p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
        <div class="flex items-start gap-3">
          <AlertTriangle class="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p>{{ state.error }}</p>
            <Button @click="handleReload" variant="outline" class="mt-3 h-8 px-3">
              <RefreshCw class="mr-2 h-3 w-3" />
              Reload App
            </Button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading indicators -->
    <div v-if="!state.isFFmpegReady && !state.error && isBrowserSupported" class="mt-8">
      <p class="text-sm mb-3">Loading video processing engine...</p>
      <div class="space-y-2">
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </div>
    
  
    </div>
  </div>
</template>