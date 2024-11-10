const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require('path');
const { addUser, getUsers } = require('./database'); // Importar funciones de base de datos
let winRegister, winUsers;

// function hello() {
//     console.log('Hello world!');
// }

function createwindow() {
    winRegister = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true } })
    winRegister.loadFile('src/ui/app.html')

    const template = [
        {
            label: 'Manage users',
            click: function () {
                winUsers = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } })
                winUsers.loadFile('src/ui/users.html')
                // winUsers.webContents.openDevTools();
            }
        }
    ]

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    winRegister.webContents.openDevTools();
}

// Manejadores IPC para interactuar con la base de datos
ipcMain.on('create-user', async (event, userData) => {
    try {
        const { code, name, lastName } = userData;
        const userId = await addUser(code, name, lastName);
        event.reply('user-created', userId); // Enviar ID del nuevo usuario al renderizado
    } catch (error) {
        console.error('Error al crear usuario:', error);
    }
});

// Manejador para obtener la lista de usuarios (si es necesario)
ipcMain.handle('get-users', async () => {
    try {
        const users = await getUsers();
        return users;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return [];
    }
});

module.exports = {
    createwindow,
}