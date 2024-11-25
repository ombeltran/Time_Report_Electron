const { createwindow } = require('./main');
const { app } = require('electron');
const db = require('./database'); // Ensure the functions from the `database.js` module are used correctly
require('electron-reload')(__dirname);

// Verify if the database and tables are properly initialized
try {
    console.log('Checking the database...');
    // Since tables are already created in `database.js`, this should execute automatically
    console.log('Database is ready.');
} catch (error) {
    console.error('Error initializing the database:', error.message);
    app.quit(); // Close the application if there are critical database issues
}

// Handle events for when the app is ready
app.whenReady().then(() => {
    createwindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createwindow();
        }
    });
});

// Completely exit the app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
