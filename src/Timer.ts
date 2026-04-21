export class Timer {
	private elapsedTime: number = 0;
	private intervalId: number | null = null;
	private onUpdate: (() => void) | null = null;

	setOnUpdate(callback: () => void): void {
		this.onUpdate = callback;
	}

	start(): void {
		if (this.intervalId !== null) return;
		this.intervalId = window.setInterval(() => {
			this.elapsedTime += 1000;
			if (this.onUpdate) {
				this.onUpdate();
			}
		}, 1000);
	}

	pause(): void {
		if (this.intervalId === null) return;
		clearInterval(this.intervalId);
		this.intervalId = null;
		if (this.onUpdate) {
			this.onUpdate();
		}
	}

	resume(): void {
		if (this.intervalId !== null) return;
		this.start();
	}

	reset(): void {
		this.elapsedTime = 0;
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		if (this.onUpdate) {
			this.onUpdate();
		}
	}

	getFormattedTime(): string {
		const seconds = Math.floor(this.elapsedTime / 1000) % 60;
		const minutes = Math.floor(this.elapsedTime / 1000 / 60) % 60;
		const hours = Math.floor(this.elapsedTime / 1000 / 60 / 60);

		const pad = (n: number) => (n < 10 ? "0" + n : n);

		return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
	}

	getTimestamp(): string {
		const totalSeconds = Math.floor(this.elapsedTime / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		const pad = (n: number) => String(n).padStart(2, "0");
		return hours > 0
			? `[${pad(hours)}:${pad(minutes)}:${pad(seconds)}]`
			: `[${pad(minutes)}:${pad(seconds)}]`;
	}
}
