# Speech-to-text in Obsidian using OpenAI Whisper

Obsidian Whisper is a plugin that turns your speech into written notes. Just speak your mind, and let [Whisper](https://openai.com/research/whisper) from OpenAI do the rest!

## Getting Started

1. This plugin can be installed from "Community Plugins" inside Obsidian.
2. You will need to provide your OpenAI API key in the plugin settings. You can also use a custom API endpoint (local Whisper server, Azure, etc.) without an API key.

## How to Use

### Record Audio

Click the ribbon button or use the command palette to open recording controls. Use the **Start** button to begin, **Pause/Resume** to pause, **Stop** to finish and transcribe, or **Cancel** to discard the recording.

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

> For a walkthrough, check out ["Speech-to-text in Obsidian using OpenAI Whisper Service"](https://tfthacker.medium.com/speech-to-text-in-obsidian-using-openai-whisper-service-7b2843bf8d64) by [TfT Hacker](https://twitter.com/tfthacker)

## Settings

### API

- **API Key**: Your OpenAI API key. Not required when using a custom API endpoint. Get one from [OpenAI](https://platform.openai.com/overview).
- **API URL**: The Whisper API endpoint. Change this to use a local Whisper server (e.g. [whisper-asr-webservice](https://github.com/ahmetoner/whisper-asr-webservice)) or Azure OpenAI.
- **Model**: The Whisper model to use (default: `whisper-1`).

### Transcription

- **Language**: Language code for transcription (e.g. `en`, `ja`). Leave empty for auto-detection.
- **Prompt**: Optional words/phrases to guide transcription accuracy.
- **Temperature**: Sampling temperature (0-1). Higher values produce more varied output.
- **Response format**: Output format (`json`, `text`, `srt`, `verbose_json`, `vtt`).
- **Send cursor context**: Sends text around your cursor as context to Whisper for better accuracy.

### Recording

- **Audio input device**: Select which microphone or audio input to use.
- **Save recording**: Save the audio file after transcription.
- **Recordings folder**: Where to save audio files (e.g. `folder/audio`).

### Output

- **Save transcription**: Create a new note for each transcription.
- **Transcriptions folder**: Where to save transcription notes (e.g. `folder/notes`).
- **Paste at cursor**: Insert the transcription at your cursor position. Can be used alongside "Save transcription" for both.
- **Audio link style**: Choose between embedding the audio file (`![[file]]`, playable inline) or linking to it (`[[file]]`).
- **Ignore upload filename**: Use a timestamp-based filename instead of the original when uploading.

### Advanced

- **Debug Mode**: Increase verbosity for troubleshooting.

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
