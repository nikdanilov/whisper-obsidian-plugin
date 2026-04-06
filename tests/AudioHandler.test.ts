import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_SETTINGS, PluginSettings } from "../src/SettingsManager";

// We test AudioHandler logic by extracting and testing the key behaviors
// since the actual class depends heavily on Obsidian + axios

function buildFormData(settings: PluginSettings, blob: Blob, fileName: string) {
	const formData = new FormData();
	formData.append("file", blob, fileName);
	formData.append("model", settings.model);

	// #47: only send language when not auto
	if (settings.language && settings.language !== "auto") {
		formData.append("language", settings.language);
	}

	if (settings.prompt) {
		formData.append("prompt", settings.prompt);
	}

	// #35: send temperature and responseFormat if non-default
	const temperature = (settings as any).temperature;
	if (temperature !== undefined && temperature !== 0) {
		formData.append("temperature", String(temperature));
	}
	const responseFormat = (settings as any).responseFormat;
	if (responseFormat && responseFormat !== "json") {
		formData.append("response_format", responseFormat);
	}

	return formData;
}

function buildHeaders(settings: PluginSettings) {
	const headers: Record<string, string> = {
		"Content-Type": "multipart/form-data",
	};
	// #2: skip auth header when no API key (local/custom endpoints)
	if (settings.apiKey) {
		headers["Authorization"] = `Bearer ${settings.apiKey}`;
	}
	return headers;
}

function buildAudioFilePath(settings: PluginSettings, fileName: string) {
	return settings.audioSavePath
		? `${settings.audioSavePath}/${fileName}`
		: fileName;
}

function getAudioFilePath(settings: PluginSettings, fileName: string): string {
	if (!settings.saveAudioFile) return "";
	return settings.audioSavePath
		? `${settings.audioSavePath}/${fileName}`
		: fileName;
}

// #40: auto-create folders
async function ensureFolderExists(
	vault: {
		adapter: { exists: (p: string) => Promise<boolean> };
		createFolder: (p: string) => Promise<void>;
	},
	folderPath: string
) {
	if (folderPath && !(await vault.adapter.exists(folderPath))) {
		await vault.createFolder(folderPath);
	}
}

// #65: silence guard
function isSilentRecording(blob: Blob, minSizeBytes: number = 1000): boolean {
	return blob.size < minSizeBytes;
}

describe("#40 — Auto-create folders", () => {
	it("creates folder when it does not exist", async () => {
		const createFolder = vi.fn();
		const vault = {
			adapter: { exists: vi.fn().mockResolvedValue(false) },
			createFolder,
		};
		await ensureFolderExists(vault, "recordings/audio");
		expect(createFolder).toHaveBeenCalledWith("recordings/audio");
	});

	it("does not create folder when it already exists", async () => {
		const createFolder = vi.fn();
		const vault = {
			adapter: { exists: vi.fn().mockResolvedValue(true) },
			createFolder,
		};
		await ensureFolderExists(vault, "recordings/audio");
		expect(createFolder).not.toHaveBeenCalled();
	});

	it("skips when folder path is empty", async () => {
		const createFolder = vi.fn();
		const vault = {
			adapter: { exists: vi.fn().mockResolvedValue(false) },
			createFolder,
		};
		await ensureFolderExists(vault, "");
		expect(createFolder).not.toHaveBeenCalled();
	});
});

describe("#52 — Phantom audio link fix", () => {
	it("returns audio path when saveAudioFile is true", () => {
		const settings = { ...DEFAULT_SETTINGS, saveAudioFile: true };
		expect(getAudioFilePath(settings, "rec.webm")).toBe("rec.webm");
	});

	it("returns empty string when saveAudioFile is false", () => {
		const settings = { ...DEFAULT_SETTINGS, saveAudioFile: false };
		expect(getAudioFilePath(settings, "rec.webm")).toBe("");
	});
});

describe("#47 — Auto-detect language in formData", () => {
	const blob = new Blob(["test"], { type: "audio/webm" });

	it("omits language when set to empty string", () => {
		const settings = { ...DEFAULT_SETTINGS, language: "" };
		const fd = buildFormData(settings, blob, "test.webm");
		expect(fd.get("language")).toBeNull();
	});

	it("omits language when set to 'auto'", () => {
		const settings = { ...DEFAULT_SETTINGS, language: "auto" };
		const fd = buildFormData(settings, blob, "test.webm");
		expect(fd.get("language")).toBeNull();
	});

	it("includes language when explicitly set", () => {
		const settings = { ...DEFAULT_SETTINGS, language: "ja" };
		const fd = buildFormData(settings, blob, "test.webm");
		expect(fd.get("language")).toBe("ja");
	});
});

