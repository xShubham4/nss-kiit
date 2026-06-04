/* ============================================================
   AUTH MODULE  —  Login modal + Backend API integration
   ============================================================ */

const API_BASE = 'http://localhost:5000/api';

// Token stored in closure (not localStorage) for security
let accessToken = null;
let currentUser = null;

// ── DOM References ─────────────────────────────────────────────
function getElements() {
  return {
    backdrop: document.getElementById('login-backdrop'),
    modal: document.getElementById('login-modal'),
    form: document.getElementById('login-form'),
    emailInput: document.getElementById('login-email'),
    passwordInput: document.getElementById('login-password'),
    emailError: document.getElementById('email-error'),
    passwordError: document.getElementById('password-error'),
    formMessage: document.getElementById('form-message'),
    submitBtn: document.getElementById('login-submit'),
    closeBtn: document.getElementById('modal-close-btn'),
    loginNavBtn: document.getElementById('nav-login-btn'),
    userNav: document.getElementById('nav-user'),
    userName: document.getElementById('nav-user-name'),
    userRole: document.getElementById('nav-user-role'),
    logoutBtn: document.getElementById('nav-logout-btn'),
    mobileLoginBtn: document.getElementById('mobile-login-btn'),
    logoutModal: document.getElementById('logout-modal'),
    logoutConfirmBtn: document.getElementById('logout-confirm-btn'),
    logoutCancelBtn: document.getElementById('logout-cancel-btn'),
  };
}

// ── Modal Controls ─────────────────────────────────────────────
function openLoginModal() {
  const { backdrop, modal, emailInput } = getElements();
  backdrop.classList.add('open');
  modal.classList.add('open');
  document.body.classList.add('modal-open');

  // Focus email after animation
  setTimeout(() => emailInput?.focus(), 350);

  // Listen for escape
  document.addEventListener('keydown', handleEscape);
}

function closeLoginModal() {
  const { backdrop, modal, form, formMessage, emailError, passwordError, logoutModal } = getElements();
  backdrop.classList.remove('open');
  modal.classList.remove('open');
  if (logoutModal) logoutModal.classList.remove('open');
  document.body.classList.remove('modal-open');

  // Reset form
  setTimeout(() => {
    if (form) form.reset();
    if (formMessage) {
      formMessage.className = 'form-message';
      formMessage.textContent = '';
    }
    clearFieldErrors();
  }, 350);

  document.removeEventListener('keydown', handleEscape);
}

function handleEscape(e) {
  if (e.key === 'Escape') closeLoginModal();
}

function clearFieldErrors() {
  const { emailInput, passwordInput, emailError, passwordError } = getElements();
  emailInput?.classList.remove('error');
  passwordInput?.classList.remove('error');
  if (emailError) emailError.textContent = '';
  if (passwordError) passwordError.textContent = '';
}

// ── Validation ─────────────────────────────────────────────────
function validateForm(email, password) {
  const { emailInput, passwordInput, emailError, passwordError } = getElements();
  let valid = true;
  clearFieldErrors();

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    emailInput.classList.add('error');
    emailError.textContent = 'Email is required';
    valid = false;
  } else if (!emailRegex.test(email)) {
    emailInput.classList.add('error');
    emailError.textContent = 'Invalid email address';
    valid = false;
  }

  // Password
  if (!password) {
    passwordInput.classList.add('error');
    passwordError.textContent = 'Password is required';
    valid = false;
  } else if (password.length < 8) {
    passwordInput.classList.add('error');
    passwordError.textContent = 'Password must be at least 8 characters';
    valid = false;
  }

  return valid;
}

// ── API Calls ──────────────────────────────────────────────────
async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive cookies
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
}

async function refreshToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) return null;

    const data = await res.json();
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    return null;
  }
}

