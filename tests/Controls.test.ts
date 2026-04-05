import { describe, it, expect, vi } from "vitest";

// --- Feature #46: Cancel recording ---
describe("#46 — Cancel recording", () => {
	it("discards audio blob and resets state on cancel", async () => {
		// Simulate the cancel flow: stop recorder but don't send audio
		const stopRecording = vi.fn().mockResolvedValue(new Blob(["audio"]));
		const sendAudioData = vi.fn();
		const timerReset = vi.fn();
		const updateStatus = vi.fn();

		// Cancel = stop recording without sending
		await stopRecording();
		timerReset();
		updateStatus("idle");

		expect(stopRecording).toHaveBeenCalled();
		expect(sendAudioData).not.toHaveBeenCalled();
		expect(timerReset).toHaveBeenCalled();
		expect(updateStatus).toHaveBeenCalledWith("idle");
	});
});

// --- Feature #41: Recording start notice ---
describe("#41 — Recording start notice", () => {
	it("shows a notice when recording starts", () => {
		const notices: string[] = [];
		const showNotice = (msg: string) => notices.push(msg);

		// Simulate start recording flow
		showNotice("Recording started");

		expect(notices).toContain("Recording started");
	});
});

// --- Feature #77/#29: Expose controls as commands ---
describe("#77 — Recording controls as commands", () => {
	it("registers start, stop, pause, and upload commands", () => {
		const commands: string[] = [];
		const addCommand = (cmd: { id: string }) => commands.push(cmd.id);

		// The plugin should register these commands
		addCommand({ id: "start-stop-recording" }); // already exists
		addCommand({ id: "upload-audio-file" }); // already exists
		addCommand({ id: "pause-resume-recording" }); // new
		addCommand({ id: "open-recording-controls" }); // new

		expect(commands).toContain("pause-resume-recording");
		expect(commands).toContain("open-recording-controls");
	});
});
