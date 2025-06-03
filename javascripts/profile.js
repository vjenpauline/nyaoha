// --- API URL UNIFICATION ---
// Use port 10000 for localhost for consistency with your backend
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://nyaoha.onrender.com';

(async function () {
  const token = localStorage.getItem('token');
  // if (!token) return window.location.href = 'log-in.html'; // <-- TEMPORARILY DISABLED FOR DEBUGGING
  if (!token) {
    console.warn('No token found in localStorage.');
    // Optionally, you can show a message here for debugging
  }

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
    localStorage.setItem('firstName', user.firstName || '');
    localStorage.setItem('lastName', user.lastName || '');

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
        const response = await fetch(`${API_URL}/api/user/update`, {
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
    // window.location.href = 'log-in.html'; // <-- TEMPORARILY DISABLED FOR DEBUGGING
  }
})();

// Favorite Plants logic
async function renderFavoritePlants() {
  const token = localStorage.getItem('token');
  const noFavoritesDiv = document.getElementById('no-favorites');
  const favoritesListDiv = document.getElementById('favorites-list');
  // Safeguard: Only proceed if both elements exist
  if (!noFavoritesDiv || !favoritesListDiv) {
    console.warn('Favorites elements not found in DOM.');
    return;
  }
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
      <div class="favorite-plant-card" style="display:flex;align-items:center;gap:1.5rem;padding:1rem 0.2rem;border-bottom:1px solid #eee;">
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

// --- Journal Posts logic ---
async function renderJournalPosts() {
  const token = localStorage.getItem('token');
  const journalContentDiv = document.querySelector('.journal-content');
  if (!journalContentDiv) return;

  // Show loading state
  journalContentDiv.innerHTML = '<p>Loading your posts...</p>';

  try {
    // Fetch all posts, then filter by current user
    const res = await fetch(`${API_URL}/api/journal`);
    if (!res.ok) throw new Error('Failed to load journal posts');
    const posts = await res.json();
    // Get user email from localStorage (already set above)
    const userEmail = document.querySelector('.email')?.value || localStorage.getItem('userEmail');
    const userPosts = posts.filter(post => post.author === userEmail);

    if (!userPosts.length) {
      // Show mascot and button
      journalContentDiv.innerHTML = `
        <img src="pictures/logo_icon_dark.png" alt="Journal mascot" />
        <p>You have no written posts yet.</p>
        <button class="write-post-btn">Write Your First Post</button>
      `;
      journalContentDiv.querySelector('.write-post-btn').onclick = () => {
        window.location.href = '3-garden-journal.html';
      };
      return;
    }

    // Render cards for each post
    journalContentDiv.innerHTML = userPosts.map(post => `
      <div class="journal-post-card" style="display:flex;flex-direction:column;gap:0.5rem;padding:1rem 0.5rem;border-bottom:1px solid #eee;position:relative;">
        <div style="font-weight:bold;font-size:1.1em;">${post.title}</div>
        <div style="color:#555;">${post.summary}</div>
        <div style="font-size:0.95em;color:#888;">${post.date}</div>
        <div style="font-size:0.9em;color:#4c7410;">${(post.tags||[]).map(t => `#${t}`).join(' ')}</div>
        <button class="delete-journal-btn" data-id="${post._id}" style="position:absolute;top:1rem;right:1rem;background:#a50000;color:#fff;border:none;padding:0.3rem 0.8rem;border-radius:6px;cursor:pointer;font-size:0.95em;">Delete</button>
      </div>
    `).join('');
    // Add delete event listeners
    journalContentDiv.querySelectorAll('.delete-journal-btn').forEach(btn => {
      btn.onclick = async function() {
        if (!confirm('Delete this post?')) return;
        const postId = btn.getAttribute('data-id');
        try {
          const res = await fetch(`${API_URL}/api/journal/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            btn.closest('.journal-post-card').remove();
            // If no more posts, show mascot and button
            if (!journalContentDiv.querySelector('.journal-post-card')) {
              journalContentDiv.innerHTML = `
                <img src="pictures/logo_icon_dark.png" alt="Journal mascot" />
                <p>You have no written posts yet.</p>
                <button class="write-post-btn">Write Your First Post</button>
              `;
              journalContentDiv.querySelector('.write-post-btn').onclick = () => {
                window.location.href = '3-garden-journal.html';
              };
            }
          } else {
            alert('Failed to delete post.');
          }
        } catch (e) {
          alert('An error occurred while deleting post.');
        }
      };
    });
  } catch (e) {
    journalContentDiv.innerHTML = '<p style="color:#a50000;">Failed to load your journal posts.</p>';
  }
}

// Sub-tab switching (if you want to expand for Favorite Plans later)
document.querySelectorAll('.sub-tab').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isPlants = btn.dataset.subtab === 'favorite-plants';
    document.getElementById('no-favorites').style.display = isPlants ? '' : 'none';
    document.getElementById('favorites-list').style.display = isPlants ? '' : 'none';
    document.getElementById('no-favorite-plans').style.display = isPlants ? 'none' : 'flex';
    if (isPlants) renderFavoritePlants();
    // If you add logic for Favorite Plans, call it here
  });
});

// Ensure correct sub-tab and content on tab switch
const favoritesTab = document.querySelector('.tab[data-tab="favorites"]');
if (favoritesTab) {
  favoritesTab.addEventListener('click', () => {
    // Activate the 'Favorite Plants' sub-tab
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    const plantsTab = document.querySelector('.sub-tab[data-subtab="favorite-plants"]');
    if (plantsTab) plantsTab.classList.add('active');
    // Show only the plants section
    document.getElementById('no-favorites').style.display = '';
    document.getElementById('favorites-list').style.display = '';
    document.getElementById('no-favorite-plans').style.display = 'none';
    renderFavoritePlants();
  });
}

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
      const res = await fetch(`${API_URL}/api/user/change-password`, {
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
      const res = await fetch(`${API_URL}/api/user/delete-account`, {
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

// Email verification logic
const sendVerificationBtn = document.querySelector('.settings-section .btn');
if (sendVerificationBtn && sendVerificationBtn.textContent.includes('Verification')) {
  sendVerificationBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/user/send-verification-email`, {
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
      const verifyRes = await fetch(`${API_URL}/api/user/verify-email`, {
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

// Journal tab initial render
const journalTab = document.querySelector('.tab[data-tab="journal"]');
if (journalTab) {
  journalTab.addEventListener('click', () => {
    renderJournalPosts();
  });
  // Initial render if already on journal tab
  if (document.getElementById('journal')?.classList.contains('active')) {
    renderJournalPosts();
  }
}
