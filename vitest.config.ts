import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
	},
	resolve: {
		alias: {
			main: "/main.ts",
			src: "/src",
			obsidian: "/tests/__mocks__/obsidian.ts",
		},
	},
});
