import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timer } from "src/Timer";

describe("Timer integration", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should accumulate time and format as HH:MM:SS", () => {
		const timer = new Timer();
		timer.start();

		// Advance 63 seconds
		vi.advanceTimersByTime(63_000);

		expect(timer.getFormattedTime()).toBe("00:01:03");
	});

	it("should pause, resume, and reset correctly", () => {
		const timer = new Timer();
		const onUpdate = vi.fn();
		timer.setOnUpdate(onUpdate);

		timer.start();
		vi.advanceTimersByTime(5_000);
		expect(timer.getFormattedTime()).toBe("00:00:05");

		// Pause — stops accumulation
		timer.pause();
		vi.advanceTimersByTime(3_000);
		expect(timer.getFormattedTime()).toBe("00:00:05"); // time frozen

		// Resume (second call to pause toggles)
		timer.pause();
		vi.advanceTimersByTime(2_000);
		expect(timer.getFormattedTime()).toBe("00:00:07");

		// Reset — back to zero
		timer.reset();
		expect(timer.getFormattedTime()).toBe("00:00:00");
		expect(onUpdate).toHaveBeenCalled();
	});
});
