// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Rout of data base
const dbPath = path.join(__dirname, 'mi-base-de-datos.db');

// Connect to data base
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Successfull connection to data base SQLite');
    }
});

// Build a table if it does not exist.
const createTable = async () => {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE,
                name TEXT,
                lastName TEXT,
                state TEXT,
                creationDate DATE DEFAULT (datetime('now', 'localtime')),
                updateDate DATE DEFAULT (datetime('now', 'localtime'))
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};


// Insert a new user into database
const addUser = async (code, name, lastName, state) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO users (code, name, lastName, state) VALUES (?, ?, ?, ?)');
        stmt.run(code, name, lastName, state, function (err) {
            if (err) reject(err);
            else resolve(this.lastID); // Return ID of new user
        });
    });
};

// Get all users
const getUsers = async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Updating state of a user

const updateUserState = async (id, newState) => {
    return new Promise((resolve, reject) => {
        db.run(`
            UPDATE users 
            SET 
                state = ?, 
                updateDate = datetime('now', 'localtime')
            WHERE id = ?
        `, [newState, id], function (err) {
            if (err) reject(err);
            else resolve(this.changes); // Number of rows updated
        });
    });
};

// Create the table when start the data base
createTable();

module.exports = { addUser, getUsers };
