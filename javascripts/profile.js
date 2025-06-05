const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://nyaoha.onrender.com';

(async function () {
  const token = localStorage.getItem('token');

  if (!token) {
    console.warn('No token found in localStorage.');

  }

  try {
    const res = await fetch(`${API_URL}/api/user/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to load user');

    const user = await res.json();

    localStorage.setItem('emailVerified', user.emailVerified ? 'true' : 'false');
    localStorage.setItem('favorites', JSON.stringify(user.favorites || []));
    localStorage.setItem('firstName', user.firstName || '');
    localStorage.setItem('lastName', user.lastName || '');
    localStorage.setItem('userId', user._id || '');

    const firstNameInput = document.querySelector('.first-name');
    const lastNameInput = document.querySelector('.last-name');
    const emailInput = document.querySelector('.email');

    firstNameInput.value = user.firstName || '';
    lastNameInput.value = user.lastName || '';
    emailInput.value = user.email || '';

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
  }
})();

async function renderFavoritePlants() {
  const token = localStorage.getItem('token');
  const noFavoritesDiv = document.getElementById('no-favorites');
  const favoritesListDiv = document.getElementById('favorites-list');

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

async function renderJournalPosts() {
  const token = localStorage.getItem('token');
  const journalContentDiv = document.querySelector('.journal-content');
  if (!journalContentDiv) return;

  journalContentDiv.innerHTML = '<p>Loading your posts...</p>';

  try {
    const res = await fetch(`${API_URL}/api/journal`);
    if (!res.ok) throw new Error('Failed to load journal posts');
    const posts = await res.json();
    const userId = localStorage.getItem('userId');
    const userPosts = posts.filter(post => post.authorId === userId);

    if (!userPosts.length) {
      journalContentDiv.innerHTML = `
        <img src="pictures/posts_logo.png" alt="Journal mascot" />
        <p>You have no written posts yet.</p>
        <button class="write-post-btn">Write Your First Post</button>
      `;
      journalContentDiv.querySelector('.write-post-btn').onclick = () => {
        window.location.href = '3-garden-journal.html';
      };
      return;
    }

    journalContentDiv.innerHTML = userPosts.map(post => `
      <div class="journal-post-card">
        <div class="journal-post-row">
          <div class="journal-post-main">
            <div class="journal-post-title">${post.title}</div>
            <div class="journal-post-summary">${post.summary}</div>
            <div class="journal-post-date">${post.date}</div>
            <div class="journal-post-tags">${(post.tags||[]).map(t => `#${t}`).join(' ')}</div>
          </div>
          <button class="delete-journal-btn" data-id="${post._id}">Delete</button>
        </div>
      </div>
    `).join('');

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

document.querySelectorAll('.sub-tab').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isPlants = btn.dataset.subtab === 'favorite-plants';
    document.getElementById('no-favorites').style.display = isPlants ? '' : 'none';
    document.getElementById('favorites-list').style.display = isPlants ? '' : 'none';
    document.getElementById('no-favorite-plans').style.display = isPlants ? 'none' : 'flex';
    if (isPlants) renderFavoritePlants();
  });
});

const favoritesTab = document.querySelector('.tab[data-tab="favorites"]');
if (favoritesTab) {
  favoritesTab.addEventListener('click', () => {
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    const plantsTab = document.querySelector('.sub-tab[data-subtab="favorite-plants"]');
    if (plantsTab) plantsTab.classList.add('active');

    document.getElementById('no-favorites').style.display = '';
    document.getElementById('favorites-list').style.display = '';
    document.getElementById('no-favorite-plans').style.display = 'none';
    renderFavoritePlants();
  });
}

if (document.getElementById('favorites-list')) renderFavoritePlants();

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

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '1-index.html';
  });
}

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
        showVerificationModal();
      } else {
        alert(result.message || 'Failed to send verification email.');
      }
    } catch (err) {
      alert('An error occurred while sending verification email.');
    }
  });
}

function showVerificationModal() {
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

const journalTab = document.querySelector('.tab[data-tab="journal"]');
if (journalTab) {
  journalTab.addEventListener('click', () => {
    renderJournalPosts();
  });
  if (document.getElementById('journal')?.classList.contains('active')) {
    renderJournalPosts();
  }
}
