import Whisper from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { SettingsManager } from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
	private plugin: Whisper;
	private settingsManager: SettingsManager;

	constructor(app: App, plugin: Whisper) {
		super(app, plugin);
		this.plugin = plugin;
		this.settingsManager = plugin.settingsManager;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for Whisper." });

		new Setting(containerEl)
			.setName("API Key")
			.setDesc("Enter your OpenAI API key")
			.addText((text) =>
				text
					.setPlaceholder("sk-...xxxx")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);

		new Setting(containerEl)
			.setName("API URL")
			.setDesc("Specify the endpoint that will be used to make requests to")
			.addText((text) =>
				text
					.setPlaceholder("https://api.your-custom-url.com")
					.setValue(this.plugin.settings.apiUrl)
					.onChange(async (value) => {
						this.plugin.settings.apiUrl = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);

		new Setting(containerEl)
			.setName("Model")
			.setDesc(
				"Specify the machine learning model to use for generating text"
			)
			.addText((text) =>
				text
					.setPlaceholder("whisper-1")
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);

		new Setting(containerEl)
			.setName("Language")
			.setDesc("Specify the language of the message being whispered")
			.addText((text) =>
				text
					.setPlaceholder("en")
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);

		// Add a new setting field for the template file location
		new Setting(containerEl)
			.setName("Template File Location")
			.setDesc("Choose a folder for your template file")
			.addExtraButton((extra) => {
				extra.setIcon("ellipsis-h").onClick(async () => {
					const file = await this.app.vault.create("", "note");
					this.app.workspace.activeLeaf?.openFile(file, {
						state: { mode: "source" },
					});
				});
				return extra;
			})
			.addText((text) => {
				text.setPlaceholder("Example: folder/note")
					.setValue(this.plugin.settings.templateFile)
					.onChange(async (value) => {
						this.plugin.settings.templateFile = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					});

				return text;
			});
		// Add a toggle for your new setting
		new Setting(containerEl)
			.setName("Create a new file after recording")
			.setDesc("If enabled, the plugin will create a new file after recording. Otherwise, the transcription will be inserted at the cursor position.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.createNewFileAfterRecording)
					.onChange(async (value) => {
						this.plugin.settings.createNewFileAfterRecording = value;
						await this.settingsManager.saveSettings(this.plugin.settings);
					})
			);
	}

}