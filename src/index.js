const {createwindow} = require('./main');
const {app} = require('electron');

const db = require('./database');
require('electron-reload')(__dirname);

app.whenReady().then(createwindow);
