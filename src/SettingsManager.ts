import { Plugin } from "obsidian";

export interface WhisperSettings {
	apiKey: string;
	apiUrl: string;
	model: string;
	prompt: string;
	language: string;
	saveAudioFile: boolean;
	saveAudioFilePath: string;
	debugMode: boolean;
	createNewFileAfterRecording: boolean;
	createNewFileAfterRecordingPath: string;
	audioDeviceId: string;
	temperature: number;
	responseFormat: string;
	sendCursorContext: boolean;
	audioLinkStyle: "embed" | "link";
	pasteAtCursor: boolean;
	ignoreUploadFilename: boolean;
	postProcessingEnabled: boolean;
	postProcessingModel: string;
	postProcessingApiKey: string;
	postProcessingPrompt: string;
	autoGenerateTitle: boolean;
	titleGenerationPrompt: string;
	keepOriginalTranscription: boolean;
}

export const DEFAULT_SETTINGS: WhisperSettings = {
	apiKey: "",
	apiUrl: "https://api.openai.com/v1/audio/transcriptions",
	model: "whisper-1",
	prompt: "",
	language: "",
	saveAudioFile: true,
	saveAudioFilePath: "",
	debugMode: false,
	createNewFileAfterRecording: true,
	createNewFileAfterRecordingPath: "",
	audioDeviceId: "default",
	temperature: 0,
	responseFormat: "json",
	sendCursorContext: false,
	audioLinkStyle: "embed",
	pasteAtCursor: false,
	ignoreUploadFilename: false,
	postProcessingEnabled: false,
	postProcessingModel: "claude-haiku-4-5-20251001",
	postProcessingApiKey: "",
	postProcessingPrompt:
		"You are a transcription editor. Clean up the following transcription: fix grammar, remove filler words and repetitions, and improve readability. Preserve the original meaning and language. Return only the polished text, nothing else.",
	autoGenerateTitle: false,
	titleGenerationPrompt:
		"Generate a short title (1-5 words) for the following text. Return only the title, nothing else.",
	keepOriginalTranscription: false,
};

export class SettingsManager {
	private plugin: Plugin;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	async loadSettings(): Promise<WhisperSettings> {
		return Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData()
		);
	}

	async saveSettings(settings: WhisperSettings): Promise<void> {
		await this.plugin.saveData(settings);
	}
}
