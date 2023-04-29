import axios from "axios";
import Whisper from "main";
import { Notice } from "obsidian";

export class AudioHandler {
	private plugin: Whisper;

	constructor(plugin: Whisper) {
		this.plugin = plugin;
	}

	async sendAudioData(blob: Blob): Promise<void> {
		new Notice(`Sending audio data size: ${blob.size / 1000} KB`);

		if (!this.plugin.settings.apiKey) {
			new Notice(
				"API key is missing. Please add your API key in the settings."
			);
			return;
		}

		const formData = new FormData();
		const fileName = `audio-${new Date().toISOString()}.webm`;
		formData.append("file", blob, fileName);
		formData.append("model", this.plugin.settings.model);
		formData.append("language", this.plugin.settings.language);

		try {
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
				return;
			}

			console.log("Audio data sent successfully:", response.data.text);

			// Create a new note with the transcribed text
			const folderPath = this.plugin.settings.templateFile
				? `${this.plugin.settings.templateFile}/`
				: "";
			const newNoteName = `${folderPath}Transcription-${new Date()
				.toISOString()
				.replace(/[:.]/g, "-")}.md`;

			await this.plugin.app.vault.create(newNoteName, response.data.text);
			await this.plugin.app.workspace.openLinkText(newNoteName, "", true);
			new Notice("Audio parsed successfully.");
		} catch (err) {
			console.error("Error sending audio data:", err);
			new Notice("Error sending audio data: " + err.message);
		}
	}
}
