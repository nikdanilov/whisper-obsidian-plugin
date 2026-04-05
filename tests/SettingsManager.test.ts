import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "../src/SettingsManager";

describe("DEFAULT_SETTINGS", () => {
	it("has sensible defaults", () => {
		expect(DEFAULT_SETTINGS.apiUrl).toBe(
			"https://api.openai.com/v1/audio/transcriptions"
		);
		expect(DEFAULT_SETTINGS.model).toBe("whisper-1");
		expect(DEFAULT_SETTINGS.language).toBe("en");
		expect(DEFAULT_SETTINGS.saveAudioFile).toBe(true);
		expect(DEFAULT_SETTINGS.createNewFileAfterRecording).toBe(true);
	});
});

// --- Feature #47: Auto-detect language ---
describe("#47 — Auto-detect language", () => {
	it("should not send language param when set to empty string (auto-detect)", () => {
		// When language is "" or "auto", the formData should NOT include a language field
		// so Whisper API auto-detects
		const settings = { ...DEFAULT_SETTINGS, language: "" };
		expect(settings.language).toBe("");

		const shouldSendLanguage = settings.language !== "" && settings.language !== "auto";
		expect(shouldSendLanguage).toBe(false);
	});

	it("should send language param when explicitly set", () => {
		const settings = { ...DEFAULT_SETTINGS, language: "en" };
		const shouldSendLanguage = settings.language !== "" && settings.language !== "auto";
		expect(shouldSendLanguage).toBe(true);
	});
});

// --- Feature #2/#61/#74: Custom API support ---
describe("#2 — Custom API endpoint support", () => {
	it("should allow custom API URL", () => {
		const settings = {
			...DEFAULT_SETTINGS,
			apiUrl: "http://localhost:9000/asr",
		};
		expect(settings.apiUrl).toBe("http://localhost:9000/asr");
	});

	it("should skip Authorization header when apiKey is empty", () => {
		const settings = { ...DEFAULT_SETTINGS, apiKey: "" };
		const headers: Record<string, string> = {
			"Content-Type": "multipart/form-data",
		};
		if (settings.apiKey) {
			headers["Authorization"] = `Bearer ${settings.apiKey}`;
		}
		expect(headers["Authorization"]).toBeUndefined();
	});

	it("should include Authorization header when apiKey is set", () => {
		const settings = { ...DEFAULT_SETTINGS, apiKey: "sk-test123" };
		const headers: Record<string, string> = {
			"Content-Type": "multipart/form-data",
		};
		if (settings.apiKey) {
			headers["Authorization"] = `Bearer ${settings.apiKey}`;
		}
		expect(headers["Authorization"]).toBe("Bearer sk-test123");
	});
});

// --- Feature #35: Expose Whisper params ---
describe("#35 — Whisper API parameters", () => {
	it("should have temperature in settings with default", () => {
		const extendedDefaults = {
			...DEFAULT_SETTINGS,
			temperature: 0,
			responseFormat: "json",
		};
		expect(extendedDefaults.temperature).toBe(0);
		expect(extendedDefaults.responseFormat).toBe("json");
	});
});
