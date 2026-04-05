import Whisper from "main";
import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import { SettingsManager } from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
	private plugin: Whisper;
	private settingsManager: SettingsManager;
	private createNewFileInput: Setting;
	private saveAudioFileInput: Setting;
	private postProcessingModelInput: Setting;
	private postProcessingApiKeyInput: Setting;
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

		containerEl.createEl("h2", { text: "API" });
		this.createApiKeySetting();
		this.createApiUrlSetting();
		this.createModelSetting();

		containerEl.createEl("h2", { text: "Transcription" });
		this.createLanguageSetting();
		this.createPromptSetting();
		this.createTemperatureSetting();
		this.createResponseFormatSetting();
		this.createSendCursorContextSetting();

		containerEl.createEl("h2", { text: "Recording" });
		// async — populates device dropdown after enumeration completes
		void this.createAudioDeviceSetting();
		this.createSaveAudioFileToggleSetting();
		this.createSaveAudioFilePathSetting();

		containerEl.createEl("h2", { text: "Output" });
		this.createNewFileToggleSetting();
		this.createNewFilePathSetting();
		this.createPasteAtCursorSetting();
		this.createAudioLinkStyleSetting();
		this.createIgnoreUploadFilenameSetting();

		containerEl.createEl("h2", { text: "Post-Processing" });
		this.createPostProcessingToggleSetting();
		this.createPostProcessingModelSetting();
		this.createPostProcessingApiKeySetting();
		this.createPostProcessingPromptSetting();
		this.createAutoGenerateTitleSetting();
		this.createTitleGenerationPromptSetting();
		this.createKeepOriginalTranscriptionSetting();

		containerEl.createEl("h2", { text: "Advanced" });
		this.createDebugModeToggleSetting();
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

	private createApiKeySetting(): void {
		this.createTextSetting(
			"API Key",
			"Enter your OpenAI API key",
			"sk-...xxxx",
			this.plugin.settings.apiKey,
			async (value) => {
				this.plugin.settings.apiKey = value;
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
			"Specify the machine learning model to use for generating text",
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
			.setName("Audio input device")
			.setDesc("Select the microphone or audio input device to use for recording");

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

	private createPasteAtCursorSetting(): void {
		new Setting(this.containerEl)
			.setName("Paste at cursor")
			.setDesc(
				"Insert transcription at cursor position in the active note"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.pasteAtCursor)
					.onChange(async (value) => {
						this.plugin.settings.pasteAtCursor = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}

	private createSendCursorContextSetting(): void {
		new Setting(this.containerEl)
			.setName("Send cursor context")
			.setDesc(
				"Send text around the cursor as context to Whisper for better transcription accuracy"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.sendCursorContext)
					.onChange(async (value) => {
						this.plugin.settings.sendCursorContext = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}

	private createIgnoreUploadFilenameSetting(): void {
		new Setting(this.containerEl)
			.setName("Ignore upload filename")
			.setDesc(
				"Use a timestamp-based filename instead of the original file name when uploading"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.ignoreUploadFilename)
					.onChange(async (value) => {
						this.plugin.settings.ignoreUploadFilename = value;
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
				"Use an LLM to clean up transcriptions — fix grammar, remove filler words, and improve readability"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.postProcessingEnabled)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingEnabled = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
						this.postProcessingModelInput.setDisabled(!value);
						this.postProcessingApiKeyInput.setDisabled(!value);
						this.postProcessingPromptInput.setDisabled(!value);
						this.autoGenerateTitleInput.setDisabled(!value);
						this.titleGenerationPromptInput.setDisabled(
							!value || !this.plugin.settings.autoGenerateTitle
						);
						this.keepOriginalInput.setDisabled(!value);
					});
			});
	}

	private createPostProcessingModelSetting(): void {
		const models: Record<string, string> = {
			"claude-haiku-4-5-20251001": "Claude Haiku 4.5 (fast, cheap)",
			"claude-sonnet-4-6-20260414": "Claude Sonnet 4.6",
			"claude-opus-4-6-20260414": "Claude Opus 4.6",
			"gpt-4o-mini": "GPT-4o Mini",
			"gpt-4o": "GPT-4o",
		};
		this.postProcessingModelInput = new Setting(this.containerEl)
			.setName("Post-processing model")
			.setDesc("LLM model used for post-processing and title generation")
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(models)) {
					dropdown.addOption(value, label);
				}
				dropdown.setValue(this.plugin.settings.postProcessingModel);
				dropdown.onChange(async (value) => {
					this.plugin.settings.postProcessingModel = value;
					await this.settingsManager.saveSettings(
						this.plugin.settings
					);
				});
			})
			.setDisabled(!this.plugin.settings.postProcessingEnabled);
	}

	private createPostProcessingApiKeySetting(): void {
		this.postProcessingApiKeyInput = new Setting(this.containerEl)
			.setName("Post-processing API key")
			.setDesc(
				"API key for the post-processing model. Leave empty to use the Whisper API key (OpenAI models only)."
			)
			.addText((text) =>
				text
					.setPlaceholder("sk-... or sk-ant-...")
					.setValue(this.plugin.settings.postProcessingApiKey)
					.onChange(async (value) => {
						this.plugin.settings.postProcessingApiKey = value;
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					})
			)
			.setDisabled(!this.plugin.settings.postProcessingEnabled);
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
			.setDisabled(!this.plugin.settings.postProcessingEnabled);
	}

	private createAutoGenerateTitleSetting(): void {
		this.autoGenerateTitleInput = new Setting(this.containerEl)
			.setName("Auto-generate title")
			.setDesc(
				"Use the LLM to generate a descriptive filename for transcription notes"
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
			.setDisabled(!this.plugin.settings.postProcessingEnabled);
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
				!this.plugin.settings.postProcessingEnabled ||
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
			.setDisabled(!this.plugin.settings.postProcessingEnabled);
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
						await this.settingsManager.saveSettings(
							this.plugin.settings
						);
					});
			});
	}
}
