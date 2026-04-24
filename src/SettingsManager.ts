import { Plugin } from "obsidian";

const SECRET_IDS: Record<keyof ApiKeysSettings, string> = {
	apiKey: "api-key",
	openAiApiKey: "openai-api-key",
	anthropicApiKey: "anthropic-api-key",
	postProcessingApiKey: "post-processing-api-key",
};

export type PostProcessingProvider = "anthropic" | "openai" | "custom";

export const PROVIDER_URLS: Record<PostProcessingProvider, string> = {
	anthropic: "https://api.anthropic.com/v1/messages",
	openai: "https://api.openai.com/v1/chat/completions",
	custom: "",
};

export const PROVIDER_DEFAULT_MODELS: Record<PostProcessingProvider, string> = {
	anthropic: "claude-haiku-4-5-20251001",
	openai: "gpt-5.4-nano-2026-03-17",
	custom: "",
};

export interface ApiKeysSettings {
	apiKey: string;
	openAiApiKey: string;
	anthropicApiKey: string;
	postProcessingApiKey: string;
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
	includeTimestamps: boolean;
}

export interface PostProcessingSettings {
	postProcessing: boolean;
	postProcessingProvider: PostProcessingProvider;
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
	postProcessingApiKey: "",
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
	saveAudioFile: true,
	audioSavePath: "",
	createNoteFile: true,
	noteSavePath: "",
	noteFilenameTemplate: "{{datetime}}",
	noteTemplate: "![[{{audioFile}}]]\n{{transcription}}",
	debugMode: false,
	includeTimestamps: false,
};

export const DEFAULT_POST_PROCESSING: PostProcessingSettings = {
	postProcessing: false,
	postProcessingProvider: "anthropic",
	postProcessingUrl: "https://api.anthropic.com/v1/messages",
	postProcessingModel: "claude-haiku-4-5-20251001",
	postProcessingPrompt:
		'You are a transcription editor. Clean up the following voice transcription: fix grammar, remove filler words (um, uh, like) and repetitions, and improve readability. Format the text in markdown. If there are action items or to-dos, format them as task lists with "[ ]". Preserve the original meaning and language. Return only the polished text, nothing else.',
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

	private get secrets() {
		return this.plugin.app.secretStorage;
	}

	private migrateKeysFromDataJson(settings: PluginSettings): boolean {
		// One-time migration: move plain-text keys out of data.json into SecretStorage.
		// Only runs for legacy installs that still have keys in data.json.
		let migrated = false;
		for (const [field, secretId] of Object.entries(SECRET_IDS)) {
			const key = field as keyof ApiKeysSettings;
			if (settings[key]) {
				this.secrets.setSecret(secretId, settings[key]);
				settings[key] = "";
				migrated = true;
			}
		}
		return migrated;
	}

	private syncKeysToSecretStorage(settings: PluginSettings): void {
		// Write current in-memory keys to SecretStorage (including empty values
		// so that clearing a field clears the stored secret) and strip them from
		// the settings object so they never land in data.json.
		for (const [field, secretId] of Object.entries(SECRET_IDS)) {
			const key = field as keyof ApiKeysSettings;
			this.secrets.setSecret(secretId, settings[key]);
			settings[key] = "";
		}
	}

	private loadKeysFromSecretStorage(settings: PluginSettings): void {
		for (const [field, secretId] of Object.entries(SECRET_IDS)) {
			const key = field as keyof ApiKeysSettings;
			settings[key] = this.secrets.getSecret(secretId) ?? "";
		}
	}

	private migratePostProcessingProvider(settings: PluginSettings): boolean {
		// Existing users without postProcessingProvider: infer from URL
		if (settings.postProcessingProvider) return false;

		for (const [provider, url] of Object.entries(PROVIDER_URLS)) {
			if (url && settings.postProcessingUrl === url) {
				settings.postProcessingProvider =
					provider as PostProcessingProvider;
				return true;
			}
		}
		if (settings.postProcessingUrl) {
			settings.postProcessingProvider = "custom";
			return true;
		}
		return false;
	}

	async loadSettings(): Promise<PluginSettings> {
		const settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData()
		);

		// Migrate provider setting for existing users
		if (this.migratePostProcessingProvider(settings)) {
			await this.plugin.saveData(settings);
		}

		// One-time migration of any plain-text keys left in data.json
		if (this.migrateKeysFromDataJson(settings)) {
			await this.plugin.saveData(settings);
		}

		// Populate in-memory settings from SecretStorage
		this.loadKeysFromSecretStorage(settings);
		return settings;
	}

	async saveSettings(settings: PluginSettings): Promise<void> {
		// Sync current keys to SecretStorage and strip them from data.json
		this.syncKeysToSecretStorage(settings);
		await this.plugin.saveData(settings);
		// Restore keys in memory so the rest of the plugin can use them
		this.loadKeysFromSecretStorage(settings);
	}
}
