import { Notice } from "obsidian";

export interface AudioRecorder {
	startRecording(): Promise<void>;
	pauseRecording(): Promise<void>;
	stopRecording(): Promise<Blob>;
}

function getSupportedMimeType(): string | undefined {
	const mimeTypes = [
		"audio/webm",
		"audio/webm;codecs=opus",
		"audio/ogg",
		"audio/ogg;codecs=opus",
		"audio/mp4",
		"audio/mp4;codecs=mp4a.40.2",
		"audio/aac",
		"audio/wav",
		"audio/mp3",
	];

	for (const mimeType of mimeTypes) {
		if (MediaRecorder.isTypeSupported(mimeType)) {
			return mimeType;
		}
	}

	return undefined;
}

export class NativeAudioRecorder implements AudioRecorder {
	private chunks: BlobPart[] = [];
	private recorder: MediaRecorder | null = null;
	private mimeType: string | undefined;
	private deviceId: string | null = null;

	getRecordingState(): "inactive" | "recording" | "paused" | undefined {
		return this.recorder?.state;
	}

	getMimeType(): string | undefined {
		return this.mimeType;
	}

	setDeviceId(deviceId: string | null): void {
		this.deviceId = deviceId;
	}

	async startRecording(): Promise<void> {
		if (!this.recorder) {
			try {
				const audioConstraints =
					this.deviceId && this.deviceId !== "default"
						? { deviceId: { exact: this.deviceId } }
						: true;
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: audioConstraints,
				});
				this.mimeType = getSupportedMimeType();

				if (!this.mimeType) {
					throw new Error("No supported mimeType found");
				}

				const options = { mimeType: this.mimeType };
				const recorder = new MediaRecorder(stream, options);

				recorder.addEventListener("dataavailable", (e: BlobEvent) => {
					this.chunks.push(e.data);
				});

				this.recorder = recorder;
			} catch (err) {
				new Notice("✘ Couldn't access microphone");
				console.error("Error initializing recorder:", err);
				return;
			}
		}

		this.recorder.start(100);
	}

	async pauseRecording(): Promise<void> {
		if (!this.recorder) {
			return;
		}

		if (this.recorder.state === "recording") {
			this.recorder.pause();
		} else if (this.recorder.state === "paused") {
			this.recorder.resume();
		}
	}

	async stopRecording(): Promise<Blob> {
		return new Promise((resolve) => {
			if (!this.recorder || this.recorder.state === "inactive") {
				const blob = new Blob(this.chunks, { type: this.mimeType });
				this.chunks.length = 0;
				resolve(blob);
			} else {
				this.recorder.addEventListener(
					"stop",
					() => {
						const blob = new Blob(this.chunks, {
							type: this.mimeType,
						});
						this.chunks.length = 0;

						// will stop all the tracks associated with the stream, effectively releasing any resources (like the mic) used by them
						if (this.recorder) {
							this.recorder.stream
								.getTracks()
								.forEach((track) => track.stop());
							this.recorder = null;
						}

						resolve(blob);
					},
					{ once: true }
				);

				this.recorder.stop();
			}
		});
	}
}
