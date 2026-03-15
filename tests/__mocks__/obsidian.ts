import { vi } from "vitest";

// --- Notice ---
export class Notice {
	message: string;
	constructor(message: string) {
		this.message = message;
	}
}

// --- Plugin ---
export class Plugin {
	app: any;
	manifest: any;

	constructor(app?: any, manifest?: any) {
		this.app = app ?? {};
		this.manifest = manifest ?? {};
	}

	addStatusBarItem(): HTMLElement {
		const el = document.createElement("div");
		document.body.appendChild(el);
		// Obsidian-like helpers
		(el as any).addClass = (...classes: string[]) => el.classList.add(...classes);
		(el as any).removeClass = (...classes: string[]) => el.classList.remove(...classes);
		return el;
	}

	addRibbonIcon = vi.fn();
	addSettingTab = vi.fn();
	addCommand = vi.fn();
	loadData = vi.fn().mockResolvedValue({});
	saveData = vi.fn().mockResolvedValue(undefined);
}

// --- Modal ---
export class Modal {
	app: any;
	containerEl: HTMLElement;
	contentEl: HTMLElement;

	constructor(app?: any) {
		this.app = app ?? {};
		this.containerEl = document.createElement("div");
		(this.containerEl as any).addClass = (...classes: string[]) =>
			this.containerEl.classList.add(...classes);
		this.contentEl = document.createElement("div");
		this.containerEl.appendChild(this.contentEl);
	}

	open = vi.fn();
	close = vi.fn();
}

// --- PluginSettingTab ---
export class PluginSettingTab {
	app: any;
	plugin: any;
	containerEl: HTMLElement;

	constructor(app?: any, plugin?: any) {
		this.app = app ?? {};
		this.plugin = plugin;
		this.containerEl = document.createElement("div");
	}

	display() {}
}

// --- ButtonComponent ---
export class ButtonComponent {
	buttonEl: HTMLElement;

	constructor(containerEl: HTMLElement) {
		this.buttonEl = document.createElement("button");
		containerEl.appendChild(this.buttonEl);
		(this.buttonEl as any).empty = () => {
			this.buttonEl.innerHTML = "";
		};
		(this.buttonEl as any).createSpan = (opts: { text: string }) => {
			const span = document.createElement("span");
			span.textContent = opts.text;
			this.buttonEl.appendChild(span);
			return span;
		};
	}

	onClick(cb: () => void): ButtonComponent {
		this.buttonEl.addEventListener("click", cb);
		return this;
	}

	setDisabled(disabled: boolean): ButtonComponent {
		(this.buttonEl as HTMLButtonElement).disabled = disabled;
		return this;
	}
}

// --- Setting ---
export class Setting {
	constructor(_containerEl: HTMLElement) {}
	setName = vi.fn().mockReturnThis();
	setDesc = vi.fn().mockReturnThis();
	addText = vi.fn().mockReturnThis();
	addToggle = vi.fn().mockReturnThis();
	addDropdown = vi.fn().mockReturnThis();
}

// --- MarkdownView ---
export class MarkdownView {
	editor: any;

	constructor() {
		this.editor = {
			getCursor: vi.fn().mockReturnValue({ line: 0, ch: 0 }),
			replaceRange: vi.fn(),
			setCursor: vi.fn(),
		};
	}
}

// --- Standalone functions ---
export const requestUrl = vi.fn();
export const setIcon = vi.fn();

// --- TFolder ---
export class TFolder {}
