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

// Favorite Plants logic
async function renderFavoritePlants() {
  const token = localStorage.getItem('token');
  const noFavoritesDiv = document.getElementById('no-favorites');
  const favoritesListDiv = document.getElementById('favorites-list');
  if (!token) {
    noFavoritesDiv.style.display = 'flex';
    favoritesListDiv.style.display = 'none';
    return;
  }
  try {
    const res = await fetch('/api/favorites', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load favorites');
    const favorites = await res.json();
    if (!favorites.length) {
      noFavoritesDiv.style.display = 'flex';
      favoritesListDiv.style.display = 'none';
      return;
    }
    // Render cards
    favoritesListDiv.innerHTML = favorites.map(plant => {
      // Use animals or fallback to None
      const pets = plant.animals && plant.animals.length
        ? plant.animals.join(', ')
        : 'None';
      return `
      <div class="favorite-plant-card" style="display:flex;align-items:center;gap:1.5rem;padding:1rem 0;border-bottom:1px solid #eee;">
        <div style="flex:2;font-weight:bold;">${plant.name}</div>
        <div style="flex:3;">Pets affected: <span style="color:#a50000;">${pets}</span></div>
        <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(plant.name)}" target="_blank" style="flex:1;">
          <button class="explore-btn" style="padding:0.4rem 1rem;">View Details</button>
        </a>
      </div>
      `;
    }).join('');
    noFavoritesDiv.style.display = 'none';
    favoritesListDiv.style.display = 'flex';
  } catch (e) {
    noFavoritesDiv.style.display = 'flex';
    favoritesListDiv.style.display = 'none';
  }
}

// Sub-tab switching (if you want to expand for Favorite Plans later)
document.querySelectorAll('.sub-tab').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.subtab === 'favorite-plants') {
      document.getElementById('no-favorites').style.display = '';
      document.getElementById('favorites-list').style.display = '';
      renderFavoritePlants();
    } else {
      document.getElementById('no-favorites').style.display = 'none';
      document.getElementById('favorites-list').style.display = 'none';
      // Add logic for Favorite Plans if needed
    }
  });
});

// Initial render
if (document.getElementById('favorites-list')) renderFavoritePlants();

// Password change
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordForm = document.getElementById('change-password-form');
if (changePasswordBtn && changePasswordForm) {
  changePasswordBtn.addEventListener('click', () => {
    changePasswordForm.style.display = changePasswordForm.style.display === 'none' ? 'flex' : 'none';
  });
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const result = await res.json();
      if (res.ok) {
        alert('Password changed successfully!');
        changePasswordForm.reset();
        changePasswordForm.style.display = 'none';
      } else {
        alert(result.message || 'Failed to change password.');
      }
    } catch (err) {
      alert('An error occurred while changing password.');
    }
  });
}

// Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '1-index.html';
  });
}

// Delete Account
const deleteAccountBtn = document.querySelector('.btn.delete');
if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (res.ok) {
        alert('Account deleted successfully.');
        localStorage.removeItem('token');
        window.location.href = '1-index.html';
      } else {
        alert(result.message || 'Failed to delete account.');
      }
    } catch (err) {
      alert('An error occurred while deleting account.');
    }
  });
}
