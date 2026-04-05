# Speech-to-text in Obsidian using OpenAI Whisper

Obsidian Whisper is a plugin that turns your speech into written notes. Just speak your mind, and let Whisper do the rest!

## Getting Started

1. This plugin can be installed from "Community Plugins" inside Obsidian.
2. You will need to provide your Whisper API key in the plugin settings. You can also use a custom API endpoint (local Whisper server, Groq, Azure, etc.) without an API key.

## How to Use

### Record Audio

Click the ribbon button or use the command palette to open recording controls. Use the **Start** button to begin, **Pause/Resume** to pause, **Stop** to finish and transcribe, or **Cancel** to discard the recording.

Transcriptions are always pasted at your cursor position in the active note.

> You can quickly start or stop recording using the `Alt + Q` shortcut.

### Upload Existing Audio or Video File

Open the command palette with `Ctrl/Cmd + P`, search for **Upload Audio File**, and select an audio or video file (mp3, mp4, m4a, wav, webm, ogg) to transcribe.

### Transcribe from File Menu

Right-click any audio file in your vault and select **Transcribe audio file** to transcribe it directly.

### Command Palette

All recording actions are available as commands and can be assigned custom hotkeys:

- **Start/stop recording** (`Alt + Q`)
- **Pause/resume recording**
- **Open recording controls**
- **Upload audio file**

### URI Handler

Trigger Whisper from iOS Shortcuts, Alfred, or any external tool:

- `obsidian://whisper` — open recording controls
- `obsidian://whisper?command=start` — start recording
- `obsidian://whisper?command=stop` — stop and transcribe
- `obsidian://whisper?command=pause` — pause/resume
- `obsidian://whisper?command=cancel` — discard recording

> For a walkthrough, check out ["Speech-to-text in Obsidian using OpenAI Whisper Service"](https://tfthacker.medium.com/speech-to-text-in-obsidian-using-openai-whisper-service-7b2843bf8d64) by [TfT Hacker](https://twitter.com/tfthacker)

## Settings

### API Keys

- **Whisper API Key**: API key for Whisper transcription (OpenAI, Groq, or Azure).
- **OpenAI API Key**: API key for GPT post-processing models.
- **Anthropic API Key**: API key for Claude post-processing models.

### Whisper Settings

- **API URL**: The Whisper API endpoint. Change this to use Groq (`https://api.groq.com/openai/v1/audio/transcriptions`), a local server (e.g. [whisper-asr-webservice](https://github.com/ahmetoner/whisper-asr-webservice)), or Azure OpenAI.
- **Model**: The transcription model (e.g. `whisper-1` for OpenAI, `whisper-large-v3` for Groq).
- **Language**: Language code (e.g. `en`, `ja`). Leave empty for auto-detection.
- **Prompt**: Optional words/phrases to guide transcription accuracy.
- **Temperature**: Sampling temperature (0-1). Higher values produce more varied output.
- **Response format**: Output format (`json`, `text`, `srt`, `verbose_json`, `vtt`).
- **Cursor context**: Send text around your cursor as context to Whisper for better accuracy.
- **Microphone**: Select which audio input device to use.
- **Save audio file**: Save the audio recording to the vault.
- **Audio save path**: Folder for saved audio files (e.g. `recordings`).
- **Create note file**: Create a new note for each transcription.
- **Note save path**: Folder for transcription notes (e.g. `notes`).
- **Note filename template**: Template for note filenames (default: `{{datetime}}`).
- **Note template**: Template for note content (default: `![[{{audioFile}}]]\n{{transcription}}`).
- **Debug mode**: Increase verbosity for troubleshooting.

#### Template Variables

Use these placeholders in filename and note templates:

| Variable | Description | Example |
|---|---|---|
| `{{date}}` | Date | `2026-04-05` |
| `{{time}}` | Time | `14-30-00` |
| `{{datetime}}` | Date and time | `2026-04-05 14:30:00` |
| `{{title}}` | Auto-generated title (or filename) | `Meeting Notes` |
| `{{transcription}}` | The transcription text | |
| `{{audioFile}}` | Audio file path | `recordings/rec.webm` |

To embed audio in a note, use `![[{{audioFile}}]]`. To link without embedding, use `[[{{audioFile}}]]`.

### Post-Processing Settings

Use an LLM to clean up transcriptions — fix grammar, remove filler words, format as markdown.

- **Post-processing**: Enable/disable LLM post-processing.
- **Post-processing API URL**: Endpoint for post-processing requests. Default: `https://api.anthropic.com/v1/messages`. Change to `https://api.openai.com/v1/chat/completions` for GPT models, or point to Ollama/other providers.
- **Post-processing model**: Model ID (e.g. `claude-haiku-4-5-20251001`, `gpt-4.1-nano`). The request format is detected from the model name — models starting with `claude` use the Anthropic API format, all others use the OpenAI format.
- **Post-processing prompt**: Instructions for the LLM on how to clean up the transcription.
- **Auto-generate title**: Use the LLM to generate a descriptive filename for notes.
- **Title generation prompt**: Instructions for generating the title.
- **Keep original transcription**: Append the raw Whisper transcription below the polished text.

## Whisper API

- [OpenAI Whisper FAQ](https://help.openai.com/en/articles/7031512-whisper-api-faq) — limitations, pricing, and usage details
- [OpenAI Whisper overview](https://openai.com/research/whisper) — high-level information

## Manual Installation

1. Download `manifest.json`, `main.js`, `styles.css` from the [GitHub releases](https://github.com/nikdanilov/whisper-obsidian-plugin/releases) into `plugins/whisper` in your Obsidian vault.
2. Go to `Settings > Community plugins` and click `Reload plugins`.
3. Enable the "Whisper" plugin.
4. Configure your API key (or custom API URL) in the plugin settings.

## Contributing

Contributions, issue reports, and feature requests are welcome! Visit the [Issues](https://github.com/nikdanilov/whisper-obsidian-plugin/issues) page.

## Say Thank You

If you find this plugin useful, you can [buy me a coffee](https://ko-fi.com/nikdanilov) or share your experience on social media.

Find me on Twitter [@nikdanilov\_](https://twitter.com/nikdanilov_).

[<img style="float:left" src="https://user-images.githubusercontent.com/14358394/115450238-f39e8100-a21b-11eb-89d0-fa4b82cdbce8.png" width="200">](https://ko-fi.com/nikdanilov)

---
