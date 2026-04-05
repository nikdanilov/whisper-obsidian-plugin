import { Plugin } from "obsidian";

export interface ApiKeysSettings {
	apiKey: string;
	openAiApiKey: string;
	anthropicApiKey: string;
}

export interface WhisperSettings {
	// API
	apiUrl: string;
	model: string;
	language: string;
	prompt: string;
	temperature: number;
	responseFormat: string;
	cursorContext: boolean;
	// Recording
	audioDeviceId: string;
	saveAudioFile: boolean;
	audioSavePath: string;
	// Output
	createNoteFile: boolean;
	noteSavePath: string;
	noteFilenameTemplate: string;
	noteTemplate: string;
	// Advanced
	debugMode: boolean;
}

export interface PostProcessingSettings {
	postProcessing: boolean;
	postProcessingUrl: string;
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
	language: "",
	prompt: "",
	temperature: 0,
	responseFormat: "json",
	cursorContext: false,
	audioDeviceId: "default",
	saveAudioFile: false,
	audioSavePath: "",
	createNoteFile: false,
	noteSavePath: "",
	noteFilenameTemplate: "{{datetime}}",
	noteTemplate: "![[{{audioFile}}]]\n{{transcription}}",
	debugMode: false,
};

export const DEFAULT_POST_PROCESSING: PostProcessingSettings = {
	postProcessing: false,
	postProcessingUrl: "https://api.anthropic.com/v1/messages",
	postProcessingModel: "claude-haiku-4-5-20251001",
	postProcessingPrompt:
		"You are a transcription editor. Clean up the following voice transcription: fix grammar, remove filler words (um, uh, like) and repetitions, and improve readability. Format the text in markdown. If there are action items or to-dos, format them as task lists with \"[ ]\". Preserve the original meaning and language. Return only the polished text, nothing else.",
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
