
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const authBtn = document.querySelector('.login-btn, #auth-btn');
  if (authBtn) {
    if (token) {
      authBtn.textContent = 'Log Out';
      authBtn.onclick = function() {
        localStorage.removeItem('token');
        window.location.reload();
      };
    } else {
      authBtn.textContent = 'Log In';
      authBtn.onclick = function() {
        window.location.href = 'log-in.html';
      };
    }
  }

  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn) {
    profileBtn.addEventListener('click', function() {
      const token = localStorage.getItem('token');
      if (token) {
        window.location.href = 'profile.html';
      } else {
        alert('Please log in to view your profile.');
      }
    });
  }
});
