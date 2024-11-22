const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'my-data-base.db'); //mi-base-de-datos.db

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Successful connection to the SQLite database');
    }
});

// Create users table if it doesn't exist
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

// Create records table if it doesn't exist
const createRelatedTable = async () => {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT,
                name TEXT,
                lastName TEXT,
                checkIn DATETIME DEFAULT (datetime('now', 'localtime')),
                checkOut DATETIME DEFAULT NULL,
                creationDate DATETIME DEFAULT (datetime('now', 'localtime')),
                updateDate DATETIME DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY(code) REFERENCES users(code)
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

//*************** Work with users table ************************

// Insert a new user into the users table
const addUser = async (code, name, lastName, state) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO users (code, name, lastName, state) VALUES (?, ?, ?, ?)');
        stmt.run(code, name, lastName, state, function (err) {
            if (err) reject(err);
            else resolve(this.lastID); // Return the ID of the new user
        });
    });
};

// Get all users
const getUsers = async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users ORDER BY code DESC', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Update a user's status
async function updateUserState(userId, newState) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE users SET state = ?, updateDate = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(sql, [newState, userId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

//*************** Work with records table ************************

// Handle user check-in/check-out
const handleUserCheckInOut = async (code) => {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT id, checkOut FROM records WHERE code = ? AND checkOut IS NULL
        `, [code], (err, row) => {
            if (err) {
                reject('Error validating record:', err.message);
            } else if (row) {
                // If there is a register without checkOut, update it
                db.run(`
                    UPDATE records
                    SET checkOut = datetime('now', 'localtime'), updateDate = datetime('now', 'localtime')
                    WHERE id = ?
                `, [row.id], (err) => {
                    if (err) reject('Error updating the record:', err.message);
                    else resolve(`Updated register with checkOut for code ${code}`);
                });
            } else {
                // If there is no existing record without checkOut, create a new one with checkIn
                db.get(`
                    SELECT name, lastName FROM users WHERE code = ? AND state = 'Active'
                `, [code], (err, user) => {
                    if (err) {
                        reject('Error searching user:', err.message);
                    } else if (!user) {
                        reject("User not found or not active");
                    } else {
                        const { name, lastName } = user;

                        const stmt = db.prepare(`
                            INSERT INTO records (code, name, lastName, checkIn) 
                            VALUES (?, ?, ?, datetime('now', 'localtime'))
                        `);
                        stmt.run(code, name, lastName, function (err) {
                            if (err) reject('Error creating the record:', err.message);
                            else resolve(`Created new register with checkIn for code ${code}`);
                        });
                    }
                });
            }
        });
    });
};

// Get all related records
const getRelatedRecords = async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM records ORDER BY checkIn DESC', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const getOneRecord = (code) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM records WHERE code = ? ORDER BY checkIn DESC';
        db.all(query, [code], (err, rows) => {
            if (err) {
                reject(err); // En caso de error en la consulta
            } else {
                resolve(rows); // Devolver los registros encontrados
            }
        });
    });
};

// Create tables at startup
(async () => {
    await createUsersTable();
    await createRelatedTable();
})();

module.exports = { addUser, getUsers, updateUserState, handleUserCheckInOut, getRelatedRecords, getOneRecord };
