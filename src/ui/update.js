const { ipcRenderer } = require('electron');

// Load users into the select dropdown when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const users = await ipcRenderer.invoke('get-users'); // Fetch the list of users
        const updateCodeSelect = document.getElementById('updateCode');
        // Populate the select dropdown with users
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.code;
            option.textContent = `${user.code} - ${user.name} ${user.lastName}`;
            updateCodeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
});

// Handle the search form submission
document.getElementById('updateForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const updateCode = document.getElementById('updateCode').value;
    try {
        let usersToDisplay = [];
        if (updateCode === 'All') {
            // Fetch all users if the selected value is 'All'
            usersToDisplay = await ipcRenderer.invoke('get-users');
        } else {
            // Fetch users by specific code
            usersToDisplay = await ipcRenderer.invoke('get-users-by-code', updateCode);
        }

        // Display the users in the table
        const tbody = document.querySelector('#updateList tbody');
        tbody.innerHTML = ''; // Clear the table before adding new users
        usersToDisplay.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.code}</td>
                <td>${user.name}</td>
                <td>${user.lastName}</td>
                <td>${user.state}</td>
                <td>${user.creationDate}</td>
                <td>${user.updateDate}</td>
                <td><button class="btn btn-warning btn-sm" data-user-id="${user.id}" data-current-state="${user.state}">Edit</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
});

// Handle the click event to change the user's state (Active/Inactive)
document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#updateList tbody');
    tbody.addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('btn-warning')) {
            const userId = event.target.dataset.userId; // Get the userId from the data attribute
            const currentState = event.target.dataset.currentState; // Get the current state
            toggleUserState(userId, currentState);
        }
    });
});

// Toggle the user's state and refresh the table
async function toggleUserState(userId, currentState) {
    const newState = currentState === 'Active' ? 'Inactive' : 'Active';
    try {
        await ipcRenderer.invoke('update-user-state', userId, newState); // Update the user's state in the database
        alert(`User status updated to ${newState}`); // Notify the user of the change
        document.getElementById('updateForm').dispatchEvent(new Event('submit')); // Refresh the table
    } catch (error) {
        console.error('Error updating user state:', error);
    }
}
