export function getCursorContext(
	editor: { getValue: () => string; getCursor: () => { line: number } },
	contextLines: number = 5
): string {
	const lines = editor.getValue().split("\n");
	const cursorLine = editor.getCursor().line;
	const start = Math.max(0, cursorLine - contextLines);
	const end = Math.min(lines.length, cursorLine + contextLines + 1);
	return lines.slice(start, end).join("\n").trim();
}

export function getExtensionFromMimeType(mimeType: string | undefined): string {
	if (!mimeType) return "webm";
	const base = mimeType.split(";")[0];
	const subtype = base.split("/")[1];
	const extensionMap: Record<string, string> = {
		"mp4a.40.2": "m4a",
		"mpeg": "mp3",
		"x-m4a": "m4a",
	};
	return extensionMap[subtype] || subtype;
}

export function getBaseFileName(filePath: string) {
	// Extract the file name including extension
	const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);

	// Remove the extension from the file name
	const baseFileName = fileName.substring(0, fileName.lastIndexOf("."));

	return baseFileName;
}
