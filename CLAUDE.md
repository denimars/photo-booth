# Photo Booth App — Tauri + Svelte
 
## Project Overview
 
A **desktop photo booth application** built with **Tauri v2** (Rust backend) and **SvelteKit** (frontend). Core features: camera access, photo capture, real-time filters/effects, countdown timer, photo strips, and image export to disk.
 
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Desktop Runtime | Tauri v2 |
| Frontend Framework | SvelteKit (or standalone Svelte) |
| Language (frontend) | TypeScript |
| Language (backend) | Rust |
| Styling | Tailwind CSS v4 |
| Camera API | MediaDevices Web API (`getUserMedia`) |
| Image Processing | Canvas API |
| File I/O | Tauri Plugin: `@tauri-apps/plugin-fs` |
| Dialog | Tauri Plugin: `@tauri-apps/plugin-dialog` |
| Notifications | Tauri Plugin: `@tauri-apps/plugin-notification` |
 
---
 
## Directory Structure

```
photo-booth/
├── src/                        # SvelteKit frontend
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Camera.svelte             # Main camera component
│   │   │   ├── CountdownTimer.svelte     # Countdown timer
│   │   │   ├── FilterPanel.svelte        # Filter selection panel
│   │   │   ├── PhotoStrip.svelte         # Photo strip with background
│   │   │   ├── BackgroundSelector.svelte # Background template selector
│   │   │   └── CaptureButton.svelte      # Shutter button
│   │   ├── stores/
│   │   │   ├── camera.ts              # Svelte store: camera state
│   │   │   ├── session.ts             # Svelte store: active session photos
│   │   │   └── settings.ts            # Svelte store: user preferences
│   │   ├── utils/
│   │   │   ├── canvas.ts              # Canvas API helpers + strip compositing
│   │   │   ├── filters.ts             # CSS/Canvas filter definitions
│   │   │   ├── backgrounds.ts         # Background templates definitions
│   │   │   └── export.ts              # Image export logic
│   │   └── types.ts                   # TypeScript interfaces
│   ├── routes/
│   │   ├── +layout.svelte             # Global layout
│   │   └── +page.svelte               # Main booth page (strip-only mode)
│   └── app.html
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                    # Tauri entry point
│   │   ├── lib.rs                     # Tauri app builder
│   │   └── commands/
│   │       ├── mod.rs
│   │       ├── photo.rs               # Command: save photo
│   │       └── settings.rs            # Command: read/write settings
│   ├── capabilities/
│   │   └── default.json               # Tauri permission config
│   ├── icons/                         # App icons
│   └── tauri.conf.json                # Tauri configuration
├── static/
│   ├── fonts/                         # Local fonts (Playfair Display, DM Mono)
│   ├── backgrounds/                   # Photo strip background templates (SVG)
│   │   ├── classic-film.svg
│   │   ├── elegant-white.svg
│   │   └── neon-pink.svg
│   └── sounds/
│       ├── shutter.mp3                # Shutter sound
│       └── countdown.mp3              # Countdown beep
├── package.json
├── svelte.config.js
├── vite.config.js
└── tailwind.config.js
```
 
---
 
## Core Features
 
### 1. Live Camera Preview
- Stream from webcam via `navigator.mediaDevices.getUserMedia`
- Select camera device (if multiple are available)
- Horizontal mirror/flip (selfie mode)
- Minimum resolution: 1280×720
 
### 2. Countdown Timer
- Duration: 3 / 5 / 10 seconds (user configurable)
- Large countdown animation overlaid on preview
- Tick sound each second + shutter click
 
### 3. Capture & Filters
- Capture frame to a hidden `<canvas>`
- Available filters:
  - `none` — original
  - `grayscale` — black & white
  - `sepia` — vintage
  - `vivid` — high saturation
  - `cool` — blue tone
  - `warm` — orange tone
  - `noir` — high contrast black & white
- Real-time filter preview via CSS `filter` property on the video element
- Filter applied to canvas on export
 
### 4. Photo Strip (Primary Mode)
- **Strip-only mode**: app focuses on creating photo strips
- Automatically takes 3 or 4 photos in sequence
- User selects a background template before capturing
- Available backgrounds:
  - `classic-film` — Dark film strip with sprocket holes
  - `elegant-white` — Clean white/cream with coral & teal accents
  - `neon-pink` — Vibrant coral party theme
- Photos are composited onto selected background
- Preview strip before saving
 
### 5. Save & Export
- Save photo/strip as `.jpg` or `.png`
- Use Tauri `dialog.save()` to choose save location
- Auto-generated filename: `photobooth_YYYY-MM-DD_HHmmss.jpg`
- Default folder: `~/Pictures/PhotoBooth/`
 
### 6. Session Gallery
- Display all photos taken in the current session
- Click a photo for a full-size preview
- Delete or re-export photos
 
---
 
## UI Design / Aesthetic

**Theme**: Soft & Elegant photo booth — warm neutral background, dusty rose & sage accents, refined typography.

```
Colors:
  --bg-primary:       #FAFAF8   /* warm off-white */
  --bg-surface:       #FFFFFF   /* white */
  --accent-primary:   #D4A59A   /* dusty rose */
  --accent-secondary: #88AEA4   /* muted sage teal */
  --text-primary:     #3D3D3D   /* soft charcoal */
  --text-muted:       #9E9E9E   /* medium gray */
  --border:           #EBEBEB   /* soft gray */

Fonts:
  Display: "Playfair Display" (serif, bold)
  Body/UI: "DM Mono" (monospace)

Layout:
  - Full-screen camera in the center
  - Background selector + filters + settings on the right sidebar
  - Photo strip preview on the left sidebar
  - Capture button at the bottom center
  - Countdown overlay on top of the video feed
```
 
