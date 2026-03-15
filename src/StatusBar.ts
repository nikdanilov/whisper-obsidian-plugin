import { Plugin } from "obsidian";

export enum RecordingStatus {
	Idle = "idle",
	Recording = "recording",
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
			this.statusBarItem.removeClass(
				"whisper-status--recording",
				"whisper-status--processing",
				"whisper-status--idle"
			);

			switch (this.status) {
				case RecordingStatus.Recording:
					this.statusBarItem.textContent = "Recording...";
					this.statusBarItem.addClass("whisper-status--recording");
					break;
				case RecordingStatus.Processing:
					this.statusBarItem.textContent = "Processing audio...";
					this.statusBarItem.addClass("whisper-status--processing");
					break;
				case RecordingStatus.Idle:
				default:
					this.statusBarItem.textContent = "Whisper Idle";
					this.statusBarItem.addClass("whisper-status--idle");
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
