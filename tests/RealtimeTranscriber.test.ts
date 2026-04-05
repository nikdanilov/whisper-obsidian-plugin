import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the extracted logic from RealtimeTranscriber without WebSocket dependency

describe("RealtimeTranscriber — session config", () => {
	function buildSessionConfig(settings: {
		model: string;
		language: string;
		prompt: string;
	}) {
		const session: Record<string, any> = {
			input_audio_format: "pcm16",
			input_audio_transcription: {
				model: settings.model,
			},
			turn_detection: {
				type: "server_vad",
				threshold: 0.5,
				silence_duration_ms: 500,
			},
		};

		if (settings.language && settings.language !== "auto") {
			session.input_audio_transcription.language = settings.language;
		}

		if (settings.prompt) {
			session.input_audio_transcription.prompt = settings.prompt;
		}

		return session;
	}

	it("includes model in transcription config", () => {
		const session = buildSessionConfig({
			model: "gpt-4o-transcribe",
			language: "",
			prompt: "",
		});
		expect(session.input_audio_transcription.model).toBe(
			"gpt-4o-transcribe"
		);
	});

	it("includes language when explicitly set", () => {
		const session = buildSessionConfig({
			model: "gpt-4o-transcribe",
			language: "ja",
			prompt: "",
		});
		expect(session.input_audio_transcription.language).toBe("ja");
	});

	it("omits language when empty (auto-detect)", () => {
		const session = buildSessionConfig({
			model: "gpt-4o-transcribe",
			language: "",
			prompt: "",
		});
		expect(session.input_audio_transcription.language).toBeUndefined();
	});

	it("omits language when set to auto", () => {
		const session = buildSessionConfig({
			model: "gpt-4o-transcribe",
			language: "auto",
			prompt: "",
		});
		expect(session.input_audio_transcription.language).toBeUndefined();
	});

	it("includes prompt when set", () => {
		const session = buildSessionConfig({
			model: "gpt-4o-transcribe",
			language: "",
			prompt: "technical terms: Kubernetes, gRPC",
		});
		expect(session.input_audio_transcription.prompt).toBe(
			"technical terms: Kubernetes, gRPC"
		);
	});

	it("uses server VAD by default", () => {
		const session = buildSessionConfig({
			model: "gpt-4o-transcribe",
			language: "",
			prompt: "",
		});
		expect(session.turn_detection.type).toBe("server_vad");
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