---
 
## Svelte Component Specifications
 
### `Camera.svelte`
```svelte
<!-- Props -->
let mirror: boolean = true
let selectedFilter: string = 'none'
let deviceId: string | null = null
 
<!-- Events -->
on:captured  // emit { dataUrl: string, timestamp: number }
on:error     // emit Error
```
 
### `CountdownTimer.svelte`
```svelte
<!-- Props -->
let duration: number = 3   // seconds
let autoStart: boolean = false
 
<!-- Events -->
on:tick     // emit remaining seconds
on:complete // emit when reaching 0
```
 
### `FilterPanel.svelte`
```svelte
<!-- Props -->
let selected: string = 'none'
let videoEl: HTMLVideoElement  // for live filter thumbnail preview
 
<!-- Events -->
on:change  // emit filter name
```
 
### `PhotoStrip.svelte`
```svelte
<!-- Props -->
let photos: string[]           // array of dataUrls
let backgroundId: BackgroundId // selected background template
let requiredCount: number = 4  // photos needed for strip

<!-- Events -->
on:save    // emit final canvas dataUrl
on:discard
```

### `BackgroundSelector.svelte`
```svelte
<!-- Props -->
let selected: BackgroundId = 'classic-film'

<!-- Events -->
on:change  // emit BackgroundId
```
 
---
 
## Tauri Commands (Rust)
 
### `save_photo`
```rust
// Input: base64 image data, file path
// Output: full path of the saved file
#[tauri::command]
async fn save_photo(
    app: AppHandle,
    data: String,        // base64 PNG/JPG
    filename: String,
    directory: Option<String>
) -> Result<String, String>
```
 
### `get_settings` / `save_settings`
```rust
// Read/write settings to a JSON file in the app data directory
#[tauri::command]
async fn get_settings(app: AppHandle) -> Result<Settings, String>
 
#[tauri::command]
async fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String>
 
#[derive(Serialize, Deserialize)]
struct Settings {
    countdown_duration: u8,
    default_filter: String,
    save_directory: String,
    strip_count: u8,
    mirror: bool,
    sound_enabled: bool,
}
```
 
---
 
## `tauri.conf.json` — Key Configuration
 
```json
{
  "app": {
    "windows": [
      {
        "title": "Photo Booth",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 650,
        "resizable": true,
        "decorations": true
      }
    ]
  },
  "plugins": {
    "fs": {
      "scope": {
        "allow": ["$PICTURE/**", "$APPDATA/**"],
        "deny": []
      }
    },
    "dialog": {},
    "notification": {}
  }
}
```
 
---
 
## `capabilities/default.json` — Permissions
 
```json
{
  "identifier": "default",
  "description": "Photo Booth default permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-create-dir",
    "dialog:allow-save",
    "dialog:allow-open",
    "notification:allow-notify"
  ]
}
```
 
---
 
## Main User Flow
 
```
App opens
  └─> Request camera permission (browser API)
      └─> [Permission granted]
          ├─> Display live video preview
          ├─> User selects a filter (optional)
          ├─> User clicks Capture / Start Strip button
          │   └─> Countdown timer starts (3..2..1)
          │       └─> Capture frame to canvas
          │           └─> [Strip mode?]
          │               ├─> Yes: repeat N times, combine into strip
          │               └─> No: immediately show photo preview
          │
          ├─> Photo/strip preview appears
          │   ├─> Save (dialog to choose location)
          │   ├─> Retake (discard, return to preview)
          │   └─> Add to session gallery
          │
          └─> Session gallery displays all photos from this session
```
 
---
 
## Setup & Development
 
```bash
# Install dependencies
npm install
 
# Run dev mode (Tauri + Vite HMR)
npm run tauri dev
 
# Production build
npm run tauri build
 
# Add Tauri plugins
cargo add tauri-plugin-fs
cargo add tauri-plugin-dialog
cargo add tauri-plugin-notification
```
 
### Minimal `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```
 
---
 
## Implementation Notes
 
1. **Camera access** only works over HTTPS or `localhost` — the Tauri dev server handles this automatically.
2. **Canvas capture**: use `ctx.drawImage(videoEl, 0, 0)` then `canvas.toDataURL('image/jpeg', 0.92)`.
3. **Mirror on canvas**: apply `ctx.scale(-1, 1)` + `ctx.translate(-width, 0)` before drawImage.
4. **Filter on canvas**: set `ctx.filter = 'grayscale(100%)'` before drawImage — same string as CSS filter.
5. **Shutter sound**: preload an audio element and call `.play()` at capture time for zero latency.
6. **Strip layout**: create a new canvas with height = (photo_height × n) + padding, then draw each photo sequentially.
7. **Save file**: convert `dataUrl` → base64 string → send to Tauri command → Rust decodes base64 → writes to disk.
 
---
 
## Future Enhancements (Optional)
 
- [ ] Green screen / background replacement (ML via WebGL)
- [ ] QR code on strip for easy sharing
- [ ] Printer support via Tauri shell command
- [ ] Decorative frame overlays
- [ ] Short GIF video recording (3 seconds)
- [ ] Multi-monitor: fullscreen mode for a second display
- [ ] Switchable UI themes (retro, modern, minimal)