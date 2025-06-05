document.addEventListener('DOMContentLoaded', function() {
  // check if the DOM is loaded
  // get token and auth button
  const token = localStorage.getItem('token');
  const authBtn = document.querySelector('.login-btn, #auth-btn');
  // if auth button exists
  if (authBtn) {
    //   if token exists, set to log out and handle logout
    if (token) {
      authBtn.textContent = 'Log Out';
      authBtn.onclick = function() {
        localStorage.removeItem('token');
        window.location.reload();
      };
    //   else, set to log in and handle login
    } else {
      authBtn.textContent = 'Log In';
      authBtn.onclick = function() {
        window.location.href = 'log-in.html';
      };
    }
  }

  // handle profile button click to go to profile or alert if not logged in
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
