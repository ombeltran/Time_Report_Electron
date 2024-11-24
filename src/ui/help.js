document.getElementById('backup').addEventListener('click', () => {
  window.myAPI.backupDatabase()
      .then(result => {
          if (result.success) {
              console.log('Backup completed:', result.filePath);
              alert(`Backup save in: ${result.filePath}`);
          } else {
              console.warn('canceled proccess or error:', result.error);
              alert(`Backup not made: ${result.error}`);
          }
      })
      .catch(error => {
          console.error('Unexpected error:', error);
          alert('There was an unexpected error when trying to perform a backup.');
      });
});