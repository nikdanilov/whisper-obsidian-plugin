import Whisper from "main";
import { App, Notice, PluginSettingTab, Setting, TFolder } from "obsidian";
import { DEFAULT_LANGUAGE, DEFAULT_MODEL, MAX_FILE_SIZE_MB } from "./constants";
import { SettingsManager } from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
	private plugin: Whisper;
	private settingsManager: SettingsManager;
	private createNewFileInput!: Setting;
	private saveAudioFileInput!: Setting;

	constructor(app: App, plugin: Whisper) {
		super(app, plugin);
		this.plugin = plugin;
		this.settingsManager = plugin.settingsManager;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		this.createHeader();
		this.createApiKeySetting();
		this.createApiUrlSetting();
		this.createModelSetting();
		this.createPromptSetting();
		this.createLanguageSetting();
		this.createSaveAudioFileToggleSetting();
		this.createSaveAudioFilePathSetting();
		this.createNewFileToggleSetting();
		this.createNewFilePathSetting();
		this.createMaxFileSizeSetting();
		this.createDebugModeToggleSetting();
	}

	private createHeader(): void {
		this.containerEl.createEl("h2", { text: "Settings for Whisper." });
	}

	private createApiKeySetting(): void {
		new Setting(this.containerEl)
			.setName("API Key")
			.setDesc("Enter your OpenAI API key")
			.addText((text) => {
				text.setPlaceholder("sk-...xxxx")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
				text.inputEl.type = "password";
			});
	}

	private createApiUrlSetting(): void {
		new Setting(this.containerEl)
			.setName("API URL")
			.setDesc(
				"Specify the endpoint that will be used to make requests to"
			)
			.addText((text) =>
				text
					.setPlaceholder("https://api.your-custom-url.com")
					.setValue(this.plugin.settings.apiUrl)
					.onChange(async (value) => {
						this.plugin.settings.apiUrl = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);
	}

	private createModelSetting(): void {
		new Setting(this.containerEl)
			.setName("Model")
			.setDesc(
				"Specify the machine learning model to use for generating text."
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_MODEL)
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);
	}

	private createPromptSetting(): void {
		new Setting(this.containerEl)
			.setName("Prompt")
			.setDesc(
				"Optional: Add words with their correct spellings to help with transcription. Make sure it matches the chosen language."
			)
			.addText((text) =>
				text
					.setPlaceholder("Example: ZyntriQix, Digique Plus, CynapseFive")
					.setValue(this.plugin.settings.prompt)
					.onChange(async (value) => {
						this.plugin.settings.prompt = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);
	}

	private createLanguageSetting(): void {
		new Setting(this.containerEl)
			.setName("Language")
			.setDesc("Specify the language of the message being whispered")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_LANGUAGE)
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);
	}

	private createSaveAudioFileToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Save recording")
			.setDesc(
				"Turn on to save the audio file after sending it to the Whisper API"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.saveAudioFile)
					.onChange(async (value) => {
						this.plugin.settings.saveAudioFile = value;
						if (!value) {
							this.plugin.settings.saveAudioFilePath = "";
						}
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
						this.saveAudioFileInput.setDisabled(!value);
					})
			);
	}

	private createSaveAudioFilePathSetting(): void {
		this.saveAudioFileInput = new Setting(this.containerEl)
			.setName("Recordings folder")
			.setDesc(
				"Specify the path in the vault where to save the audio files"
			)
			.addText((text) =>
				text
					.setPlaceholder("Example: folder/audio")
					.setValue(this.plugin.settings.saveAudioFilePath)
					.onChange(async (value) => {
						this.plugin.settings.saveAudioFilePath = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					})
			)
			.setDisabled(!this.plugin.settings.saveAudioFile);
	}

	private createNewFileToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Save transcription")
			.setDesc(
				"Turn on to create a new file for each recording, or leave off to add transcriptions at your cursor"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.createNewFileAfterRecording)
					.onChange(async (value) => {
						this.plugin.settings.createNewFileAfterRecording =
							value;
						if (!value) {
							this.plugin.settings.createNewFileAfterRecordingPath =
								"";
						}
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
						this.createNewFileInput.setDisabled(!value);
					});
			});
	}

	private createNewFilePathSetting(): void {
		this.createNewFileInput = new Setting(this.containerEl)
			.setName("Transcriptions folder")
			.setDesc(
				"Specify the path in the vault where to save the transcription files"
			)
			.addText((text) => {
				text.setPlaceholder("Example: folder/note")
					.setValue(
						this.plugin.settings.createNewFileAfterRecordingPath
					)
					.onChange(async (value) => {
						this.plugin.settings.createNewFileAfterRecordingPath =
							value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}

	private createMaxFileSizeSetting(): void {
		new Setting(this.containerEl)
			.setName("Max file size (MB)")
			.setDesc(
				`Maximum allowed recording file size in megabytes. The Whisper API limit is ${MAX_FILE_SIZE_MB} MB.`
			)
			.addText((text) =>
				text
					.setPlaceholder(String(MAX_FILE_SIZE_MB))
					.setValue(String(this.plugin.settings.maxFileSizeMB))
					.onChange(async (value) => {
						const parsed = Number(value);
						if (!isNaN(parsed) && parsed > 0 && parsed <= MAX_FILE_SIZE_MB) {
							this.plugin.settings.maxFileSizeMB = parsed;
							await this.settingsManager.saveSettings(
								this.plugin.settings
							);
						} else {
							new Notice(
								`Invalid file size. Please enter a number between 1 and ${MAX_FILE_SIZE_MB}.`
							);
						}
					})
			);
	}

	private createDebugModeToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Debug Mode")
			.setDesc(
				"Turn on to increase the plugin's verbosity for troubleshooting."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.debugMode)
					.onChange(async (value) => {
						this.plugin.settings.debugMode = value;
						this.plugin.recorder.setDebug(value);
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}
}
