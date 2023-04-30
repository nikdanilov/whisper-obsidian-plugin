import Whisper from "main";
import { App, PluginSettingTab, Setting, TextComponent, TFolder } from "obsidian";
import { SettingsManager } from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
    private plugin: Whisper;
    private settingsManager: SettingsManager;
    private templateFileInput: TextComponent;

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
        this.createLanguageSetting();
        this.createRecordingToggleSetting();
        this.createTemplateFileLocationSetting();
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

    private createTextSetting(name: string, desc: string, placeholder: string, value: string, onChange: (value: string) => Promise<void>): void {
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

    private createLanguageSetting(): void {
        this.createTextSetting(
            "Language",
            "Specify the language of the message being whispered",
            "en",
            this.plugin.settings.language,
            async (value) => {
                this.plugin.settings.language = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createRecordingToggleSetting(): void {
        new Setting(this.containerEl)
            .setName("Create a new file after recording")
            .setDesc(
                "Turn on to create a new file for each recording, or leave off to add transcriptions at your cursor."
            )
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.newFilePostRecording)
					.onChange(async (value) => {
						this.plugin.settings.newFilePostRecording = value;
						this.templateFileInput.setDisabled(!value);
						if (!value) {
							this.templateFileInput.setValue('');
						}
						await this.settingsManager.saveSettings(this.plugin.settings);
					});
			});
    }

	private createTemplateFileLocationSetting(): void {
		const templateFileSetting = new Setting(this.containerEl)
			.setName("Template file location")
			.setDesc("Choose a folder for your template file");
	
		templateFileSetting.addText((text) => {
			text.setPlaceholder("Example: folder/note")
				.setValue(this.plugin.settings.templateFile)
				.onChange(async (value) => {
					this.plugin.settings.templateFile = value;
					await this.settingsManager.saveSettings(this.plugin.settings);
				});
	
			this.templateFileInput = text;
		});
	
		this.templateFileInput.setDisabled(!this.plugin.settings.newFilePostRecording);

		if (!this.plugin.settings.newFilePostRecording) {
			this.templateFileInput.setValue('');
		}
	}

}