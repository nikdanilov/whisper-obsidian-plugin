import Whisper from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import {
	SettingsManager,
	PostProcessingProvider,
	PROVIDER_URLS,
	PROVIDER_DEFAULT_MODELS,
} from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
	private plugin: Whisper;
	private settingsManager: SettingsManager;

	constructor(app: App, plugin: Whisper) {
		super(app, plugin);
		this.plugin = plugin;
		this.settingsManager = plugin.settingsManager;
	}

	display(): void {
		const { containerEl } = this;
		const scrollTop = containerEl.scrollTop;

		containerEl.empty();

		// --- API Keys ---
		new Setting(containerEl).setName("API Keys").setHeading();
		this.createWhisperApiKeySetting();
		this.createOpenAiApiKeySetting();
		this.createAnthropicApiKeySetting();

		// --- Transcription ---
		new Setting(containerEl).setName("Transcription").setHeading();
		this.createApiUrlSetting();
		this.createModelSetting();
		this.createLanguageSetting();
		this.createPromptSetting();
		this.createSendCursorContextSetting();
		this.createTemperatureSetting();
		this.createResponseFormatSetting();

		// --- Recording ---
		new Setting(containerEl).setName("Recording").setHeading();
		// async — populates device dropdown after enumeration completes
		void this.createAudioDeviceSetting();
		this.createSaveAudioFileToggleSetting();
		if (this.plugin.settings.saveAudioFile) {
			this.createSaveAudioFilePathSetting();
			this.createDeleteAudioAfterTranscriptionSetting();
		}

		// --- Output ---
		new Setting(containerEl).setName("Output").setHeading();
		this.createNewFileToggleSetting();
		if (this.plugin.settings.createNoteFile) {
			this.createNewFilePathSetting();
			this.createNoteFilenameTemplateSetting();
			this.createNoteTemplateSetting();
		}

		// --- Post-Processing ---
		new Setting(containerEl).setName("Post-processing").setHeading();
		this.createPostProcessingToggleSetting();
		if (this.plugin.settings.postProcessing) {
			this.createPostProcessingProviderSetting();
			this.createPostProcessingUrlSetting();
			this.createPostProcessingApiKeySetting();
			this.createPostProcessingModelSetting();
			this.createPostProcessingPromptSetting();
			this.createAutoGenerateTitleSetting();
			this.createTitleGenerationPromptSetting();
			this.createKeepOriginalTranscriptionSetting();
		}

		// --- Advanced ---
		new Setting(containerEl).setName("Advanced").setHeading();
		this.createDebugModeToggleSetting();

		// Restore scroll position after re-render to prevent jumping
		containerEl.scrollTop = scrollTop;
	}

	private async save(): Promise<void> {
		await this.settingsManager.saveSettings(this.plugin.settings);
	}

	private createTextSetting(
		name: string,
		desc: string,
		placeholder: string,
		value: string,
		onChange: (value: string) => Promise<void>
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(desc)
			.addText((text) =>
				text
					.setPlaceholder(placeholder)
					.setValue(value)
					.onChange(async (value) => await onChange(value))
			);
	}

	private createApiKeySetting(
		name: string,
		desc: string,
		placeholder: string,
		value: string,
		onChange: (value: string) => Promise<void>
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(desc)
			.addText((text) => {
				text.setPlaceholder(placeholder)
					.setValue(value)
					.onChange(async (value) => await onChange(value));
				text.inputEl.type = "password";
			});
	}

	private createWhisperApiKeySetting(): void {
		this.createApiKeySetting(
			"Whisper API Key",
			"API key for Whisper transcription (OpenAI, Groq, or Azure)",
			"sk-...xxxx",
			this.plugin.settings.apiKey,
			async (value) => {
				this.plugin.settings.apiKey = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private createOpenAiApiKeySetting(): void {
		this.createApiKeySetting(
			"OpenAI API Key",
			"API key for GPT post-processing models",
			"sk-...xxxx",
			this.plugin.settings.openAiApiKey,
			async (value) => {
				this.plugin.settings.openAiApiKey = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private createAnthropicApiKeySetting(): void {
		this.createApiKeySetting(
			"Anthropic API Key",
			"API key for Claude post-processing models",
			"sk-ant-...xxxx",
			this.plugin.settings.anthropicApiKey,
			async (value) => {
				this.plugin.settings.anthropicApiKey = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private createApiUrlSetting(): void {
		this.createTextSetting(
			"API URL",
			"Specify the endpoint that will be used to make requests to",
			"https://api.your-custom-url.com",
			this.plugin.settings.apiUrl,
			async (value) => {
				this.plugin.settings.apiUrl = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private createModelSetting(): void {
		this.createTextSetting(
			"Model",
			"Model for transcription (whisper-1 for OpenAI, whisper-large-v3 for Groq)",
			"whisper-1",
			this.plugin.settings.model,
			async (value) => {
				this.plugin.settings.model = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private createPromptSetting(): void {
		this.createTextSetting(
			"Prompt",
			"Optional: Add words with their correct spellings to help with transcription. Make sure it matches the chosen language.",
			"Example: ZyntriQix, Digique Plus, CynapseFive",
			this.plugin.settings.prompt,
			async (value) => {
				this.plugin.settings.prompt = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private createLanguageSetting(): void {
		this.createTextSetting(
			"Language",
			"Specify the language, or leave empty for auto-detection",
			"en (leave empty for auto-detect)",
			this.plugin.settings.language,
			async (value) => {
				this.plugin.settings.language = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private async createAudioDeviceSetting(): Promise<void> {
		const setting = new Setting(this.containerEl)
			.setName("Microphone")
			.setDesc("Select the audio input device to use for recording");

		// Request permission first to get device labels (some browsers hide labels until permission is granted)
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			// Stop the stream immediately to release the microphone
			stream.getTracks().forEach((track) => track.stop());
		} catch (err) {
			// Permission denied or error - continue anyway, devices may still be listed
			console.log(
				"Microphone permission not granted, device labels may be limited"
			);
		}

		// Enumerate devices
		let devices: MediaDeviceInfo[] = [];
		try {
			const allDevices = await navigator.mediaDevices.enumerateDevices();
			devices = allDevices.filter(
				(device) => device.kind === "audioinput"
			);
		} catch (err) {
			console.error("Error enumerating audio devices:", err);
		}

		// Build dropdown options: "default" + all audio input devices
		const options: Record<string, string> = {};
		options["default"] = "Default";

		devices.forEach((device) => {
			const label =
				device.label ||
				`Unknown device (${device.deviceId.substring(0, 8)})`;
			options[device.deviceId] = label;
		});

		// Get current value, defaulting to "default" if not set or device not found
		let currentValue = this.plugin.settings.audioDeviceId || "default";
		if (currentValue !== "default" && !options[currentValue]) {
			// Device no longer available, reset to default
			currentValue = "default";
			this.plugin.settings.audioDeviceId = "default";
			await this.settingsManager.saveSettings(this.plugin.settings);
		}

		setting.addDropdown((dropdown) => {
			Object.keys(options).forEach((deviceId) => {
				dropdown.addOption(deviceId, options[deviceId]);
			});
			dropdown.setValue(currentValue);
			dropdown.onChange(async (value) => {
				this.plugin.settings.audioDeviceId = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
				// Update recorder with new device ID
				this.plugin.recorder.setDeviceId(
					value === "default" ? null : value
				);
			});
		});
	}

	private createSaveAudioFileToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Save audio file")
			.setDesc("Save the audio recording to the vault")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.saveAudioFile)
					.onChange(async (value) => {
						this.plugin.settings.saveAudioFile = value;
						if (!value) {
							this.plugin.settings.audioSavePath = "";
						}
						await this.save();
						this.display();
					})
			);
	}

	private createSaveAudioFilePathSetting(): void {
		new Setting(this.containerEl)
			.setName("Audio save path")
			.setDesc("Folder in the vault where audio files are saved")
			.addText((text) =>
				text
					.setPlaceholder("Example: folder/audio")
					.setValue(this.plugin.settings.audioSavePath)
					.onChange(async (value) => {
						this.plugin.settings.audioSavePath = value;
						await this.save();
					})
			);
	}

	private createDeleteAudioAfterTranscriptionSetting(): void {
		new Setting(this.containerEl)
			.setName("Delete after transcription")
			.setDesc("Delete the audio file from the vault after a successful transcription")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.deleteAudioAfterTranscription)
					.onChange(async (value) => {
						this.plugin.settings.deleteAudioAfterTranscription = value;
						await this.save();
					})
			);
	}

	private createTemperatureSetting(): void {
		this.createTextSetting(
			"Temperature",
			"Sampling temperature (0 to 1). Higher values produce more random output.",
			"0",
			String(this.plugin.settings.temperature),
			async (value) => {
				const num = parseFloat(value);
				this.plugin.settings.temperature = isNaN(num)
					? 0
					: Math.max(0, Math.min(1, num));
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private createResponseFormatSetting(): void {
		this.createTextSetting(
			"Response format",
			"Output format: json, text, srt, verbose_json, or vtt",
			"json",
			this.plugin.settings.responseFormat,
			async (value) => {
				this.plugin.settings.responseFormat = value;
				await this.settingsManager.saveSettings(this.plugin.settings);
			}
		);
	}

	private createNewFileToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Create note file")
			.setDesc("Create a new note file for each transcription")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.createNoteFile)
					.onChange(async (value) => {
						this.plugin.settings.createNoteFile = value;
						if (!value) {
							this.plugin.settings.noteSavePath = "";
						}
						await this.save();
						this.display();
					});
			});
	}

	private createNewFilePathSetting(): void {
		new Setting(this.containerEl)
			.setName("Note save path")
			.setDesc("Folder in the vault where note files are saved")
			.addText((text) => {
				text.setPlaceholder("Example: folder/note")
					.setValue(this.plugin.settings.noteSavePath)
					.onChange(async (value) => {
						this.plugin.settings.noteSavePath = value;
						await this.save();
					});
			});
	}

	private createNoteFilenameTemplateSetting(): void {
		new Setting(this.containerEl)
			.setName("Note filename template")
			.setDesc(
				"Template for note filenames. Variables: {{date}}, {{time}}, {{datetime}}, {{title}}"
			)
			.addText((text) =>
				text
					.setPlaceholder("{{datetime}}")
					.setValue(this.plugin.settings.noteFilenameTemplate)
					.onChange(async (value) => {
						this.plugin.settings.noteFilenameTemplate = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					})
			);
	}

	private createNoteTemplateSetting(): void {
		new Setting(this.containerEl)
			.setName("Note template")
			.setDesc(
				"Template for note content. Variables: {{transcription}}, {{audioFile}}, {{date}}, {{time}}, {{datetime}}, {{title}}. Use ![[{{audioFile}}]] to embed or [[{{audioFile}}]] to link."
			)
			.addTextArea((text) => {
				text.setPlaceholder("![[{{audioFile}}]]\n{{transcription}}")
					.setValue(this.plugin.settings.noteTemplate)
					.onChange(async (value) => {
						this.plugin.settings.noteTemplate = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
				text.inputEl.rows = 4;
				text.inputEl.cols = 50;
			});
	}

	private createSendCursorContextSetting(): void {
		new Setting(this.containerEl)
			.setName("Cursor context")
			.setDesc(
				"Send text around the cursor to Whisper for better transcription accuracy"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.cursorContext)
					.onChange(async (value) => {
						this.plugin.settings.cursorContext = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}

	private createPostProcessingToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Enable post-processing")
			.setDesc(
				"Clean up transcriptions with an LLM — fix grammar, remove filler words, improve readability"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.postProcessing)
					.onChange(async (value) => {
						this.plugin.settings.postProcessing = value;
						await this.save();
						this.display();
					});
			});
	}

	private createPostProcessingProviderSetting(): void {
		const providers: Record<PostProcessingProvider, string> = {
			anthropic: "Anthropic",
			openai: "OpenAI",
			custom: "Custom",
		};

		new Setting(this.containerEl)
			.setName("Provider")
			.setDesc(
				"Anthropic and OpenAI use the API keys from the API Keys section above"
			)
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(providers)) {
					dropdown.addOption(value, label);
				}
				dropdown
					.setValue(this.plugin.settings.postProcessingProvider)
					.onChange(async (value) => {
						const provider = value as PostProcessingProvider;
						this.plugin.settings.postProcessingProvider = provider;
						if (provider !== "custom") {
							this.plugin.settings.postProcessingUrl =
								PROVIDER_URLS[provider];
							this.plugin.settings.postProcessingModel =
								PROVIDER_DEFAULT_MODELS[provider];
						}
						await this.save();
						this.display();
					});
			});
	}

	private createPostProcessingUrlSetting(): void {
		if (this.plugin.settings.postProcessingProvider !== "custom") return;

		new Setting(this.containerEl)
			.setName("Post-processing API URL")
			.setDesc("Endpoint for post-processing requests")
			.addText((text) =>
				text
					.setPlaceholder("https://api.example.com/v1/chat/completions")
					.setValue(this.plugin.settings.postProcessingUrl)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingUrl = value;
						await this.save();
					})
			);
	}

	private createPostProcessingApiKeySetting(): void {
		if (this.plugin.settings.postProcessingProvider !== "custom") return;

		new Setting(this.containerEl)
			.setName("Post-processing API Key")
			.setDesc("API key for the custom endpoint")
			.addText((text) => {
				text.setPlaceholder("sk-...xxxx")
					.setValue(this.plugin.settings.postProcessingApiKey)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingApiKey = value;
						await this.save();
					});
				text.inputEl.type = "password";
			});
	}

	private createPostProcessingModelSetting(): void {
		new Setting(this.containerEl)
			.setName("Post-processing model")
			.setDesc("Model ID for the selected provider")
			.addText((text) =>
				text
					.setPlaceholder("claude-haiku-4-5-20251001")
					.setValue(this.plugin.settings.postProcessingModel)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingModel = value;
						await this.save();
					})
			);
	}

	private createPostProcessingPromptSetting(): void {
		new Setting(this.containerEl)
			.setName("Post-processing prompt")
			.setDesc(
				"Instructions for the LLM on how to clean up the transcription"
			)
			.addTextArea((text) => {
				text.setPlaceholder("You are a transcription editor...")
					.setValue(this.plugin.settings.postProcessingPrompt)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingPrompt = value;
						await this.save();
					});
				text.inputEl.rows = 4;
				text.inputEl.cols = 50;
			});
	}

	private createAutoGenerateTitleSetting(): void {
		new Setting(this.containerEl)
			.setName("Auto-generate title")
			.setDesc("Use the LLM to generate a descriptive filename for notes")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.autoGenerateTitle)
					.onChange(async (value) => {
						this.plugin.settings.autoGenerateTitle = value;
						await this.save();
						this.display();
					});
			});
	}

	private createTitleGenerationPromptSetting(): void {
		if (!this.plugin.settings.autoGenerateTitle) return;

		new Setting(this.containerEl)
			.setName("Title generation prompt")
			.setDesc("Instructions for the LLM on how to generate the title")
			.addTextArea((text) => {
				text.setPlaceholder("Generate a short title...")
					.setValue(this.plugin.settings.titleGenerationPrompt)
					.onChange(async (value) => {
						this.plugin.settings.titleGenerationPrompt = value;
						await this.save();
					});
				text.inputEl.rows = 2;
				text.inputEl.cols = 50;
			});
	}

	private createKeepOriginalTranscriptionSetting(): void {
		new Setting(this.containerEl)
			.setName("Keep original transcription")
			.setDesc(
				"Append the raw Whisper transcription below the post-processed text"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.keepOriginalTranscription)
					.onChange(async (value) => {
						this.plugin.settings.keepOriginalTranscription = value;
						await this.save();
					});
			});
	}

	private createDebugModeToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Debug mode")
			.setDesc("Increase the plugin's verbosity for troubleshooting")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.debugMode)
					.onChange(async (value) => {
						this.plugin.settings.debugMode = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}
}
