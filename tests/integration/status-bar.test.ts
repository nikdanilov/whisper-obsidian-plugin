import { describe, it, expect, beforeEach } from "vitest";
import { StatusBar, RecordingStatus } from "src/StatusBar";
import { createMockPlugin } from "../helpers/plugin-factory";

describe("StatusBar integration", () => {
	let statusBar: StatusBar;

	beforeEach(() => {
		document.body.innerHTML = "";
		const { plugin } = createMockPlugin();
		statusBar = new StatusBar(plugin as any);
	});

	it("should transition through Idle → Recording → Processing → Idle with correct CSS and text", () => {
		const el = statusBar.statusBarItem!;

		// Initial: Idle
		expect(el.textContent).toBe("Whisper Idle");
		expect(el.classList.contains("whisper-status--idle")).toBe(true);

		// Recording
		statusBar.updateStatus(RecordingStatus.Recording);
		expect(el.textContent).toBe("Recording...");
		expect(el.classList.contains("whisper-status--recording")).toBe(true);
		expect(el.classList.contains("whisper-status--idle")).toBe(false);

		// Processing
		statusBar.updateStatus(RecordingStatus.Processing);
		expect(el.textContent).toBe("Processing audio...");
		expect(el.classList.contains("whisper-status--processing")).toBe(true);
		expect(el.classList.contains("whisper-status--recording")).toBe(false);

		// Back to Idle
		statusBar.updateStatus(RecordingStatus.Idle);
		expect(el.textContent).toBe("Whisper Idle");
		expect(el.classList.contains("whisper-status--idle")).toBe(true);
		expect(el.classList.contains("whisper-status--processing")).toBe(false);
	});

	it("should remove the status bar element from DOM", () => {
		const el = statusBar.statusBarItem!;
		expect(document.body.contains(el)).toBe(true);

		statusBar.remove();
		expect(document.body.contains(el)).toBe(false);
	});
});
