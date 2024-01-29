import { existsSync, readFileSync, writeFileSync } from "fs";

// Define the paths to the assets you want to verify
const assets = ["main.js", "manifest.json", "styles.css"];

// Verify each asset exists
assets.forEach((asset) => {
	if (!existsSync(asset)) {
		console.error(`Error: File ${asset} does not exist.`);
		process.exit(1);
	}
});

console.log("All files exist and are accessible.");

// Read version from package.json
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const targetVersion = packageJson.version;

// Read and update manifest.json
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));

// Update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = manifest.minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, 2));

console.log("Version information updated successfully.");
