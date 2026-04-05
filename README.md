# Whisper — Speech-to-text for Obsidian

Record or upload audio, transcribe it with [Whisper](https://openai.com/research/whisper), and paste the text at your cursor. Optionally clean up transcriptions with an LLM.

## Getting Started

1. Install from **Community Plugins** in Obsidian.
2. Add your Whisper API key in settings (OpenAI, [Groq](https://groq.com), or Azure).
3. Open a note, press `Alt + Q`, speak, press `Alt + Q` again — done.

## Usage

**Record**: Click the mic icon in the sidebar or use the command palette. Text is pasted at your cursor.

**Upload**: Command palette → **Upload audio file** → select a file (mp3, mp4, m4a, wav, webm, ogg).

**Right-click**: Right-click any audio file in your vault → **Transcribe audio file**.

**Commands** (assignable to hotkeys):

| Command | Default |
|---|---|
| Start/stop recording | `Alt + Q` |
| Pause/resume recording | — |
| Open recording controls | — |
| Upload audio file | — |

**URI handler** for iOS Shortcuts, Alfred, etc.:

```
obsidian://whisper                    → open controls
obsidian://whisper?command=start      → start recording
obsidian://whisper?command=stop       → stop and transcribe
obsidian://whisper?command=pause      → pause/resume
obsidian://whisper?command=cancel     → discard
```

## Post-Processing

Enable **Post-processing** in settings to clean up transcriptions with an LLM — fix grammar, remove filler words, format as markdown. Supports Claude and GPT models, or any OpenAI-compatible endpoint (Ollama, etc.).

You can also enable **Auto-generate title** to create descriptive note filenames.

## Note Templates

When **Create note file** is enabled, you can customize the filename and content with templates.

**Filename template** (default: `{{datetime}}`):
```
{{date}} {{title}}
```

**Note template** (default: `![[{{audioFile}}]]\n{{transcription}}`):
```
# {{title}}
![[{{audioFile}}]]
{{transcription}}
```

Available variables: `{{date}}`, `{{time}}`, `{{datetime}}`, `{{title}}`, `{{transcription}}`, `{{audioFile}}`

Use `![[{{audioFile}}]]` to embed audio (playable) or `[[{{audioFile}}]]` to link.

## Installation

**Community Plugins** (recommended): Search for "Whisper" in Obsidian settings.

**Manual**: Download `manifest.json`, `main.js`, `styles.css` from [releases](https://github.com/nikdanilov/whisper-obsidian-plugin/releases) into `.obsidian/plugins/whisper/` in your vault.

## Contributing

Issues and PRs welcome — [github.com/nikdanilov/whisper-obsidian-plugin/issues](https://github.com/nikdanilov/whisper-obsidian-plugin/issues)

## Support

[Buy me a coffee](https://ko-fi.com/nikdanilov) · Twitter [@nikdanilov\_](https://twitter.com/nikdanilov_)

[<img src="https://user-images.githubusercontent.com/14358394/115450238-f39e8100-a21b-11eb-89d0-fa4b82cdbce8.png" width="200">](https://ko-fi.com/nikdanilov)
