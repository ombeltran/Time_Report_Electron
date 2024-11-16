const userForm = document.getElementById('userForm');
const userCode = document.getElementById('userCode');
const userName = document.getElementById('userName');
const userLastName = document.getElementById('userLastName');
const userList = document.getElementById('userList').querySelector('tbody');

const { ipcRenderer } = require('electron');

userForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Check if the shipment is already being processed
    if (userForm.querySelector('button').disabled) {
        return;
    }

    // Disable button while request is processing
    userForm.querySelector('button').disabled = true;

    const newUser = {
        code: userCode.value,
        name: userName.value,
        lastName: userLastName.value,
        state: "Active"
    }
    ipcRenderer.send('create-user', newUser);
    userForm.reset();
});

ipcRenderer.on('user-created', (event, response) => {
    const button = userForm.querySelector('button');
    button.disabled = false;

    if (response.success) {
        alert(`Created user successfuly. ID: ${response.userId}`);
    } else {
        alert(response.message);
    }
    ipcRenderer.send('hide-users-window');
    ipcRenderer.send('show-users-window');
    userCode.focus();
});

// Load users and update user table
window.onload = async () => {
    try {
        const users = await ipcRenderer.invoke('get-users');
        console.log('Usuarios:', users);

        // Create a map with user codes for quick search
        const existingRows = Array.from(userList.querySelectorAll('tr'));
        const existingUsers = new Map();

        existingRows.forEach(row => {
            const code = row.querySelector('td:first-child').textContent;
            existingUsers.set(code, row);
        });

        users.forEach(user => {
            let row;

            // Check if the row already exists
            if (existingUsers.has(user.code)) {
                row = existingUsers.get(user.code);
                existingUsers.delete(user.code);
            } else {
                row = document.createElement('tr');
                userList.appendChild(row);
            }

            // Update or fill the row with data
            row.innerHTML = `
                <td>${user.code}</td>
                <td>${user.name}</td>
                <td>${user.lastName}</td>
                <td>${user.state}</td>
                <td>${new Date(user.creationDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                <td>${new Date(user.updateDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
            `;
        });

        // Remove rows that are not in the new user list
        existingUsers.forEach((row) => row.remove());

        userCode.focus();
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
    }
};