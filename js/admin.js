/**
 * AmnesiaIP — Admin panel logic
 */

import {
  logout,
  getStats,
  getOnlineUsers,
  getBroadcastMessages,
  sendBroadcastMessage,
  sendPrivateMessage,
} from './api.js';
import { isAuthenticated, getSession } from './session.js';

const els = {
  adminName: document.getElementById('admin-name'),
  adminAvatar: document.getElementById('admin-avatar'),
  logoutBtn: document.getElementById('logout-btn'),
  statTotalUsers: document.getElementById('stat-total-users'),
  statOnline: document.getElementById('stat-online'),
  statAdmins: document.getElementById('stat-admins'),
  statMessages: document.getElementById('stat-messages'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  chatHistory: document.getElementById('chat-history'),
  usersList: document.getElementById('users-list'),
  pmModal: document.getElementById('pm-modal'),
  pmForm: document.getElementById('pm-form'),
  pmRecipient: document.getElementById('pm-recipient'),
  pmMessage: document.getElementById('pm-message'),
  toast: document.getElementById('toast'),
};

let activePmUserId = null;
let pmModalOpen = false;
let focusTrapHandler = null;

function authGuard() {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function renderAdminInfo() {
  const session = getSession();
  if (!session) return;
  els.adminName.textContent = session.name;
  els.adminAvatar.textContent = session.name.charAt(0).toUpperCase();
}

async function renderStats() {
  const stats = await getStats();
  els.statTotalUsers.textContent = stats.totalUsers;
  els.statOnline.textContent = stats.online;
  els.statAdmins.textContent = stats.admins;
  els.statMessages.textContent = stats.messagesSent;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderChatHistory(messages) {
  els.chatHistory.innerHTML = '';
  messages.forEach((msg) => {
    const li = document.createElement('li');
    li.className = 'chat-message';
    li.innerHTML = `
      <p class="chat-message__text">${escapeHtml(msg.text)}</p>
      <time class="chat-message__time" datetime="${msg.timestamp}">${formatTime(msg.timestamp)}</time>
    `;
    els.chatHistory.appendChild(li);
  });
}

async function loadChatHistory() {
  const messages = await getBroadcastMessages();
  renderChatHistory(messages);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function renderOnlineUsers() {
  const users = await getOnlineUsers();
  els.usersList.innerHTML = '';

  users.forEach((user) => {
    const li = document.createElement('li');
    li.className = 'user-item';
    li.innerHTML = `
      <div class="user-item__info">
        <span class="user-item__status" aria-label="Онлайн"></span>
        <span class="user-item__name">${escapeHtml(user.name)}</span>
      </div>
      <button type="button" class="btn btn--secondary btn--sm" data-user-id="${user.id}" data-user-name="${escapeHtml(user.name)}">Написать</button>
    `;
    els.usersList.appendChild(li);
  });

  els.usersList.querySelectorAll('[data-user-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openPmModal(Number(btn.dataset.userId), btn.dataset.userName);
    });
  });
}

async function handleChatSubmit(e) {
  e.preventDefault();
  const text = els.chatInput.value;
  const result = await sendBroadcastMessage(text);
  if (result.success) {
    els.chatInput.value = '';
    await loadChatHistory();
    await renderStats();
  }
}

function openPmModal(userId, userName) {
  activePmUserId = userId;
  els.pmRecipient.textContent = userName;
  els.pmMessage.value = '';
  els.pmModal.classList.add('is-open');
  els.pmModal.setAttribute('aria-hidden', 'false');
  pmModalOpen = true;
  document.body.style.overflow = 'hidden';
  trapFocus(els.pmModal);
  setTimeout(() => els.pmMessage.focus(), 100);
}

function closePmModal() {
  els.pmModal.classList.remove('is-open');
  els.pmModal.setAttribute('aria-hidden', 'true');
  pmModalOpen = false;
  activePmUserId = null;
  document.body.style.overflow = '';
  releaseFocusTrap();
}

function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  focusTrapHandler = (e) => {
    if (e.key === 'Escape') {
      closePmModal();
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

async function handlePmSubmit(e) {
  e.preventDefault();
  const text = els.pmMessage.value.trim();
  if (!text || !activePmUserId) return;

  const result = await sendPrivateMessage(activePmUserId, text);
  closePmModal();
  showToast(result.message);
}

let toastTimer = null;

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  els.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('is-visible');
    setTimeout(() => { els.toast.hidden = true; }, 300);
  }, 3500);
}

async function handleLogout() {
  await logout();
  window.location.href = 'index.html';
}

function setupPmModal() {
  els.pmModal.querySelector('[data-modal-close]')?.addEventListener('click', closePmModal);
  els.pmModal.addEventListener('click', (e) => {
    if (e.target === els.pmModal) closePmModal();
  });
  els.pmForm.addEventListener('submit', handlePmSubmit);
}

async function init() {
  if (!authGuard()) return;

  renderAdminInfo();
  await renderStats();
  await loadChatHistory();
  await renderOnlineUsers();

  els.chatForm.addEventListener('submit', handleChatSubmit);
  els.logoutBtn.addEventListener('click', handleLogout);
  setupPmModal();
}

document.addEventListener('DOMContentLoaded', init);
