const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { EngineBridge } = require('./cpp_engine/bridge');

// Global engine bridge instance
let engineBridge = null;
let mainWindow = null;

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Custom titlebar
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false
    },
    icon: path.join(__dirname, 'icon.ico'),
    show: false // Don't show until ready
  });

  // Load the built React app
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(indexPath);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize engine bridge
async function initializeEngine() {
  engineBridge = new EngineBridge();
  
  // Listen for engine messages
  engineBridge.onMessage((message) => {
    if (mainWindow) {
      mainWindow.webContents.send('engine-message', message);
    }
  });

  const status = engineBridge.getStatus();
  console.log('[Main] Engine status:', status);
  
  return status;
}

// IPC Handlers
function setupIPCHandlers() {
  // Get engine status
  ipcMain.handle('get-engine-status', async () => {
    if (!engineBridge) {
      return { error: 'Engine bridge not initialized' };
    }
    return engineBridge.getStatus();
  });

  // Inject engine into Roblox
  ipcMain.handle('inject-engine', async () => {
    try {
      if (!engineBridge) {
        engineBridge = new EngineBridge();
      }
      
      console.log('[Main] Starting injection...');
      const result = await engineBridge.injectEngine();
      
      // Wait a bit for injection to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to connect to engine
      try {
        await engineBridge.connect();
        return { success: true, message: 'Engine injected and connected' };
      } catch (connErr) {
        return { 
          success: true, 
          message: 'Engine injected but connection pending - will retry on first execute',
          warning: connErr.message 
        };
      }
    } catch (error) {
      console.error('[Main] Injection error:', error);
      return { success: false, error: error.message };
    }
  });

  // Connect to engine
  ipcMain.handle('connect-engine', async () => {
    try {
      if (!engineBridge) {
        engineBridge = new EngineBridge();
      }
      
      await engineBridge.connect();
      return { success: true, connected: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Execute script
  ipcMain.handle('execute-script', async (event, script) => {
    try {
      if (!engineBridge) {
        return { success: false, error: 'Engine not initialized' };
      }

      // Try to connect if not connected
      if (!engineBridge.connected) {
        try {
          await engineBridge.connect();
        } catch (connErr) {
          return { success: false, error: `Not connected: ${connErr.message}` };
        }
      }

      const result = await engineBridge.executeScript(script);
      return result;
    } catch (error) {
      console.error('[Main] Execute error:', error);
      return { success: false, error: error.message };
    }
  });

  // Stop execution
  ipcMain.handle('stop-execution', async () => {
    // C++ engine doesn't support stopping yet
    return { success: false, message: 'Stop not implemented in engine' };
  });

  // Window controls
  ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  // Show save dialog
  ipcMain.handle('show-save-dialog', async (event, options) => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  // Show open dialog
  ipcMain.handle('show-open-dialog', async (event, options) => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });
}

// App event handlers
app.whenReady().then(async () => {
  console.log('[Main] Electron app ready');
  
  // Initialize engine bridge
  await initializeEngine();
  
  // Create window
  createWindow();
  
  // Setup IPC
  setupIPCHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Cleanup engine bridge
  if (engineBridge) {
    engineBridge.disconnect();
    engineBridge = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup before quit
  if (engineBridge) {
    engineBridge.disconnect();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});
