# [非官方] Codex 简体中文汉化包

本扩展是由社区开发的非官方汉化补丁，旨在为 Codex VS Code 插件提供简体中文界面支持。

注意： 本项目与 openAI 官方或 Codex 团队无任何关联。

[从 VS Code 扩展商店安装](https://marketplace.visualstudio.com/items?itemName=vancenx.codex-zh-cn)

![Codex 简体中文汉化包预览](https://raw.githubusercontent.com/vancenx/codex-zh-cn/refs/heads/main/image.png)

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

## 项目结构

```text
codexcn/
├─ lib/
│  ├─ backup.js            # 备份与恢复
│  ├─ locale-manager.js    # localeOverride 写入与恢复
│  ├─ locator.js           # 定位目标扩展和目标文件
│  ├─ manifest-patcher.js  # 修改 package.json 文案
│  └─ webview-patcher.js   # 修改 app-main-*.js 的 i18n 开关
├─ scripts/
│  └─ verify.js            # 本地验证脚本
├─ translations/
│  └─ manifest-zh-cn.json  # 清单翻译数据
├─ extension.js            # 扩展入口
├─ package.json            # 扩展配置
└─ README.md               # 项目说明
```

## 工作原理

1. 定位扩展：优先使用 VS Code API 查找 `openai.chatgpt`，失败时再从本地扩展目录搜索。
2. 查找目标文件：定位目标扩展中的 `package.json` 和 `webview/assets/app-main-*.js`。
3. 创建备份：修改前为这两个文件生成 `.codex-zh-cn.bak` 备份。
4. 应用汉化：把 `translations/manifest-zh-cn.json` 中的翻译合并到目标扩展 `package.json`。
5. 启用中文界面：将 `chatgpt.localeOverride` 设为 `zh-CN`，并对 `app-main-*.js` 打最小补丁，强制开启前端 i18n。
6. 重应用与恢复：启动时自动应用；检测到目标扩展更新后自动重应用；需要时可从备份还原原版。

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
