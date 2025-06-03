(async function () {
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:10000'
    : 'https://nyaoha.onrender.com';
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'log-in.html';

  try {
    const res = await fetch(`${API_URL}/api/user/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to load user');

    const user = await res.json();

    // Persist verification and favorites state
    localStorage.setItem('emailVerified', user.emailVerified ? 'true' : 'false');
    localStorage.setItem('favorites', JSON.stringify(user.favorites || []));

    // Fill input fields
    const firstNameInput = document.querySelector('.first-name');
    const lastNameInput = document.querySelector('.last-name');
    const emailInput = document.querySelector('.email');

    firstNameInput.value = user.firstName || '';
    lastNameInput.value = user.lastName || '';
    emailInput.value = user.email || '';

    // Show profile photo if exists
    const avatarDiv = document.getElementById('profile-avatar');
    if (user.photo && user.photo.data) {
      // Convert Buffer to base64
      const base64 = `data:${user.photo.contentType};base64,${user.photo.data}`;
      avatarDiv.style.backgroundImage = `url('${base64}')`;
      avatarDiv.style.backgroundSize = 'cover';
      avatarDiv.style.backgroundPosition = 'center';
    } else {
      avatarDiv.style.backgroundImage = '';
    }

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

    // Email verification UI update
    const verificationSection = document.querySelector('.settings-section .btn');
    if (verificationSection && verificationSection.textContent.includes('Verification')) {
      if (user.emailVerified) {
        const parent = verificationSection.parentElement;
        verificationSection.remove();
        const verifiedMsg = document.createElement('div');
        verifiedMsg.textContent = 'Email verified!';
        verifiedMsg.style.color = '#4c7410';
        verifiedMsg.style.fontWeight = 'bold';
        verifiedMsg.style.marginTop = '0.5rem';
        parent.appendChild(verifiedMsg);
      }
    }

  } catch (err) {
    console.error(err);
    alert('Session expired or user not found');
    localStorage.removeItem('token');
    window.location.href = 'log-in.html';
  }
})();

// Favorite Plants logic
async function renderFavoritePlants() {
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:10000'
    : 'https://nyaoha.onrender.com';
  const token = localStorage.getItem('token');
  const noFavoritesDiv = document.getElementById('no-favorites');
  const favoritesListDiv = document.getElementById('favorites-list');
  if (!token) {
    noFavoritesDiv.style.display = 'flex';
    favoritesListDiv.style.display = 'none';
    return;
  }
  try {
    const res = await fetch(`${API_URL}/api/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load favorites');
    const favorites = await res.json();
    localStorage.setItem('favorites', JSON.stringify(favorites.map(p => p.pid)));
    if (!favorites.length) {
      noFavoritesDiv.style.display = 'flex';
      favoritesListDiv.style.display = 'none';
      return;
    }
    // Render cards
    favoritesListDiv.innerHTML = favorites.map(plant => {
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
      document.getElementById('no-favorite-plans').style.display = 'none';
      renderFavoritePlants();
    } else {
      document.getElementById('no-favorites').style.display = 'none';
      document.getElementById('favorites-list').style.display = 'none';
      document.getElementById('no-favorite-plans').style.display = 'flex';
      // Add logic for Favorite Plans if needed
    }
  });
});

// Initial render
if (document.getElementById('favorites-list')) renderFavoritePlants();

// Password change modal logic
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordForm = document.getElementById('change-password-form');
const closePasswordModal = document.getElementById('close-password-modal');

if (changePasswordBtn && changePasswordModal && changePasswordForm && closePasswordModal) {
  changePasswordBtn.addEventListener('click', () => {
    changePasswordModal.style.display = 'flex';
  });
  closePasswordModal.addEventListener('click', () => {
    changePasswordModal.style.display = 'none';
    changePasswordForm.reset();
  });
  changePasswordModal.addEventListener('click', (e) => {
    if (e.target === changePasswordModal) {
      changePasswordModal.style.display = 'none';
      changePasswordForm.reset();
    }
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
        changePasswordModal.style.display = 'none';
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

// Profile photo upload logic
const changePhotoBtn = document.getElementById('change-photo-btn');
const photoInput = document.getElementById('photo-input');
const avatarDiv = document.getElementById('profile-avatar');

if (changePhotoBtn && photoInput && avatarDiv) {
  changePhotoBtn.addEventListener('click', () => {
    photoInput.click();
  });

  photoInput.addEventListener('change', async function () {
    const file = photoInput.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const result = await res.json();
      if (res.ok && result.photo && result.photo.data) {
        const base64 = `data:${result.photo.contentType};base64,${result.photo.data}`;
        avatarDiv.style.backgroundImage = `url('${base64}')`;
        avatarDiv.style.backgroundSize = 'cover';
        avatarDiv.style.backgroundPosition = 'center';
        alert('Profile photo updated!');
      } else {
        alert(result.message || 'Failed to upload photo.');
      }
    } catch (err) {
      alert('An error occurred while uploading photo.');
    }
  });
}

// Email verification logic
const sendVerificationBtn = document.querySelector('.settings-section .btn');
if (sendVerificationBtn && sendVerificationBtn.textContent.includes('Verification')) {
  sendVerificationBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/user/send-verification-email', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        alert('Verification email sent! Please check your inbox.');
        // Show custom modal for code entry
        showVerificationModal();
      } else {
        alert(result.message || 'Failed to send verification email.');
      }
    } catch (err) {
      alert('An error occurred while sending verification email.');
    }
  });
}

