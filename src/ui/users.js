const userForm = document.getElementById('userForm');
const userCode = document.getElementById('userCode');
const userName = document.getElementById('userName');
const userLastName = document.getElementById('userLastName');

const { ipcRenderer } = require('electron');

userForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Verificar si ya se está procesando el envío
    if (userForm.querySelector('button').disabled) {
        console.log('Formulario ya en proceso. No hacer nada.');
        return; // Si el botón está deshabilitado, no hacer nada
    }

    //Disability form while proccess the request
    userForm.querySelector('button').disabled = true;

    const newUser = {
        code: userCode.value,
        name: userName.value,
        lastName: userLastName.value,
        state: "Active"
    }
    ipcRenderer.send('create-user', newUser);
});

// Lisen process principal answer after create the user
ipcRenderer.on('user-created', (event, response) => {
    const button = userForm.querySelector('button');
    button.disabled = false; // Habilitar el botón de nuevo

    console.log('Respuesta del proceso principal:', response);

    if (response.success) {
        alert(`Usuario creado con éxito. ID: ${response.userId}`);
        // Limpiar los campos después de un registro exitoso
        userCode.value = '';
        userName.value = '';
        userLastName.value = '';
    } else {
        alert(response.message); // Mostrar el mensaje de error

        // Asegurarse de que los campos sean limpiados y el foco vaya al campo de código
        userCode.value = '';
        userName.value = '';
        userLastName.value = '';

        // Colocar el foco en el campo de código
        userCode.focus();
    }
});


window.onload = async () => {
    try {
        const users = await ipcRenderer.invoke('get-users');
        console.log('Usuarios:', users);

        const userList = document.getElementById('userList').querySelector('tbody');
        userList.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos registros

        users.forEach(user => {
            const row = document.createElement('tr');

            // Crear celdas para cada campo
            const codeCell = document.createElement('td');
            codeCell.textContent = user.code;
            row.appendChild(codeCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = user.name;
            row.appendChild(nameCell);

            const lastNameCell = document.createElement('td');
            lastNameCell.textContent = user.lastName;
            row.appendChild(lastNameCell);

            const stateCell = document.createElement('td');
            stateCell.textContent = user.state;
            row.appendChild(stateCell);

            // Formatear la fecha de creación y actualización
            const creationDateCell = document.createElement('td');
            const formattedCreationDate = new Date(user.creationDate).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
            creationDateCell.textContent = formattedCreationDate;
            row.appendChild(creationDateCell);

            const updateDateCell = document.createElement('td');
            const formattedUpdateDate = new Date(user.updateDate).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
            updateDateCell.textContent = formattedUpdateDate;
            row.appendChild(updateDateCell);

            // Add the row to table
            userList.appendChild(row);
        });
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
    }
};


