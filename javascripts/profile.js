(async function () {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'log-in.html';

  try {
    const res = await fetch('/api/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to load user');

    const user = await res.json();

    // Fill input fields
    const firstNameInput = document.querySelector('.first-name');
    const lastNameInput = document.querySelector('.last-name');
    const emailInput = document.querySelector('.email');

    firstNameInput.value = user.firstName || '';
    lastNameInput.value = user.lastName || '';
    emailInput.value = user.email || '';

    // Handle save button click
    document.querySelector('.save-btn').addEventListener('click', async (e) => {
      e.preventDefault();

      const updatedUser = {
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        email: emailInput.value
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
        console.error(error);
      }
    });

  } catch (err) {
    console.error(err);
    alert('Session expired or user not found');
    localStorage.removeItem('token');
    window.location.href = 'log-in.html';
  }
})();
