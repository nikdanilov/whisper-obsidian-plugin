import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsManager, DEFAULT_SETTINGS } from "src/SettingsManager";

describe("SettingsManager integration", () => {
	let pluginMock: any;
	let manager: SettingsManager;

	beforeEach(() => {
		pluginMock = {
			loadData: vi.fn(),
			saveData: vi.fn().mockResolvedValue(undefined),
		};
		manager = new SettingsManager(pluginMock);
	});

	it("should merge defaults with stored data and round-trip via saveSettings", async () => {
		// Stored data has only a partial override
		pluginMock.loadData.mockResolvedValue({
			apiKey: "my-key",
			language: "fr",
		});

		const loaded = await manager.loadSettings();

		// Overridden values
		expect(loaded.apiKey).toBe("my-key");
		expect(loaded.language).toBe("fr");

		// Defaults preserved
		expect(loaded.model).toBe(DEFAULT_SETTINGS.model);
		expect(loaded.apiUrl).toBe(DEFAULT_SETTINGS.apiUrl);
		expect(loaded.saveAudioFile).toBe(DEFAULT_SETTINGS.saveAudioFile);
		expect(loaded.maxFileSizeMB).toBe(DEFAULT_SETTINGS.maxFileSizeMB);

		// Save round-trip
		await manager.saveSettings(loaded);
		expect(pluginMock.saveData).toHaveBeenCalledWith(loaded);
	});
});
