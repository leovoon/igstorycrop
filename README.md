# Instagram Story Video Cropper

A web application that allows users to upload video and fit it to Instagram Story format (9:16 aspect ratio). The entire processing happens client-side using FFmpeg.js with Web Workers.

## Features

- **Video Upload:** Upload video files (MP4, WebM, MOV, AVI)
- **Video Preview:** Preview videos with playback controls
- **Crop Tool:** Crop videos to 9:16 aspect ratio with an interactive crop window
- **Client-side Processing:** All video processing happens in the browser using FFmpeg.js
- **Download:** Download the cropped video ready for Instagram Stories

## Tech Stack

- Vue 3 with TypeScript
- Vite for fast development
- ShadCN/Vue for UI components
- video.js for video playback
- FFmpeg.js with Web Workers for video processing
- Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/insta-story-crop.git
cd insta-story-crop

# Install dependencies
bun install

# Start the development server
bun run dev
```

The app will be available at http://localhost:5173

## How to Use

1. **Upload a Video:** Drag and drop a video file or use the file picker
2. **Preview and Adjust:** Preview your video and adjust the crop window
3. **Crop:** Click the "Crop to 9:16" button to process the video
4. **Download:** Once processing is complete, download your cropped video

## Browser Compatibility

This app requires modern browser features:
- SharedArrayBuffer support (Chrome 92+, Edge 92+, Firefox 79+, Safari 15.2+)
- WebAssembly
- Web Workers

## Build for Production

```bash
# Build the app for production
bun run build

# Preview the production build
bun run preview
```

## License

MIT
