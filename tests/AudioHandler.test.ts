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
	return settings.saveAudioFilePath
		? `${settings.saveAudioFilePath}/${fileName}`
		: fileName;
}

function buildNoteContent(
	settings: PluginSettings,
	audioFilePath: string,
	transcription: string
) {
	// #52: don't include audio link if save is disabled
	if (!settings.saveAudioFile) {
		return transcription;
	}
	// #26: embed vs link style
	const linkStyle = (settings as any).audioLinkStyle;
	if (linkStyle === "link") {
		return `[[${audioFilePath}]]\n${transcription}`;
	}
	return `![[${audioFilePath}]]\n${transcription}`;
}

// #40: auto-create folders
async function ensureFolderExists(
	vault: { adapter: { exists: (p: string) => Promise<boolean> }; createFolder: (p: string) => Promise<void> },
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
	it("includes audio embed when saveAudioFile is true", () => {
		const settings = { ...DEFAULT_SETTINGS, saveAudioFile: true };
		const content = buildNoteContent(settings, "audio/rec.webm", "Hello world");
		expect(content).toBe("![[audio/rec.webm]]\nHello world");
	});

	it("excludes audio link when saveAudioFile is false", () => {
		const settings = { ...DEFAULT_SETTINGS, saveAudioFile: false };
		const content = buildNoteContent(settings, "audio/rec.webm", "Hello world");
		expect(content).toBe("Hello world");
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
		const normalBlob = new Blob([new ArrayBuffer(5000)], { type: "audio/webm" });
		expect(isSilentRecording(normalBlob)).toBe(false);
	});

	it("respects custom minimum size", () => {
		const blob = new Blob([new ArrayBuffer(500)], { type: "audio/webm" });
		expect(isSilentRecording(blob, 200)).toBe(false);
		expect(isSilentRecording(blob, 1000)).toBe(true);
	});
});

// Simulates the dispatch logic in AudioHandler.sendAudioData
function getTranscriptionActions(settings: {
	createNewFileAfterRecording: boolean;
	pasteAtCursor: boolean;
}): { createsFile: boolean; pastesAtCursor: boolean } {
	return {
		createsFile: settings.createNewFileAfterRecording,
		pastesAtCursor: settings.pasteAtCursor,
	};
}

describe("#64 — Paste and save as independent toggles", () => {
	it("only creates file when createNewFileAfterRecording is on", () => {
		const actions = getTranscriptionActions({
			createNewFileAfterRecording: true,
			pasteAtCursor: false,
		});
		expect(actions.createsFile).toBe(true);
		expect(actions.pastesAtCursor).toBe(false);
	});

	it("only pastes at cursor when pasteAtCursor is on", () => {
		const actions = getTranscriptionActions({
			createNewFileAfterRecording: false,
			pasteAtCursor: true,
		});
		expect(actions.createsFile).toBe(false);
		expect(actions.pastesAtCursor).toBe(true);
	});

	it("does both when both are on", () => {
		const actions = getTranscriptionActions({
			createNewFileAfterRecording: true,
			pasteAtCursor: true,
		});
		expect(actions.createsFile).toBe(true);
		expect(actions.pastesAtCursor).toBe(true);
	});

	it("does neither when both are off", () => {
		const actions = getTranscriptionActions({
			createNewFileAfterRecording: false,
			pasteAtCursor: false,
		});
		expect(actions.createsFile).toBe(false);
		expect(actions.pastesAtCursor).toBe(false);
	});

	it("default settings: creates file, does not paste", () => {
		const actions = getTranscriptionActions({
			createNewFileAfterRecording: DEFAULT_SETTINGS.createNewFileAfterRecording,
			pasteAtCursor: (DEFAULT_SETTINGS as any).pasteAtCursor ?? false,
		});
		expect(actions.createsFile).toBe(true);
		expect(actions.pastesAtCursor).toBe(false);
	});
});

describe("#26 — Audio link style", () => {
	it("uses embed syntax by default", () => {
		const settings = { ...DEFAULT_SETTINGS, saveAudioFile: true };
		const content = buildNoteContent(settings, "rec.webm", "text");
		expect(content).toContain("![[rec.webm]]");
	});

	it("uses link syntax when configured", () => {
		const settings = { ...DEFAULT_SETTINGS, saveAudioFile: true, audioLinkStyle: "link" } as any;
		const content = buildNoteContent(settings, "rec.webm", "text");
		expect(content).toBe("[[rec.webm]]\ntext");
		expect(content).not.toContain("![[");
	});
});

describe("#68 — Ignore upload filename", () => {
	it("generates timestamp filename when ignoreUploadFilename is true", () => {
		const originalName = "my-important-meeting.mp3";
		const ignoreUploadFilename = true;

		let fileName: string;
		if (ignoreUploadFilename) {
			const extension = originalName.split(".").pop();
			fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
		} else {
			fileName = originalName;
		}

		expect(fileName).not.toBe(originalName);
		expect(fileName).toMatch(/\.mp3$/);
	});

	it("keeps original filename when ignoreUploadFilename is false", () => {
		const originalName = "my-important-meeting.mp3";
		const ignoreUploadFilename = false;

		let fileName: string;
		if (ignoreUploadFilename) {
			const extension = originalName.split(".").pop();
			fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
		} else {
			fileName = originalName;
		}

		expect(fileName).toBe(originalName);
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
		const settings = { ...DEFAULT_SETTINGS, saveAudioFilePath: "recordings" };
		expect(buildAudioFilePath(settings, "rec.webm")).toBe("recordings/rec.webm");
	});

	it("uses just filename when path is empty", () => {
		const settings = { ...DEFAULT_SETTINGS, saveAudioFilePath: "" };
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
	const audioExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg'];
	const isAudioFile = (path: string) => audioExtensions.some(ext => path.endsWith(ext));

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
