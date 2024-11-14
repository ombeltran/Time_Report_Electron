const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'mi-base-de-datos.db');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Successful connection to the database SQLite');
    }
});

// Create users table if it does not exist
const createUsersTable = async () => {
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

// Create records table if it does not exist
const createRelatedTable = async () => {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT,
                name TEXT,
                lastName TEXT,
                checkIn DATE DEFAULT (datetime('now', 'localtime')),
                checkOut DATE DEFAULT NULL,
                creationDate DATE DEFAULT (datetime('now', 'localtime')),
                updateDate DATE DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY(code) REFERENCES users(code)
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Insert a new user into the users table
const addUser = async (code, name, lastName, state) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO users (code, name, lastName, state) VALUES (?, ?, ?, ?)');
        stmt.run(code, name, lastName, state, function (err) {
            if (err) reject(err);
            else resolve(this.lastID); // Retornar ID del nuevo usuario
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

// Update a user's status
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
            else resolve(this.changes); // Number rows updated
        });
    });
};

const handleUserCheckInOut = async (code) => {
    return new Promise((resolve, reject) => {
        // First, search if tehre is already a register with checkIn and without checkOut
        db.get(`
            SELECT id, checkOut FROM records WHERE code = ? AND checkOut IS NULL
        `, [code], (err, row) => {
            if (err) {
                reject('Error al validar el registro:', err.message);
            } else if (row) {
                // If there is a register without checkOut, We update with currenly date and time
                db.run(`
                    UPDATE records
                    SET checkOut = datetime('now', 'localtime'), updateDate = datetime('now', 'localtime')
                    WHERE id = ?
                `, [row.id], function (err) {
                    if (err) reject('Error al actualizar el registro:', err.message);
                    else resolve(`Updated register with checkOut to code ${code}`);
                });
            } else {
                // If there is a register without checkOut, we create a new one with checkIn
                db.get(`
                    SELECT name, lastName FROM users WHERE code = ? AND state = 'Active'
                `, [code], (err, user) => {
                    if (err) {
                        reject('Error searching user:', err.message);
                    } else if (!user) {
                        reject("User doesn't no found or not active");
                    } else {
                        const { name, lastName } = user;

                        const stmt = db.prepare(`
                            INSERT INTO records (code, name, lastName, checkIn) 
                            VALUES (?, ?, ?, datetime('now', 'localtime'))
                        `);
                        stmt.run(code, name, lastName, function (err) {
                            if (err) reject('Error al crear el registro:', err.message);
                            else resolve(`Craeted new register with checkIn to code ${code}`);
                        });
                    }
                });
            }
        });
    });
};


// Get records records
const getRelatedRecords = async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM records', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Create tables at startup
(async () => {
    await createUsersTable();
    await createRelatedTable();
})();

module.exports = { addUser, getUsers, updateUserState, handleUserCheckInOut, getRelatedRecords };
