import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timer } from "../src/Timer";

// Timer uses window.setInterval — proxy to globalThis so fake timers work
vi.stubGlobal("window", new Proxy(globalThis, {
	get(target, prop) {
		return (target as any)[prop];
	},
}));

describe("Timer", () => {
	let timer: Timer;

	beforeEach(() => {
		vi.useFakeTimers();
		timer = new Timer();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts at 00:00:00", () => {
		expect(timer.getFormattedTime()).toBe("00:00:00");
	});

	it("increments elapsed time", () => {
		timer.start();
		vi.advanceTimersByTime(3000);
		expect(timer.getFormattedTime()).toBe("00:00:03");
	});

	it("pauses the timer", () => {
		timer.start();
		vi.advanceTimersByTime(2000);
		timer.pause();
		vi.advanceTimersByTime(5000);
		expect(timer.getFormattedTime()).toBe("00:00:02");
	});

	it("resumes the timer after pause", () => {
		timer.start();
		vi.advanceTimersByTime(2000);
		timer.pause();
		vi.advanceTimersByTime(5000);
		timer.resume();
		vi.advanceTimersByTime(3000);
		expect(timer.getFormattedTime()).toBe("00:00:05");
	});

	it("resume is a no-op when already running", () => {
		timer.start();
		vi.advanceTimersByTime(2000);
		timer.resume(); // should be no-op
		vi.advanceTimersByTime(1000);
		expect(timer.getFormattedTime()).toBe("00:00:03");
	});

	it("pause is a no-op when not running", () => {
		timer.pause(); // should be no-op
		expect(timer.getFormattedTime()).toBe("00:00:00");
	});

	it("resets the timer", () => {
		timer.start();
		vi.advanceTimersByTime(5000);
		timer.reset();
		expect(timer.getFormattedTime()).toBe("00:00:00");
	});

	it("calls onUpdate callback on tick", () => {
		const callback = vi.fn();
		timer.setOnUpdate(callback);
		timer.start();
		vi.advanceTimersByTime(3000);
		expect(callback).toHaveBeenCalledTimes(3);
	});

	it("ignores double-start (no duplicate intervals)", () => {
		timer.start();
		timer.start(); // should be a no-op
		vi.advanceTimersByTime(3000);
		expect(timer.getFormattedTime()).toBe("00:00:03"); // not 00:00:06
	});

	it("formats hours correctly", () => {
		timer.start();
		vi.advanceTimersByTime(3661000); // 1h 1m 1s
		expect(timer.getFormattedTime()).toBe("01:01:01");
	});
});
