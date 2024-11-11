const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require('path');
const { addUser, getUsers } = require('./database'); // Import functions of data base
let winRegister, winUsers, winHelp;

function createwindow() {
    winRegister = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true } })
    winRegister.loadFile('src/ui/app.html')

    const template = [
        {
            label: 'File', submenu: [{label: 'Log out'}, {label: 'Exit'}]
        },
        {
            label: 'Users', submenu: [{label: 'Create/Update users', click: function () {
                    winUsers = new BrowserWindow({ width: 1200, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } })
                    winUsers.loadFile('src/ui/users.html')
                    // winUsers.webContents.openDevTools();
                }}, {label: 'Reports'}]
        },
        {
            label: 'Help', click: function () {
                winHelp = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } })
                winHelp.loadFile('src/ui/help.html')
            }
        }
    ]

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    winRegister.webContents.openDevTools();
}

// Handler IPC to work with data base
ipcMain.on('create-user', async (event, userData) => {
    try {
        const { code, name, lastName, state } = userData;
        const userId = await addUser(code, name, lastName, state);
        console.log(`Usuario creado con ID: ${userId}`);
        event.reply('user-created', { success: true, userId }); // Enviar respuesta exitosa
    } catch (error) {
        console.error('Error creando usuario:', error.message);

        // Mensaje de error
        const message = error.message.includes('UNIQUE constraint failed: users.code')
            ? 'El código ya ha sido utilizado. Por favor, use otro.'
            : 'Error al crear el usuario. Intente de nuevo.';
        event.reply('user-created', { success: false, message });
    }
});


// Handler to get user list (if it is necesary)
ipcMain.handle('get-users', async () => {
    try {
        const users = await getUsers();
        return users;
    } catch (error) {
        console.error('Error to get users:', error);
        return [];
    }
});

module.exports = {
    createwindow,
}