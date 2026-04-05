import { describe, it, expect } from "vitest";
import { getBaseFileName, getCursorContext } from "../src/utils";

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