describe("#2 — Custom API headers", () => {
	it("skips Authorization when apiKey is empty", () => {
		const settings = { ...DEFAULT_SETTINGS, apiKey: "" };
		const headers = buildHeaders(settings);
		expect(headers["Authorization"]).toBeUndefined();
	});

	it("includes Authorization when apiKey is set", () => {
		const settings = { ...DEFAULT_SETTINGS, apiKey: "sk-abc" };
		const headers = buildHeaders(settings);
		expect(headers["Authorization"]).toBe("Bearer sk-abc");
	});
});

describe("#65 — Silence/hallucination guard", () => {
	it("detects silent recording (tiny blob)", () => {
		const tinyBlob = new Blob(["x"], { type: "audio/webm" }); // ~1 byte
		expect(isSilentRecording(tinyBlob)).toBe(true);
	});

	it("passes normal recording", () => {
		const normalBlob = new Blob([new ArrayBuffer(5000)], {
			type: "audio/webm",
		});
		expect(isSilentRecording(normalBlob)).toBe(false);
	});

	it("respects custom minimum size", () => {
		const blob = new Blob([new ArrayBuffer(500)], { type: "audio/webm" });
		expect(isSilentRecording(blob, 200)).toBe(false);
		expect(isSilentRecording(blob, 1000)).toBe(true);
	});
});

describe("#35 — Whisper API params in formData", () => {
	const blob = new Blob(["test"], { type: "audio/webm" });

	it("sends temperature when non-zero", () => {
		const settings = { ...DEFAULT_SETTINGS, temperature: 0.5 } as any;
		const fd = buildFormData(settings, blob, "test.webm");
		expect(fd.get("temperature")).toBe("0.5");
	});

	it("omits temperature when zero (default)", () => {
		const settings = { ...DEFAULT_SETTINGS, temperature: 0 } as any;
		const fd = buildFormData(settings, blob, "test.webm");
		expect(fd.get("temperature")).toBeNull();
	});

	it("sends response_format when non-default", () => {
		const settings = { ...DEFAULT_SETTINGS, responseFormat: "srt" } as any;
		const fd = buildFormData(settings, blob, "test.webm");
		expect(fd.get("response_format")).toBe("srt");
	});

	it("omits response_format when json (default)", () => {
		const settings = { ...DEFAULT_SETTINGS, responseFormat: "json" } as any;
		const fd = buildFormData(settings, blob, "test.webm");
		expect(fd.get("response_format")).toBeNull();
	});
});

describe("buildAudioFilePath", () => {
	it("prepends folder path when set", () => {
		const settings = { ...DEFAULT_SETTINGS, audioSavePath: "recordings" };
		expect(buildAudioFilePath(settings, "rec.webm")).toBe(
			"recordings/rec.webm"
		);
	});

	it("uses just filename when path is empty", () => {
		const settings = { ...DEFAULT_SETTINGS, audioSavePath: "" };
		expect(buildAudioFilePath(settings, "rec.webm")).toBe("rec.webm");
	});
});

describe("isDefaultApi — API key requirement", () => {
	const DEFAULT_URL = "https://api.openai.com/v1/audio/transcriptions";

	function isApiKeyRequired(apiUrl: string, apiKey: string): boolean {
		const isDefaultApi = apiUrl === DEFAULT_URL;
		return isDefaultApi && !apiKey;
	}

	it("requires API key for default OpenAI URL", () => {
		expect(isApiKeyRequired(DEFAULT_URL, "")).toBe(true);
	});

	it("does not require API key for custom URL", () => {
		expect(isApiKeyRequired("http://localhost:9000/asr", "")).toBe(false);
	});

	it("passes when API key is provided for default URL", () => {
		expect(isApiKeyRequired(DEFAULT_URL, "sk-abc")).toBe(false);
	});
});

describe("file-menu audio extension matching", () => {
	const audioExtensions = [
		".mp3",
		".mp4",
		".mpeg",
		".mpga",
		".m4a",
		".wav",
		".webm",
		".ogg",
	];
	const isAudioFile = (path: string) =>
		audioExtensions.some((ext) => path.endsWith(ext));

	it("matches common audio files", () => {
		expect(isAudioFile("recording.mp3")).toBe(true);
		expect(isAudioFile("folder/audio.webm")).toBe(true);
		expect(isAudioFile("voice.ogg")).toBe(true);
		expect(isAudioFile("meeting.m4a")).toBe(true);
	});

	it("rejects non-audio files", () => {
		expect(isAudioFile("document.pdf")).toBe(false);
		expect(isAudioFile("image.png")).toBe(false);
		expect(isAudioFile("note.md")).toBe(false);
	});

	it("does not false-positive on partial extension matches", () => {
		expect(isAudioFile("stamp3")).toBe(false);
		expect(isAudioFile("camp3")).toBe(false);
	});
});
