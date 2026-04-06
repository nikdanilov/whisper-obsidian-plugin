# Whisper — Speech-to-text for Obsidian

Record or upload audio, transcribe with [Whisper](https://openai.com/research/whisper), and optionally polish the result with an LLM. Works on desktop and mobile.

Supports OpenAI, [Groq](https://groq.com), Azure, or any Whisper-compatible API.

## Quick Start

1. Install from **Settings → Community Plugins** → search "Whisper"
2. Add your API key in the plugin settings
3. Open a note, press `Alt + Q`, speak, press `Alt + Q` again

The transcription appears at your cursor.

## Usage

**Record** — click the mic icon in the sidebar, or press `Alt + Q` to start/stop.

**Upload** — command palette → *Upload audio file* (mp3, mp4, m4a, wav, webm, ogg).

**Right-click** — right-click any audio file in your vault → *Transcribe audio file*.

All commands can be assigned custom hotkeys in Obsidian's hotkey settings:

- Start/stop recording (`Alt + Q` by default)
- Pause/resume recording
- Open recording controls
- Upload audio file

### Automation

Trigger from iOS Shortcuts, Alfred, or any tool that can open URLs:

```
obsidian://whisper                 open controls
obsidian://whisper?command=start   start recording
obsidian://whisper?command=stop    stop and transcribe
obsidian://whisper?command=pause   pause/resume
obsidian://whisper?command=cancel  discard recording
```

## Post-Processing

Enable **Post-processing** in settings to run transcriptions through an LLM — fix grammar, remove filler words, format as markdown, extract action items.

Supports Claude, GPT, or any OpenAI-compatible endpoint (Ollama, LM Studio, etc.).

You can also enable **Auto-generate title** to create descriptive filenames for your notes.

## Note Templates

When **Create note file** is enabled, you can customize the filename and content using template variables:

| Variable | Example |
|---|---|
| `{{title}}` | `Meeting Notes` |
| `{{audioFile}}` | `recordings/2026-04-05.webm` |
| `{{transcription}}` | *the transcribed text* |
| `{{date}}` | `2026-04-05` |
| `{{time}}` | `14-30-00` |
| `{{datetime}}` | `2026-04-05 14:30:00` |

Example note template:

```
# {{title}}
![[{{audioFile}}]]

{{transcription}}
```

Use `![[{{audioFile}}]]` to embed audio (playable) or `[[{{audioFile}}]]` to link.

## Manual Installation

Download `manifest.json`, `main.js`, `styles.css` from [releases](https://github.com/nikdanilov/whisper-obsidian-plugin/releases) into `.obsidian/plugins/whisper/` in your vault.

## Contributing

Issues and PRs welcome — [GitHub Issues](https://github.com/nikdanilov/whisper-obsidian-plugin/issues)

---

[Buy me a coffee](https://ko-fi.com/nikdanilov) · [@nikdanilov\_](https://twitter.com/nikdanilov_)

[<img src="https://user-images.githubusercontent.com/14358394/115450238-f39e8100-a21b-11eb-89d0-fa4b82cdbce8.png" width="200">](https://ko-fi.com/nikdanilov)
