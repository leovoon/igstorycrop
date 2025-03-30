<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Upload, UploadCloud, FileVideo, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  isLoading?: boolean
}>()

const emit = defineEmits<{
  'file-selected': [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const errorMessage = ref('')

const acceptedFormats = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo'
]

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  const file = input.files[0]
  validateAndProcessFile(file)
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  if (!event.dataTransfer?.files.length) return
  
  const file = event.dataTransfer.files[0]
  validateAndProcessFile(file)
}

const validateAndProcessFile = (file: File) => {
  errorMessage.value = ''
  
  // Check if file type is supported
  if (!acceptedFormats.includes(file.type)) {
    errorMessage.value = 'Unsupported file format. Please upload MP4, WebM, MOV, or AVI.'
    return
  }
  
  // Check file size (100MB limit)
  if (file.size > 100 * 1024 * 1024) {
    errorMessage.value = 'File is too large. Maximum size is 100MB.'
    return
  }
  
  emit('file-selected', file)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const containerClasses = computed(() => {
  return {
    'border-primary': isDragging,
    'bg-primary/5': isDragging,
    'scale-[1.01]': isDragging,
    'shadow-lg': isDragging
  }
})
</script>

<template>
  <div 
    class="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 sm:p-10 transition-all duration-200 bg-card/50 scale-100 hover:bg-card/80"
    :class="containerClasses"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleFileDrop"
  >
    <input 
      ref="fileInput"
      type="file"
      class="hidden"
      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
      @change="handleFileSelect"
    />
    
    <div class="flex flex-col items-center gap-5 text-center">
      <div class="p-5 bg-primary/10 rounded-full shadow-inner animate-pulse-slow">
        <UploadCloud class="h-12 w-12 text-primary" />
      </div>
      
      <div class="space-y-2">
        <h3 class="text-xl font-semibold">Upload your video</h3>
        <p class="text-sm text-muted-foreground max-w-md">
          Drag and drop your video file here or click the button below to browse
        </p>
        <div class="flex items-center justify-center gap-2 mt-2">
          <FileVideo class="h-4 w-4 text-muted-foreground" />
          <p class="text-xs text-muted-foreground">
            Supports MP4, WebM, MOV, AVI (max 100MB)
          </p>
        </div>
      </div>
      
      <Button 
        @click="triggerFileInput" 
        :disabled="props.isLoading"
        variant="default"
        size="lg"
        class="mt-2 font-medium relative overflow-hidden group"
      >
        <div class="absolute inset-0 w-3 bg-primary/20 skew-x-[20deg] group-hover:w-full group-hover:skew-x-0 transition-all duration-500"></div>
        <Upload class="mr-2 h-4 w-4 relative z-10" />
        <span class="relative z-10">Select video</span>
      </Button>
      
      <div v-if="errorMessage" class="flex items-center gap-2 text-sm text-destructive mt-2 p-3 bg-destructive/10 rounded-lg">
        <AlertCircle class="h-4 w-4" />
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
</style>