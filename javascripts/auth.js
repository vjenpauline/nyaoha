// Handle authentication and token management
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://nyaoha.onrender.com';

const authService = {
    saveToken(token) {
        localStorage.setItem('token', token);
    },

    getToken() {
        return localStorage.getItem('token');
    },

    removeToken() {
        localStorage.removeItem('token');
    },

    isLoggedIn() {
        const token = this.getToken();
        return !!token;
    },    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            this.saveToken(data.token);
            return data;
        } catch (error) {
            throw error;
        }
    },    async signup(userData) {
        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const errorMessages = data.errors.map(err => err.msg).join('\n');
                    throw new Error(errorMessages);
                }
                throw new Error(data.message || 'Signup failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    logout() {
        this.removeToken();
        window.location.href = '/1-index.html';
    },

    // Utility function for making authenticated API calls
    async fetchAuthenticated(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('Session expired');
        }

        return response;
    }
};

document.querySelector('.signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Clear any existing error messages
  const existingMessages = document.querySelectorAll('.message');
  existingMessages.forEach(msg => msg.remove());

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }

  // Disable submit button and show loading state
  const submitButton = e.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Creating account...';

  const userData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    password: password
  };

  try {
    const response = await authService.signup(userData);
    showMessage('Account created successfully!', 'success');
    
    // Save the token and redirect to profile
    authService.saveToken(response.token);
    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 1500);
  } catch (error) {
    showMessage(error.message || 'Failed to create account', 'error');
    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = 'Create Account';
  }
});

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  document.querySelector('.signup-form')?.insertBefore(
    messageDiv,
    document.querySelector('button[type="submit"]')
  );
  setTimeout(() => messageDiv.remove(), 3000);
}

document.querySelector('.login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await authService.login(email, password);
    showMessage('Login successful!', 'success');
    setTimeout(() => {
      window.location.href = '/profile.html';
    }, 1000);
  } catch (error) {
    showMessage(error.message || 'Login failed.', 'error');
  }
});

document.querySelectorAll('a[href="profile.html"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      e.preventDefault();
      window.location.href = 'log-in.html';
    }
  });
});

document.querySelectorAll('a[href="log-in.html"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const isLoggedIn = localStorage.getItem('token');
    if (isLoggedIn) {
      e.preventDefault();
      window.location.href = 'profile.html';
    }
  });
});
