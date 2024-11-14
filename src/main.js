const {  BrowserWindow, Menu, ipcMain } = require("electron");
const { addUser, getUsers, handleUserCheckInOut } = require('./database'); // Import functions of data base
let winRegister, winUsers, winHelp;

function createwindow() {
    winRegister = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } })
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
    // winRegister.webContents.openDevTools();
}

// *************** Process with Users Window ********************

// Handler IPC to work with data base
ipcMain.on('create-user', async (event, userData) => {
    try {
        const { code, name, lastName, state } = userData;
        const userId = await addUser(code, name, lastName, state);
        console.log(`Created user with ID: ${userId}`);
        event.reply('user-created', { success: true, userId }); // Send successfuly response
    } catch (error) {
        console.error('Error user creating:', error.message);

        // Mensaje de error
        const message = error.message.includes('UNIQUE constraint failed: users.code')
            ? 'The code was already used. Please, use other.'
            : 'Error while user create. Try again.';
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

// Hide and the sow the users window for resolve the problem of cursor lose
ipcMain.on('hide-users-window', () => {
    if (winUsers && winUsers.isVisible()) winUsers.hide();
});

ipcMain.on('show-users-window', () => {
    if (winUsers && !winUsers.isVisible()) winUsers.show();
    winUsers.focus();  // Asegura que se focalice al mostrarla nuevamente
});

ipcMain.on('focus-users-window', () => {
    if (winUsers) winUsers.focus();
});

// *************** Process with App Window (Record creations) ********************

// Handler IPC to work with data base
ipcMain.on('create-record', async (event, recordData) => {
    try {
        const { code } = recordData;  // El código del usuario

        // Verificar si el código existe en la base de datos
        const userExists = await getUsers();  // Suponiendo que esta función devuelve la lista de usuarios
        const user = userExists.find(user => user.code === code);

        if (!user) {
            // Si no se encuentra el usuario, enviar mensaje de error
            event.reply('user-record', { success: false, message: 'User code does not exist.' });
            return;
        }

        // Si el usuario existe, proceder con el proceso
        const recordCode = await handleUserCheckInOut(code);
        console.log(`User created with code: ${recordCode}`);
        event.reply('user-record', { success: true, recordCode });  // Respuesta exitosa

    } catch (error) {
        console.error('Error creating record:', error.message);
        event.reply('user-record', { success: false, message: 'Error creating record. Try again.' });
    }
});

// Hide and the sow the users window for resolve the problem of cursor lose
ipcMain.on('hide-register-window', () => {
    if (winRegister && winRegister.isVisible()) winRegister.hide();
});

ipcMain.on('show-register-window', () => {
    if (winRegister && !winRegister.isVisible()) winRegister.show();
    winRegister.focus();  // Asegura que se focalice al mostrarla nuevamente
});

ipcMain.on('focus-register-window', () => {
    if (winRegister) winRegister.focus();
});

// *************** Export windows creation ********************
module.exports = {
    createwindow,
}