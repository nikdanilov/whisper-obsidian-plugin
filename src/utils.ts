export function getBaseFileName(filePath: string) {
	// Extract the file name including extension
	const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);

	// Remove the extension from the file name
	const baseFileName = fileName.substring(0, fileName.lastIndexOf("."));

	return baseFileName;
}

export function megabytesToBytes(sizeInMB: number): number {
	return sizeInMB * 1024 * 1024;
}

export function bytesToMegabytes(sizeInBytes: number, fractionDigits: number = 1): string {
	return (sizeInBytes / (1024 * 1024)).toFixed(fractionDigits);
}
