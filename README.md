# Speech-to-text in Obsidian using OpenAI Whisper 🗣️📝

Obsidian Whisper is a plugin that effortlessly turns your speech into written notes. Just speak your mind, and let [Whisper](https://openai.com/research/whisper) from OpenAI do the rest!

## ⚙️ Installation

1. This plugin can be installed from "Community Plugins" inside Obsidian.
2. For this plugin to work, you will need to provide your OpenAI API key. See the Settings section of this README file for more information.

## 🎯 How to Use

1. Click on the ribbon button to access the recording controls interface.
2. Use the "Start", "Pause/Resume", and "Stop" buttons to manage your audio recordings.
3. Upon stopping a recording, the plugin will promptly transcribe the audio content and generate a new note in the specified folder.
4. Alternatively, use the shortcut key `Alt + Q` to start/stop recording without opening the recording controls interface.

> For further explanation of using this plugin, check out the article ["Speech-to-text in Obsidian using OpenAI Whisper Service"](https://tfthacker.medium.com/speech-to-text-in-obsidian-using-openai-whisper-service-7b2843bf8d64) by [TfT Hacker](https://twitter.com/tfthacker)

## 🔧 Settings

-   **API Key**: Input your OpenAI API key to unlock the advanced transcription capabilities of the Whisper API.
    -   You can get a key from OpenAI at this [link](https://platform.openai.com/overview). If you are not familiar with the concept of an API key, you can learn more about this at this [link](https://tfthacker.medium.com/how-to-get-your-own-api-key-for-using-openai-chatgpt-in-obsidian-41b7dd71f8d3).
-   **API URL**: Specify the endpoint that will be used to make requests to the Whisper API.
    -   Normally this should not be changed unless you understand what you are doing.
-   **Model**: Choose the machine learning model to use for generating text transcriptions.
    -   Normally this should not be changed unless you understand what you are doing.
-   **Language**: Enter the language of the message being whispered.
    -   For a list of languages and codes, consult this [link](https://github.com/openai/whisper/blob/main/whisper/tokenizer.py)
-   **Template File Location**: Specify the desired folder for storing your transcribed notes.
    -   If the designated folder is not found, it will be created automatically. Leave this field blank to have transcriptions saved to the root of the vault.

## 🤝 Contributing

We welcome and appreciate contributions, issue reports, and feature requests from the community! Feel free to visit the [Issues](https://github.com/nikdanilov/whisper-obsidian-plugin/issues) page to share your thoughts and suggestions.

## 💬 Whisper API

-   For additional information, including limitations and pricing related to using the Whisper API, check out the [OpenAI Whisper FAQ](https://help.openai.com/en/articles/7031512-whisper-api-faq)
-   For a high-level overview of the Whisper API, check out this information from [OpenAI](https://openai.com/research/whisper)

## ⚒️ Manual Installation

If you want to install this from this repository, use the following steps:

1. Download `manifest.json`, `main.js`, `styles.css` from the [GitHub repository](https://github.com/nikdanilov/whisper-obsidian-plugin/releases) into the `plugins/whisper` folder within your Obsidian vault.
2. Click on `Reload plugins` button inside `Settings > Community plugins`.
3. Locate the "Whisper" plugin and enable it.
4. In the plugin settings include your OpenAI API key.

## 📜 License

This project is licensed under the MIT License. For more details, please refer to the [LICENSE](https://github.com/nikdanilov/whisper-obsidian-plugin/blob/main/LICENSE) file.
