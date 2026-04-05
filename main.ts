import { Notice, Plugin, TFile } from "obsidian";
import { Timer } from "src/Timer";
import { Controls } from "src/Controls";
import { AudioHandler } from "src/AudioHandler";
import { WhisperSettingsTab } from "src/WhisperSettingsTab";
import { SettingsManager, WhisperSettings } from "src/SettingsManager";
import { NativeAudioRecorder } from "src/AudioRecorder";
import { RecordingStatus, StatusBar } from "src/StatusBar";
import { getExtensionFromMimeType } from "src/utils";
import { RealtimeTranscriber } from "src/RealtimeTranscriber";
import { PCMAudioRecorder } from "src/PCMAudioRecorder";
export default class Whisper extends Plugin {
	settings: WhisperSettings;
	settingsManager: SettingsManager;
	timer: Timer;
	recorder: NativeAudioRecorder;
	audioHandler: AudioHandler;
	controls: Controls | null = null;
	statusBar: StatusBar;
	private realtimeTranscriber: RealtimeTranscriber | null = null;
	private pcmRecorder: PCMAudioRecorder | null = null;

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
		this.audioHandler = new AudioHandler(this);
		this.recorder = new NativeAudioRecorder();
		// Set initial device ID from settings
		const deviceId =
			this.settings.audioDeviceId === "default"
				? null
				: this.settings.audioDeviceId;
		this.recorder.setDeviceId(deviceId);

		this.statusBar = new StatusBar(this);

		this.addCommands();

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {

				if (!(file instanceof TFile)) return;

				const audioExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg'];
				if (!audioExtensions.some(ext => file.path.endsWith(ext))) return;

				menu.addItem((item) => {
					item
						.setTitle('Transcribe audio file 🔊')
						.setIcon('document')
						.onClick(async () => {
							const audioBlob = new Blob([await file.vault.readBinary(file)]);
							await this.audioHandler.sendAudioData(
								audioBlob,
								file.name
							);
						});
				});
			})
		);
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
					new Notice("Recording...");

					if (this.settings.useRealtimeTranscription) {
						this.realtimeTranscriber = new RealtimeTranscriber(
							{
								apiKey: this.settings.apiKey,
								apiUrl: this.settings.apiUrl,
								model: this.settings.model,
								language: this.settings.language,
								prompt: this.settings.prompt,
							},
							{
								onDelta: () => {},
								onCompleted: () => {},
								onError: (err) => new Notice("Transcription error: " + err),
							}
						);
						this.realtimeTranscriber.connect();

						this.pcmRecorder = new PCMAudioRecorder();
						const deviceId = this.settings.audioDeviceId === "default"
							? null : this.settings.audioDeviceId;
						this.pcmRecorder.setDeviceId(deviceId);
						this.pcmRecorder.setOnAudioData((pcm16) => {
							this.realtimeTranscriber?.sendAudio(pcm16);
						});
						await this.pcmRecorder.start();
					} else {
						await this.recorder.startRecording();
					}
				} else {
					this.statusBar.updateStatus(RecordingStatus.Processing);

					if (this.realtimeTranscriber) {
						await this.pcmRecorder?.stop();
						this.pcmRecorder = null;
						const transcript = this.realtimeTranscriber.getTranscript();
						this.realtimeTranscriber.disconnect();
						this.realtimeTranscriber = null;
						if (transcript) {
							await this.audioHandler.handleTranscription(transcript);
						}
					} else {
						const audioBlob = await this.recorder.stopRecording();
						const extension = getExtensionFromMimeType(
							this.recorder.getMimeType()
						);
						const fileName = `${new Date()
							.toISOString()
							.replace(/[:.]/g, "-")}.${extension}`;
						await this.audioHandler.sendAudioData(audioBlob, fileName);
					}

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
				fileInput.accept = "audio/*,video/*,.mp4,.m4a,.wav,.webm,.ogg,.mp3";

				// Handle file selection
				fileInput.onchange = async (event) => {
					const files = (event.target as HTMLInputElement).files;
					if (files && files.length > 0) {
						const file = files[0];
						let fileName = file.name;
						if (this.settings.ignoreUploadFilename) {
							const extension = file.name.split(".").pop();
							fileName = `${new Date()
								.toISOString()
								.replace(/[:.]/g, "-")}.${extension}`;
						}
						const audioBlob = file.slice(0, file.size, file.type);
						// Use audioBlob to send or save the uploaded audio as needed
						await this.audioHandler.sendAudioData(
							audioBlob,
							fileName
						);
					}
				};

				// Programmatically open the file dialog
				fileInput.click();
			},
		});

		this.addCommand({
			id: "pause-resume-recording",
			name: "Pause/resume recording",
			callback: async () => {
				if (this.realtimeTranscriber) {
					new Notice("Pause not supported in realtime mode");
					return;
				}

				const state = this.recorder.getRecordingState();
				if (state === "recording") {
					await this.recorder.pauseRecording();
					new Notice("Recording paused");
				} else if (state === "paused") {
					await this.recorder.pauseRecording();
					new Notice("Recording resumed");
				}
			},
		});

		this.addCommand({
			id: "open-recording-controls",
			name: "Open recording controls",
			callback: () => {
				if (!this.controls) {
					this.controls = new Controls(this);
				}
				this.controls.open();
			},
		});
	}
}
