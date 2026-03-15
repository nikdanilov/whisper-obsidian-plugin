import Whisper from "main";
import { ButtonComponent, Modal, Notice, setIcon } from "obsidian";
import { RecordingStatus } from "./StatusBar";

export class Controls extends Modal {
	private plugin: Whisper;
	private startButton: ButtonComponent;
	private pauseButton: ButtonComponent;
	private stopButton: ButtonComponent;
	private uploadButton: ButtonComponent;
	private timerDisplay: HTMLElement;
	private isStopping = false;

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
			.onClick(this.startRecording.bind(this))
			.buttonEl.addClass("button-component");
		this.setButtonIconAndText(this.startButton.buttonEl, "microphone", "Record");

		// Add pause button
		this.pauseButton = new ButtonComponent(buttonGroupEl);
		this.pauseButton
			.onClick(this.pauseRecording.bind(this))
			.buttonEl.addClass("button-component");
		this.setButtonIconAndText(this.pauseButton.buttonEl, "pause", "Pause");

		// Add stop button
		this.stopButton = new ButtonComponent(buttonGroupEl);
		this.stopButton
			.onClick(this.stopRecording.bind(this))
			.buttonEl.addClass("button-component");
		this.setButtonIconAndText(this.stopButton.buttonEl, "square", "Stop");

		// Add divider
		buttonGroupEl.createEl("div", { cls: "button-divider" });

		// Add upload button
		this.uploadButton = new ButtonComponent(buttonGroupEl);
		this.uploadButton
			.onClick(this.uploadAudio.bind(this))
			.buttonEl.addClass("button-component");
		this.setButtonIconAndText(this.uploadButton.buttonEl, "upload", "Upload");
	}

	async startRecording() {
		if (this.isStopping) {
			return;
		}

		if (this.plugin.settings.debugMode) {
			console.log("start");
		}
		this.plugin.statusBar.updateStatus(RecordingStatus.Recording);
		await this.plugin.recorder.startRecording();
		this.plugin.timer.start();
		this.resetGUI();
	}

	async pauseRecording() {
		if (this.isStopping) {
			return;
		}

		if (this.plugin.settings.debugMode) {
			console.log("pausing recording...");
		}
		await this.plugin.recorder.pauseRecording();
		this.plugin.timer.pause();
		this.resetGUI();
	}

	async stopRecording() {
		if (this.isStopping) {
			return;
		}

		this.isStopping = true;
		if (this.plugin.settings.debugMode) {
			console.log("stopping recording...");
		}
		this.plugin.statusBar.updateStatus(RecordingStatus.Processing);
		const blob = await this.plugin.recorder.stopRecording();
		this.plugin.timer.reset();
		this.resetGUI();

		const extension = this.plugin.recorder.getMimeType()?.split("/")[1];
		const fileName = `${new Date()
			.toISOString()
			.replace(/[:.]/g, "-")}.${extension}`;
		await this.plugin.audioHandler.sendAudioData(blob, fileName);
		this.plugin.statusBar.updateStatus(RecordingStatus.Idle);
		this.isStopping = false;
		this.close();
	}

	uploadAudio() {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "audio/*";

		fileInput.onchange = async (event) => {
			const files = (event.target as HTMLInputElement).files;
			if (files && files.length > 0) {
				const file = files[0];
				const maxSizeBytes =
					this.plugin.settings.maxFileSizeMB * 1024 * 1024;
				if (file.size > maxSizeBytes) {
					new Notice(
						`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed size of ${this.plugin.settings.maxFileSizeMB} MB.`
					);
					return;
				}
				this.plugin.statusBar.updateStatus(RecordingStatus.Processing);
				this.uploadButton.setDisabled(true);
				this.setButtonIconAndText(this.uploadButton.buttonEl, "clock", "Processing");
				try {
					const audioBlob = file.slice(0, file.size, file.type);
					await this.plugin.audioHandler.sendAudioData(audioBlob, file.name);
				} finally {
					this.uploadButton.setDisabled(false);
					this.setButtonIconAndText(this.uploadButton.buttonEl, "upload", "Upload");
					this.plugin.statusBar.updateStatus(RecordingStatus.Idle);
				}
				this.close();
			}
		};

		fileInput.click();
	}

	updateTimerDisplay() {
		this.timerDisplay.textContent = this.plugin.timer.getFormattedTime();
	}

	resetGUI() {
		const recorderState = this.plugin.recorder.getRecordingState();

		this.startButton.setDisabled(
			recorderState === "recording" || recorderState === "paused"
		);
		this.pauseButton.setDisabled(recorderState === "inactive");
		this.stopButton.setDisabled(recorderState === "inactive");

		const isPaused = recorderState === "paused";
		this.setButtonIconAndText(
			this.pauseButton.buttonEl,
			isPaused ? "play" : "pause",
			isPaused ? "Resume" : "Pause"
		);
	}

	private setButtonIconAndText(el: HTMLElement, icon: string, text: string) {
		el.empty();
		setIcon(el, icon);
		el.createSpan({ text });
	}
}
