// Minimal Obsidian API mocks for testing

export class Plugin {
	app: any = {};
	addStatusBarItem() {
		return document.createElement("div");
	}
	addCommand(_cmd: any) {}
	addRibbonIcon(_icon: string, _title: string, _cb: any) {}
	addSettingTab(_tab: any) {}
	async loadData() {
		return {};
	}
	async saveData(_data: any) {}
}

export class Modal {
	app: any;
	containerEl = document.createElement("div");
	contentEl = document.createElement("div");
	constructor(app: any) {
		this.app = app;
	}
	open() {}
	close() {}
}

export class Notice {
	message: string;
	constructor(message: string) {
		this.message = message;
	}
}

export class MarkdownView {
	editor = {
		getCursor: () => ({ line: 0, ch: 0 }),
		replaceRange: (_text: string, _pos: any) => {},
		setCursor: (_pos: any) => {},
	};
}

export class Setting {
	constructor(_el: HTMLElement) {}
	setName(_n: string) {
		return this;
	}
	setDesc(_d: string) {
		return this;
	}
	addText(_cb: any) {
		return this;
	}
	addToggle(_cb: any) {
		return this;
	}
	addDropdown(_cb: any) {
		return this;
	}
	setDisabled(_d: boolean) {
		return this;
	}
}

export class PluginSettingTab {
	app: any;
	plugin: any;
	containerEl = document.createElement("div");
	constructor(app: any, plugin: any) {
		this.app = app;
		this.plugin = plugin;
	}
}

export class ButtonComponent {
	buttonEl = document.createElement("button");
	constructor(_el: HTMLElement) {}
	setIcon(_i: string) {
		return this;
	}
	setButtonText(_t: string) {
		return this;
	}
	onClick(_cb: any) {
		return this;
	}
	setDisabled(_d: boolean) {
		return this;
	}
}

export class TFolder {
	path: string = "";
}
