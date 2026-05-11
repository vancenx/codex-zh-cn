const fs = require("fs");
const os = require("os");
const path = require("path");
let vscode = null;
try {
  vscode = require("vscode");
} catch {
  vscode = null;
}

class Locator {
  async findExtension(extensionId) {
    const exactMatch = vscode?.extensions?.getExtension?.(extensionId);
    if (exactMatch) {
      return {
        extensionId,
        extensionPath: exactMatch.extensionPath,
        version: exactMatch.packageJSON?.version || null,
      };
    }

    const normalizedPrefix = `${extensionId.toLowerCase()}-`;
    for (const root of this.getExtensionRoots()) {
      if (!fs.existsSync(root)) {
        continue;
      }
      const entries = fs.readdirSync(root, { withFileTypes: true });
      const match = entries.find(
        (entry) => entry.isDirectory() && entry.name.toLowerCase().startsWith(normalizedPrefix),
      );
      if (match) {
        const extensionPath = path.join(root, match.name);
        return {
          extensionId,
          extensionPath,
          version: this.readVersion(extensionPath),
        };
      }
    }

    return null;
  }

  getManifestPath(extensionPath) {
    return path.join(extensionPath, "package.json");
  }

  getAppMainPath(extensionPath) {
    const assetsPath = path.join(extensionPath, "webview", "assets");
    if (!fs.existsSync(assetsPath)) {
      return null;
    }

    const entries = fs
      .readdirSync(assetsPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^app-main-.*\.js$/i.test(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name));

    if (entries.length === 0) {
      return null;
    }

    return path.join(assetsPath, entries[0].name);
  }

  getExtensionRoots() {
    const home = os.homedir();
    return [
      path.join(home, ".vscode", "extensions"),
      path.join(home, ".vscode-insiders", "extensions"),
    ];
  }

  readVersion(extensionPath) {
    try {
      const manifestPath = this.getManifestPath(extensionPath);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      return manifest.version || null;
    } catch {
      return null;
    }
  }
}

module.exports = Locator;
