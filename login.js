// Login and registration functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) {
            showAlert('Please fill in all fields', 'error');
            return;
        }

        try {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';

            const user = loginUser(username, password);
            setCurrentUser(user);
            
            showAlert('Login successful!', 'success');
            setTimeout(() => {
                checkAuthState();
            }, 1000);

        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();

        if (!username || !email || !password || !confirmPassword) {
            showAlert('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            registerBtn.disabled = true;
            registerBtn.textContent = 'Registering...';

            const user = registerUser(username, email, password);
            setCurrentUser(user);
            
            showAlert('Registration successful!', 'success');
            setTimeout(() => {
                checkAuthState();
            }, 1000);

        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    });
});