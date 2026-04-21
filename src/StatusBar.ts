import { Plugin } from "obsidian";
import { Timer } from "./Timer";

export enum RecordingStatus {
	Idle = "idle",
	Recording = "recording",
	Paused = "paused",
	Processing = "processing",
}

export class StatusBar {
	plugin: Plugin;
	timer: Timer | null = null;
	statusBarItem: HTMLElement | null = null;
	status: RecordingStatus = RecordingStatus.Idle;
	private listeners: Array<(status: RecordingStatus) => void> = [];

	constructor(plugin: Plugin) {
		this.plugin = plugin;
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.updateStatusBarItem();
	}

	onChange(listener: (status: RecordingStatus) => void): void {
		this.listeners.push(listener);
	}

	offChange(listener: (status: RecordingStatus) => void): void {
		this.listeners = this.listeners.filter((fn) => fn !== listener);
	}

	updateStatus(status: RecordingStatus) {
		this.status = status;
		this.updateStatusBarItem();
		this.listeners.forEach((fn) => fn(status));
	}

	updateStatusBarItem() {
		if (this.statusBarItem) {
			const time = this.timer ? this.timer.getFormattedTime() : null;
			switch (this.status) {
				case RecordingStatus.Recording:
					this.statusBarItem.textContent = time
						? `Recording ${time}`
						: "Recording...";
					this.statusBarItem.style.color = "red";
					break;
				case RecordingStatus.Paused:
					this.statusBarItem.textContent = time
						? `Paused ${time}`
						: "Paused";
					this.statusBarItem.style.color = "yellow";
					break;
				case RecordingStatus.Processing:
					this.statusBarItem.textContent = "Processing...";
					this.statusBarItem.style.color = "gray";
					break;
				case RecordingStatus.Idle:
				default:
					this.statusBarItem.textContent = "Whisper Idle";
					this.statusBarItem.style.color = "green";
					break;
			}
		}
	}

	remove() {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
		}
	}
}
