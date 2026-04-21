export class Timer {
	private elapsedTime: number = 0;
	private intervalId: number | null = null;
	private updateListeners: Array<() => void> = [];
	private limitMs: number | null = null;
	private onLimitReached: (() => void) | null = null;

	setOnUpdate(callback: () => void): void {
		this.updateListeners.push(callback);
	}

	private notifyUpdate(): void {
		this.updateListeners.forEach((fn) => fn());
	}

	setLimit(ms: number | null): void {
		this.limitMs = ms;
	}

	setOnLimitReached(callback: (() => void) | null): void {
		this.onLimitReached = callback;
	}

	start(): void {
		if (this.intervalId !== null) return;
		this.intervalId = window.setInterval(() => {
			this.elapsedTime += 1000;
			this.notifyUpdate();
			if (this.limitMs !== null && this.elapsedTime >= this.limitMs) {
				this.pause();
				this.onLimitReached?.();
			}
		}, 1000);
	}

	pause(): void {
		if (this.intervalId === null) return;
		clearInterval(this.intervalId);
		this.intervalId = null;
		this.notifyUpdate();
	}

	resume(): void {
		if (this.intervalId !== null) return;
		this.start();
	}

	reset(): void {
		this.elapsedTime = 0;
		this.limitMs = null;
		this.onLimitReached = null;
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.notifyUpdate();
	}

	getFormattedTime(): string {
		const pad = (n: number) => (n < 10 ? "0" + n : n);

		if (this.limitMs !== null) {
			const remaining = Math.max(0, this.limitMs - this.elapsedTime);
			const seconds = Math.floor(remaining / 1000) % 60;
			const minutes = Math.floor(remaining / 1000 / 60) % 60;
			const hours = Math.floor(remaining / 1000 / 60 / 60);
			return `${pad(hours)}:${pad(minutes)}:${pad(seconds)} remaining`;
		}

		const seconds = Math.floor(this.elapsedTime / 1000) % 60;
		const minutes = Math.floor(this.elapsedTime / 1000 / 60) % 60;
		const hours = Math.floor(this.elapsedTime / 1000 / 60 / 60);
		return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
	}
}
