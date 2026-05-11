const fs = require("fs");
const vscode = require("vscode");
const BackupManager = require("./lib/backup");
const Locator = require("./lib/locator");
const { ensureLocaleOverride, restoreLocaleOverride } = require("./lib/locale-manager");
const ManifestPatcher = require("./lib/manifest-patcher");
const WebviewPatcher = require("./lib/webview-patcher");

const REAPPLY_DELAY_MS = 1500;

function activate(context) {
  const backup = new BackupManager();
  const locator = new Locator();
  const patcher = new ManifestPatcher(context.extensionPath);
  const webviewPatcher = new WebviewPatcher();

  let reapplyTimer = null;
  let lastSeenTargetStamp = null;

  const runApply = async ({ silent = false, force = false, targetOverride = null } = {}) => {
    try {
      const config = getConfig();
      const extensionId = config.get("targetExtensionId");
      const target = targetOverride || (await locator.findExtension(extensionId));
      if (!target) {
        if (!silent) {
          vscode.window.showErrorMessage(`未找到目标扩展：${extensionId}`);
        }
        return;
      }

      const manifestPath = locator.getManifestPath(target.extensionPath);
      const appMainPath = locator.getAppMainPath(target.extensionPath);
      lastSeenTargetStamp = buildTargetStamp(target);
      if (!fs.existsSync(manifestPath)) {
        if (!silent) {
          vscode.window.showErrorMessage(`未找到目标扩展清单文件：${manifestPath}`);
        }
        return;
      }
      if (!appMainPath || !fs.existsSync(appMainPath)) {
        if (!silent) {
          vscode.window.showErrorMessage("未找到目标扩展 webview 主 bundle。");
        }
        return;
      }

      if (force && backup.hasBackup(manifestPath)) {
        backup.restoreBackup(manifestPath);
      }
      if (force && backup.hasBackup(appMainPath)) {
        backup.restoreBackup(appMainPath);
      }

      const originalContent = fs.readFileSync(manifestPath, "utf8");
      const originalManifest = JSON.parse(originalContent);
      const { manifest: translatedManifest, changed } = patcher.apply(originalManifest);
      const originalAppMain = fs.readFileSync(appMainPath, "utf8");
      const { source: translatedAppMain, changed: webviewChanged } =
        webviewPatcher.apply(originalAppMain);

      if (changed && config.get("createBackup") && !backup.hasBackup(manifestPath)) {
        backup.createBackup(manifestPath);
      }
      if (webviewChanged && config.get("createBackup") && !backup.hasBackup(appMainPath)) {
        backup.createBackup(appMainPath);
      }

      if (changed) {
        fs.writeFileSync(
          manifestPath,
          `${JSON.stringify(translatedManifest, null, 2)}\n`,
          "utf8",
        );
      }
      if (webviewChanged) {
        fs.writeFileSync(appMainPath, translatedAppMain, "utf8");
      }

      const localeChanged = config.get("applyLocaleOverride")
        ? await ensureLocaleOverride(context.globalState, {
            settingKey: config.get("localeSettingKey"),
            localeValue: config.get("localeValue"),
          })
        : false;

      if (!silent && config.get("showNotifications")) {
        const message = buildApplyMessage({
          manifestChanged: changed,
          webviewChanged,
          localeChanged,
        });
        const action = await vscode.window.showInformationMessage(
          message,
          "重新加载窗口",
          "稍后",
        );
        if (action === "重新加载窗口") {
          await vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      }
    } catch (error) {
      if (!silent) {
        vscode.window.showErrorMessage(`应用 Codex 汉化失败：${error.message}`);
      }
      console.error(error);
    }
  };

  const runRestore = async ({ silent = false } = {}) => {
    try {
      const config = getConfig();
      const extensionId = config.get("targetExtensionId");
      const target = await locator.findExtension(extensionId);
      if (!target) {
        if (!silent) {
          vscode.window.showErrorMessage(`未找到目标扩展：${extensionId}`);
        }
        return;
      }

      const manifestPath = locator.getManifestPath(target.extensionPath);
      const appMainPath = locator.getAppMainPath(target.extensionPath);
      let manifestRestored = false;
      let webviewRestored = false;
      if (backup.hasBackup(manifestPath)) {
        backup.restoreBackup(manifestPath);
        manifestRestored = true;
      }
      if (appMainPath && backup.hasBackup(appMainPath)) {
        backup.restoreBackup(appMainPath);
        webviewRestored = true;
      }

      const localeRestored = config.get("applyLocaleOverride")
        ? await restoreLocaleOverride(context.globalState, {
            settingKey: config.get("localeSettingKey"),
          })
        : false;

      if (!silent && config.get("showNotifications")) {
        const message = buildRestoreMessage({
          manifestRestored,
          webviewRestored,
          localeRestored,
        });
        const action = await vscode.window.showInformationMessage(
          message,
          "重新加载窗口",
          "稍后",
        );
        if (action === "重新加载窗口") {
          await vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      }
    } catch (error) {
      if (!silent) {
        vscode.window.showErrorMessage(`恢复 Codex 原版失败：${error.message}`);
      }
      console.error(error);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("codexZhCn.applyTranslation", () => runApply()),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("codexZhCn.reapplyTranslation", () =>
      runApply({ force: true }),
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("codexZhCn.restoreOriginal", () => runRestore()),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("codexZhCn.openSettings", () =>
      vscode.commands.executeCommand("workbench.action.openSettings", "codexZhCn"),
    ),
  );

  context.subscriptions.push(
    vscode.extensions.onDidChange(() => {
      if (!getConfig().get("autoApplyOnUpdate")) {
        return;
      }
      if (reapplyTimer) {
        clearTimeout(reapplyTimer);
      }
      reapplyTimer = setTimeout(() => {
        detectAndReapplyIfNeeded().catch((error) => console.error(error));
      }, REAPPLY_DELAY_MS);
    }),
  );

  if (getConfig().get("autoApplyOnStartup")) {
    setTimeout(() => {
      runApply({ silent: true });
    }, REAPPLY_DELAY_MS);
  }

  async function detectAndReapplyIfNeeded() {
    const extensionId = getConfig().get("targetExtensionId");
    const target = await locator.findExtension(extensionId);
    if (!target) {
      return;
    }
    const currentStamp = buildTargetStamp(target);
    if (currentStamp === lastSeenTargetStamp) {
      return;
    }
    await runApply({ silent: true, force: true, targetOverride: target });
  }
}

function deactivate() {}

function getConfig() {
  return vscode.workspace.getConfiguration("codexZhCn");
}

function buildApplyMessage({ manifestChanged, webviewChanged, localeChanged }) {
  const changedParts = collectChangedParts({
    "扩展清单": manifestChanged,
    "webview": webviewChanged,
    "语言设置": localeChanged,
  });
  if (changedParts.length === 0) {
    return "Codex 汉化已处于最新状态。";
  }
  return `Codex 汉化已应用，${changedParts.join("、")}已更新。`;
}

function buildRestoreMessage({ manifestRestored, webviewRestored, localeRestored }) {
  const restoredParts = collectChangedParts({
    "扩展清单": manifestRestored,
    "webview": webviewRestored,
    "语言设置": localeRestored,
  });
  if (restoredParts.length === 0) {
    return "没有可恢复的 Codex 汉化备份。";
  }
  return `Codex 原版已恢复，${restoredParts.join("、")}已还原。`;
}

function collectChangedParts(parts) {
  return Object.entries(parts)
    .filter(([, changed]) => changed)
    .map(([label]) => label);
}

function buildTargetStamp(target) {
  return `${target.extensionPath}::${target.version || ""}`;
}

module.exports = {
  activate,
  deactivate,
};
