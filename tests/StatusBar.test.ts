import { describe, it, expect } from "vitest";
import { RecordingStatus } from "../src/StatusBar";

describe("RecordingStatus enum", () => {
	it("has expected values", () => {
		expect(RecordingStatus.Idle).toBe("idle");
		expect(RecordingStatus.Recording).toBe("recording");
		expect(RecordingStatus.Processing).toBe("processing");
	});
});
