const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

// Configura la conexión a la base de datos
async function connectToDatabase() {
    // Abre la base de datos o crea el archivo si no existe
    const db = await sqlite.open({
      filename: './mi_base_de_datos.db', // Ubicación de la base de datos
      driver: sqlite3.Database,
    });
    
    return db;
  }


  module.exports = {
    connectToDatabase
  }