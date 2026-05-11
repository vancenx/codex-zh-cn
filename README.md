# [非官方] Codex 中文汉化

这个项目提供一个 VS Code 扩展，用来把 OpenAI 的 Codex VS Code 插件切换为简体中文。

当前方案不是重做一套语言包，而是基于 Codex 现有结构做最小改动：

1. 把 `OpenAI.chatgpt` 扩展 `package.json` 里的命令名、设置说明等清单文案改成中文。
2. 把 `chatgpt.localeOverride` 设为 `zh-CN`，让 Codex 内置的中文 webview 资源生效。
3. 对 `webview/assets/app-main-*.js` 做定点补丁，强制打开 Codex 前端的 i18n 加载链。

这比整包替换 webview bundle 更稳，升级后也更容易重新应用。

## 功能

- 启动时自动应用汉化
- 检测到目标扩展更新后自动重应用
- 修改前自动备份 `package.json` 和 `app-main-*.js`
- 支持一键恢复原版
- 支持配置目标扩展 ID 和语言覆盖值

## 命令

在命令面板中搜索：

- `应用 Codex 汉化`
- `重新应用 Codex 汉化`
- `还原 Codex 原版`
- `打开 Codex 汉化设置`

## 配置项

- `codexZhCn.autoApplyOnStartup`
- `codexZhCn.autoApplyOnUpdate`
- `codexZhCn.createBackup`
- `codexZhCn.showNotifications`
- `codexZhCn.targetExtensionId`
- `codexZhCn.localeSettingKey`
- `codexZhCn.localeValue`
- `codexZhCn.applyLocaleOverride`

默认目标是：

- 扩展 ID：`openai.chatgpt`
- 语言设置键：`chatgpt.localeOverride`
- 语言值：`zh-CN`

## 开发

```bash
npm install
npm run verify
npm run package
```

打包产物默认输出到 `dist/codex-zh-cn.vsix`。

## 已知边界

- 这个插件依赖 Codex 扩展本身已经内置 `zh-CN` webview 资源。
- 当前只补丁已确认的 `app-main-*.js` i18n gating 位点，不做整包字符串替换。
- 如果 Codex 后续移除 `localeOverride`、调整前端入口文件名，或修改 i18n 加载逻辑，需要跟进适配。
