import Whisper from "main";
import { ButtonComponent, Modal, Notice } from "obsidian";
import { RecordingStatus } from "./StatusBar";
import { getExtensionFromMimeType } from "./utils";
import { RealtimeTranscriber } from "./RealtimeTranscriber";
import { PCMAudioRecorder } from "./PCMAudioRecorder";

export class Controls extends Modal {
	private plugin: Whisper;
	private startButton: ButtonComponent;
	private pauseButton: ButtonComponent;
	private stopButton: ButtonComponent;
	private cancelButton: ButtonComponent;
	private timerDisplay: HTMLElement;
	private transcriptDisplay: HTMLElement;
	private realtimeTranscriber: RealtimeTranscriber | null = null;
	private pcmRecorder: PCMAudioRecorder | null = null;

	constructor(plugin: Whisper) {
		super(plugin.app);
		this.plugin = plugin;
		this.containerEl.addClass("recording-controls");

		// Add elapsed time display
		this.timerDisplay = this.contentEl.createEl("div", { cls: "timer" });
		this.updateTimerDisplay();

		// Set onUpdate callback for the timer
		this.plugin.timer.setOnUpdate(() => {
			this.updateTimerDisplay();
		});

		// Add live transcript display (hidden until realtime mode)
		this.transcriptDisplay = this.contentEl.createEl("div", {
			cls: "transcript-preview",
		});
		this.transcriptDisplay.style.display = "none";

		// Add button group
		const buttonGroupEl = this.contentEl.createEl("div", {
			cls: "button-group",
		});

		// Add record button
		this.startButton = new ButtonComponent(buttonGroupEl);
		this.startButton
			.setIcon("microphone")
			.setButtonText(" Record")
			.onClick(this.startRecording.bind(this))
			.buttonEl.addClass("button-component");

		// Add pause button
		this.pauseButton = new ButtonComponent(buttonGroupEl);
		this.pauseButton
			.setIcon("pause")
			.setButtonText(" Pause")
			.onClick(this.pauseRecording.bind(this))
			.buttonEl.addClass("button-component");

		// Add stop button
		this.stopButton = new ButtonComponent(buttonGroupEl);
		this.stopButton
			.setIcon("square")
			.setButtonText(" Stop")
			.onClick(this.stopRecording.bind(this))
			.buttonEl.addClass("button-component");

		// Add cancel button
		this.cancelButton = new ButtonComponent(buttonGroupEl);
		this.cancelButton
			.setIcon("x")
			.setButtonText(" Cancel")
			.onClick(this.cancelRecording.bind(this))
			.buttonEl.addClass("button-component");
	}

	async startRecording() {
		this.plugin.statusBar.updateStatus(RecordingStatus.Recording);
		this.plugin.timer.start();
		new Notice("Recording...");

		if (this.plugin.settings.useRealtimeTranscription) {
			await this.startRealtimeRecording();
		} else {
			await this.plugin.recorder.startRecording();
		}

		this.resetGUI();
	}

	private async startRealtimeRecording(): Promise<void> {
		this.transcriptDisplay.style.display = "block";
		this.transcriptDisplay.textContent = "";

		// Hide pause button — not supported in realtime mode
		this.pauseButton.buttonEl.style.display = "none";

		this.realtimeTranscriber = new RealtimeTranscriber(
			{
				apiKey: this.plugin.settings.apiKey,
				apiUrl: this.plugin.settings.apiUrl,
				model: this.plugin.settings.model,
				language: this.plugin.settings.language,
				prompt: this.plugin.settings.prompt,
			},
			{
				onDelta: (text) => {
					this.transcriptDisplay.textContent += text;
				},
				onCompleted: (fullText) => {
					this.transcriptDisplay.textContent = fullText;
				},
				onError: (error) => {
					new Notice("Transcription error: " + error);
				},
			}
		);

		this.realtimeTranscriber.connect();

		this.pcmRecorder = new PCMAudioRecorder();
		const deviceId =
			this.plugin.settings.audioDeviceId === "default"
				? null
				: this.plugin.settings.audioDeviceId;
		this.pcmRecorder.setDeviceId(deviceId);
		this.pcmRecorder.setOnAudioData((pcm16) => {
			this.realtimeTranscriber?.sendAudio(pcm16);
		});
		await this.pcmRecorder.start();
	}

	async pauseRecording() {
		await this.plugin.recorder.pauseRecording();
		this.plugin.timer.pause();
		this.resetGUI();
	}

	async stopRecording() {
		this.plugin.statusBar.updateStatus(RecordingStatus.Processing);
		this.plugin.timer.reset();

		if (this.realtimeTranscriber) {
			await this.stopRealtimeRecording();
		} else {
			await this.stopBatchRecording();
		}

		this.plugin.statusBar.updateStatus(RecordingStatus.Idle);
		this.close();
	}

	private async stopBatchRecording(): Promise<void> {
		const blob = await this.plugin.recorder.stopRecording();
		this.resetGUI();

		const extension = getExtensionFromMimeType(
			this.plugin.recorder.getMimeType()
		);
		const fileName = `${new Date()
			.toISOString()
			.replace(/[:.]/g, "-")}.${extension}`;
		await this.plugin.audioHandler.sendAudioData(blob, fileName);
	}

	private async stopRealtimeRecording(): Promise<void> {
		await this.pcmRecorder?.stop();
		this.pcmRecorder = null;

		const transcript = this.realtimeTranscriber?.getTranscript() || "";
		this.realtimeTranscriber?.disconnect();
		this.realtimeTranscriber = null;

		if (transcript) {
			await this.plugin.audioHandler.handleTranscription(transcript);
		}
	}

	async cancelRecording() {
		if (this.realtimeTranscriber) {
			await this.pcmRecorder?.stop();
			this.pcmRecorder = null;
			this.realtimeTranscriber.disconnect();
			this.realtimeTranscriber = null;
		} else {
			await this.plugin.recorder.stopRecording();
		}

		this.plugin.timer.reset();
		this.plugin.statusBar.updateStatus(RecordingStatus.Idle);
		this.resetGUI();
		this.close();
	}

	updateTimerDisplay() {
		this.timerDisplay.textContent = this.plugin.timer.getFormattedTime();
	}

	resetGUI() {
		const isRealtime = this.plugin.settings.useRealtimeTranscription;

		if (isRealtime) {
			const isRecording = this.pcmRecorder !== null;
			this.startButton.setDisabled(isRecording);
			this.pauseButton.buttonEl.style.display = "none";
			this.stopButton.setDisabled(!isRecording);
			this.cancelButton.setDisabled(!isRecording);
		} else {
			const recorderState = this.plugin.recorder.getRecordingState();
			this.startButton.setDisabled(
				recorderState === "recording" || recorderState === "paused"
			);
			this.pauseButton.buttonEl.style.display = "";
			this.pauseButton.setDisabled(recorderState === "inactive");
			this.stopButton.setDisabled(recorderState === "inactive");
			this.cancelButton.setDisabled(recorderState === "inactive");

			this.pauseButton.setButtonText(
				recorderState === "paused" ? " Resume" : " Pause"
			);
		}
	}
}
