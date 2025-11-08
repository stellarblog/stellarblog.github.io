// Authentication management
const AUTH_KEY = 'stellar-blog-auth';

// User data (in real app, this would be on server)
const users = JSON.parse(localStorage.getItem('stellar-blog-users') || '[]');

// Get current user
function getCurrentUser() {
    const authData = localStorage.getItem(AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

// Remove current user
function logout() {
    localStorage.removeItem(AUTH_KEY);
}

// Register new user
function registerUser(username, email, password) {
    // Check if user already exists
    if (users.find(user => user.username === username)) {
        throw new Error('Username already exists');
    }
    
    if (users.find(user => user.email === email)) {
        throw new Error('Email already registered');
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: btoa(password), // Simple encoding (in real app, use proper hashing)
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('stellar-blog-users', JSON.stringify(users));
    
    return newUser;
}

// Login user
function loginUser(username, password) {
    const user = users.find(u => u.username === username);
    
    if (!user) {
        throw new Error('User not found');
    }

    if (user.password !== btoa(password)) {
        throw new Error('Invalid password');
    }

    return user;
}

// Check if user is authenticated
function isAuthenticated() {
    return getCurrentUser() !== null;
}