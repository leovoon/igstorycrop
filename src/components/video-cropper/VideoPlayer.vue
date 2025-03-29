<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import 'video.js/dist/video-js.css'
import { Button } from '@/components/ui/button'
import { Cpu, RefreshCw, Download, Instagram } from 'lucide-vue-next'
import type { VideoCropParams } from '@/types/video'

const props = defineProps<{
  videoUrl: string
  isProcessing: boolean
}>()

const emit = defineEmits<{
  'crop': [params: VideoCropParams]
  'reset': []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const player = ref<Player | null>(null)
const videoFile = ref<File | null>(null)
const processedUrl = ref<string | null>(null)

// Initialize video.js player
const initPlayer = () => {
  if (!videoRef.value) return
  
  player.value = videojs(videoRef.value, {
    controls: true,
    fluid: true,
    preload: 'auto',
    playsinline: true,
    muted: true,
    sources: [{
      src: props.videoUrl,
      type: 'video/mp4'
    }]
  })
}

// Clean up player
const cleanupPlayer = () => {
  if (player.value) {
    player.value.dispose()
    player.value = null
  }
}

const handleCrop = () => {
  if (!props.videoUrl) return
  
  // Extract the file name from the URL
  const fileName = props.videoUrl.split('/').pop() || 'video.mp4'
  
  // Create a file object from the video URL if we don't have one
  if (!videoFile.value) {
    fetch(props.videoUrl)
      .then(response => response.blob())
      .then(blob => {
        videoFile.value = new File([blob], fileName, { type: 'video/mp4' })
        emitCropEvent()
      })
      .catch(error => {
        console.error('Error fetching video:', error)
      })
  } else {
    emitCropEvent()
  }
}

const emitCropEvent = () => {
  if (!videoFile.value) return;
  
  // We're no longer cropping, just passing the file for 9:16 conversion
  emit('crop', {
    file: videoFile.value,
    x: 0,
    y: 0,
    width: 1,
    height: 1
  });
}

const handleReset = () => {
  emit('reset')
  processedUrl.value = null
}

const handleDownload = () => {
  if (processedUrl.value) {
    const a = document.createElement('a')
    a.href = processedUrl.value
    a.download = 'instagram-story.mp4'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

// Set processed URL when video is processed
watch(() => props.videoUrl, (newUrl) => {
  if (newUrl && props.isProcessing === false) {
    processedUrl.value = newUrl
  }
})

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  cleanupPlayer()
})

// Reinitialize player if video URL changes
watch(() => props.videoUrl, (newUrl) => {
  if (newUrl) {
    cleanupPlayer()
    setTimeout(() => {
      initPlayer()
    }, 0)
  }
})
</script>

<template>
  <div class="w-full">
    <div class="relative mb-6 rounded-lg overflow-hidden shadow-xl">
      <!-- Video Player -->
      <video
        ref="videoRef"
        class="video-js vjs-big-play-centered vjs-fluid vjs-theme-insta"
      ></video>
      
      <!-- Processing overlay -->
      <div v-if="isProcessing" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
        <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-white font-medium">Processing your video...</p>
        <p class="text-white/70 text-sm mt-2">This may take a moment</p>
      </div>
    </div>
    
    <div class="flex flex-wrap gap-4 justify-center">
      <Button 
        @click="handleCrop" 
        :disabled="isProcessing" 
        variant="default"
        size="lg"
        class="relative group"
      >
        <div class="absolute inset-0 bg-primary/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
        <Cpu class="mr-2 h-5 w-5 relative z-10" />
        <span class="relative z-10">Convert to 9:16</span>
      </Button>
      
      <Button 
        @click="handleReset" 
        :disabled="isProcessing" 
        variant="outline"
        size="lg"
      >
        <RefreshCw class="mr-2 h-5 w-5" />
        Reset
      </Button>
      
      <Button 
        v-if="processedUrl"
        @click="handleDownload" 
        variant="secondary"
        size="lg"
        class="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-none"
      >
        <Download class="mr-2 h-5 w-5" />
        Download
      </Button>
      
      <Button 
        v-if="processedUrl"
        variant="secondary"
        size="lg"
        class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
      >
        <Instagram class="mr-2 h-5 w-5" />
        Share to Instagram
      </Button>
    </div>
  </div>
</template>

<style>
/* Custom video.js theme */
.vjs-theme-insta {
  --vjs-theme-primary: var(--primary);
  --vjs-theme-secondary: white;
}

.vjs-theme-insta .vjs-big-play-button {
  background-color: var(--vjs-theme-primary) !important;
  border: none !important;
  border-radius: 50% !important;
  width: 80px !important;
  height: 80px !important;
  line-height: 80px !important;
  margin-left: -40px !important;
  margin-top: -40px !important;
  transition: transform 0.3s ease !important;
}

.vjs-theme-insta .vjs-big-play-button:hover {
  transform: scale(1.1) !important;
  background-color: var(--vjs-theme-primary) !important;
}

.vjs-theme-insta .vjs-control-bar {
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent) !important;
  height: 4em !important;
  padding-bottom: 1em !important;
}

.vjs-theme-insta .vjs-button > .vjs-icon-placeholder:before {
  line-height: 2.2 !important;
}

/* Ensure the video container maintains aspect ratio */
.video-js {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Animation for processing spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1.5s linear infinite;
}
</style>