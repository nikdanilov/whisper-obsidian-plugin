import Whisper from "main";
import { Notice, MarkdownView, requestUrl } from "obsidian";
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

		if (this.plugin.settings.debugMode) {
			new Notice(`Sending audio data size: ${blob.size / 1000} KB`);
		}

		const maxSizeBytes = this.plugin.settings.maxFileSizeMB * 1024 * 1024;
		if (blob.size > maxSizeBytes) {
			new Notice(
				`Recording file size (${(blob.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed size of ${this.plugin.settings.maxFileSizeMB} MB. Please record a shorter clip.`
			);
			return;
		}

		if (!this.plugin.settings.apiKey) {
			new Notice(
				"API key is missing. Please add your API key in the settings."
			);
			return;
		}

		try {
			// If the saveAudioFile setting is true, save the audio file
			if (this.plugin.settings.saveAudioFile) {
				const arrayBuffer = await blob.arrayBuffer();
				await this.plugin.app.vault.adapter.writeBinary(
					audioFilePath,
					arrayBuffer
				);
				new Notice("Audio saved successfully.");
			}
		} catch (err) {
			console.error("Error saving audio file:", err);
			const message = err instanceof Error ? err.message : String(err);
			new Notice("Error saving audio file: " + message);
		}

		try {
			if (this.plugin.settings.debugMode) {
				new Notice("Parsing audio data: " + fileName);
			}

			const boundary = "----ObsidianWhisperBoundary" + Date.now();
			const arrayBuf = await blob.arrayBuffer();
			const uint8 = new Uint8Array(arrayBuf);

			const parts: (string | Uint8Array)[] = [];
			const addField = (name: string, value: string) => {
				parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
			};

			// File part header
			parts.push(
				`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${blob.type || "application/octet-stream"}\r\n\r\n`
			);
			parts.push(uint8);
			parts.push("\r\n");

			addField("model", this.plugin.settings.model);
			addField("language", this.plugin.settings.language);
			if (this.plugin.settings.prompt) {
				addField("prompt", this.plugin.settings.prompt);
			}
			parts.push(`--${boundary}--\r\n`);

			// Assemble body
			const encoder = new TextEncoder();
			const encoded = parts.map(p => typeof p === "string" ? encoder.encode(p) : p);
			const totalLength = encoded.reduce((sum, arr) => sum + arr.byteLength, 0);
			const body = new Uint8Array(totalLength);
			let offset = 0;
			for (const arr of encoded) {
				body.set(arr, offset);
				offset += arr.byteLength;
			}

			const response = await requestUrl({
				url: this.plugin.settings.apiUrl,
				method: "POST",
				headers: {
					"Content-Type": `multipart/form-data; boundary=${boundary}`,
					Authorization: `Bearer ${this.plugin.settings.apiKey}`,
				},
				body: body.buffer,
				throw: true,
			});

			// Determine if a new file should be created
			const activeView =
				this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			const shouldCreateNewFile =
				this.plugin.settings.createNewFileAfterRecording || !activeView;

			const transcription = response.json.text;

			if (shouldCreateNewFile) {
				const file = await this.plugin.app.vault.create(
					noteFilePath,
					`![[${audioFilePath}]]\n${transcription}`
				);
				const leaf = this.plugin.app.workspace.getLeaf(true);
				await leaf.openFile(file);
			} else {
				// Insert the transcription at the cursor position
				const editor =
					this.plugin.app.workspace.getActiveViewOfType(
						MarkdownView
					)?.editor;
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

			new Notice("Audio parsed successfully.");
		} catch (err) {
			console.error("Error parsing audio:", err);
			const message = err instanceof Error ? err.message : String(err);
			new Notice("Error parsing audio: " + message);
		}
	}
}