// --- Custom modal for verification code entry ---
function showVerificationModal() {
  // Remove existing modal if present
  document.getElementById('verify-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'verify-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.4)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';
  modal.innerHTML = `
    <div style="background:#fff;padding:2rem 2.5rem;border-radius:1.2rem;box-shadow:0 2px 24px #0002;max-width:350px;width:100%;text-align:center;">
      <h3 style='margin-bottom:1rem;'>Enter Verification Code</h3>
      <input id="verify-code-input" type="text" maxlength="6" style="font-size:1.2rem;padding:0.5rem 1rem;border-radius:8px;border:1px solid #aaa;width:80%;margin-bottom:1rem;" placeholder="6-digit code" autofocus />
      <div style="margin-bottom:1rem;color:#888;font-size:0.95em;">Check your email for the code.</div>
      <button id="verify-code-btn" style="background:#4c7410;color:#fff;padding:0.6rem 1.5rem;border:none;border-radius:8px;font-size:1rem;">Verify</button>
      <button id="verify-cancel-btn" style="margin-left:1rem;background:#eee;color:#333;padding:0.6rem 1.5rem;border:none;border-radius:8px;font-size:1rem;">Cancel</button>
      <div id="verify-error" style="color:#a50000;margin-top:1rem;font-size:0.95em;"></div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('verify-code-btn').onclick = async function() {
    const code = document.getElementById('verify-code-input').value.trim();
    if (!/^\d{6}$/.test(code)) {
      document.getElementById('verify-error').textContent = 'Please enter a valid 6-digit code.';
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const verifyRes = await fetch('/api/user/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });
      const verifyResult = await verifyRes.json();
      if (verifyRes.ok) {
        alert('Email verified successfully!');
        modal.remove();
        // Remove button and show message
        const verificationSection = document.querySelector('.settings-section .btn');
        if (verificationSection && verificationSection.textContent.includes('Verification')) {
          const parent = verificationSection.parentElement;
          verificationSection.remove();
          const verifiedMsg = document.createElement('div');
          verifiedMsg.textContent = 'Email verified!';
          verifiedMsg.style.color = '#4c7410';
          verifiedMsg.style.fontWeight = 'bold';
          verifiedMsg.style.marginTop = '0.5rem';
          parent.appendChild(verifiedMsg);
        }
      } else {
        document.getElementById('verify-error').textContent = verifyResult.message || 'Verification failed.';
      }
    } catch (err) {
      document.getElementById('verify-error').textContent = 'An error occurred.';
    }
  };
  document.getElementById('verify-cancel-btn').onclick = function() {
    modal.remove();
  };
}
