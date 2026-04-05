import Whisper from "main";
import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import { SettingsManager } from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
	private plugin: Whisper;
	private settingsManager: SettingsManager;
	private createNewFileInput: Setting;
	private saveAudioFileInput: Setting;
	private postProcessingUrlInput: Setting;
	private postProcessingModelInput: Setting;
	private postProcessingPromptInput: Setting;
	private autoGenerateTitleInput: Setting;
	private titleGenerationPromptInput: Setting;
	private keepOriginalInput: Setting;

	constructor(app: App, plugin: Whisper) {
		super(app, plugin);
		this.plugin = plugin;
		this.settingsManager = plugin.settingsManager;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// --- API Keys ---
		containerEl.createEl("h2", { text: "API Keys" });
		this.createWhisperApiKeySetting();
		this.createOpenAiApiKeySetting();
		this.createAnthropicApiKeySetting();

		// --- Whisper Settings ---
		containerEl.createEl("h2", { text: "Whisper Settings" });
		this.createApiUrlSetting();
		this.createModelSetting();
		this.createLanguageSetting();
		this.createPromptSetting();
		this.createTemperatureSetting();
		this.createResponseFormatSetting();
		this.createSendCursorContextSetting();
		// async — populates device dropdown after enumeration completes
		void this.createAudioDeviceSetting();
		this.createSaveAudioFileToggleSetting();
		this.createSaveAudioFilePathSetting();
		this.createNewFileToggleSetting();
		this.createNewFilePathSetting();
		this.createNoteFilenameTemplateSetting();
		this.createNoteTemplateSetting();
		this.createAudioLinkStyleSetting();
		this.createIgnoreUploadFilenameSetting();
		this.createDebugModeToggleSetting();

		// --- Post-Processing Settings ---
		containerEl.createEl("h2", { text: "Post-Processing Settings" });
		this.createPostProcessingToggleSetting();
		this.createPostProcessingUrlSetting();
		this.createPostProcessingModelSetting();
		this.createPostProcessingPromptSetting();
		this.createAutoGenerateTitleSetting();
		this.createTitleGenerationPromptSetting();
		this.createKeepOriginalTranscriptionSetting();
	}

	private getUniqueFolders(): TFolder[] {
		const files = this.app.vault.getMarkdownFiles();
		const folderSet = new Set<TFolder>();

		for (const file of files) {
			const parentFolder = file.parent;
			if (parentFolder && parentFolder instanceof TFolder) {
				folderSet.add(parentFolder);
			}
		}

		return Array.from(folderSet);
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

	private createWhisperApiKeySetting(): void {
		this.createTextSetting(
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
		this.createTextSetting(
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
		this.createTextSetting(
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
			console.log("Microphone permission not granted, device labels may be limited");
		}

		// Enumerate devices
		let devices: MediaDeviceInfo[] = [];
		try {
			const allDevices = await navigator.mediaDevices.enumerateDevices();
			devices = allDevices.filter((device) => device.kind === "audioinput");
		} catch (err) {
			console.error("Error enumerating audio devices:", err);
		}

		// Build dropdown options: "default" + all audio input devices
		const options: Record<string, string> = {};
		options["default"] = "Default";

		devices.forEach((device) => {
			const label = device.label || `Unknown device (${device.deviceId.substring(0, 8)})`;
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
			.setDesc(
				"Save the audio recording to the vault"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.saveAudioFile)
					.onChange(async (value) => {
						this.plugin.settings.saveAudioFile = value;
						if (!value) {
							this.plugin.settings.audioSavePath = "";
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
			.setName("Audio save path")
			.setDesc(
				"Folder in the vault where audio files are saved"
			)
			.addText((text) =>
				text
					.setPlaceholder("Example: folder/audio")
					.setValue(this.plugin.settings.audioSavePath)
					.onChange(async (value) => {
						this.plugin.settings.audioSavePath = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					})
			)
			.setDisabled(!this.plugin.settings.saveAudioFile);
	}

	private createAudioLinkStyleSetting(): void {
		new Setting(this.containerEl)
			.setName("Audio link style")
			.setDesc(
				"Choose how the audio file is referenced in notes: embed (playable) or link"
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOption("embed", "Embed (![[file]])")
					.addOption("link", "Link ([[file]])")
					.setValue(this.plugin.settings.audioLinkStyle)
					.onChange(async (value) => {
						this.plugin.settings.audioLinkStyle = value as
							| "embed"
							| "link";
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
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
			.setDesc(
				"Create a new note file for each transcription"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.createNoteFile)
					.onChange(async (value) => {
						this.plugin.settings.createNoteFile =
							value;
						if (!value) {
							this.plugin.settings.noteSavePath =
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
			.setName("Note save path")
			.setDesc(
				"Folder in the vault where note files are saved"
			)
			.addText((text) => {
				text.setPlaceholder("Example: folder/note")
					.setValue(
						this.plugin.settings.noteSavePath
					)
					.onChange(async (value) => {
						this.plugin.settings.noteSavePath =
							value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
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
				"Template for note content. Variables: {{transcription}}, {{audio}}, {{date}}, {{time}}, {{datetime}}, {{title}}"
			)
			.addTextArea((text) => {
				text.setPlaceholder("{{audio}}\n{{transcription}}")
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

	private createIgnoreUploadFilenameSetting(): void {
		new Setting(this.containerEl)
			.setName("Use timestamp filename")
			.setDesc(
				"Replace the original filename with a timestamp when uploading audio files"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.useTimestampFilename)
					.onChange(async (value) => {
						this.plugin.settings.useTimestampFilename = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}

	private createPostProcessingToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Post-processing")
			.setDesc(
				"Clean up transcriptions with an LLM — fix grammar, remove filler words, improve readability"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.postProcessing)
					.onChange(async (value) => {
						this.plugin.settings.postProcessing = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
						this.postProcessingUrlInput.setDisabled(!value);
						this.postProcessingModelInput.setDisabled(!value);
						this.postProcessingPromptInput.setDisabled(!value);
						this.autoGenerateTitleInput.setDisabled(!value);
						this.titleGenerationPromptInput.setDisabled(
							!value || !this.plugin.settings.autoGenerateTitle
						);
						this.keepOriginalInput.setDisabled(!value);
					});
			});
	}

	private createPostProcessingUrlSetting(): void {
		this.postProcessingUrlInput = new Setting(this.containerEl)
			.setName("Post-processing API URL")
			.setDesc(
				"Endpoint for post-processing requests. Change for Anthropic, Ollama, or other providers."
			)
			.addText((text) =>
				text
					.setPlaceholder("https://api.anthropic.com/v1/messages")
					.setValue(this.plugin.settings.postProcessingUrl)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingUrl = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					})
			)
			.setDisabled(!this.plugin.settings.postProcessing);
	}

	private createPostProcessingModelSetting(): void {
		this.postProcessingModelInput = new Setting(this.containerEl)
			.setName("Post-processing model")
			.setDesc(
				"Model ID for post-processing and title generation (e.g. claude-haiku-4-5-20251001, gpt-4.1-nano)"
			)
			.addText((text) =>
				text
					.setPlaceholder("claude-haiku-4-5-20251001")
					.setValue(this.plugin.settings.postProcessingModel)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingModel = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					})
			)
			.setDisabled(!this.plugin.settings.postProcessing);
	}

	private createPostProcessingPromptSetting(): void {
		this.postProcessingPromptInput = new Setting(this.containerEl)
			.setName("Post-processing prompt")
			.setDesc(
				"Instructions for the LLM on how to clean up the transcription"
			)
			.addTextArea((text) => {
				text.setPlaceholder("You are a transcription editor...")
					.setValue(this.plugin.settings.postProcessingPrompt)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingPrompt = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
				text.inputEl.rows = 4;
				text.inputEl.cols = 50;
			})
			.setDisabled(!this.plugin.settings.postProcessing);
	}

	private createAutoGenerateTitleSetting(): void {
		this.autoGenerateTitleInput = new Setting(this.containerEl)
			.setName("Auto-generate title")
			.setDesc(
				"Use the LLM to generate a descriptive filename for notes"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.autoGenerateTitle)
					.onChange(async (value) => {
						this.plugin.settings.autoGenerateTitle = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
						this.titleGenerationPromptInput.setDisabled(!value);
					});
			})
			.setDisabled(!this.plugin.settings.postProcessing);
	}

	private createTitleGenerationPromptSetting(): void {
		this.titleGenerationPromptInput = new Setting(this.containerEl)
			.setName("Title generation prompt")
			.setDesc("Instructions for the LLM on how to generate the title")
			.addTextArea((text) => {
				text.setPlaceholder("Generate a short title...")
					.setValue(this.plugin.settings.titleGenerationPrompt)
					.onChange(async (value) => {
						this.plugin.settings.titleGenerationPrompt = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
				text.inputEl.rows = 2;
				text.inputEl.cols = 50;
			})
			.setDisabled(
				!this.plugin.settings.postProcessing ||
					!this.plugin.settings.autoGenerateTitle
			);
	}

	private createKeepOriginalTranscriptionSetting(): void {
		this.keepOriginalInput = new Setting(this.containerEl)
			.setName("Keep original transcription")
			.setDesc(
				"Append the raw Whisper transcription below the post-processed text"
			)	
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.keepOriginalTranscription)
					.onChange(async (value) => {
						this.plugin.settings.keepOriginalTranscription = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			})
			.setDisabled(!this.plugin.settings.postProcessing);
	}

	private createDebugModeToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Debug mode")
			.setDesc(
				"Increase the plugin's verbosity for troubleshooting"
			)
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
