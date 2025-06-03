const token = localStorage.getItem('token');

if (!token) {
  // Redirect if not logged in
  window.location.href = 'log-in.html';
}

const payload = JSON.parse(atob(token.split('.')[1]));

// Select form fields by class or id
const firstNameInput = document.querySelector('.first-name');
const lastNameInput = document.querySelector('.last-name');
const emailInput = document.querySelector('.email');

// Fill in user data
firstNameInput.value = payload.firstName || '';
lastNameInput.value = payload.lastName || '';
emailInput.value = payload.email || '';

// Handle save button
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
