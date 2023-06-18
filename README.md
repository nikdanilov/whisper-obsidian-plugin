# Speech-to-text in Obsidian using OpenAI Whisper 🗣️📝

Obsidian Whisper is a plugin that effortlessly turns your speech into written notes. Just speak your mind, and let [Whisper](https://openai.com/research/whisper) from OpenAI do the rest!

## 🚀 Getting Started

1. This plugin can be installed from "Community Plugins" inside Obsidian.
2. For this plugin to work, you will need to provide your OpenAI API key. See the Settings section of this README file for more information.

## 🎯 How to Use

### Access Recording Controls
Click on the ribbon button to open the recording controls interface.

### Record Audio
Use the "Start" button to begin recording. You can pause and resume the recording using the "Pause/Resume" button. Click the "Stop" button once you're done. After stopping the recording, the plugin will automatically transcribe the audio and create a new note with the transcribed content and linked audio file in the specified folder.

* Shortcut for Recording
As an alternative to using the recording controls interface, you can quickly start or stop recording using the `Alt + Q` shortcut.

### Upload Existing Audio File
You can also transcribe an existing audio file:
- Open the command palette with `Ctrl/Cmd + P`.
- Search for "Upload Audio File" and select it.
- A file dialog will appear. Choose the audio file you want to transcribe.
- The plugin will transcribe the selected file and create a new note with the content.

### Command Palette for Quick Actions
Both "Start/Stop recording" and "Upload Audio File" actions can also be accessed quickly through the command palette.

> For further explanation of using this plugin, check out the article ["Speech-to-text in Obsidian using OpenAI Whisper Service"](https://tfthacker.medium.com/speech-to-text-in-obsidian-using-openai-whisper-service-7b2843bf8d64) by [TfT Hacker](https://twitter.com/tfthacker)

## ⚙️ Settings

### API Key
Input your OpenAI API key to unlock the advanced transcription capabilities of the Whisper API.
- You can obtain a key from OpenAI at this [link](https://platform.openai.com/overview). If you are not familiar with the concept of an API key, you can learn more about this at this [link](https://tfthacker.medium.com/how-to-get-your-own-api-key-for-using-openai-chatgpt-in-obsidian-41b7dd71f8d3).

### API URL
Specify the endpoint that will be used to make requests to the Whisper API.
- This should not be changed unless you have a specific reason to use a different endpoint.

### Model
Choose the machine learning model to use for generating text transcriptions.
- This should not be changed unless you have a specific reason to use a different model.

### Language
Specify the language of the message being whispered.
- For a list of languages and codes, consult this [link](https://github.com/openai/whisper/blob/main/whisper/tokenizer.py).

### Save recording
Toggle this option to save the audio file after sending it to the Whisper API.
- When enabled, you can specify the path in the vault where the audio files should be saved.

### Recordings folder
Specify the path in the vault where to save the audio files.
- Example: `folder/audio`. This option is only available if "Save recording" is enabled.

### Save transcription
Toggle this option to create a new file for each recording, or leave it off to add transcriptions at your cursor.
- When enabled, you can specify the path in the vault where the transcriptions should be saved.

### Transcriptions folder
Specify the path in the vault where to save the transcription files.
- Example: `folder/note`. This option is only available if "Save transcription" is enabled.


## 🤝 Contributing

We welcome and appreciate contributions, issue reports, and feature requests from the community! Feel free to visit the [Issues](https://github.com/nikdanilov/whisper-obsidian-plugin/issues) page to share your thoughts and suggestions.

## 💬 Whisper API

-   For additional information, including limitations and pricing related to using the Whisper API, check out the [OpenAI Whisper FAQ](https://help.openai.com/en/articles/7031512-whisper-api-faq)
-   For a high-level overview of the Whisper API, check out this information from [OpenAI](https://openai.com/research/whisper)

## ⚒️ Manual Installation

If you want to install this plugin manually, use the following steps:

1. Download `manifest.json`, `main.js`, `styles.css` from the [GitHub repository](https://github.com/nikdanilov/whisper-obsidian-plugin/releases) into the `plugins/whisper` folder within your Obsidian vault.
2. Click on `Reload plugins` button inside `Settings > Community plugins`.
3. Locate the "Whisper" plugin and enable it.
4. In the plugin settings include your OpenAI API key.

## 🤩 Say Thank You

Are you finding value in this plugin? Great! You can fuel my coding sessions and share your appreciation by buying me a coffee [here](https://ko-fi.com/nikdanilov).

Help others discover the magic of the Obsidian Whisper Plugin! I'd be thrilled if you could share your experiences on Twitter, Reddit, or your preferred social media platform!

You can find me on Twitter [@nikdanilov_](https://twitter.com/nikdanilov_).

[<img style="float:left" src="https://user-images.githubusercontent.com/14358394/115450238-f39e8100-a21b-11eb-89d0-fa4b82cdbce8.png" width="200">](https://ko-fi.com/nikdanilov)

---
