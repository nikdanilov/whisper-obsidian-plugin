import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		include: ["tests/**/*.test.ts"],
		alias: {
			obsidian: path.resolve(__dirname, "tests/__mocks__/obsidian.ts"),
			main: path.resolve(__dirname, "main.ts"),
			src: path.resolve(__dirname, "src"),
		},
	},
});
