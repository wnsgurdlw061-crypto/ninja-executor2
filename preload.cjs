const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Secure bridge between React UI and Electron main process
 * Exposes only necessary APIs to the renderer process
 */

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Engine API
  getEngineStatus: () => ipcRenderer.invoke('get-engine-status'),
  injectEngine: () => ipcRenderer.invoke('inject-engine'),
  connectEngine: () => ipcRenderer.invoke('connect-engine'),
  executeScript: (script) => ipcRenderer.invoke('execute-script', script),
  stopExecution: () => ipcRenderer.invoke('stop-execution'),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),

  // Dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // Listen for engine messages
  onEngineMessage: (callback) => {
    // Remove any existing listeners to prevent duplicates
    ipcRenderer.removeAllListeners('engine-message');
    // Add new listener
    ipcRenderer.on('engine-message', (event, message) => callback(message));
  },

  // Remove engine message listener
  offEngineMessage: (callback) => {
    ipcRenderer.removeListener('engine-message', callback);
  },

  // Platform info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron
  }
});

// Log that preload script has loaded
console.log('[Preload] Electron API exposed to renderer');
