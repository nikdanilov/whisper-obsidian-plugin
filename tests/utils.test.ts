import { describe, it, expect } from "vitest";
import { getBaseFileName } from "../src/utils";

describe("getBaseFileName", () => {
	it("strips extension from simple filename", () => {
		expect(getBaseFileName("recording.webm")).toBe("recording");
	});

	it("strips extension from path with directories", () => {
		expect(getBaseFileName("folder/sub/recording.mp3")).toBe("recording");
	});

	it("handles filenames with multiple dots", () => {
		expect(getBaseFileName("2024-01-01T12-00-00.000Z.webm")).toBe(
			"2024-01-01T12-00-00.000Z"
		);
	});

	it("returns empty string for file with no base name", () => {
		expect(getBaseFileName(".hidden")).toBe("");
	});
});
