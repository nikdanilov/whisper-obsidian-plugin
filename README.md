# Speech-to-text in Obsidian using OpenAI Whisper 🗣️📝

Obsidian Whisper is a plugin that effortlessly turns your speech into written notes. Just speak your mind, and let  [Whisper](https://openai.com/research/whisper) from OpenAI do the rest!

## ⚙️ Installation

1. Download `manifest.json`, `main.js`, `styles.css` from the [GitHub repository](https://github.com/nikdanilov/whisper-obsidian-plugin/releases) into the `plugins/obsidian-whisper-plugin` folder within your Obsidian vault.
2. Click on `Reload plugins` button inside `Settings > Community plugins`.
3. Locate the "Whisper" plugin and enable it.
4. In the plugin settings include your OpenAI API key.

## 🎯 How to Use

1. Click on the ribbon button to access recording controls interface.
2. Use the "Record", "Pause", "Resume", and "Stop" buttons to manage your audio recordings.
3. Upon stopping a recording, the plugin will promptly transcribe the audio content and generate a new note in the specified folder.

## 🔧 Settings

- **API Key**: Input your OpenAI API key to unlock the advanced transcription capabilities of the Whisper API.
- **API URL**: Specify the endpoint that will be used to make requests to the Whisper API.
- **Model**: Choose the machine learning model to use for generating text transcriptions.
- **Language**: Select the language of the message being whispered.
- **Template File Location**: Specify the desired folder for storing your transcribed notes. If the designated folder is not found, it will be created automatically.

## 🤝 Contributing

We welcome and appreciate contributions, issue reports, and feature requests from the community! Feel free to visit the [Issues](https://github.com/nikdanilov/whisper-obsidian-plugin/issues) page to share your thoughts and suggestions.

## 📜 License

This project is licensed under the MIT License. For more details, please refer to the [LICENSE](https://github.com/nikdanilov/whisper-obsidian-plugin/blob/main/LICENSE) file.
