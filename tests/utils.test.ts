import { describe, it, expect } from "vitest";
import {
	getBaseFileName,
	getCursorContext,
	getExtensionFromMimeType,
	resolveTemplate,
	buildTemplateVariables,
} from "../src/utils";

describe("getBaseFileName", () => {
	it("strips extension from simple filename", () => {
		expect(getBaseFileName("recording.webm")).toBe("recording");
	});

	it("strips extension from path with directories", () => {
		expect(getBaseFileName("folder/sub/recording.mp3")).toBe("recording");
	});

	it("handles filenames with multiple dots", () => {
		expect(getBaseFileName("2024-01-01T12-00-00.000Z.webm")).toBe(
			"2024-01-01T12-00-00.000Z"
		);
	});

	it("returns empty string for file with no base name", () => {
		expect(getBaseFileName(".hidden")).toBe("");
	});
});

describe("getCursorContext", () => {
	const makeEditor = (text: string, cursorLine: number) => ({
		getValue: () => text,
		getCursor: () => ({ line: cursorLine }),
	});

	it("extracts lines around cursor", () => {
		const text = "line0\nline1\nline2\nline3\nline4\nline5\nline6";
		const editor = makeEditor(text, 3);
		const context = getCursorContext(editor, 2);
		expect(context).toBe("line1\nline2\nline3\nline4\nline5");
	});

	it("handles cursor at start of document", () => {
		const text = "first\nsecond\nthird";
		const editor = makeEditor(text, 0);
		const context = getCursorContext(editor, 2);
		expect(context).toBe("first\nsecond\nthird");
	});

	it("handles cursor at end of document", () => {
		const text = "first\nsecond\nthird";
		const editor = makeEditor(text, 2);
		const context = getCursorContext(editor, 1);
		expect(context).toBe("second\nthird");
	});

	it("returns empty string for empty document", () => {
		const editor = makeEditor("", 0);
		const context = getCursorContext(editor, 5);
		expect(context).toBe("");
	});
});

describe("getExtensionFromMimeType", () => {
	it("extracts extension from simple mime type", () => {
		expect(getExtensionFromMimeType("audio/webm")).toBe("webm");
	});

	it("strips codecs parameter", () => {
		expect(getExtensionFromMimeType("audio/webm;codecs=opus")).toBe("webm");
	});

	it("handles mp4 with codecs", () => {
		expect(getExtensionFromMimeType("audio/mp4;codecs=mp4a.40.2")).toBe("mp4");
	});

	it("returns webm for undefined", () => {
		expect(getExtensionFromMimeType(undefined)).toBe("webm");
	});

	it("handles audio/ogg", () => {
		expect(getExtensionFromMimeType("audio/ogg;codecs=opus")).toBe("ogg");
	});

	it("maps mpeg to mp3", () => {
		expect(getExtensionFromMimeType("audio/mpeg")).toBe("mp3");
	});
});

describe("resolveTemplate", () => {
	const vars = {
		date: "2026-04-05",
		time: "14-30-00",
		datetime: "2026-04-05 14:30:00",
		title: "Meeting Notes",
		transcription: "Hello world",
		audio: "![[recordings/rec.webm]]",
	};

	it("replaces all placeholders", () => {
		const result = resolveTemplate(
			"{{audio}}\n# {{title}}\n{{transcription}}",
			vars
		);
		expect(result).toBe(
			"![[recordings/rec.webm]]\n# Meeting Notes\nHello world"
		);
	});

	it("replaces date/time placeholders in filename", () => {
		const result = resolveTemplate("{{date}} {{title}}", vars);
		expect(result).toBe("2026-04-05 Meeting Notes");
	});

	it("handles multiple occurrences of same variable", () => {
		const result = resolveTemplate("{{date}} - {{date}}", vars);
		expect(result).toBe("2026-04-05 - 2026-04-05");
	});

	it("leaves unknown placeholders unchanged", () => {
		const result = resolveTemplate("{{unknown}} {{date}}", vars);
		expect(result).toBe("{{unknown}} 2026-04-05");
	});

	it("handles template with no placeholders", () => {
		const result = resolveTemplate("plain text", vars);
		expect(result).toBe("plain text");
	});

	it("handles empty audio ref gracefully", () => {
		const noAudioVars = { ...vars, audio: "" };
		const result = resolveTemplate("{{audio}}\n{{transcription}}", noAudioVars);
		expect(result).toBe("\nHello world");
	});
});

describe("buildTemplateVariables", () => {
	it("produces variables with correct types", () => {
		const vars = buildTemplateVariables("text", "title", "![[audio.webm]]");
		expect(vars.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(vars.time).toMatch(/^\d{2}-\d{2}-\d{2}$/);
		expect(vars.datetime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
		expect(vars.title).toBe("title");
		expect(vars.transcription).toBe("text");
		expect(vars.audio).toBe("![[audio.webm]]");
	});
});
