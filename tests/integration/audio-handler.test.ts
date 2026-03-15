import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioHandler } from "src/AudioHandler";
import { requestUrl, MarkdownView } from "obsidian";
import { createMockPlugin } from "../helpers/plugin-factory";

describe("AudioHandler integration", () => {
	let handler: AudioHandler;
	let plugin: any;
	let mockLeaf: any;

	beforeEach(() => {
		vi.clearAllMocks();
		const created = createMockPlugin();
		plugin = created.plugin;
		mockLeaf = created.mockLeaf;
		handler = new AudioHandler(plugin);
	});

	function makeBlob(sizeBytes: number, type = "audio/webm"): Blob {
		return new Blob([new Uint8Array(sizeBytes)], { type });
	}

	it("happy path: sends audio to API and creates a new note", async () => {
		const transcriptionText = "Hello world";
		vi.mocked(requestUrl).mockResolvedValue({
			json: { text: transcriptionText },
		} as any);

		const blob = makeBlob(1000);
		await handler.sendAudioData(blob, "test.webm");

		// requestUrl was called with correct URL and auth header
		expect(requestUrl).toHaveBeenCalledTimes(1);
		const callArgs = vi.mocked(requestUrl).mock.calls[0][0] as any;
		expect(callArgs.url).toBe(plugin.settings.apiUrl);
		expect(callArgs.headers.Authorization).toBe(`Bearer ${plugin.settings.apiKey}`);
		expect(callArgs.headers["Content-Type"]).toContain("multipart/form-data; boundary=");

		// New note created (createNewFileAfterRecording defaults to true)
		expect(plugin.app.vault.create).toHaveBeenCalledTimes(1);
		const [notePath, noteContent] = plugin.app.vault.create.mock.calls[0];
		expect(notePath).toBe("test.md");
		expect(noteContent).toContain(transcriptionText);

		// Opened in a new leaf
		expect(mockLeaf.openFile).toHaveBeenCalledTimes(1);
	});

	it("rejects files exceeding maxFileSizeMB without calling the API", async () => {
		plugin.settings.maxFileSizeMB = 1;
		const blob = makeBlob(2 * 1024 * 1024); // 2 MB

		await handler.sendAudioData(blob, "big.webm");

		expect(requestUrl).not.toHaveBeenCalled();
		expect(plugin.app.vault.create).not.toHaveBeenCalled();
	});

	it("handles API error gracefully without crashing", async () => {
		vi.mocked(requestUrl).mockRejectedValue(new Error("Network failure"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const blob = makeBlob(1000);
		await handler.sendAudioData(blob, "err.webm");

		consoleSpy.mockRestore();

		// No vault note created on error
		expect(plugin.app.vault.create).not.toHaveBeenCalled();
	});

	it("saves audio file to vault when saveAudioFile is enabled", async () => {
		plugin.settings.saveAudioFile = true;
		plugin.settings.saveAudioFilePath = "recordings";
		vi.mocked(requestUrl).mockResolvedValue({ json: { text: "hi" } } as any);

		const blob = makeBlob(500);
		await handler.sendAudioData(blob, "clip.webm");

		expect(plugin.app.vault.adapter.writeBinary).toHaveBeenCalledTimes(1);
		const [path] = plugin.app.vault.adapter.writeBinary.mock.calls[0];
		expect(path).toBe("recordings/clip.webm");
	});

	it("inserts transcription at cursor when not creating a new file", async () => {
		plugin.settings.createNewFileAfterRecording = false;

		// Simulate an active MarkdownView with an editor
		const mockEditor = {
			getCursor: vi.fn().mockReturnValue({ line: 5, ch: 10 }),
			replaceRange: vi.fn(),
			setCursor: vi.fn(),
		};
		const mockView = new MarkdownView();
		mockView.editor = mockEditor;
		plugin.app.workspace.getActiveViewOfType.mockReturnValue(mockView);

		vi.mocked(requestUrl).mockResolvedValue({
			json: { text: "transcribed text" },
		} as any);

		const blob = makeBlob(1000);
		await handler.sendAudioData(blob, "cursor.webm");

		// Should NOT create a new file
		expect(plugin.app.vault.create).not.toHaveBeenCalled();

		// Should insert at cursor
		expect(mockEditor.replaceRange).toHaveBeenCalledWith(
			"transcribed text",
			{ line: 5, ch: 10 }
		);
		expect(mockEditor.setCursor).toHaveBeenCalled();
	});
});
