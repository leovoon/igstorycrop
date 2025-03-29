1. Project Overview
A web app that allows users to:

Upload a video.

Preview the video in a player.

Crop the video to a 9:16 aspect ratio (Instagram Story format).

Download the cropped video.

Technologies:

Vue 3 with TypeScript.

Vite for fast development.

ShadCN/Vue for UI components.

video.js for video playback.

ffmpeg.js with Web Workers for video cropping (client-side).

Tailwind CSS (optional for styling).

2. Functional Requirements
Video Upload:

Users can upload a video file (e.g., MP4, MOV) from their device.

Video Preview:

After upload, the video should be previewed in a player using video.js.

Cropping Tool:

Users can crop the video to a fixed 9:16 aspect ratio using a crop window that they can move and resize.

Ensure the crop window has fixed proportions and the ability to adjust position.

Cropping Action:

When the user is satisfied, they can apply the crop.

Use ffmpeg.js in a Web Worker to crop the video client-side (no server processing).

Allow the user to download the cropped video.

3. Non-Functional Requirements
Performance:

Use Web Workers to offload video processing and prevent UI blocking.

Ensure smooth video playback and cropping, even for moderately large files.

Security:

Validate uploaded video file types and sizes on the client side to ensure compatibility with the app.

Usability:

User-friendly interface with clear upload, preview, crop, and download buttons.

Ensure responsiveness across different screen sizes.

No Server-Side Processing:

The entire process (uploading, previewing, cropping, and downloading) should be handled on the client side using Web Workers and ffmpeg.js.

4. User Interface Components
File Upload: Allows users to upload a video file.

Video Player: Displays the uploaded video using video.js with playback controls.

Cropper: A crop window with a 9:16 aspect ratio that users can move and resize.

Crop Action Button: A button to apply the crop and initiate the video processing via ffmpeg.js in a Web Worker.

Download Button: Allows users to download the cropped video.