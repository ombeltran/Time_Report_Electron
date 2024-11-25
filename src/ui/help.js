// Add event listener to the backup button
document.getElementById('backup').addEventListener('click', () => {
    // Call the backupDatabase function from the preload script
    window.myAPI.backupDatabase()
        .then(result => {
            if (result.success) {
                // Log success and notify the user
                console.log('Backup completed successfully:', result.filePath);
                alert(`Backup saved in: ${result.filePath}`);
            } else {
                // Handle cases where the backup was canceled or an error occurred
                console.warn('Canceled process or error:', result.error);
                alert(`Backup not made: ${result.error}`);
            }
        })
        .catch(error => {
            // Handle unexpected errors
            console.error('Unexpected error during backup:', error);
            alert('An unexpected error occurred while trying to perform a backup.');
        });
});
