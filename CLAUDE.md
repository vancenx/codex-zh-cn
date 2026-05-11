# CLAUDE.md

## 项目目标

这个项目产出一个 VS Code 扩展，用于把 `OpenAI.chatgpt`（Codex VS Code 插件）的可见文案切换为简体中文。

当前实现策略固定为三层：

1. 修改目标扩展 `package.json` 中的命令名、设置说明等清单文案。
2. 将 `chatgpt.localeOverride` 设置为 `zh-CN`，让目标扩展内置的中文 webview 资源生效。
3. 对目标扩展 `webview/assets/app-main-*.js` 做最小补丁，强制启用前端 i18n 加载链，避免内置中文资源因 `enable_i18n` gating 未开启而失效。

不做的事：

- 不重写 Codex 的整套 webview bundle，只允许对已定位的最小入口文件做定点补丁。
- 不引入额外运行时服务。
- 不做发布、部署、自动上传。

## 目录约定

- `extension.js`：VS Code 扩展入口。
- `lib/`：实现逻辑，按职责拆分。
- `translations/`：翻译数据。
- `scripts/`：本地验证脚本。
- `dist/`：打包产物，仅构建生成，不手写。

## 工程约束

- 优先结构化修改 JSON，不用脆弱的全局字符串替换。
- 只修改目标扩展最小必要文件：当前为 `package.json` 和 `webview/assets/app-main-*.js`。
- 备份文件使用同目录旁路文件，不覆盖已有备份。
- 恢复时只恢复本扩展创建过的内容，不碰其他文件。
- 针对 webview 的补丁必须可重复应用、可检测已应用状态，并在目标版本结构变化时明确报错，不允许静默跳过。

## 开发命令

- 安装依赖：`npm install`
- 本地验证：`npm run verify`
- 打包扩展：`npm run package`

## 验证要求

每次改动至少执行：

1. `npm run verify`
2. `npm run package`

如果目标环境已安装 `OpenAI.chatgpt`，还应保证：

- 能定位目标扩展目录。
- 能创建 `package.json.codex-zh-cn.bak` 备份。
- 能创建 `app-main-*.js.codex-zh-cn.bak` 备份。
- 能把 `chatgpt.localeOverride` 设为 `zh-CN`。
- 能对 `app-main-*.js` 成功注入 i18n 补丁。
- 能从备份恢复。
