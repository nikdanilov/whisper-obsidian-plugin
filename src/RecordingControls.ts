import Whisper from "main";
import { ButtonComponent, Modal, Notice } from "obsidian";

export class RecordingControls extends Modal {
	plugin: Whisper;
	startButton: ButtonComponent;
	pauseButton: ButtonComponent;
	stopButton: ButtonComponent;
	chunks: BlobPart[] = [];
	recorder: MediaRecorder | null = null;

	timer: HTMLElement;
	elapsedTime: number = 0;
	intervalId: number | null;

	constructor(plugin: Whisper) {
		super(plugin.app);
		this.plugin = plugin;
		this.containerEl.addClass("recording-controls");

		// Add elapsed time display
		this.timer = this.contentEl.createEl("div", { cls: "timer" });
		this.updateTimerDisplay();

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
	}

	async startRecording() {
		console.log("start");
		this.chunks.length = 0;

		if (!this.recorder) {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				const options = { mimeType: "audio/webm; codecs=opus" };
				const recorder = new MediaRecorder(stream, options);

				recorder.addEventListener("dataavailable", (e: BlobEvent) => {
					console.log("dataavailable", e.data.size);
					this.chunks.push(e.data);
				});

				recorder.addEventListener("pause", () => {
					console.log("recording paused");
					this.pauseTimer();
					this.pauseButton.setButtonText(" Resume");
				});

				recorder.addEventListener("resume", () => {
					console.log("recording resumed");
					this.startTimer();
					this.pauseButton.setButtonText(" Pause");
				});

				recorder.addEventListener("start", () => {
					this.startTimer();
					this.startButton.setDisabled(true);
					this.pauseButton.setDisabled(false);
					this.stopButton.setDisabled(false);
				});

				recorder.addEventListener("stop", async () => {
					console.log("recording stopped");
					this.pauseTimer();
					const blob = new Blob(this.chunks, { type: "audio/webm" });
					await this.plugin.sendAudioData(blob);
					this.chunks.length = 0;
					this.close();
				});

				this.recorder = recorder;

				if (this.recorder) {
					this.recorder.start(100);
					console.log("recording started");
				}
			} catch (err) {
				new Notice("Error initializing recorder: " + err);
				console.error("Error initializing recorder:", err);
				return;
			}
		}
	}

	async pauseRecording() {
		console.log("pausing recording...");
		if (this.recorder && this.recorder.state === "recording") {
			this.recorder.pause();
		} else if (this.recorder && this.recorder.state === "paused") {
			this.recorder.resume();
		}
	}

	async stopRecording() {
		console.log("stopping recording...");
		if (this.recorder && this.recorder.state !== "inactive") {
			this.recorder.stop();
		}
		this.close()
	}

	open() {
		super.open();
		this.elapsedTime = 0;
		this.recorder = null;
		this.updateTimerDisplay();
		this.resetGUI();
	}

	close() {
		super.close();
		this.elapsedTime = 0;
		this.recorder = null;
		this.updateTimerDisplay();
		this.resetGUI();
	}

	resetGUI() {
		this.startButton.setDisabled(false);
		this.pauseButton.setDisabled(true);
		this.stopButton.setDisabled(true);
	}

	updateTimerDisplay() {
		const seconds = Math.floor(this.elapsedTime / 1000) % 60;
		const minutes = Math.floor(this.elapsedTime / 1000 / 60) % 60;
		const hours = Math.floor(this.elapsedTime / 1000 / 60 / 60);

		const pad = (n: number) => (n < 10 ? "0" + n : n);

		this.timer.textContent = `${pad(hours)}:${pad(minutes)}:${pad(
			seconds
		)}`;
	}

	startTimer() {
		this.intervalId = window.setInterval(() => {
			this.elapsedTime += 1000;
			this.updateTimerDisplay();
		}, 1000);
	}

	pauseTimer() {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
}