/**
 * AmnesiaIP — Auth modals (login & register)
 */

import { login, register } from './api.js';
import {
  getRememberedEmail,
  setRememberedEmail,
  clearRememberedEmail,
} from './session.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const els = {
  loginBtn: document.getElementById('login-btn'),
  registerBtn: document.getElementById('register-btn'),
  loginModal: document.getElementById('login-modal'),
  registerModal: document.getElementById('register-modal'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  loginError: document.getElementById('login-error'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginRemember: document.getElementById('login-remember'),
  registerName: document.getElementById('register-name'),
  registerEmail: document.getElementById('register-email'),
  registerPassword: document.getElementById('register-password'),
  registerPasswordConfirm: document.getElementById('register-password-confirm'),
  registerContent: document.getElementById('register-content'),
  registerSuccess: document.getElementById('register-success'),
};

let activeModal = null;
let focusTrapHandler = null;

function openModal(modal) {
  if (!modal) return;
  closeModal();
  activeModal = modal;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  trapFocus(modal);
  const firstInput = modal.querySelector('input:not([type="checkbox"])');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function closeModal() {
  if (!activeModal) return;
  if (activeModal === els.registerModal && els.registerSuccess.hidden === false) {
    resetRegisterModal();
  }
  activeModal.classList.remove('is-open');
  activeModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  releaseFocusTrap();
  activeModal = null;
}

function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  focusTrapHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', focusTrapHandler);
}

function releaseFocusTrap() {
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }
}

function setupModalClose(modal) {
  const overlay = modal.querySelector('.modal-overlay') || modal;
  const closeBtn = modal.querySelector('[data-modal-close]');

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });
}

function setFieldError(input, errorEl, message) {
  if (message) {
    input.classList.add('is-invalid');
    errorEl.textContent = message;
  } else {
    input.classList.remove('is-invalid');
    errorEl.textContent = '';
  }
}

function validateEmail(email) {
  if (!email.trim()) return 'Введите email';
  if (!EMAIL_REGEX.test(email)) return 'Введите корректный email';
  return '';
}

function validatePassword(password) {
  if (!password) return 'Введите пароль';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`;
  }
  return '';
}

async function handleLogin(e) {
  e.preventDefault();
  els.loginError.hidden = true;

  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;
  const remember = els.loginRemember.checked;

  if (!email) {
    els.loginError.textContent = 'Введите логин или email';
    els.loginError.hidden = false;
    return;
  }

  if (!password) {
    els.loginError.textContent = 'Введите пароль';
    els.loginError.hidden = false;
    return;
  }

  const result = await login({ email, password, remember });

  if (result.success) {
    if (remember) {
      setRememberedEmail(email);
    } else {
      clearRememberedEmail();
    }
    window.location.href = 'admin.html';
    return;
  }

  els.loginError.textContent = result.error;
  els.loginError.hidden = false;
}

async function handleRegister(e) {
  e.preventDefault();

  const fields = {
    name: { input: els.registerName, error: document.getElementById('register-name-error') },
    email: { input: els.registerEmail, error: document.getElementById('register-email-error') },
    password: { input: els.registerPassword, error: document.getElementById('register-password-error') },
    confirm: { input: els.registerPasswordConfirm, error: document.getElementById('register-confirm-error') },
  };

  let valid = true;

  if (!fields.name.input.value.trim()) {
    setFieldError(fields.name.input, fields.name.error, 'Введите имя');
    valid = false;
  } else {
    setFieldError(fields.name.input, fields.name.error, '');
  }

  const emailErr = validateEmail(fields.email.input.value);
  setFieldError(fields.email.input, fields.email.error, emailErr);
  if (emailErr) valid = false;

  const passErr = validatePassword(fields.password.input.value);
  setFieldError(fields.password.input, fields.password.error, passErr);
  if (passErr) valid = false;

  if (fields.confirm.input.value !== fields.password.input.value) {
    setFieldError(fields.confirm.input, fields.confirm.error, 'Пароли не совпадают');
    valid = false;
  } else {
    setFieldError(fields.confirm.input, fields.confirm.error, '');
  }

  if (!valid) return;

  const result = await register({
    name: fields.name.input.value.trim(),
    email: fields.email.input.value.trim(),
    password: fields.password.input.value,
  });

  els.registerContent.hidden = true;
  els.registerSuccess.hidden = false;
  document.getElementById('register-success-text').textContent = result.message;
}

function resetRegisterModal() {
  els.registerForm.reset();
  els.registerContent.hidden = false;
  els.registerSuccess.hidden = true;
  ['register-name-error', 'register-email-error', 'register-password-error', 'register-confirm-error'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  els.registerForm.querySelectorAll('.is-invalid').forEach((input) => {
    input.classList.remove('is-invalid');
  });
}

function init() {
  if (!els.loginBtn) return;

  const remembered = getRememberedEmail();
  if (remembered) {
    els.loginEmail.value = remembered;
    els.loginRemember.checked = true;
  }

  els.loginBtn.addEventListener('click', () => openModal(els.loginModal));
  els.registerBtn.addEventListener('click', () => {
    resetRegisterModal();
    openModal(els.registerModal);
  });

  setupModalClose(els.loginModal);
  setupModalClose(els.registerModal);

  els.loginForm.addEventListener('submit', handleLogin);
  els.registerForm.addEventListener('submit', handleRegister);

  els.registerModal.querySelector('[data-register-close]')?.addEventListener('click', () => {
    closeModal();
    resetRegisterModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
