const PATCH_MARKER = "codex-zh-cn:force-i18n";
const ENABLE_I18N_PATTERN =
  /\(\)=>[A-Za-z_$][\w$]*\?\.get\(`enable_i18n`,!1\)/;

class WebviewPatcher {
  apply(source) {
    if (source.includes(PATCH_MARKER)) {
      return {
        source,
        changed: false,
      };
    }

    const next = source.replace(
      ENABLE_I18N_PATTERN,
      `()=>!0/*${PATCH_MARKER}*/`,
    );

    if (next === source) {
      throw new Error("未找到 Codex i18n 补丁位点，当前版本可能已调整前端结构。");
    }

    return {
      source: next,
      changed: true,
    };
  }
}

module.exports = WebviewPatcher;
module.exports.PATCH_MARKER = PATCH_MARKER;
