// WhisperSettings.ts
import { App, PluginSettingTab, Setting } from "obsidian";
import Whisper from "../main";

export interface WhisperSettings {
	mySetting: string;
	apiUrl: string;
	apiKey: string;
	model: string;
	language: string;
	templateFile: string;
}

export const DEFAULT_SETTINGS: WhisperSettings = {
	mySetting: "default",
	apiKey: "",
	apiUrl: "https://api.openai.com/v1/audio/transcriptions",
	model: "whisper-1",
	language: "en",
	templateFile: "Transcriptions",
};

export class WhisperSettingTab extends PluginSettingTab {
	plugin: Whisper;

	constructor(app: App, plugin: Whisper) {
		super(app, plugin);
		this.plugin = plugin;
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
						await this.plugin.saveSettings();
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
						await this.plugin.saveSettings();
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
						await this.plugin.saveSettings();
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
						await this.plugin.saveSettings();
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
						await this.plugin.saveSettings();
					});

				return text;
			});
	}
}
