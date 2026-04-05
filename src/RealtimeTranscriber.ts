export interface RealtimeTranscriberConfig {
	apiKey: string;
	apiUrl: string;
	model: string;
	language: string;
	prompt: string;
}

export interface RealtimeTranscriberCallbacks {
	onDelta: (text: string) => void;
	onCompleted: (text: string) => void;
	onError: (error: string) => void;
}

export class RealtimeTranscriber {
	private ws: WebSocket | null = null;
	private callbacks: RealtimeTranscriberCallbacks;
	private config: RealtimeTranscriberConfig;
	private fullTranscript: string = "";

	constructor(
		config: RealtimeTranscriberConfig,
		callbacks: RealtimeTranscriberCallbacks
	) {
		this.config = config;
		this.callbacks = callbacks;
	}

	connect(): void {
		const isDefaultApi =
			this.config.apiUrl ===
			"https://api.openai.com/v1/audio/transcriptions";
		const wsBase = isDefaultApi
			? "wss://api.openai.com/v1/realtime"
			: this.config.apiUrl.replace(/^http/, "ws");

		const url = `${wsBase}?intent=transcription`;

		this.ws = new WebSocket(url, [
			"realtime",
			`openai-insecure-api-key.${this.config.apiKey}`,
		]);

		this.ws.onopen = () => {
			this.sendSessionUpdate();
		};

		this.ws.onmessage = (event) => {
			this.handleMessage(JSON.parse(event.data));
		};

		this.ws.onerror = () => {
			this.callbacks.onError("WebSocket connection failed");
		};

		this.ws.onclose = () => {
			this.ws = null;
		};
	}

	private sendSessionUpdate(): void {
		if (!this.ws) return;

		const transcription: Record<string, any> = {
			model: this.config.model,
		};

		if (this.config.language && this.config.language !== "auto") {
			transcription.language = this.config.language;
		}

		if (this.config.prompt) {
			transcription.prompt = this.config.prompt;
		}

		this.send({
			type: "session.update",
			session: {
				type: "transcription",
				audio: {
					input: {
						format: {
							type: "audio/pcm",
							rate: 24000,
						},
						noise_reduction: {
							type: "near_field",
						},
						transcription,
						turn_detection: {
							type: "server_vad",
							threshold: 0.5,
							prefix_padding_ms: 300,
							silence_duration_ms: 500,
						},
					},
				},
			},
		});
	}

	sendAudio(pcm16Data: ArrayBuffer): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

		const base64 = this.arrayBufferToBase64(pcm16Data);
		this.send({
			type: "input_audio_buffer.append",
			audio: base64,
		});
	}

	private handleMessage(message: any): void {
		switch (message.type) {
			case "conversation.item.input_audio_transcription.delta":
				if (message.delta) {
					this.callbacks.onDelta(message.delta);
				}
				break;

			case "conversation.item.input_audio_transcription.completed":
				if (message.transcript) {
					this.fullTranscript +=
						(this.fullTranscript ? " " : "") + message.transcript;
					this.callbacks.onCompleted(this.fullTranscript);
				}
				break;

			case "error":
				this.callbacks.onError(
					message.error?.message || "Unknown error"
				);
				break;
		}
	}

	getTranscript(): string {
		return this.fullTranscript;
	}

	disconnect(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.fullTranscript = "";
	}

	isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	private send(event: Record<string, any>): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(event));
		}
	}

	private arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		let binary = "";
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}
}
