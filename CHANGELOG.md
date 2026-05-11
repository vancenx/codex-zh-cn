# Changelog

## 0.1.1

- 修复真机环境下 `chatgpt.localeOverride=zh-CN` 已写入但 webview 仍未切换中文的问题
- 新增对 `webview/assets/app-main-*.js` 的最小 i18n 补丁
- 备份与恢复范围扩展到 `package.json` 和 `app-main-*.js`

## 0.1.0

- 初始版本
- 支持将 `OpenAI.chatgpt` 的扩展清单文案汉化
- 支持自动设置 `chatgpt.localeOverride=zh-CN`
- 支持备份、恢复、启动自动应用和更新后重应用
