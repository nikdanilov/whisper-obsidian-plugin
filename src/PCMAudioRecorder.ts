import { Notice } from "obsidian";

const TARGET_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export class PCMAudioRecorder {
	private context: AudioContext | null = null;
	private source: MediaStreamAudioSourceNode | null = null;
	private processor: ScriptProcessorNode | null = null;
	private stream: MediaStream | null = null;
	private onAudioData: ((pcm16: ArrayBuffer) => void) | null = null;
	private deviceId: string | null = null;

	setDeviceId(deviceId: string | null): void {
		this.deviceId = deviceId;
	}

	setOnAudioData(callback: (pcm16: ArrayBuffer) => void): void {
		this.onAudioData = callback;
	}

	async start(): Promise<void> {
		try {
			const audioConstraints =
				this.deviceId && this.deviceId !== "default"
					? { deviceId: { exact: this.deviceId } }
					: true;

			this.stream = await navigator.mediaDevices.getUserMedia({
				audio: audioConstraints,
			});

			this.context = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
			this.source = this.context.createMediaStreamSource(this.stream);

			// ScriptProcessorNode is deprecated but widely supported.
			// AudioWorklet would be better but requires a separate file
			// that complicates the Obsidian plugin build.
			this.processor = this.context.createScriptProcessor(
				BUFFER_SIZE,
				1,
				1
			);

			this.processor.onaudioprocess = (event) => {
				if (!this.onAudioData) return;

				const inputData = event.inputBuffer.getChannelData(0);
				const pcm16 = this.float32ToPCM16(inputData);
				this.onAudioData(pcm16.buffer);
			};

			this.source.connect(this.processor);
			this.processor.connect(this.context.destination);
		} catch (err) {
			console.error("Error starting PCM recorder:", err);
			new Notice("Couldn't access microphone");
		}
	}

	async stop(): Promise<void> {
		if (this.processor) {
			this.processor.disconnect();
			this.processor = null;
		}
		if (this.source) {
			this.source.disconnect();
			this.source = null;
		}
		if (this.context) {
			await this.context.close();
			this.context = null;
		}
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}
	}

	private float32ToPCM16(float32: Float32Array): Int16Array {
		const pcm16 = new Int16Array(float32.length);
		for (let i = 0; i < float32.length; i++) {
			const clamped = Math.max(-1, Math.min(1, float32[i]));
			pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
		}
		return pcm16;
	}
}