async function fetchMe() {
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });

    if (!res.ok) {
      // Try refresh
      const newToken = await refreshToken();
      if (!newToken) return null;

      const retry = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${newToken}` },
        credentials: 'include',
      });

      if (!retry.ok) return null;
      return (await retry.json()).user;
    }

    return (await res.json()).user;
  } catch {
    return null;
  }
}

function logout(e) {
  if (e) e.preventDefault();
  
  const { backdrop, logoutModal } = getElements();
  if (backdrop && logoutModal) {
    backdrop.classList.add('open');
    logoutModal.classList.add('open');
    document.body.classList.add('modal-open');
  }
}

async function executeLogout() {
  const { logoutConfirmBtn } = getElements();
  if (logoutConfirmBtn) {
    logoutConfirmBtn.classList.add('loading');
    logoutConfirmBtn.innerHTML = '<span class="btn-spinner" style="display: inline-block;"></span>';
  }

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
  } catch {
    // Ignore errors, still clear local state
  }

  accessToken = null;
  currentUser = null;
  updateNavForLogout();
  closeLoginModal(); // This will close the logout modal too since we added it to closeLoginModal
  window.dispatchEvent(new CustomEvent('authChange', { detail: { user: null } }));
}

// ── UI Updates ─────────────────────────────────────────────────
function updateNavForLogin(user) {
  const { loginNavBtn, userNav, userName, userRole } = getElements();
  currentUser = user;

  if (loginNavBtn) loginNavBtn.style.display = 'none';
  if (userNav) {
    userNav.classList.add('visible');
    if (userName) userName.textContent = user.name;
    if (userRole) userRole.textContent = user.role;
  }
}

function updateNavForLogout() {
  const { loginNavBtn, userNav } = getElements();
  if (loginNavBtn) loginNavBtn.style.display = '';
  if (userNav) userNav.classList.remove('visible');
}

// ── Form Submit Handler ────────────────────────────────────────
async function handleLoginSubmit(e) {
  e.preventDefault();

  const { emailInput, passwordInput, submitBtn, formMessage } = getElements();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Reset message
  formMessage.className = 'form-message';
  formMessage.textContent = '';

  // Validate
  if (!validateForm(email, password)) return;

  // Show loading
  submitBtn.classList.add('loading');

  try {
    const data = await login(email, password);

    accessToken = data.accessToken;
    currentUser = data.user;

    // Success
    formMessage.className = 'form-message success';
    formMessage.textContent = `Welcome, ${data.user.name}!`;

    updateNavForLogin(data.user);
    window.dispatchEvent(new CustomEvent('authChange', { detail: { user: data.user } }));

    // Close modal after a beat
    setTimeout(() => closeLoginModal(), 800);

  } catch (err) {
    formMessage.className = 'form-message error';
    formMessage.textContent = err.message || 'Invalid credentials';
  } finally {
    submitBtn.classList.remove('loading');
  }
}

// ── Init ───────────────────────────────────────────────────────
function initAuth() {
  const { backdrop, closeBtn, loginNavBtn, logoutBtn, form, mobileLoginBtn } = getElements();

  // Open modal
  loginNavBtn?.addEventListener('click', openLoginModal);
  mobileLoginBtn?.addEventListener('click', () => {
    // Close mobile nav first
    document.querySelector('.mobile-nav')?.classList.remove('open');
    document.querySelector('.nav-burger')?.classList.remove('open');
    setTimeout(openLoginModal, 300);
  });

  // Close modal
  closeBtn?.addEventListener('click', closeLoginModal);
  backdrop?.addEventListener('click', closeLoginModal);

  // Form submit
  form?.addEventListener('submit', handleLoginSubmit);

  // Logout
  logoutBtn?.addEventListener('click', logout);
  
  const { logoutConfirmBtn, logoutCancelBtn } = getElements();
  logoutConfirmBtn?.addEventListener('click', executeLogout);
  logoutCancelBtn?.addEventListener('click', closeLoginModal);

  // Clear field errors on input
  const { emailInput, passwordInput } = getElements();
  emailInput?.addEventListener('input', () => {
    emailInput.classList.remove('error');
    document.getElementById('email-error').textContent = '';
  });
  passwordInput?.addEventListener('input', () => {
    passwordInput.classList.remove('error');
    document.getElementById('password-error').textContent = '';
  });

  // Try to restore session
  tryRestoreSession();
}

async function tryRestoreSession() {
  const newToken = await refreshToken();
  if (newToken) {
    const user = await fetchMe();
    if (user) {
      updateNavForLogin(user);
    }
  }
}

function getCurrentUser() {
  return currentUser;
}

function getAccessToken() {
  return accessToken;
}

export { initAuth, openLoginModal, closeLoginModal, getCurrentUser, getAccessToken };
