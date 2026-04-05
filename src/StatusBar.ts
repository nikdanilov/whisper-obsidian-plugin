import { Plugin } from "obsidian";

export enum RecordingStatus {
	Idle = "idle",
	Recording = "recording",
	Paused = "paused",
	Processing = "processing",
}

export class StatusBar {
	plugin: Plugin;
	statusBarItem: HTMLElement | null = null;
	status: RecordingStatus = RecordingStatus.Idle;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.updateStatusBarItem();
	}

	updateStatus(status: RecordingStatus) {
		this.status = status;
		this.updateStatusBarItem();
	}

	updateStatusBarItem() {
		if (this.statusBarItem) {
			switch (this.status) {
				case RecordingStatus.Recording:
					this.statusBarItem.textContent = "Recording...";
					this.statusBarItem.style.color = "red";
					break;
				case RecordingStatus.Paused:
					this.statusBarItem.textContent = "Paused";
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
