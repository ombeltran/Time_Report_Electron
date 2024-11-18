const { ipcRenderer } = require('electron');

const reportForm = document.getElementById('reportForm');
const userCode = document.getElementById('userCode');
const initialDate = document.getElementById('initialDate');
const finalDate = document.getElementById('finalDate');
const userList = document.getElementById('updateList').querySelector('tbody');

reportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Deshabilita el botón mientras se procesa la solicitud
    const submitButton = reportForm.querySelector('button');
    if (submitButton.disabled) {
        return;
    }
    submitButton.disabled = true;

    if (userCode.value === '' && initialDate.value === '' && finalDate.value === '') {
        getAllRecords(submitButton);
    } else if (userCode.value === '' && initialDate.value !== '' && finalDate.value !== '') {
        const initial = new Date(initialDate.value).toISOString().split('T')[0] + ' 01:00:00';
        const final = new Date(finalDate.value).toISOString().split('T')[0] + ' 23:59:59';
        console.log('Sending parameters 1:', initial, final);
        getAllRecordsWithDate(submitButton, initial, final);
    } else {
        console.log('Does not work');
    }

});

const tableHTML = (records) => {
    if (!records || records.length === 0) {
        console.log('No records to display');
        return;  // Si no hay registros, no hacer nada
    }
    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.code}</td>
            <td>${record.name}</td>
            <td>${record.lastName}</td>
            <td>${record.checkIn}</td>
            <td>${record.checkOut}</td>
            <td>${record.creationDate}</td>
        `;
        userList.appendChild(tr); // Aquí usamos userList
    });
};

// Get all records without parameters
const getAllRecords = async (submitButton) => {
    try {
        const records = await ipcRenderer.invoke('get-records');
        userList.innerHTML = ''; // Limpia la tabla antes de agregar nuevos datos
        tableHTML(records);
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        submitButton.disabled = false; // Reactiva el botón después del proceso
    }
};

// Get all records with date specific
const getAllRecordsWithDate = async (submitButton, iniCheckIn, finalCheckOut) => {
    try {
        console.log('Sending parameters 2:', iniCheckIn, finalCheckOut);
        const records = await ipcRenderer.invoke('get-records-date', iniCheckIn, finalCheckOut)
            .then((records) => {
                console.log(iniCheckIn, finalCheckOut);
                console.log('Records returned from main process:', records);
            })
            .catch((error) => {
                console.error('Error invoking get-records-date:', error);
            });
        console.log('Records fetched:', records); // Verifica si los datos son correctos
        userList.innerHTML = ''; // Limpia la tabla antes de agregar nuevos datos
        tableHTML(records);
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        submitButton.disabled = false; // Reactiva el botón después del proceso
    }
};


