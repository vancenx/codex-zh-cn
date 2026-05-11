const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const BackupManager = require("../lib/backup");
const ManifestPatcher = require("../lib/manifest-patcher");
const WebviewPatcher = require("../lib/webview-patcher");
const Locator = require("../lib/locator");

function main() {
  verifyManifestPatcher();
  verifyWebviewPatcher();
  verifyLocator();
  verifyBackupManager();
  console.log("verify ok");
}

function verifyManifestPatcher() {
  const patcher = new ManifestPatcher(path.join(__dirname, ".."));
  const manifest = {
    displayName: "Codex - OpenAI's coding agent",
    description: "placeholder",
    contributes: {
      commands: [
        {
          command: "chatgpt.openSidebar",
          title: "Open Codex Sidebar",
        },
        {
          command: "chatgpt.newCodexPanel",
          title: "New Codex Agent",
        },
      ],
      configuration: {
        title: "Codex Settings",
        properties: {
          "chatgpt.localeOverride": {
            description: "Preferred language for the Codex UI. Leave empty to auto detect.",
          },
        },
      },
      customEditors: [
        {
          viewType: "chatgpt.conversationEditor",
          displayName: "Codex Task",
        },
      ],
      chatSessions: [
        {
          type: "openai-codex",
          displayName: "OpenAI Codex",
          description: "OpenAI Codex integration for VS Code",
        },
      ],
      languages: [
        {
          id: "codex-rules",
          aliases: ["Codex Rules"],
        },
      ],
    },
  };

  const { manifest: translated, changed } = patcher.apply(manifest);

  assert.equal(changed, true);
  assert.equal(translated.displayName, "Codex - OpenAI 的编码代理");
  assert.equal(translated.contributes.commands[0].title, "打开 Codex 侧边栏");
  assert.equal(translated.contributes.commands[1].title, "新建 Codex Agent");
  assert.equal(translated.contributes.configuration.title, "Codex 设置");
  assert.equal(
    translated.contributes.configuration.properties["chatgpt.localeOverride"].description,
    "Codex UI 的首选语言。留空则自动检测。",
  );
  assert.equal(translated.contributes.customEditors[0].displayName, "Codex 任务");
  assert.equal(
    translated.contributes.chatSessions[0].description,
    "OpenAI Codex 的 VS Code 集成",
  );
  assert.deepEqual(translated.contributes.languages[0].aliases, ["Codex 规则"]);
}

function verifyWebviewPatcher() {
  const patcher = new WebviewPatcher();
  const source =
    "function qN(){let n=gs(`72216192`),r=(0,Q.useMemo)(()=>n?.get(`enable_i18n`,!1),[n]),i=(0,Q.useMemo)(()=>n?.get(`locale_source`,`IDE`),[n]);return r&&i}";

  const firstPass = patcher.apply(source);
  assert.equal(firstPass.changed, true);
  assert.match(firstPass.source, /codex-zh-cn:force-i18n/);
  assert.ok(!firstPass.source.includes("enable_i18n"));

  const secondPass = patcher.apply(firstPass.source);
  assert.equal(secondPass.changed, false);
}

function verifyLocator() {
  const locator = new Locator();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-zh-cn-locator-"));
  const assetsDir = path.join(tempDir, "webview", "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.writeFileSync(path.join(assetsDir, "app-main-ZZZ.js"), "", "utf8");
  fs.writeFileSync(path.join(assetsDir, "app-main-AAA.js"), "", "utf8");

  assert.equal(
    locator.getAppMainPath(tempDir),
    path.join(assetsDir, "app-main-AAA.js"),
  );
}

function verifyBackupManager() {
  const backup = new BackupManager();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-zh-cn-"));
  const filePath = path.join(tempDir, "package.json");
  fs.writeFileSync(filePath, "before", "utf8");

  backup.createBackup(filePath);
  fs.writeFileSync(filePath, "after", "utf8");
  const restored = backup.restoreBackup(filePath);

  assert.equal(restored, true);
  assert.equal(fs.readFileSync(filePath, "utf8"), "before");
}

main();
