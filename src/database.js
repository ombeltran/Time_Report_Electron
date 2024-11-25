const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'my-data-base.db');

// Connect to the database
const db = new Database(dbPath, { verbose: console.log });

// Create users table if it doesn't exist
const createUsersTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            name TEXT,
            lastName TEXT,
            state TEXT,
            creationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            updateDate DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
};

// Create records table if it doesn't exist
const createRelatedTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT,
            name TEXT,
            lastName TEXT,
            checkIn DATETIME DEFAULT CURRENT_TIMESTAMP,
            checkOut DATETIME DEFAULT NULL,
            creationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            updateDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (code) REFERENCES users (code)
        )
    `).run();
};

//*************** Work with users table ************************

// Insert a new user into the users table
const addUser = (code, name, lastName, state) => {
    const stmt = db.prepare('INSERT INTO users (code, name, lastName, state) VALUES (?, ?, ?, ?)');
    return stmt.run(code, name, lastName, state).lastInsertRowid; // Return the ID of the new user
};

// Get all users
const getUsers = () => {
    const stmt = db.prepare('SELECT * FROM users ORDER BY code DESC');
    return stmt.all();
};

// Get one user
const getOneUser = (userCode) => {
    const stmt = db.prepare('SELECT * FROM users WHERE code = ?');
    return stmt.get(userCode);  // Devuelve solo el primer resultad
};

// Update a user's state
const updateUserState = (userId, newState) => {
    const stmt = db.prepare('UPDATE users SET state = ?, updateDate = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(newState, userId);
};

//*************** Work with records table ************************

// Handle user check-in/check-out
const handleUserCheckInOut = (code) => {
    const checkExisting = db.prepare(`
        SELECT id, checkOut FROM records WHERE code = ? AND checkOut IS NULL
    `).get(code);

    if (checkExisting) {
        db.prepare(`
            UPDATE records
            SET checkOut = CURRENT_TIMESTAMP, updateDate = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(checkExisting.id);
        return `Updated register with checkOut for code ${code}`;
    } else {
        const user = db.prepare(`
            SELECT name, lastName FROM users WHERE code = ? AND state = 'Active'
        `).get(code);

        if (!user) {
            throw new Error('User not found or not active');
        }

        db.prepare(`
            INSERT INTO records (code, name, lastName, checkIn)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(code, user.name, user.lastName);
        return `Created new register with checkIn for code ${code}`;
    }
};

// Get all related records
const getRelatedRecords = () => {
    const stmt = db.prepare('SELECT * FROM records ORDER BY checkIn DESC');
    return stmt.all();
};

// Get one record by code
const getOneRecord = (code) => {
    const stmt = db.prepare('SELECT * FROM records WHERE code = ? ORDER BY checkIn DESC');
    return stmt.all(code);
};

// Create tables at startup
(() => {
    createUsersTable();
    createRelatedTable();
})();

module.exports = { addUser, getUsers, getOneUser, updateUserState, handleUserCheckInOut, getRelatedRecords, getOneRecord };
