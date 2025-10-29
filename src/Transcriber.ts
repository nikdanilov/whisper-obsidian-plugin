import axios from "axios";
import Whisper from "main";
import { Notice, MarkdownView } from "obsidian";
import { getBaseFileName } from "./utils";

export class Transcriber {
	private plugin: Whisper;

	constructor(plugin: Whisper) {
		this.plugin = plugin;
	}

	async transcribeAndSaveResults(
		audio: Blob,
		audioFileName: string
	): Promise<void> {
		if (!this.plugin.settings.apiKey) {
			new Notice(
				"API key is missing. Please add your API key in the settings."
			);
			return;
		}

		if (this.plugin.settings.debugMode) {
			new Notice(`Sending audio data size: ${audio.size / 1000} KB`);
		}

		const audioFilePath = this.getDirPathForAudio() + audioFileName;

		if (this.plugin.settings.saveAudioFile) {
			await this.saveAudioFile(audio, audioFilePath);
		}

		try {
			if (this.plugin.settings.debugMode) {
				new Notice("Parsing audio data:" + audioFileName);
			}
			const transcription = await this.transcribe(audio, audioFileName);

			if (this.shouldCreateNewFile()) {
				// Get the base file name without extension
				const baseFileName = getBaseFileName(audioFileName);

				const noteFilePath =
					this.getDirPathForNewTranscriptionNotes() +
					baseFileName +
					".md";

				await this.saveTranscriptionToNewNote(
					transcription,
					noteFilePath,
					audioFilePath
				);
				await this.openNoteFile(noteFilePath);
			} else {
				this.pasteTranscriptionAtCursor(transcription);
			}

			new Notice("Audio parsed successfully.");
		} catch (err) {
			console.error("Error parsing audio:", err);
			new Notice("Error parsing audio: " + err.message);
		}
	}

	private getDirPathForAudio(): string {
		return this.plugin.settings.saveAudioFilePath
			? `${this.plugin.settings.saveAudioFilePath}/`
			: "";
	}

	private getDirPathForNewTranscriptionNotes(): string {
		return this.plugin.settings.createNewFileAfterRecordingPath
			? `${this.plugin.settings.createNewFileAfterRecordingPath}/`
			: "";
	}

	private async saveAudioFile(
		blob: Blob,
		audioFilePath: string
	): Promise<void> {
		try {
			const arrayBuffer = await blob.arrayBuffer();
			await this.plugin.app.vault.adapter.writeBinary(
				audioFilePath,
				arrayBuffer
			);
			new Notice("Audio saved successfully.");
		} catch (err) {
			console.error("Error saving audio file:", err);
			new Notice("Error saving audio file: " + err.message);
		}
	}

	private async transcribe(blob: Blob, fileName: string): Promise<string> {
		const formData = new FormData();
		formData.append("file", blob, fileName);
		formData.append("model", this.plugin.settings.model);
		formData.append("language", this.plugin.settings.language);
		if (this.plugin.settings.prompt)
			formData.append("prompt", this.plugin.settings.prompt);

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

		return response.data.text;
	}

	private shouldCreateNewFile(): boolean {
		const activeView =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		return this.plugin.settings.createNewFileAfterRecording || !activeView;
	}

	private async saveTranscriptionToNewNote(
		transcription: string,
		noteFilePath: string,
		audioFilePath: string
	): Promise<void> {
		await this.plugin.app.vault.create(
			noteFilePath,
			`![[${audioFilePath}]]\n${transcription}`
		);
	}

	private async openNoteFile(noteFilePath: string): Promise<void> {
		await this.plugin.app.workspace.openLinkText(noteFilePath, "", true);
	}

	private async pasteTranscriptionAtCursor(
		transcription: string
	): Promise<void> {
		const editor =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (editor) {
			const cursorPosition = editor.getCursor();
			editor.replaceRange(transcription, cursorPosition);

			// Move the cursor to the end of the inserted text
			const newPosition = {
				line: cursorPosition.line,
				ch: cursorPosition.ch + transcription.length,
			};
			editor.setCursor(newPosition);
		}
	}
}
