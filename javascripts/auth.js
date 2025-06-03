document.addEventListener('DOMContentLoaded', function() {
    const isAuthPage = window.location.pathname.endsWith('log-in.html') || window.location.pathname.endsWith('sign-up.html');
    const token = sessionStorage.getItem('token');

    // Redirect logged-in users away from login page
    if (token && window.location.pathname.endsWith('log-in.html')) {
        window.location.href = "profile.html";
    }

    // Redirect non-logged-in users to login page if trying to access protected pages
    if (!token && window.location.pathname.endsWith('profile.html')) {
        window.location.href = "log-in.html";
    }
});

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://nyaoha.onrender.com';

const authService = {
    saveToken(token) {
        sessionStorage.setItem('token', token);
    },
    getToken() {
        return sessionStorage.getItem('token');
    },
    removeToken() {
        sessionStorage.removeItem('token');
    },
    isLoggedIn() {
        return !!this.getToken();
    },
    async login(email, password) {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        this.saveToken(data.token);
        return data;
    },
    async signup(userData) {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    },
    logout() {
        this.removeToken();
        window.location.href = '/1-index.html';
    },
    async fetchAuthenticated(url, options = {}) {
        const token = this.getToken();
        if (!token) throw new Error('No authentication token found');
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            this.logout();
            throw new Error('Session expired');
        }
        return response;
    }
};

// Signup form
document.querySelector('.signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const signupForm = e.target;
    const submitButton = signupForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';

    const userData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await authService.signup(userData);
        showMessage('Account created successfully!', 'success');
        authService.saveToken(response.token);
        window.location.href = 'profile.html';
    } catch (error) {
        showMessage(error.message || 'Failed to create account', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }
});

// Login form
document.querySelector('.login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await authService.login(email, password);
        showMessage('Login successful!', 'success');
        setTimeout(() => window.location.href = '/profile.html', 1000);
    } catch (error) {
        showMessage(error.message || 'Login failed.', 'error');
    }
});

// Redirect links
document.querySelectorAll('a[href="profile.html"]').forEach(link => {
    link.addEventListener('click', (e) => {
        if (!authService.isLoggedIn()) {
            e.preventDefault();
            window.location.href = 'log-in.html';
        }
    });
});

document.querySelectorAll('a[href="log-in.html"]').forEach(link => {
    link.addEventListener('click', (e) => {
        if (authService.isLoggedIn()) {
            e.preventDefault();
            window.location.href = 'profile.html';
        }
    });
});

// Message feedback
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    const form = document.querySelector('.signup-form') || document.querySelector('.login-form');
    const submitButton = form?.querySelector('button[type="submit"]');

    if (form && submitButton) {
        form.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    } else {
        console.error('Unable to find form to display message.');
    }
}