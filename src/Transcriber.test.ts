import { test, jest, expect } from "@jest/globals";
import { Transcriber } from "./Transcriber";
import axios from "axios";
import Whisper from "main";
import { WhisperSettings } from "./SettingsManager";
import { App, Vault, Workspace } from "obsidian";

jest.mock("axios");
const mockAxios = jest.mocked(axios);
const { mockNotice } = require("obsidian");

let plugin: Whisper;
let audioData: Readonly<Uint8Array>;
let audioBlob: Blob;
let transcriber: Transcriber;

const audioFileName = "test.wav";
const apiUrl = "https://api.openai.com/v1/audio/transcriptions";

function createMockWorkspace() {
	return {
		getActiveViewOfType: jest.fn().mockReturnValue(null),
		openLinkText: jest.fn(),
	} as unknown as Workspace;
}

function createMockVault() {
	return {
		create: jest.fn(),
		adapter: {
			writeBinary: jest.fn(),
		},
	} as unknown as Vault;
}

function createMockPlugin(settings: Partial<WhisperSettings> = {}): Whisper {
	const defaultSettings: WhisperSettings = {
		apiKey: "test-api-key",
		apiUrl,
		model: "whisper-1",
		prompt: "Prompt",
		language: "en",
		saveAudioFile: false,
		saveAudioFilePath: "",
		debugMode: false,
		createNewFileAfterRecording: false,
		createNewFileAfterRecordingPath: "",
		...settings,
	};

	return {
		app: {
			workspace: createMockWorkspace(),
			vault: createMockVault(),
		} as App,
		settings: defaultSettings,
	} as Whisper;
}

beforeEach(() => {
	plugin = createMockPlugin();

	audioData = new Uint8Array([1, 2, 3]) as Readonly<Uint8Array>;
	audioBlob = new Blob([audioData as BlobPart], { type: "audio/wav" });
	transcriber = new Transcriber(plugin);
});

afterEach(() => {
	jest.resetAllMocks();
});

const transcription = "What a beautiful day!";

function setUpSuccessfulApiResponse() {
	mockAxios.post.mockResolvedValue({
		data: {
			text: transcription,
		},
	});
}

test("makes a request to the configured API URL with given audio blob", async () => {
	setUpSuccessfulApiResponse();

	await transcriber.transcribeAndSaveResults(audioBlob, audioFileName);

	expect(mockAxios.post).toHaveBeenCalledWith(
		apiUrl,
		expect.any(FormData),
		expect.objectContaining({
			headers: {
				"Content-Type": "multipart/form-data",
				Authorization: "Bearer test-api-key",
			},
		})
	);

	const formDataCall = mockAxios.post.mock.calls[0][1] as FormData;
	expect(formDataCall.get("model")).toBe("whisper-1");
	expect(formDataCall.get("language")).toBe("en");
	expect(formDataCall.get("prompt")).toBe("Prompt");

	const file = formDataCall.get("file");
	expect(file).toBeDefined();
	expect(file).toBeInstanceOf(File);
	expect((file as File).name).toBe(audioFileName);
	expect((file as File).size).toBe(audioBlob.size);
});

test("saves audio blob to file if corresponding setting is enabled", async () => {
	plugin = createMockPlugin({ saveAudioFile: true });
	transcriber = new Transcriber(plugin);

	setUpSuccessfulApiResponse();

	await transcriber.transcribeAndSaveResults(audioBlob, audioFileName);

	expect(plugin.app.vault.adapter.writeBinary).toHaveBeenCalledWith(
		audioFileName,
		audioData.buffer as ArrayBuffer
	);
});

test('pastes the transcription at the cursor if "Save transcription" is off and a note is opened', async () => {
	const cursorAtStart = { line: 0, ch: 0 };

	plugin.settings.createNewFileAfterRecording = false;
	const activeView = {
		editor: {
			getCursor: jest.fn().mockReturnValue(cursorAtStart),
			replaceRange: jest.fn(),
			setCursor: jest.fn(),
		},
	};
	(plugin.app.workspace.getActiveViewOfType as jest.Mock).mockReturnValue(
		activeView
	);

	setUpSuccessfulApiResponse();

	await transcriber.transcribeAndSaveResults(audioBlob, audioFileName);

	expect(activeView.editor.replaceRange).toHaveBeenCalledWith(
		transcription,
		cursorAtStart
	);
	expect(activeView.editor.setCursor).toHaveBeenCalledWith({
		line: 0,
		ch: transcription.length,
	});
});

test.each([
	[true, {}],
	[false, null],
])(
	"saves the transcription to a new note if 'Save transcription' is %s and active view is %s",
	async (createNewFileAfterRecording, activeView) => {
		plugin = createMockPlugin({ createNewFileAfterRecording });
		transcriber = new Transcriber(plugin);

		(plugin.app.workspace.getActiveViewOfType as jest.Mock).mockReturnValue(
			activeView
		);

		setUpSuccessfulApiResponse();

		await transcriber.transcribeAndSaveResults(audioBlob, audioFileName);

		expect(plugin.app.vault.create).toHaveBeenCalledWith(
			"test.md",
			`![[${audioFileName}]]\n${transcription}`
		);
	}
);

test("notices about missing API key and does nothing", async () => {
	plugin.settings.apiKey = "";

	await transcriber.transcribeAndSaveResults(audioBlob, audioFileName);

	expect(mockNotice).toHaveBeenCalledWith(
		"API key is missing. Please add your API key in the settings."
	);
});

test("notices about transcription error", async () => {
	mockAxios.post.mockRejectedValue(new Error("500 Internal Server Error"));

	await transcriber.transcribeAndSaveResults(audioBlob, audioFileName);

	expect(mockNotice).toHaveBeenCalledWith(
		"Error parsing audio: 500 Internal Server Error"
	);
});

test("notices about audio file saving error", async () => {
	plugin = createMockPlugin({ saveAudioFile: true });
	transcriber = new Transcriber(plugin);

	setUpSuccessfulApiResponse();

	(
		plugin.app.vault.adapter.writeBinary as jest.Mock<() => Promise<void>>
	).mockRejectedValue(new Error("Permission denied"));

	await transcriber.transcribeAndSaveResults(audioBlob, audioFileName);

	expect(mockNotice).toHaveBeenCalledWith(
		"Error saving audio file: Permission denied"
	);
});
