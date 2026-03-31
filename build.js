const fs = require('fs');
const path = require('path');

// Paths
const packagePath = path.join(__dirname, 'package.json');
const versionJsPath = path.join(__dirname, 'data', 'version.js');

// Read package.json
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = pkg.version;

// Increment version (assuming semver: major.minor.patch)
const parts = currentVersion.split('.');
if (parts.length === 3) {
    // Increment the patch version
    parts[2] = parseInt(parts[2]) + 1;
} else {
    // If not standard semver, just append .1 or something, but 1.0.0 is there.
    // Let's just treat it as a general increment if possible.
    // For 1.0.0, it becomes 1.0.1
}

const newVersion = parts.join('.');
pkg.version = newVersion;

// Write back to package.json
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

// Write to data/version.js
const versionJsContent = `export const VERSION = "${newVersion}";\n`;
fs.writeFileSync(versionJsPath, versionJsContent);

console.log(`Version incremented: ${currentVersion} -> ${newVersion}`);
console.log(`Updated package.json and data/version.js`);
