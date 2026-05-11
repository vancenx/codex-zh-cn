const vscode = require("vscode");

const PREVIOUS_VALUE_KEY = "codexZhCn.previousLocaleOverride";
const MANAGED_FLAG_KEY = "codexZhCn.localeOverrideManaged";

async function ensureLocaleOverride(globalState, { settingKey, localeValue }) {
  const config = vscode.workspace.getConfiguration();
  const currentValue = config.get(settingKey);
  const managed = globalState.get(MANAGED_FLAG_KEY, false);

  if (currentValue === localeValue) {
    return false;
  }

  if (!managed) {
    await globalState.update(PREVIOUS_VALUE_KEY, currentValue ?? null);
  }

  await config.update(settingKey, localeValue, vscode.ConfigurationTarget.Global);
  await globalState.update(MANAGED_FLAG_KEY, true);
  return true;
}

async function restoreLocaleOverride(globalState, { settingKey }) {
  const managed = globalState.get(MANAGED_FLAG_KEY, false);
  if (!managed) {
    return false;
  }

  const previousValue = globalState.get(PREVIOUS_VALUE_KEY, null);
  const config = vscode.workspace.getConfiguration();
  await config.update(
    settingKey,
    previousValue === null ? undefined : previousValue,
    vscode.ConfigurationTarget.Global,
  );
  await globalState.update(MANAGED_FLAG_KEY, false);
  await globalState.update(PREVIOUS_VALUE_KEY, null);
  return true;
}

module.exports = {
  ensureLocaleOverride,
  restoreLocaleOverride,
};
