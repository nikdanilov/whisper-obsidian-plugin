import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "../src/SettingsManager";

describe("DEFAULT_SETTINGS", () => {
	it("has correct API defaults", () => {
		expect(DEFAULT_SETTINGS.apiUrl).toBe(
			"https://api.openai.com/v1/audio/transcriptions"
		);
		expect(DEFAULT_SETTINGS.model).toBe("whisper-1");
		expect(DEFAULT_SETTINGS.apiKey).toBe("");
	});

	it("defaults language to empty (auto-detect)", () => {
		expect(DEFAULT_SETTINGS.language).toBe("");
	});

	it("saves audio and creates note file by default", () => {
		expect(DEFAULT_SETTINGS.saveAudioFile).toBe(true);
		expect(DEFAULT_SETTINGS.createNoteFile).toBe(true);
	});

	it("disables optional features by default", () => {
		expect(DEFAULT_SETTINGS.cursorContext).toBe(false);
		expect(DEFAULT_SETTINGS.debugMode).toBe(false);
	});

	it("has safe Whisper API param defaults", () => {
		expect(DEFAULT_SETTINGS.temperature).toBe(0);
		expect(DEFAULT_SETTINGS.responseFormat).toBe("json");
	});

	it("defaults to system audio device", () => {
		expect(DEFAULT_SETTINGS.audioDeviceId).toBe("default");
	});
});
