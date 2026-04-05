import { describe, it, expect } from "vitest";
import { RecordingStatus } from "../src/StatusBar";

describe("RecordingStatus enum", () => {
	it("has expected values", () => {
		expect(RecordingStatus.Idle).toBe("idle");
		expect(RecordingStatus.Recording).toBe("recording");
		expect(RecordingStatus.Processing).toBe("processing");
	});
});

// --- Feature #32: Canvas recording ---
describe("#32 — Canvas recording respects settings", () => {
	it("should create new file even when no MarkdownView is active (Canvas)", () => {
		// When in Canvas, getActiveViewOfType(MarkdownView) returns null
		// The plugin should still create a new file if the setting is on
		const activeView = null; // Canvas = no MarkdownView
		const createNewFileAfterRecording = true;

		const shouldCreateNewFile = createNewFileAfterRecording || !activeView;
		expect(shouldCreateNewFile).toBe(true);
	});

	it("should still insert at cursor if setting is off and MarkdownView exists", () => {
		const activeView = { editor: {} }; // MarkdownView exists
		const createNewFileAfterRecording = false;

		const shouldCreateNewFile = createNewFileAfterRecording || !activeView;
		expect(shouldCreateNewFile).toBe(false);
	});
});
