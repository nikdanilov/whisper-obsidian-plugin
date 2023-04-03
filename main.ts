import axios from "axios";
import { Notice, Plugin } from "obsidian";
import { RecordingControls } from "src/RecordingControls";
import {
	DEFAULT_SETTINGS,
	WhisperSettings,
	WhisperSettingTab,
} from "src/WhisperSettings";

export default class Whisper extends Plugin {
	settings: WhisperSettings;
	recordingControls: RecordingControls;

	async onload() {
		await this.loadSettings();
		this.addRibbonIcon("activity", "Open recording controls", (evt) => {
			if (!this.recordingControls) {
				this.recordingControls = new RecordingControls(this);
			}
			this.recordingControls.open();
		});
		this.addSettingTab(new WhisperSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async sendAudioData(blob: Blob) {
		console.log("Audio data size:", blob.size / 1000, "KB");

		if (!this.settings.apiKey) {
			new Notice(
				"API key is missing. Please add your API key in the settings."
			);
			return;
		}

		const formData = new FormData();
		const fileName = `audio-${new Date().toISOString()}.webm`;
		formData.append("file", blob, fileName);
		formData.append("model", this.settings.model);
		formData.append("language", this.settings.language);

		try {
			const response = await axios.post(this.settings.apiUrl, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${this.settings.apiKey}`,
				},
			});

			if (response.data.error) {
				console.error("Error sending audio data:", response.data.error);
				new Notice("Error sending audio data: " + response.data.error);
				return;
			}

			console.log("Audio data sent successfully:", response.data.text);

			// Create a new note with the transcribed text
			const folderPath = this.settings.templateFile
				? `${this.settings.templateFile}/`
				: "";
			const newNoteName = `${folderPath}Transcription-${new Date()
				.toISOString()
				.replace(/[:.]/g, "-")}.md`;

			await this.app.vault.create(newNoteName, response.data.text);
			await this.app.workspace.openLinkText(newNoteName, "", true);
		} catch (err) {
			console.error("Error sending audio data:", err);
			new Notice("Error sending audio data: " + err.message);
		}
	}
}
