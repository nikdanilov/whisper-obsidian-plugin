import Whisper from "main";
import { ButtonComponent, Modal, Notice } from "obsidian";
import { RecordingStatus } from "./StatusBar";
import { getExtensionFromMimeType } from "./utils";

export class Controls extends Modal {
	private plugin: Whisper;
	private startButton: ButtonComponent;
	private pauseButton: ButtonComponent;
	private stopButton: ButtonComponent;
	private cancelButton: ButtonComponent;
	private timerDisplay: HTMLElement;

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

		// Add button group
		const buttonGroupEl = this.contentEl.createEl("div", {
			cls: "button-group",
		});

		// Add record button
		this.startButton = new ButtonComponent(buttonGroupEl);
		this.startButton
			.setIcon("circle")
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

		this.resetGUI();
	}

	async startRecording() {
		this.plugin.statusBar.updateStatus(RecordingStatus.Recording);
		await this.plugin.recorder.startRecording();
		this.plugin.timer.start();
		new Notice("Recording...");
		this.resetGUI();
	}

	async pauseRecording() {
		const wasPaused = this.plugin.recorder.getRecordingState() === "paused";
		await this.plugin.recorder.pauseRecording();
		this.plugin.timer.pause();
		this.plugin.statusBar.updateStatus(
			wasPaused ? RecordingStatus.Recording : RecordingStatus.Paused
		);
		new Notice(wasPaused ? "Recording resumed" : "Recording paused");
		this.resetGUI();
	}

	async stopRecording() {
		this.plugin.statusBar.updateStatus(RecordingStatus.Processing);
		const blob = await this.plugin.recorder.stopRecording();
		this.plugin.timer.reset();
		this.resetGUI();

		const extension = getExtensionFromMimeType(
			this.plugin.recorder.getMimeType()
		);
		const fileName = `${new Date()
			.toISOString()
			.replace(/[:.]/g, "-")}.${extension}`;
		await this.plugin.audioHandler.sendAudioData(blob, fileName);
		this.plugin.statusBar.updateStatus(RecordingStatus.Idle);
		this.close();
	}

	async cancelRecording() {
		await this.plugin.recorder.stopRecording();
		this.plugin.timer.reset();
		this.plugin.statusBar.updateStatus(RecordingStatus.Idle);
		new Notice("Recording cancelled");
		this.resetGUI();
		this.close();
	}

	updateTimerDisplay() {
		this.timerDisplay.textContent = this.plugin.timer.getFormattedTime();
	}

	resetGUI() {
		const recorderState = this.plugin.recorder.getRecordingState();
		const isIdle = recorderState === "inactive" || !recorderState;
		const isPaused = recorderState === "paused";

		// Record: only visible when idle
		this.startButton.buttonEl.style.display = isIdle ? "" : "none";
		this.startButton.buttonEl.empty();
		this.startButton.buttonEl.empty();
		this.startButton.setIcon("circle");
		this.startButton.buttonEl.appendText(" Record");

		// Pause/Resume: visible when recording or paused
		this.pauseButton.buttonEl.style.display = isIdle ? "none" : "";
		this.pauseButton.buttonEl.empty();
		this.pauseButton.setIcon(isPaused ? "play" : "pause");
		this.pauseButton.buttonEl.appendText(isPaused ? " Resume" : " Pause");

		// Stop: visible when recording or paused
		this.stopButton.buttonEl.style.display = isIdle ? "none" : "";
		this.stopButton.buttonEl.empty();
		this.stopButton.setIcon("square");
		this.stopButton.buttonEl.appendText(" Stop");

		// Cancel: visible when recording or paused
		this.cancelButton.buttonEl.style.display = isIdle ? "none" : "";
		this.cancelButton.buttonEl.empty();
		this.cancelButton.setIcon("x");
		this.cancelButton.buttonEl.appendText(" Cancel");
	}
}
