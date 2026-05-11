const fs = require("fs");

class BackupManager {
  getBackupPath(filePath) {
    return `${filePath}.codex-zh-cn.bak`;
  }

  hasBackup(filePath) {
    return fs.existsSync(this.getBackupPath(filePath));
  }

  createBackup(filePath) {
    const backupPath = this.getBackupPath(filePath);
    if (fs.existsSync(backupPath)) {
      return backupPath;
    }
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }

  restoreBackup(filePath) {
    const backupPath = this.getBackupPath(filePath);
    if (!fs.existsSync(backupPath)) {
      return false;
    }
    fs.copyFileSync(backupPath, filePath);
    return true;
  }
}

module.exports = BackupManager;
