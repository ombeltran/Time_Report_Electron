const appForm = document.getElementById('appForm');
const userCode = document.getElementById('userCode');

const { ipcRenderer } = require('electron');

appForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Check if the shipment is already being processed
    if (appForm.querySelector('button').disabled) {
        return;
    }

    // Disable button while request is processing
    appForm.querySelector('button').disabled = true;

    const newRecord = {
        code: userCode.value  // Aquí envías el 'code'
    };

    console.log(newRecord);
    ipcRenderer.send('create-record', newRecord);  // Llamas a create-record correctamente
    appForm.reset();
    console.log('Submitting');
});

ipcRenderer.on('user-record', (event, response) => {
    const button = appForm.querySelector('button');
    button.disabled = false;

    if (response.success) {
        alert(response.recordCode);
    } else {
        alert(response.message);
    }

    ipcRenderer.send('hide-register-window');
    ipcRenderer.send('show-register-window');
    userCode.focus();
});