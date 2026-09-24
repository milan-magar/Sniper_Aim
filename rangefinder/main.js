const { app, BrowserWindow, Menu, globalShortcut, shell } = require('electron');
const path = require('path');

const isDev = process.argv.includes('--dev');

let mainWindow = null;

/* =========================================================
   CREATE WINDOW
   ========================================================= */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#05070a',
    title: 'Sniper Trainer — Stadiametric Rangefinder',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      // The game is fully self-contained, so we lock down everything
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      devTools: isDev,
      zoomFactor: 1.0
    }
  });

  // Load the game
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show once ready to avoid a white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // Disable pinch-zoom / ctrl+scroll zoom for a more app-like feel
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
    mainWindow.webContents.setZoomFactor(1.0);
  });

  // Prevent external navigation; open in default browser instead
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* =========================================================
   APPLICATION MENU
   ========================================================= */
function buildMenu() {
  const template = [
    {
      label: 'Game',
      submenu: [
        {
          label: 'New Target',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow && mainWindow.webContents.send('menu-new-target')
        },
        { type: 'separator' },
        {
          label: 'Fullscreen',
          accelerator: 'F11',
          click: () => {
            if (!mainWindow) return;
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload()
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom', enabled: false },
        { role: 'zoomIn',    enabled: false },
        { role: 'zoomOut',   enabled: false },
        { type: 'separator' },
        { role: 'toggleDevTools', visible: isDev }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'How to Play',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'How to Play',
              message: 'Sniper Trainer — Stadiametric Rangefinder',
              detail:
                '1. Find the target through the scope (drag or use WASD/arrow keys to pan).\n\n' +
                '2. Estimate its range using the stadiametric ladder:\n' +
                '   • STANDING targets (1.80 m) — read the +X ladder on the right.\n' +
                '   • PRONE targets (0.50 m) — read the −Y ladder below the crosshair.\n\n' +
                '3. Read the anemometer, then enter RANGE and WIND, and press LOCK.\n\n' +
                '4. Align the cyan AIM HERE bracket over the target center and press FIRE.\n\n' +
                '5. If you miss, the spotter will call your impact in MILs — adjust and RE-FIRE.\n\n' +
                'Headshots award a +50 point bonus.',
              buttons: ['Got it']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Sniper Trainer',
              detail: 'Version ' + app.getVersion() + '\nElectron ' + process.versions.electron +
                      '\nChromium ' + process.versions.chrome + '\nNode ' + process.versions.node
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* =========================================================
   APP LIFECYCLE
   ========================================================= */
app.whenReady().then(() => {
  buildMenu();
  createWindow();

  // F11 fullscreen as a global shortcut fallback
  globalShortcut.register('F11', () => {
    if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  // macOS: re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});