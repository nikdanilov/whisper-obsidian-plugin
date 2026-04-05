import axios from "axios";
import Whisper from "main";
import { Notice, MarkdownView } from "obsidian";
import { getBaseFileName, getCursorContext } from "./utils";

export class AudioHandler {
	private plugin: Whisper;

	constructor(plugin: Whisper) {
		this.plugin = plugin;
	}

	private async ensureFolderExists(folderPath: string): Promise<void> {
		if (
			folderPath &&
			!(await this.plugin.app.vault.adapter.exists(folderPath))
		) {
			await this.plugin.app.vault.createFolder(folderPath);
		}
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

		if (this.plugin.settings.debugMode) {
			new Notice(`Sending ${Math.round(blob.size / 1000)} KB...`);
		}

		const isDefaultApi = this.plugin.settings.apiUrl ===
			"https://api.openai.com/v1/audio/transcriptions";
		if (isDefaultApi && !this.plugin.settings.apiKey) {
			new Notice("Add your API key in Whisper settings");
			return;
		}

		const MIN_AUDIO_SIZE_BYTES = 1000;
		if (blob.size < MIN_AUDIO_SIZE_BYTES) {
			new Notice("Recording too short");
			return;
		}

		const formData = new FormData();
		formData.append("file", blob, fileName);
		formData.append("model", this.plugin.settings.model);
		if (
			this.plugin.settings.language &&
			this.plugin.settings.language !== "auto"
		) {
			formData.append("language", this.plugin.settings.language);
		}

		let prompt = this.plugin.settings.prompt || "";
		if (this.plugin.settings.sendCursorContext) {
			const editor =
				this.plugin.app.workspace.getActiveViewOfType(
					MarkdownView
				)?.editor;
			if (editor) {
				const context = getCursorContext(editor);
				prompt = prompt ? `${prompt}\n${context}` : context;
			}
		}
		if (prompt) formData.append("prompt", prompt);

		if (this.plugin.settings.temperature !== 0)
			formData.append(
				"temperature",
				String(this.plugin.settings.temperature)
			);
		if (this.plugin.settings.responseFormat !== "json")
			formData.append(
				"response_format",
				this.plugin.settings.responseFormat
			);

		try {
			// If the saveAudioFile setting is true, save the audio file
			if (this.plugin.settings.saveAudioFile) {
				await this.ensureFolderExists(
					this.plugin.settings.saveAudioFilePath
				);
				const arrayBuffer = await blob.arrayBuffer();
				await this.plugin.app.vault.adapter.writeBinary(
					audioFilePath,
					new Uint8Array(arrayBuffer)
				);
				// No notice for intermediate save — final "Transcription complete" covers it
			}
		} catch (err) {
			console.error("Error saving audio file:", err);
			new Notice("Couldn't save audio: " + (err instanceof Error ? err.message : String(err)));
		}

		try {
			if (this.plugin.settings.debugMode) {
				new Notice("Transcribing...");
			}
			const response = await axios.post(
				this.plugin.settings.apiUrl,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						...(this.plugin.settings.apiKey
							? { Authorization: `Bearer ${this.plugin.settings.apiKey}` }
							: {}),
					},
				}
			);

			await this.outputTranscription(
				response.data.text,
				audioFilePath,
				noteFilePath
			);
		} catch (err) {
			console.error("Error parsing audio:", err);
			new Notice("Transcription failed: " + (err instanceof Error ? err.message : String(err)));
		}
	}

	async handleTranscription(text: string): Promise<void> {
		const baseFileName = new Date()
			.toISOString()
			.replace(/[:.]/g, "-");

		const noteFilePath = `${
			this.plugin.settings.createNewFileAfterRecordingPath
				? `${this.plugin.settings.createNewFileAfterRecordingPath}/`
				: ""
		}${baseFileName}.md`;

		await this.outputTranscription(text, null, noteFilePath);
	}

	private async outputTranscription(
		text: string,
		audioFilePath: string | null,
		noteFilePath: string
	): Promise<void> {
		if (this.plugin.settings.createNewFileAfterRecording) {
			await this.ensureFolderExists(
				this.plugin.settings.createNewFileAfterRecordingPath
			);
			let noteContent = text;
			if (audioFilePath && this.plugin.settings.saveAudioFile) {
				const audioRef =
					this.plugin.settings.audioLinkStyle === "link"
						? `[[${audioFilePath}]]`
						: `![[${audioFilePath}]]`;
				noteContent = `${audioRef}\n${text}`;
			}
			await this.plugin.app.vault.create(noteFilePath, noteContent);
			await this.plugin.app.workspace.openLinkText(
				noteFilePath,
				"",
				true
			);
		}

		if (this.plugin.settings.pasteAtCursor) {
			const editor =
				this.plugin.app.workspace.getActiveViewOfType(
					MarkdownView
				)?.editor;
			if (editor) {
				const cursorPosition = editor.getCursor();
				editor.replaceRange(text, cursorPosition);

				const newPosition = {
					line: cursorPosition.line,
					ch: cursorPosition.ch + text.length,
				};
				editor.setCursor(newPosition);
			}
		}

		new Notice("Transcription complete");
	}
}
