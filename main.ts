import { Plugin } from "obsidian";
import { Timer } from "src/Timer";
import { Controls } from "src/Controls";
import { Transcriber } from "src/Transcriber";
import { WhisperSettingsTab } from "src/WhisperSettingsTab";
import { SettingsManager, WhisperSettings } from "src/SettingsManager";
import { NativeAudioRecorder } from "src/AudioRecorder";
import { RecordingStatus, StatusBar } from "src/StatusBar";
export default class Whisper extends Plugin {
	settings: WhisperSettings;
	settingsManager: SettingsManager;
	timer: Timer;
	recorder: NativeAudioRecorder;
	transcriber: Transcriber;
	controls: Controls | null = null;
	statusBar: StatusBar;

	async onload() {
		this.settingsManager = new SettingsManager(this);
		this.settings = await this.settingsManager.loadSettings();

		this.addRibbonIcon("activity", "Open recording controls", (evt) => {
			if (!this.controls) {
				this.controls = new Controls(this);
			}
			this.controls.open();
		});

		this.addSettingTab(new WhisperSettingsTab(this.app, this));

		this.timer = new Timer();
		this.transcriber = new Transcriber(this);
		this.recorder = new NativeAudioRecorder();

		this.statusBar = new StatusBar(this);

		this.addCommands();
	}

	onunload() {
		if (this.controls) {
			this.controls.close();
		}

		this.statusBar.remove();
	}

	addCommands() {
		this.addCommand({
			id: "start-stop-recording",
			name: "Start/stop recording",
			callback: async () => {
				if (this.statusBar.status !== RecordingStatus.Recording) {
					this.statusBar.updateStatus(RecordingStatus.Recording);
					await this.recorder.startRecording();
				} else {
					this.statusBar.updateStatus(RecordingStatus.Processing);
					const audioBlob = await this.recorder.stopRecording();
					const extension = this.recorder
						.getMimeType()
						?.split("/")[1];
					const fileName = `${new Date()
						.toISOString()
						.replace(/[:.]/g, "-")}.${extension}`;
					// Use audioBlob to send or save the recorded audio as needed
					await this.transcriber.transcribeAndSaveResults(
						audioBlob,
						fileName
					);
					this.statusBar.updateStatus(RecordingStatus.Idle);
				}
			},
			hotkeys: [
				{
					modifiers: ["Alt"],
					key: "Q",
				},
			],
		});

		this.addCommand({
			id: "upload-audio-file",
			name: "Upload audio file",
			callback: () => {
				// Create an input element for file selection
				const fileInput = document.createElement("input");
				fileInput.type = "file";
				fileInput.accept = "audio/*"; // Accept only audio files

				// Handle file selection
				fileInput.onchange = async (event) => {
					const files = (event.target as HTMLInputElement).files;
					if (files && files.length > 0) {
						const file = files[0];
						const fileName = file.name;
						const audioBlob = file.slice(0, file.size, file.type);
						// Use audioBlob to send or save the uploaded audio as needed
						await this.transcriber.transcribeAndSaveResults(
							audioBlob,
							fileName
						);
					}
				};

				// Programmatically open the file dialog
				fileInput.click();
			},
		});
	}
}
