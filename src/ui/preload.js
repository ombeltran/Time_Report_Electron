const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
    backupDatabase: () => ipcRenderer.invoke('backup-database'),
});
