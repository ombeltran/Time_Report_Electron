const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const {
    addUser,
    getUsers,
    handleUserCheckInOut,
    updateUserState,
    getRelatedRecords
} = require('./database'); // Import functions of database
let winRegister, winUsers, winHelp, winUpdate, winReport;

function createwindow() {
    winRegister = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } });
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
                    winUsers = new BrowserWindow({ width: 1200, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } });
                    winUsers.loadFile('src/ui/users.html');
                    updateMenuState('create', false);
                    // winUsers.webContents.openDevTools();

                    // 'close' event for winUsers
                    winUsers.on('close', () => {
                        winUsers = null;
                        updateMenuState('create', true);
                    });
                }
            },
            {
                label: 'Update', id: 'update', click: function () {
                    winUpdate = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } });
                    winUpdate.loadFile('src/ui/update.html');
                    updateMenuState('update', false);
                    // winUpdate.webContents.openDevTools();

                    // 'close' event for winUsers
                    winUpdate.on('close', () => {
                        winUpdate = null;
                        updateMenuState('update', true);
                    });
                }
            },
            {
                label: 'Reports', id: 'report', click: function () {
                    winReport = new BrowserWindow({ width: 1200, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false} });
                    winReport.loadFile('src/ui/report.html');
                    updateMenuState('report', false);
                    winReport.webContents.openDevTools();

                    // 'close' event for winUsers
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
                    // Create only if not initialized
                    winHelp = new BrowserWindow({ width: 800, height: 600, webPreferences: { nodeIntegration: true, contextIsolation: false } });
                    winHelp.loadFile('src/ui/help.html');
                    updateMenuState('help', false);

                    winHelp.on('close', () => {
                        winHelp = null;
                        updateMenuState('help', true);
                    });
                }
            }
        }
    ];

    // Function to update the menu state
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
ipcMain.on('create-user', async (event, userData) => {
    try {
        const { code, name, lastName, state } = userData;
        const userId = await addUser(code, name, lastName, state);
        console.log(`Created user with ID: ${userId}`);
        event.reply('user-created', { success: true, userId }); // Send successful response
    } catch (error) {
        console.error('Error creating user:', error.message);

        // Error message
        const message = error.message.includes('UNIQUE constraint failed: users.code')
            ? 'The code was already used. Please, use another.'
            : 'Error while creating user. Try again.';
        event.reply('user-created', { success: false, message });
    }
});

// IPC handler to get user list (if necessary)
ipcMain.handle('get-users', async () => {
    try {
        const users = await getUsers();
        return users;
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
});

// Hide and show the users window to resolve cursor loss issue
ipcMain.on('hide-users-window', () => {
    if (winUsers && winUsers.isVisible()) winUsers.hide();
});

ipcMain.on('show-users-window', () => {
    if (winUsers && !winUsers.isVisible()) winUsers.show();
    winUsers.focus();  // Ensure it is focused when shown again
});

ipcMain.on('focus-users-window', () => {
    if (winUsers) winUsers.focus();
});

// *************** Process with update window ********************

// Get users by code
ipcMain.handle('get-users-by-code', async (event, code) => {
    try {
        const users = await getUsers();
        return users.filter(user => user.code === code); // Filter by code
    } catch (error) {
        console.error('Error getting users by code:', error);
        return [];
    }
});

// Update user state
ipcMain.handle('update-user-state', async (event, userId, newState) => {
    try {
        await updateUserState(userId, newState);
        return { success: true };  // Return a successful result
    } catch (error) {
        console.error('Error updating user state:', error);
        return { success: false, message: error.message };  // Return the error
    }
});

// *************** Process with App Window (Record creations) ********************

// IPC handler to work with database
ipcMain.on('create-record', async (event, recordData) => {
    try {
        const { code } = recordData;  // User code

        // Check if the code exists in the database
        const userExists = await getUsers();  // Assuming this function returns the list of users
        const user = userExists.find(user => user.code === code);

        if (!user) {
            // If user is not found, send error message
            event.reply('user-record', { success: false, message: 'User code does not exist.' });
            return;
        }

        // If user exists, proceed with the process
        const recordCode = await handleUserCheckInOut(code);
        console.log(`User created with code: ${recordCode}`);
        event.reply('user-record', { success: true, recordCode });  // Successful response

    } catch (error) {
        console.error('Error creating record:', error.message);
        event.reply('user-record', { success: false, message: 'Error creating record. Try again.' });
    }
});

// Get all records without a specifict critery
ipcMain.handle('get-records', async () => {
    try {
        const records = await getRelatedRecords();
        return records;
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
});

// Get all records with a specifict critery
ipcMain.handle('get-records-date', async (event, iniCheckIn, finalCheckOut) => {
    try {
        console.log('esto llega al main: ', iniCheckIn, finalCheckOut);
        const records = await getAllRecordOneDate(iniCheckIn, finalCheckOut);
        return records;
    } catch (error) {
        console.error('Error getting records by date:', error);
        return [];
    }
});

// Hide and show the users window to resolve cursor loss issue
ipcMain.on('hide-register-window', () => {
    if (winRegister && winRegister.isVisible()) winRegister.hide();
});

ipcMain.on('show-register-window', () => {
    if (winRegister && !winRegister.isVisible()) winRegister.show();
    winRegister.focus();  // Ensure it is focused when shown again
});

ipcMain.on('focus-register-window', () => {
    if (winRegister) winRegister.focus();
});

// *************** Export windows creation ********************
module.exports = {
    createwindow,
};
