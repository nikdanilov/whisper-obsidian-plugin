import { Plugin } from "obsidian";

export interface ApiKeysSettings {
	apiKey: string;
	openAiApiKey: string;
	anthropicApiKey: string;
}

export interface WhisperSettings {
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
	noteFilenameTemplate: string;
	noteTemplate: string;
}

export interface PostProcessingSettings {
	postProcessingEnabled: boolean;
	postProcessingModel: string;
	postProcessingPrompt: string;
	autoGenerateTitle: boolean;
	titleGenerationPrompt: string;
	keepOriginalTranscription: boolean;
}

export type PluginSettings = ApiKeysSettings &
	WhisperSettings &
	PostProcessingSettings;

export const DEFAULT_API_KEYS: ApiKeysSettings = {
	apiKey: "",
	openAiApiKey: "",
	anthropicApiKey: "",
};

export const DEFAULT_WHISPER: WhisperSettings = {
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
	noteFilenameTemplate: "{{date}} {{title}}",
	noteTemplate: "{{audio}}\n{{transcription}}",
};

export const DEFAULT_POST_PROCESSING: PostProcessingSettings = {
	postProcessingEnabled: false,
	postProcessingModel: "claude-haiku-4-5-20251001",
	postProcessingPrompt:
		"You are a transcription editor. Clean up the following transcription: fix grammar, remove filler words and repetitions, and improve readability. Preserve the original meaning and language. Return only the polished text, nothing else.",
	autoGenerateTitle: false,
	titleGenerationPrompt:
		"Generate a short title (1-5 words) for the following text. Return only the title, nothing else.",
	keepOriginalTranscription: false,
};

export const DEFAULT_SETTINGS: PluginSettings = {
	...DEFAULT_API_KEYS,
	...DEFAULT_WHISPER,
	...DEFAULT_POST_PROCESSING,
};

export class SettingsManager {
	private plugin: Plugin;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	async loadSettings(): Promise<PluginSettings> {
		return Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData()
		);
	}

	async saveSettings(settings: PluginSettings): Promise<void> {
		await this.plugin.saveData(settings);
	}
}
