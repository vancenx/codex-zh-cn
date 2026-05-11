const fs = require("fs");
const path = require("path");

class ManifestPatcher {
  constructor(extensionPath) {
    this.translationData = JSON.parse(
      fs.readFileSync(
        path.join(extensionPath, "translations", "manifest-zh-cn.json"),
        "utf8",
      ),
    );
  }

  apply(manifest) {
    const next = deepClone(manifest);
    const before = JSON.stringify(next);

    if (this.translationData.displayName) {
      next.displayName = this.translationData.displayName;
    }

    if (this.translationData.description) {
      next.description = this.translationData.description;
    }

    this.patchCommands(next);
    this.patchConfiguration(next);
    this.patchCustomEditors(next);
    this.patchChatSessions(next);
    this.patchLanguages(next);

    return {
      manifest: next,
      changed: JSON.stringify(next) !== before,
    };
  }

  patchCommands(manifest) {
    const commands = manifest.contributes?.commands;
    if (!Array.isArray(commands)) {
      return;
    }

    for (const command of commands) {
      const translatedTitle = this.translationData.commands?.[command.command];
      if (translatedTitle) {
        command.title = translatedTitle;
      }
    }
  }

  patchConfiguration(manifest) {
    const configuration = manifest.contributes?.configuration;
    if (!configuration) {
      return;
    }

    if (this.translationData.configuration?.title) {
      configuration.title = this.translationData.configuration.title;
    }

    const properties = configuration.properties;
    if (!properties || typeof properties !== "object") {
      return;
    }

    const propertyTranslations = this.translationData.configuration?.properties || {};
    for (const [propertyKey, fields] of Object.entries(propertyTranslations)) {
      if (!properties[propertyKey]) {
        continue;
      }
      for (const [fieldName, fieldValue] of Object.entries(fields)) {
        properties[propertyKey][fieldName] = fieldValue;
      }
    }
  }

  patchCustomEditors(manifest) {
    const editors = manifest.contributes?.customEditors;
    if (!Array.isArray(editors)) {
      return;
    }

    for (const editor of editors) {
      const translatedName = this.translationData.customEditors?.[editor.viewType];
      if (translatedName) {
        editor.displayName = translatedName;
      }
    }
  }

  patchChatSessions(manifest) {
    const sessions = manifest.contributes?.chatSessions;
    if (!Array.isArray(sessions)) {
      return;
    }

    for (const session of sessions) {
      const translatedSession = this.translationData.chatSessions?.[session.type];
      if (!translatedSession) {
        continue;
      }

      if (translatedSession.displayName) {
        session.displayName = translatedSession.displayName;
      }
      if (translatedSession.description) {
        session.description = translatedSession.description;
      }
    }
  }

  patchLanguages(manifest) {
    const languages = manifest.contributes?.languages;
    if (!Array.isArray(languages)) {
      return;
    }

    for (const language of languages) {
      const translatedAliases = this.translationData.languages?.[language.id];
      if (translatedAliases) {
        language.aliases = translatedAliases;
      }
    }
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = ManifestPatcher;
