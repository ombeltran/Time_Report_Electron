const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const db = require('./database'); // Import functions of database
const fs = require('fs');
const path = require('path');
let winRegister, winUsers, winHelp, winUpdate, winReport;

function createwindow() {
    const iconPath = path.resolve('src', 'assets', 'icon.ico');

    winRegister = new BrowserWindow({
        width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false },
        icon: iconPath,
    });
    winRegister.loadFile('src/ui/app.html');

    const template = [
        {
            label: 'File', submenu: [{
                label: 'Exit', click: function () {
                    app.quit();
                }
            }]
        },
        {
            label: 'Users', submenu: [{
                label: 'Create', id: 'create', click: function () {
                    winUsers = new BrowserWindow({
                        width: 1200, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false },
                        icon: iconPath,
                    });
                    winUsers.loadFile('src/ui/users.html');
                    updateMenuState('create', false);

                    winUsers.on('close', () => {
                        winUsers = null;
                        updateMenuState('create', true);
                    });
                }
            },
            {
                label: 'Update', id: 'update', click: function () {
                    winUpdate = new BrowserWindow({
                        width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false },
                        icon: iconPath,
                    });
                    winUpdate.loadFile('src/ui/update.html');
                    updateMenuState('update', false);

                    winUpdate.on('close', () => {
                        winUpdate = null;
                        updateMenuState('update', true);
                    });
                }
            },
            {
                label: 'Reports', id: 'report', click: function () {
                    winReport = new BrowserWindow({
                        width: 1200, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false },
                        icon: iconPath,
                    });
                    winReport.loadFile('src/ui/report.html');
                    updateMenuState('report', false);

                    winReport.on('close', () => {
                        winReport = null;
                        updateMenuState('report', true);
                    });
                }
            }]
        },
        {
            label: 'Help', id: 'help', click: function () {
                if (!winHelp) {
                    winHelp = new BrowserWindow({
                        width: 800, height: 600, webPreferences: {
                            preload: path.resolve(__dirname, 'ui/preload.js'),
                            contextIsolation: true,
                            enableRemoteModule: false,
                        },
                        icon: iconPath,
                    });
                    winHelp.loadFile('src/ui/help.html');
                    updateMenuState('help', false);
                    // winHelp.webContents.openDevTools();

                    winHelp.on('close', () => {
                        winHelp = null;
                        updateMenuState('help', true);
                    });
                }
            }
        }
    ];

    function updateMenuState(menuId, enabled) {
        const menu = Menu.getApplicationMenu();
        const menuItem = menu.getMenuItemById(menuId);
        if (menuItem) {
            menuItem.enabled = enabled;
        }
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// *************** Process with Users Window ********************

// IPC handler to work with database
ipcMain.on('create-user', (event, userData) => {
    try {
        const { code, name, lastName, state } = userData;
        const userId = db.addUser(code, name, lastName, state);  // Direct synchronous call
        console.log(`Created user with ID: ${userId}`);
        event.reply('user-created', { success: true, userId });
    } catch (error) {
        console.error('Error creating user:', error.message);
        const message = error.message.includes('UNIQUE constraint failed: users.code')
            ? 'The code was already used. Please, use another.'
            : 'Error while creating user. Try again.';
        event.reply('user-created', { success: false, message });
    }
});

// IPC handler to get user list
ipcMain.handle('get-users', () => {
    try {
        const users = db.getUsers();  // Direct synchronous call
        return users;
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
});

//Get only one user information
ipcMain.handle('get-users-by-code', (event, updateCode) => {
    try {
        const user = db.getOneUser(updateCode);  // Direct synchronous call
        return user ? [user] : [];;
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
})

// Update user state
ipcMain.handle('update-user-state', (event, userId, newState) => {
    try {
        db.updateUserState(userId, newState);  // Direct synchronous call
        return { success: true };
    } catch (error) {
        console.error('Error updating user state:', error);
        return { success: false, message: error.message };
    }
});

// *************** Process with App Window (Record creations) ********************

// IPC handler to create a record
ipcMain.on('create-record', (event, recordData) => {
    try {
        const { code } = recordData;  
        const userExists = db.getUsers();  
        const user = userExists.find(user => user.code === code);

        if (!user) {
            event.reply('user-record', { success: false, message: 'User code does not exist.' });
            return;
        }

        const recordCode = db.handleUserCheckInOut(code);
        console.log(`User created with code: ${recordCode}`);
        event.reply('user-record', { success: true, recordCode });
    } catch (error) {
        console.error('Error creating record:', error.message);
        event.reply('user-record', { success: false, message: 'Error creating record. Try again.' });
    }
});

// Get all records
ipcMain.handle('get-records', () => {
    try {
        const records = db.getRelatedRecords();  // Direct synchronous call
        return records;
    } catch (error) {
        console.error('Error getting records:', error);
        return [];
    }
});

// Get a specific user record
ipcMain.handle('get-one-record', (event, code) => {
    try {
        const records = db.getOneRecord(code);  // Direct synchronous call
        return records;
    } catch (error) {
        console.error('Error fetching record:', error);
        return [];
    }
});

// *************** Backup and Export *****************

// Backup process
ipcMain.handle('backup-database', () => {
    try {
        const databasePath = path.resolve(__dirname, 'my-data-base.db');
        console.log('Database path:', databasePath);

        const filePath = dialog.showSaveDialogSync({
            title: 'Save backup',
            defaultPath: 'backup.sql',
            filters: [
                { name: 'SQL Files', extensions: ['sql'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!filePath) {
            console.error('Backup canceled or no file path provided.');
            return { success: false, error: 'The user canceled the process or no file path provided.' };
        }

        if (!fs.existsSync(databasePath)) {
            console.error('Database file does not exist:', databasePath);
            return { success: false, error: `File does not exist: ${databasePath}` };
        }

        fs.copyFileSync(databasePath, filePath);
        console.log('Backup done successfully:', filePath);
        return { success: true, filePath };
    } catch (error) {
        console.error('Error during backup:', error);
        return { success: false, error: error.message };
    }
});

// *************** Export CSV *****************

ipcMain.handle('save-csv', (event, csvData) => {
    try {
        const result = dialog.showSaveDialogSync({
            filters: [
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });

        if (!result) {
            console.log('User canceled export');
            return;
        }

        fs.writeFileSync(result, csvData);
        console.log('CSV file saved at:', result);
    } catch (error) {
        console.error('Error saving CSV:', error);
    }
});

// *************** Window visibility *****************

// Hide and show the users window
ipcMain.on('hide-users-window', () => {
    if (winUsers && winUsers.isVisible()) winUsers.hide();
});

ipcMain.on('show-users-window', () => {
    if (winUsers && !winUsers.isVisible()) winUsers.show();
    winUsers.focus();
});

ipcMain.on('focus-users-window', () => {
    if (winUsers) winUsers.focus();
});

// Hide and show the app window (checkIn amd checkOut)
ipcMain.on('hide-register-window', () => {
    if (winRegister && winRegister.isVisible()) winRegister.hide();
});

ipcMain.on('show-register-window', () => {
    if (winRegister && !winRegister.isVisible()) winRegister.show();
    winRegister.focus();
});

ipcMain.on('focus-winRegister-window', () => {
    if (winRegister) winRegister.focus();
});

module.exports = {
    createwindow,
};
