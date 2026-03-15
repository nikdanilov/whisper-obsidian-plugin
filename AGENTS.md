# Project Guidelines

## Architecture

Obsidian plugin that records audio and transcribes it via the OpenAI Whisper API.

```
main.ts                    # Plugin entry point (`Whisper` extends Plugin)
├── src/SettingsManager.ts # Persists/loads settings via Obsidian vault API
├── src/Timer.ts           # Interval-based MM:SS timer with start/pause/reset
├── src/AudioRecorder.ts   # NativeAudioRecorder wraps MediaRecorder API
├── src/AudioHandler.ts    # Sends audio to Whisper API, handles note/file creation
├── src/Controls.ts        # Modal UI with Record/Pause/Stop buttons
├── src/StatusBar.ts       # Status bar indicator (Idle/Recording/Processing)
├── src/WhisperSettingsTab.ts # Settings UI (12 options)
├── src/constants.ts       # API defaults (URL, model, 25 MB max file size)
└── src/utils.ts           # getBaseFileName() helper
```

Components are class-based with constructor-injected settings. `AudioHandler` manually constructs multipart/form-data (not `FormData`) for compatibility with Obsidian's `requestUrl`.

## Build and Test

```sh
npm run dev       # esbuild watch mode (inline sourcemaps)
npm run build     # tsc type check + production build (minified)
npm run release   # release-it: bumps version, runs verify-and-update.mjs
```

- **Entry**: `main.ts` → **Output**: `main.js` (CommonJS, ES2018)
- `OUTPUT_PATH` env var overrides output location (for symlinking into a vault)
- Externals: `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`
- Zero runtime dependencies

## Conventions

- **Strict TypeScript** — `strict: true` in tsconfig
- **Conventional commits** — enforced via commitlint + husky (`feat:`, `fix:`, etc.)
- **Error handling** — try-catch with `new Notice()` for user-facing errors
- **State guards** — `isStopping` flag prevents double-click issues during recording stop
- **File size validation** — checked in both `main.ts` (upload) and `AudioHandler` (API call); max 25 MB per Whisper API limit
- **MIME type detection** — `MediaRecorder.isTypeSupported()` probes webm/ogg/mp3/mp4 at runtime
- **Note creation logic** — if "Save transcription" is on OR no active markdown view → new note; otherwise → insert at cursor

## Code Style

- Prettier for formatting
- ESLint for linting
- Classes: PascalCase (`AudioHandler`, `NativeAudioRecorder`)
- Methods: camelCase (`startRecording`, `sendAudioData`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE_MB`, `DEFAULT_API_URL`)

## Release Process

`verify-and-update.mjs` runs post-bump to sync `package.json` version → `manifest.json` and record the version → minAppVersion mapping in `versions.json`. All three files must stay in sync.
