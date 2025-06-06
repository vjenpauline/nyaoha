document.addEventListener('DOMContentLoaded', function () {
    // wait for DOM to load

    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : 'https://nyaoha.onrender.com';

    const authService = {
        // define authService object for authentication logic
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
            return !!this.getToken();
        },
        async login(email, password) {
            // login method
            const response = await fetch(`${API_URL}/api/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }
            const data = await response.json();
            this.saveToken(data.token);
            return data;
        },
        async signup(userData) {
            // signup method
            const response = await fetch(`${API_URL}/api/user/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessages = errorData.errors
                    ? errorData.errors.map(err => err.msg).join('\n')
                    : errorData.message || 'Signup failed';
                throw new Error(errorMessages);
            }
            return await response.json();
        },
        logout() {
            // logout method
            this.removeToken();
            window.location.href = '/1-index.html';
        },
        async fetchAuthenticated(url, options = {}) {
            // fetch with authentication
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

    const token = authService.getToken();
    const pathname = window.location.pathname;

    // redirect if already logged in or not logged in on certain pages
    if (token && pathname.endsWith('log-in.html')) {
        window.location.href = "profile.html";
    } else if (!token && pathname.endsWith('profile.html')) {
        window.location.href = "log-in.html";
    }

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

    function showMessage(message, type) {
        // show message helper function
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        const form = document.querySelector('.signup-form') || document.querySelector('.login-form');
        if (form) {
            form.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 3000);
        } else {
            console.error('Unable to find form to display message.');
        }
    }
});