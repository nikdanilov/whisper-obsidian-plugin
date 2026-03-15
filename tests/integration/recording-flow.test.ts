import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timer } from "src/Timer";
import { StatusBar, RecordingStatus } from "src/StatusBar";
import { AudioHandler } from "src/AudioHandler";
import { requestUrl } from "obsidian";
import { createMockPlugin } from "../helpers/plugin-factory";

/**
 * Integration test: verifies that Timer, StatusBar, and AudioHandler
 * work together through a simulated recording lifecycle.
 */
describe("Recording flow integration", () => {
	let plugin: any;
	let timer: Timer;
	let statusBar: StatusBar;
	let audioHandler: AudioHandler;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		document.body.innerHTML = "";

		const created = createMockPlugin();
		plugin = created.plugin;

		timer = new Timer();
		statusBar = new StatusBar(plugin as any);
		audioHandler = new AudioHandler(plugin);

		plugin.timer = timer;
		plugin.statusBar = statusBar;
		plugin.audioHandler = audioHandler;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("start recording: timer starts, statusBar transitions to Recording", () => {
		// Simulate what Controls.startRecording / command handler does
		statusBar.updateStatus(RecordingStatus.Recording);
		timer.start();

		expect(statusBar.status).toBe(RecordingStatus.Recording);
		expect(statusBar.statusBarItem!.textContent).toBe("Recording...");

		// Timer ticks for 3 seconds
		vi.advanceTimersByTime(3_000);
		expect(timer.getFormattedTime()).toBe("00:00:03");
	});

	it("stop recording: audio sent, timer reset, statusBar ends at Idle", async () => {
		vi.mocked(requestUrl).mockResolvedValue({
			json: { text: "test transcription" },
		} as any);

		// Start
		statusBar.updateStatus(RecordingStatus.Recording);
		timer.start();
		vi.advanceTimersByTime(5_000);

		// Stop — mirrors Controls.stopRecording flow
		statusBar.updateStatus(RecordingStatus.Processing);
		expect(statusBar.status).toBe(RecordingStatus.Processing);

		const blob = new Blob([new Uint8Array(100)], { type: "audio/webm" });
		timer.reset();
		expect(timer.getFormattedTime()).toBe("00:00:00");

		// Send audio data (the actual API interaction)
		await audioHandler.sendAudioData(blob, "recording.webm");

		// Transition back to Idle
		statusBar.updateStatus(RecordingStatus.Idle);
		expect(statusBar.status).toBe(RecordingStatus.Idle);
		expect(statusBar.statusBarItem!.textContent).toBe("Whisper Idle");

		// Verify API was called and note was created
		expect(requestUrl).toHaveBeenCalledTimes(1);
		expect(plugin.app.vault.create).toHaveBeenCalledTimes(1);
	});
});
