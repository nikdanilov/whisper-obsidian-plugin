import Whisper from "main";
import { ButtonComponent, Modal } from "obsidian";
import { RecordingStatus } from "./StatusBar";

export class Controls extends Modal {
	private plugin: Whisper;
	private startButton: ButtonComponent;
	private pauseButton: ButtonComponent;
	private stopButton: ButtonComponent;
	private cancelButton: ButtonComponent;
	private timerDisplay: HTMLElement;
	private statusListener: () => void;

	constructor(plugin: Whisper) {
		super(plugin.app);
		this.plugin = plugin;
		this.containerEl.addClass("recording-controls");

		this.timerDisplay = this.contentEl.createEl("div", { cls: "timer" });
		this.updateTimerDisplay();

		this.plugin.timer.setOnUpdate(() => {
			this.updateTimerDisplay();
		});

		const buttonGroupEl = this.contentEl.createEl("div", {
			cls: "button-group",
		});

		this.startButton = new ButtonComponent(buttonGroupEl);
		this.startButton
			.setIcon("circle")
			.setButtonText(" Record")
			.onClick(() => this.plugin.startRecording())
			.buttonEl.addClass("button-component");

		this.pauseButton = new ButtonComponent(buttonGroupEl);
		this.pauseButton
			.setIcon("pause")
			.setButtonText(" Pause")
			.onClick(() => this.plugin.pauseRecording())
			.buttonEl.addClass("button-component");

		this.stopButton = new ButtonComponent(buttonGroupEl);
		this.stopButton
			.setIcon("square")
			.setButtonText(" Stop")
			.onClick(async () => {
				await this.plugin.stopRecording();
				this.close();
			})
			.buttonEl.addClass("button-component");

		this.cancelButton = new ButtonComponent(buttonGroupEl);
		this.cancelButton
			.setIcon("x")
			.setButtonText(" Cancel")
			.onClick(async () => {
				await this.plugin.cancelRecording();
				this.close();
			})
			.buttonEl.addClass("button-component");

		this.resetGUI();

		this.statusListener = () => {
			this.resetGUI();
			this.updateTimerDisplay();
		};
		this.plugin.statusBar.onChange(this.statusListener);
	}

	onClose() {
		this.plugin.statusBar.offChange(this.statusListener);
	}

	updateTimerDisplay() {
		this.timerDisplay.textContent = this.plugin.timer.getFormattedTime();
	}

	resetGUI() {
		const status = this.plugin.statusBar.status;
		const isIdle = status === RecordingStatus.Idle;
		const isPaused = status === RecordingStatus.Paused;

		this.startButton.buttonEl.style.display = isIdle ? "" : "none";
		this.startButton.buttonEl.empty();
		this.startButton.setIcon("circle");
		this.startButton.buttonEl.appendText(" Record");

		this.pauseButton.buttonEl.style.display = isIdle ? "none" : "";
		this.pauseButton.buttonEl.empty();
		this.pauseButton.setIcon(isPaused ? "play" : "pause");
		this.pauseButton.buttonEl.appendText(isPaused ? " Resume" : " Pause");

		this.stopButton.buttonEl.style.display = isIdle ? "none" : "";
		this.stopButton.buttonEl.empty();
		this.stopButton.setIcon("square");
		this.stopButton.buttonEl.appendText(" Stop");

		this.cancelButton.buttonEl.style.display = isIdle ? "none" : "";
		this.cancelButton.buttonEl.empty();
		this.cancelButton.setIcon("x");
		this.cancelButton.buttonEl.appendText(" Cancel");
	}
}
