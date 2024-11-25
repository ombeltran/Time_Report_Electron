const { ipcRenderer } = require('electron');
const Papa = require('papaparse');
const fs = require('fs');

const reportForm = document.getElementById('reportForm');
const userCode = document.getElementById('userCode');
const userList = document.getElementById('updateList').querySelector('tbody');

// Handle form submission
reportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Disable the submit button while the request is being processed
    const submitButton = reportForm.querySelector('button');
    if (submitButton.disabled) {
        return;
    }
    submitButton.disabled = true;

    // Check if a user code is provided
    if (userCode.value === '') {
        getAllRecords(submitButton);
    } else {
        getOneRecord(submitButton, userCode.value);
    }
});

// Generate table rows from the records
const tableHTML = (records) => {
    if (!records || records.length === 0) {
        console.log('No records to display');
        return; // If no records, do nothing
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
        userList.appendChild(tr); // Append rows to the table
    });
};

// Fetch all records
const getAllRecords = async (submitButton) => {
    try {
        const records = await ipcRenderer.invoke('get-records');
        userList.innerHTML = ''; // Clear the table before adding new data
        tableHTML(records);
    } catch (error) {
        console.error('Error fetching all records:', error);
    } finally {
        submitButton.disabled = false; // Re-enable the button after the process
    }
};

// Fetch a single record by code
const getOneRecord = async (submitButton, code) => {
    try {
        const records = await ipcRenderer.invoke('get-one-record', code); // Call the main process
        userList.innerHTML = ''; // Clear the table
        tableHTML(records); // Display the fetched records
    } catch (error) {
        console.error('Error fetching a single record:', error);
    } finally {
        submitButton.disabled = false; // Re-enable the button
    }
};

// Export table data to CSV
const exportToCSV = async () => {
    try {
        // Get the data from the table
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

        // Convert data to CSV using PapaParse
        const csv = Papa.unparse(records);

        // Call the main process to save the CSV file
        ipcRenderer.invoke('save-csv', csv); 
    } catch (error) {
        console.error('Error exporting data to CSV:', error);
    }
};

// Add event listener to the download button
document.getElementById('download').addEventListener('click', exportToCSV);
