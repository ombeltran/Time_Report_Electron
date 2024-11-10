// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta a la base de datos
const dbPath = path.join(__dirname, 'mi-base-de-datos.db');

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos SQLite');
    }
});

// Crear tabla si no existe
const createTable = async () => {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT,
                nombre TEXT,
                apellido TEXT
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Insertar un usuario en la base de datos
const addUser = async (codigo, nombre, apellido) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO usuarios (codigo, nombre, apellido) VALUES (?, ?, ?)');
        stmt.run(codigo, nombre, apellido, function (err) {
            if (err) reject(err);
            else resolve(this.lastID); // Devuelve el ID del nuevo usuario
        });
    });
};

// Obtener todos los usuarios
const getUsers = async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM usuarios', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Crear la tabla cuando se inicie la base de datos
createTable();

module.exports = { addUser, getUsers };
