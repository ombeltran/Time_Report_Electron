const userForm = document.getElementById('userForm');
const userCode = document.getElementById('userCode');
const userName = document.getElementById('userName');
const userLastName = document.getElementById('userLastName');
const userList = document.getElementById('userList').querySelector('tbody');

const { ipcRenderer } = require('electron');

// Handle user creation form submission
userForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Check if the request is already being processed
    if (userForm.querySelector('button').disabled) {
        return;
    }

    // Disable button while the request is being processed
    userForm.querySelector('button').disabled = true;

    const newUser = {
        code: userCode.value,
        name: userName.value,
        lastName: userLastName.value,
        state: "Active"
    };
    
    ipcRenderer.send('create-user', newUser); // Send the new user data to the main process
    userForm.reset(); // Reset the form fields
});

// Listen for the user creation response
ipcRenderer.on('user-created', (event, response) => {
    const button = userForm.querySelector('button');
    button.disabled = false;

    // Display a success or error message
    if (response.success) {
        alert(`User created successfully. ID: ${response.userId}`);
    } else {
        alert(response.message); // Display the error message if creation fails
    }

    ipcRenderer.send('hide-users-window'); // Hide the user creation window
    ipcRenderer.send('show-users-window'); // Show the updated users window
    userCode.focus(); // Set focus back to the user code field
});

// Load and update the user table when the page is loaded
window.onload = async () => {
    try {
        const users = await ipcRenderer.invoke('get-users'); // Fetch the list of users
        console.log('Users:', users);

        // Create a map with user codes for quick lookup
        const existingRows = Array.from(userList.querySelectorAll('tr'));
        const existingUsers = new Map();

        existingRows.forEach(row => {
            const code = row.querySelector('td:first-child').textContent;
            existingUsers.set(code, row); // Map existing rows to user codes
        });

        users.forEach(user => {
            let row;

            // Check if the row for this user already exists
            if (existingUsers.has(user.code)) {
                row = existingUsers.get(user.code); // If exists, update the row
                existingUsers.delete(user.code);
            } else {
                row = document.createElement('tr'); // Create a new row if it doesn't exist
                userList.appendChild(row);
            }

            // Update the row with the user's data
            row.innerHTML = `
                <td>${user.code}</td>
                <td>${user.name}</td>
                <td>${user.lastName}</td>
                <td>${user.state}</td>
                <td>${new Date(user.creationDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                <td>${new Date(user.updateDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
            `;
        });

        // Remove rows that are not in the updated user list
        existingUsers.forEach((row) => row.remove());

        userCode.focus(); // Focus back to the user code input field
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};
