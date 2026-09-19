/* auth.js — User registration, login, session management, and authentication guards. */

const Auth = (() => {

  const USERS_KEY = 'sims_users';
  const SESSION_KEY = 'sims_session';

  // Simple async SHA-256 hash using Web Crypto API
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_sims_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(user) {
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'Administrator',
      storeName: user.storeName || 'My Store',
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (typeof Storage !== 'undefined' && Storage.emit) {
      Storage.emit('auth_changed', session);
    }
    return session;
  }

  async function register({ name, email, password, role, storeName }) {
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!name) throw new Error('Full name is required');
    if (!email || !email.includes('@')) throw new Error('Valid email address is required');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long');

    const users = getUsers();
    if (users.some(u => u.email === email)) {
      throw new Error('An account with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      id: 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      email,
      passwordHash,
      role: role || 'Administrator',
      storeName: storeName || 'My Store',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // If store name provided, update store settings
    if (storeName && typeof Storage !== 'undefined') {
      Storage.saveSettings({ storeName });
    }

    setSession(newUser);
    return newUser;
  }

  async function login(email, password) {
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!email || !password) {
      throw new Error('Please enter both email and password');
    }

    // Ensure default users are seeded
    await seedDefaultUsers();

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Invalid email or password');
    }

    setSession(user);
    return user;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    if (typeof Storage !== 'undefined' && Storage.emit) {
      Storage.emit('auth_changed', null);
    }
    window.location.href = 'login.html';
  }

  function requireAuth() {
    const current = getCurrentUser();
    if (!current) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  async function seedDefaultUsers() {
    const users = getUsers();
    if (users.length > 0) return;

    const adminHash = await hashPassword('admin123');
    const managerHash = await hashPassword('manager123');

    const defaults = [
      {
        id: 'usr-admin',
        name: 'Alex Mercer (Admin)',
        email: 'admin@smartinventory.com',
        passwordHash: adminHash,
        role: 'Administrator',
        storeName: 'Smart Inventory Hub',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-manager',
        name: 'Sarah Connor',
        email: 'manager@smartinventory.com',
        passwordHash: managerHash,
        role: 'Inventory Manager',
        storeName: 'Smart Inventory Hub',
        createdAt: new Date().toISOString()
      }
    ];

    saveUsers(defaults);
  }

  // Auto-seed default accounts on load
  seedDefaultUsers();

  return {
    getUsers,
    getCurrentUser,
    register,
    login,
    logout,
    requireAuth,
    seedDefaultUsers
  };
})();
