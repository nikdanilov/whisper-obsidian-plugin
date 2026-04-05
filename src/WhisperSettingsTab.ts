import Whisper from "main";
import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import { SettingsManager } from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
	private plugin: Whisper;
	private settingsManager: SettingsManager;
	private createNewFileInput: Setting;
	private saveAudioFileInput: Setting;

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
		this.createAudioDeviceSetting();
		this.createSaveAudioFileToggleSetting();
		this.createSaveAudioFilePathSetting();
		this.createAudioLinkStyleSetting();
		this.createTemperatureSetting();
		this.createResponseFormatSetting();
		this.createNewFileToggleSetting();
		this.createNewFilePathSetting();
		this.createSendCursorContextSetting();
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

	private createHeader(): void {
		this.containerEl.createEl("h2", { text: "Settings for Whisper." });
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
