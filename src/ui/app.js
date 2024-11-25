const appForm = document.getElementById('appForm');
const userCode = document.getElementById('userCode');
const { ipcRenderer } = require('electron');

// Helper: Enable or disable the submit button
const toggleSubmitButton = (state) => {
    const button = appForm.querySelector('button');
    button.disabled = !state;
};

// Event listener for handling form submission
appForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const button = appForm.querySelector('button');
    if (button.disabled) return; // Prevent multiple submissions

    // Disable button while the request is being processed
    toggleSubmitButton(false);

    const newRecord = {
        code: userCode.value.trim() // Trim to remove extra spaces
    };

    if (!newRecord.code) {
        alert('The code cannot be empty.');
        toggleSubmitButton(true);
        return;
    }

    console.log('Sending record:', newRecord);
    ipcRenderer.send('create-record', newRecord); // Send data to the main process
    appForm.reset();
    console.log('Form submitted.');
});

// Handle the response from the main process
ipcRenderer.on('user-record', (event, response) => {
    toggleSubmitButton(true); // Re-enable the button after receiving the response

    if (response.success) {
        alert(`Record successfully created: ${response.recordCode}`);
    } else {
        alert(`Error: ${response.message}`);
    }

    // Hide and show windows (assuming these actions are necessary)
    ipcRenderer.send('hide-register-window');
    ipcRenderer.send('show-register-window');

    // Refocus the input field
    userCode.focus();
});
