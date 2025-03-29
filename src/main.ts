import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Add TypeScript declarations for window extensions
declare global {
  interface Window {
    process?: {
      env?: Record<string, any>;
    };
    module?: {
      exports: Record<string, any>;
    };
  }
}

// Add CORS headers for SharedArrayBuffer support (required for FFmpeg)
// This should be configured on the server in production
if (typeof document !== 'undefined') {
  const meta = document.createElement('meta')
  meta.httpEquiv = 'Cross-Origin-Opener-Policy'
  meta.content = 'same-origin'
  document.head.appendChild(meta)

  const meta2 = document.createElement('meta')
  meta2.httpEquiv = 'Cross-Origin-Embedder-Policy'
  meta2.content = 'require-corp'
  document.head.appendChild(meta2)
}

// Set up global window properties for FFmpeg
if (typeof window !== 'undefined') {
  // Ensure required properties exist
  window.process = window.process || {}
  window.process.env = window.process.env || {}
  
  // Create a simple module implementation for FFmpeg if needed
  if (typeof window.module === 'undefined') {
    // Just a simple stub to prevent "module is not defined" errors
    window.module = { exports: {} }
  }
}

createApp(App).mount('#app')
