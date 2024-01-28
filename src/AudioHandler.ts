import axios from "axios";
import Whisper from "main";
import { Notice, MarkdownView } from "obsidian";
import { getBaseFileName } from "./utils";

export class AudioHandler {
	private plugin: Whisper;

	constructor(plugin: Whisper) {
		this.plugin = plugin;
	}

	async sendAudioData(blob: Blob, fileName: string): Promise<void> {
		// Get the base file name without extension
		const baseFileName = getBaseFileName(fileName);

		const audioFilePath = `${
			this.plugin.settings.saveAudioFilePath
				? `${this.plugin.settings.saveAudioFilePath}/`
				: ""
		}${fileName}`;

		const noteFilePath = `${
			this.plugin.settings.createNewFileAfterRecordingPath
				? `${this.plugin.settings.createNewFileAfterRecordingPath}/`
				: ""
		}${baseFileName}.md`;

		new Notice(`Sending audio data size: ${blob.size / 1000} KB`);

		if (!this.plugin.settings.apiKey) {
			new Notice(
				"API key is missing. Please add your API key in the settings."
			);
			return;
		}

		const formData = new FormData();
		formData.append("file", blob, fileName);
		formData.append("model", this.plugin.settings.model);
		formData.append("language", this.plugin.settings.language);

		try {
			// If the saveAudioFile setting is true, save the audio file
			if (this.plugin.settings.saveAudioFile) {
				const arrayBuffer = await blob.arrayBuffer();
				await this.plugin.app.vault.adapter.writeBinary(
					audioFilePath,
					new Uint8Array(arrayBuffer)
				);
				console.log("write to ", audioFilePath);
			}
			new Notice("Sending audio data:" + fileName);
			const response = await axios.post(
				this.plugin.settings.apiUrl,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${this.plugin.settings.apiKey}`,
					},
				}
			);

			if (response.data.error) {
				console.error("Error sending audio data:", response.data.error);
				new Notice("Error sending audio data: " + response.data.error);
			}

			console.log("Audio data sent successfully:", response.data.text);
		} catch (err) {
			console.error("Error sending audio data:", err);
			new Notice("Error sending audio data: " + err.message);
		}

		try {
			// Determine if a new file should be created
			const activeView =
				this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			const shouldCreateNewFile =
				this.plugin.settings.createNewFileAfterRecording || !activeView;

			if (shouldCreateNewFile) {
				await this.plugin.app.vault.create(
					noteFilePath,
					`![[${audioFilePath}]]\n${response.data.text}`
				);
				await this.plugin.app.workspace.openLinkText(
					noteFilePath,
					"",
					true
				);
			} else {
				// Insert the transcription at the cursor position
				const editor =
					this.plugin.app.workspace.getActiveViewOfType(
						MarkdownView
					)?.editor;
				if (editor) {
					const cursorPosition = editor.getCursor();
					editor.replaceRange(response.data.text, cursorPosition);

					// Move the cursor to the end of the inserted text
					const newPosition = {
						line: cursorPosition.line,
						ch: cursorPosition.ch + response.data.text.length,
					};
					editor.setCursor(newPosition);
				}
			}

			new Notice("Audio parsed successfully.");
		} catch (err) {
			console.error("Error sending audio data:", err);
			new Notice("Error sending audio data: " + err.message);
		}
	}
}
