export function getBaseFileName(filePath: string) {
	// Extract the file name including extension
	const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);

	// Remove the extension from the file name
	const baseFileName = fileName.substring(0, fileName.lastIndexOf("."));

	return baseFileName;
}
