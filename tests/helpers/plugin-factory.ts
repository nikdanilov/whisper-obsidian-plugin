import { vi } from "vitest";
import { DEFAULT_SETTINGS, WhisperSettings } from "src/SettingsManager";

/**
 * Creates a mock Whisper plugin instance for integration tests.
 * Partials in `settingsOverrides` are merged on top of DEFAULT_SETTINGS.
 */
export function createMockPlugin(settingsOverrides: Partial<WhisperSettings> = {}) {
	const settings: WhisperSettings = {
		...DEFAULT_SETTINGS,
		apiKey: "test-api-key",
		...settingsOverrides,
	};

	const mockLeaf = {
		openFile: vi.fn().mockResolvedValue(undefined),
	};

	const plugin: any = {
		app: {
			vault: {
				create: vi.fn().mockResolvedValue({ path: "test.md" }),
				adapter: {
					writeBinary: vi.fn().mockResolvedValue(undefined),
				},
			},
			workspace: {
				getActiveViewOfType: vi.fn().mockReturnValue(null),
				getLeaf: vi.fn().mockReturnValue(mockLeaf),
			},
		},
		settings,
		settingsManager: {
			loadSettings: vi.fn().mockResolvedValue(settings),
			saveSettings: vi.fn().mockResolvedValue(undefined),
		},
		loadData: vi.fn().mockResolvedValue({}),
		saveData: vi.fn().mockResolvedValue(undefined),
		addStatusBarItem: () => {
			const el = document.createElement("div");
			document.body.appendChild(el);
			(el as any).addClass = (...classes: string[]) => el.classList.add(...classes);
			(el as any).removeClass = (...classes: string[]) => el.classList.remove(...classes);
			return el;
		},
		addRibbonIcon: vi.fn(),
		addSettingTab: vi.fn(),
		addCommand: vi.fn(),
	};

	return { plugin, mockLeaf };
}
