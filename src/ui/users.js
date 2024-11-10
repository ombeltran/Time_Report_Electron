const userForm = document.getElementById('userForm');
const userCode = document.getElementById('userCode');
const userName = document.getElementById('userName');
const userLastName = document.getElementById('userLastName');

const { ipcRenderer } = require('electron');

userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUser = {
        code: userCode.value,
        name: userName.value,
        lastName: userLastName.value
    }
    ipcRenderer.send('create-user', newUser);
});

// Escuchar la respuesta del proceso principal después de crear el usuario
ipcRenderer.on('user-created', (event, userId) => {
    alert(`Usuario creado con éxito. ID: ${userId}`);
    // window.location.href = 'app.html'; // Redirigir al listado de usuarios
});

window.onload = async () => {
    const users = await ipcRenderer.invoke('get-users');
    const userList = document.getElementById('userList');
    
    // Mostrar los usuarios en una lista
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = `${user.codigo} - ${user.nombre} ${user.apellido}`;
        userList.appendChild(li);
    });
};