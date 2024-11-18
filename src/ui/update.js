const { ipcRenderer } = require('electron');

// Load users into the select when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const users = await ipcRenderer.invoke('get-users'); // Get the list of users
        const updateCodeSelect = document.getElementById('updateCode');
        // Add each user to the select
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
            // If the value is 'All', show all users
            usersToDisplay = await ipcRenderer.invoke('get-users');
        } else {
            // Otherwise, search users by code
            usersToDisplay = await ipcRenderer.invoke('get-users-by-code', updateCode);
        }

        // Display the users in the table
        const tbody = document.querySelector('#updateList tbody');
        tbody.innerHTML = ''; // Clear table before adding new users
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

// Change the user's state (active/inactive)
// Code in update.js
document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#updateList tbody');
    tbody.addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('btn-warning')) {
            const userId = event.target.dataset.userId;  // Get the userId from the data attribute
            const currentState = event.target.dataset.currentState;  // Get the current state
            toggleUserState(userId, currentState);
        }
    });
});

async function toggleUserState(userId, currentState) {
    const newState = currentState === 'Active' ? 'Inactive' : 'Active';
    try {
        await ipcRenderer.invoke('update-user-state', userId, newState);
        alert(`User status updated to ${newState}`);
        document.getElementById('updateForm').dispatchEvent(new Event('submit'));
    } catch (error) {
        console.error('Error updating user state:', error);
    }
}
