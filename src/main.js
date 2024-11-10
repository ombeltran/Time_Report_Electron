const { BrowserWindow } = require("electron");
const { Menu } = require("electron");
let winRegister, winUsers;

function createwindow() {
    winRegister = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true } })
    winRegister.loadFile('src/ui/app.html')

    const template = [
        {
            label: 'Manage users',
            click: function () {
                winUsers = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true } })
                winUsers.loadFile('src/ui/users.html')
                winUsers.webContents.openDevTools();
            }
        }
    ]

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    winRegister.webContents.openDevTools();
}

module.exports = {
    createwindow
}