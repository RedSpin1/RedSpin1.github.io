const { app, BrowserWindow } = require('electron');
function createWindow() {
    const win = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } });
    
    // ADD THIS LINE BELOW:
    win.webContents.openDevTools(); 
    
    win.loadFile('index.html');
}
app.whenReady().then(createWindow);
