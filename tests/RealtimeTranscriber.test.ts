import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the extracted logic from RealtimeTranscriber without WebSocket dependency

describe("RealtimeTranscriber — session config", () => {
	function buildSessionUpdate(settings: {
		model: string;
		language: string;
		prompt: string;
	}) {
		const transcription: Record<string, any> = {
			model: settings.model,
		};

		if (settings.language && settings.language !== "auto") {
			transcription.language = settings.language;
		}

		if (settings.prompt) {
			transcription.prompt = settings.prompt;
		}

		return {
			type: "session.update",
			session: {
				type: "transcription",
				audio: {
					input: {
						format: { type: "audio/pcm", rate: 24000 },
						noise_reduction: { type: "near_field" },
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
		};
	}

	it("uses session.update event type", () => {
		const event = buildSessionUpdate({ model: "gpt-4o-transcribe", language: "", prompt: "" });
		expect(event.type).toBe("session.update");
		expect(event.session.type).toBe("transcription");
	});

	it("includes model in transcription config", () => {
		const event = buildSessionUpdate({ model: "gpt-4o-transcribe", language: "", prompt: "" });
		expect(event.session.audio.input.transcription.model).toBe("gpt-4o-transcribe");
	});

	it("sets PCM 24kHz audio format", () => {
		const event = buildSessionUpdate({ model: "gpt-4o-transcribe", language: "", prompt: "" });
		expect(event.session.audio.input.format).toEqual({ type: "audio/pcm", rate: 24000 });
	});

	it("includes language when explicitly set", () => {
		const event = buildSessionUpdate({ model: "gpt-4o-transcribe", language: "ja", prompt: "" });
		expect(event.session.audio.input.transcription.language).toBe("ja");
	});

	it("omits language when empty (auto-detect)", () => {
		const event = buildSessionUpdate({ model: "gpt-4o-transcribe", language: "", prompt: "" });
		expect(event.session.audio.input.transcription.language).toBeUndefined();
	});

	it("omits language when set to auto", () => {
		const event = buildSessionUpdate({ model: "gpt-4o-transcribe", language: "auto", prompt: "" });
		expect(event.session.audio.input.transcription.language).toBeUndefined();
	});

	it("includes prompt when set", () => {
		const event = buildSessionUpdate({ model: "gpt-4o-transcribe", language: "", prompt: "Kubernetes, gRPC" });
		expect(event.session.audio.input.transcription.prompt).toBe("Kubernetes, gRPC");
	});

	it("uses server VAD with near_field noise reduction", () => {
		const event = buildSessionUpdate({ model: "gpt-4o-transcribe", language: "", prompt: "" });
		expect(event.session.audio.input.turn_detection.type).toBe("server_vad");
		expect(event.session.audio.input.noise_reduction.type).toBe("near_field");
	});
});

describe("RealtimeTranscriber — WebSocket URL", () => {
	function buildWsUrl(apiUrl: string) {
		const isDefaultApi =
			apiUrl === "https://api.openai.com/v1/audio/transcriptions";
		const wsBase = isDefaultApi
			? "wss://api.openai.com/v1/realtime"
			: apiUrl.replace(/^http/, "ws");
		return `${wsBase}?intent=transcription`;
	}

	it("uses OpenAI realtime endpoint for default API", () => {
		const url = buildWsUrl(
			"https://api.openai.com/v1/audio/transcriptions"
		);
		expect(url).toBe(
			"wss://api.openai.com/v1/realtime?intent=transcription"
		);
	});

	it("converts custom http URL to ws", () => {
		const url = buildWsUrl("http://localhost:9000/transcribe");
		expect(url).toBe(
			"ws://localhost:9000/transcribe?intent=transcription"
		);
	});

	it("converts custom https URL to wss", () => {
		const url = buildWsUrl("https://my-server.com/api/whisper");
		expect(url).toBe(
			"wss://my-server.com/api/whisper?intent=transcription"
		);
	});
});

describe("RealtimeTranscriber — message handling", () => {
	function handleMessage(
		message: any,
		state: { fullTranscript: string },
		callbacks: {
			onDelta: (t: string) => void;
			onCompleted: (t: string) => void;
			onError: (e: string) => void;
		}
	) {
		switch (message.type) {
			case "conversation.item.input_audio_transcription.delta":
				if (message.delta) callbacks.onDelta(message.delta);
				break;
			case "conversation.item.input_audio_transcription.completed":
				if (message.transcript) {
					state.fullTranscript +=
						(state.fullTranscript ? " " : "") + message.transcript;
					callbacks.onCompleted(state.fullTranscript);
				}
				break;
			case "error":
				callbacks.onError(message.error?.message || "Unknown error");
				break;
		}
	}

	it("calls onDelta with partial text", () => {
		const onDelta = vi.fn();
		const state = { fullTranscript: "" };
		handleMessage(
			{
				type: "conversation.item.input_audio_transcription.delta",
				delta: "Hello",
			},
			state,
			{ onDelta, onCompleted: vi.fn(), onError: vi.fn() }
		);
		expect(onDelta).toHaveBeenCalledWith("Hello");
	});

	it("accumulates transcript on completed events", () => {
		const onCompleted = vi.fn();
		const state = { fullTranscript: "" };
		const callbacks = {
			onDelta: vi.fn(),
			onCompleted,
			onError: vi.fn(),
		};

		handleMessage(
			{
				type: "conversation.item.input_audio_transcription.completed",
				transcript: "Hello world",
			},
			state,
			callbacks
		);
		expect(state.fullTranscript).toBe("Hello world");

		handleMessage(
			{
				type: "conversation.item.input_audio_transcription.completed",
				transcript: "How are you?",
			},
			state,
			callbacks
		);
		expect(state.fullTranscript).toBe("Hello world How are you?");
		expect(onCompleted).toHaveBeenLastCalledWith(
			"Hello world How are you?"
		);
	});

	it("calls onError for error messages", () => {
		const onError = vi.fn();
		const state = { fullTranscript: "" };
		handleMessage(
			{ type: "error", error: { message: "Rate limited" } },
			state,
			{ onDelta: vi.fn(), onCompleted: vi.fn(), onError }
		);
		expect(onError).toHaveBeenCalledWith("Rate limited");
	});

	it("handles error without message field", () => {
		const onError = vi.fn();
		const state = { fullTranscript: "" };
		handleMessage(
			{ type: "error", error: {} },
			state,
			{ onDelta: vi.fn(), onCompleted: vi.fn(), onError }
		);
		expect(onError).toHaveBeenCalledWith("Unknown error");
	});
});

describe("PCMAudioRecorder — float32 to PCM16 conversion", () => {
	function float32ToPCM16(float32: Float32Array): Int16Array {
		const pcm16 = new Int16Array(float32.length);
		for (let i = 0; i < float32.length; i++) {
			const clamped = Math.max(-1, Math.min(1, float32[i]));
			pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
		}
		return pcm16;
	}

	it("converts silence (zeros) correctly", () => {
		const input = new Float32Array([0, 0, 0]);
		const output = float32ToPCM16(input);
		expect(output[0]).toBe(0);
		expect(output[1]).toBe(0);
	});

	it("converts max positive to 32767", () => {
		const input = new Float32Array([1.0]);
		const output = float32ToPCM16(input);
		expect(output[0]).toBe(32767);
	});

	it("converts max negative to -32768", () => {
		const input = new Float32Array([-1.0]);
		const output = float32ToPCM16(input);
		expect(output[0]).toBe(-32768);
	});

	it("clamps values beyond [-1, 1]", () => {
		const input = new Float32Array([2.0, -2.0]);
		const output = float32ToPCM16(input);
		expect(output[0]).toBe(32767);
		expect(output[1]).toBe(-32768);
	});
});
