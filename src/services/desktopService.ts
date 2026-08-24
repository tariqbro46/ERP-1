/**
 * Desktop Application & Local Storage Bridge Service
 * Seamlessly manages Desktop mode (Electron) and Web mode (Browser)
 */

declare global {
  interface Window {
    desktopAPI?: {
      isDesktop: boolean;
      platform: string;
      version: string;
      saveBackupFile: (fileName: string, data: any) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
      loadBackupFile: () => Promise<{ success: boolean; filePath?: string; data?: string; error?: string; canceled?: boolean }>;
      getSystemStorageInfo: () => Promise<{ userDataPath: string; appVersion: string; platform: string; isPackaged: boolean }>;
      printToPrinter: (options?: any) => Promise<any>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
    };
  }
}

export const desktopService = {
  /**
   * Detects if the app is running as an installed Desktop Application
   */
  isDesktop(): boolean {
    return typeof window !== 'undefined' && Boolean(window.desktopAPI?.isDesktop);
  },

  /**
   * Gets the operating platform (e.g. 'win32', 'darwin', 'linux' or 'web')
   */
  getPlatform(): string {
    if (this.isDesktop() && window.desktopAPI?.platform) {
      return window.desktopAPI.platform;
    }
    return 'web';
  },

  /**
   * Safely exports local database backup to the computer's storage or triggers browser download
   */
  async exportLocalBackup(filename: string, backupData: any): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const dataStr = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);

      // If running inside Electron desktop app
      if (this.isDesktop() && window.desktopAPI?.saveBackupFile) {
        const result = await window.desktopAPI.saveBackupFile(filename, dataStr);
        if (result.canceled) return { success: false, error: 'User canceled file selection' };
        if (!result.success) return { success: false, error: result.error || 'Failed to save local file' };
        return { success: true, filePath: result.filePath };
      }

      // Browser Fallback (Standard Web Download)
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, filePath: 'Browser Downloads' };
    } catch (err: any) {
      console.error('Export local backup error:', err);
      return { success: false, error: err.message || 'Unknown backup error' };
    }
  },

  /**
   * Imports local database backup from computer's disk or file picker
   */
  async importLocalBackup(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // If running inside Electron desktop app
      if (this.isDesktop() && window.desktopAPI?.loadBackupFile) {
        const result = await window.desktopAPI.loadBackupFile();
        if (result.canceled) return { success: false, error: 'User canceled file selection' };
        if (!result.success || !result.data) return { success: false, error: result.error || 'Failed to load file' };
        
        const parsed = JSON.parse(result.data);
        return { success: true, data: parsed };
      }

      // Browser Fallback: Open file input
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.db';
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) {
            resolve({ success: false, error: 'No file chosen' });
            return;
          }
          try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            resolve({ success: true, data: parsed });
          } catch (readErr: any) {
            resolve({ success: false, error: 'Invalid backup file format' });
          }
        };
        input.click();
      });
    } catch (err: any) {
      return { success: false, error: err.message || 'Import error' };
    }
  },

  /**
   * Gets desktop app metadata & storage location info
   */
  async getStorageInfo(): Promise<{ isDesktop: boolean; platform: string; storagePath?: string }> {
    if (this.isDesktop() && window.desktopAPI?.getSystemStorageInfo) {
      try {
        const info = await window.desktopAPI.getSystemStorageInfo();
        return {
          isDesktop: true,
          platform: info.platform,
          storagePath: info.userDataPath
        };
      } catch (e) {
        return { isDesktop: true, platform: this.getPlatform() };
      }
    }

    return {
      isDesktop: false,
      platform: 'web',
      storagePath: 'IndexedDB & Firebase Cloud'
    };
  }
};
