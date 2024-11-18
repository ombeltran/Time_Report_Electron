const { ipcRenderer } = require('electron');
const Papa = require('papaparse');
const fs = require('fs');

const reportForm = document.getElementById('reportForm');
const userCode = document.getElementById('userCode');
const userList = document.getElementById('updateList').querySelector('tbody');

reportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Deshabilita el botón mientras se procesa la solicitud
    const submitButton = reportForm.querySelector('button');
    if (submitButton.disabled) {
        return;
    }
    submitButton.disabled = true;

    if (userCode.value === '' ) {
        getAllRecords(submitButton);
    } else {
        getOneRecord(submitButton, userCode.value);
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

//Get one record
const getOneRecord = async (submitButton, code) => {
    try {
        const records = await ipcRenderer.invoke('get-one-record', code); // Llamada al proceso principal
        userList.innerHTML = ''; // Limpiar la tabla
        tableHTML(records); // Mostrar los registros
    } catch (error) {
        console.error('Error fetching records:', error);
    } finally {
        submitButton.disabled = false; // Reactivar el botón
    }
};

// Download data
const exportToCSV = async () => {
    try {
        // Obtener los datos de la tabla
        const rows = Array.from(userList.querySelectorAll('tr'));
        const records = rows.map(row => {
            const cols = row.querySelectorAll('td');
            return {
                code: cols[0].innerText,
                name: cols[1].innerText,
                lastName: cols[2].innerText,
                checkIn: cols[3].innerText,
                checkOut: cols[4].innerText,
                creationDate: cols[5].innerText,
            };
        });

        // Convertir los datos a CSV usando PapaParse
        const csv = Papa.unparse(records);

        // Llamar a la función del proceso principal para guardar el archivo CSV
        ipcRenderer.invoke('save-csv', csv); 
    } catch (error) {
        console.error('Error exportando los datos a CSV:', error);
    }
};

// Botón de descarga
document.getElementById('download').addEventListener('click', exportToCSV);