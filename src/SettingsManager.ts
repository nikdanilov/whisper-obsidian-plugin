import { Plugin } from "obsidian";

export interface WhisperSettings {
    apiKey: string;
    apiUrl: string;
    model: string;
    language: string;
    templateFile: string;
    newFilePostRecording: boolean;
}

export const DEFAULT_SETTINGS: WhisperSettings = {
    apiKey: "",
    apiUrl: "https://api.openai.com/v1/audio/transcriptions",
    model: "whisper-1",
    language: "en",
    templateFile: "",
    newFilePostRecording: true,
};

export class SettingsManager {
    private plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async loadSettings(): Promise<WhisperSettings> {
        return Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
    }

    async saveSettings(settings: WhisperSettings): Promise<void> {
        await this.plugin.saveData(settings);
    }
}
