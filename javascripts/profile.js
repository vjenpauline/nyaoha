const token = localStorage.getItem('token');

if (token) {
  const user = JSON.parse(atob(token.split('.')[1]));

  // Populate user information
  document.querySelector('input[value="John"]').value = user.firstName;
  document.querySelector('input[value="Doe"]').value = user.lastName;
  document.querySelector('input[type="email"]').value = user.email;

  // Handle save changes
  document.querySelector('.save-btn').addEventListener('click', async (e) => {
    e.preventDefault();

    const updatedUser = {
      firstName: document.querySelector('input[value="John"]').value,
      lastName: document.querySelector('input[value="Doe"]').value,
      email: document.querySelector('input[type="email"]').value,
    };

    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Changes saved successfully!');
      } else {
        alert(result.message || 'Failed to save changes.');
      }
    } catch (error) {
      alert('An error occurred while saving changes.');
    }
  });
} else {
  // Redirect to login if not logged in
  window.location.href = 'log-in.html';
}
