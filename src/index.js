const {createwindow} = require('./main');
const {app} = require('electron');

const db = require('./database');
require('electron-reload')(__dirname);

app.whenReady().then(createwindow);

// // Ejemplo de uso al iniciar la aplicación Electron
// app.on('ready', async () => {
//     try {
//       const usuarios = await db.getUsuarios();
//       console.log('Usuarios:', usuarios);
  
//       // Agrega un usuario de ejemplo
//       await db.addUsuario('Nombre de Prueba', 'prueba@email.com');
//     } catch (error) {
//       console.error("Error en la base de datos:", error);
//     }
//   });


// // Cerrar la aplicación cuando todas las ventanas estén cerradas
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') app.quit();
//   });