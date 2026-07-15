/**
 * AmnesiaIP API layer — stub functions for future backend integration.
 * Replace function bodies with fetch('/api/...') when server is ready.
 */

import { setSession, clearSession } from './session.js';

const DEMO_LOGIN = 'AmnesiaOwner';
const DEMO_PASSWORD = 'Amnesia7575';

const BROADCAST_KEY = 'amnesia_broadcast_messages';
const STATS_KEY = 'amnesia_demo_stats';

const DEFAULT_STATS = {
  totalUsers: 128,
  online: 3,
  admins: 1,
  messagesSent: 0,
};

const DEMO_USERS = [
  { id: 1, name: 'Пользователь #1' },
  { id: 2, name: 'Пользователь #2' },
  { id: 3, name: 'Пользователь #3' },
];

function loadStats() {
  try {
    const raw = sessionStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function saveStats(stats) {
  sessionStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function loadBroadcastMessages() {
  try {
    const raw = sessionStorage.getItem(BROADCAST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBroadcastMessages(messages) {
  sessionStorage.setItem(BROADCAST_KEY, JSON.stringify(messages));
}

/**
 * @param {{ email: string, password: string, remember?: boolean }} credentials
 * @returns {Promise<{ success: boolean, error?: string, user?: object }>}
 */
export async function login(credentials) {
  const { email, password } = credentials;

  if (email === DEMO_LOGIN && password === DEMO_PASSWORD) {
    const user = { role: 'admin', name: 'AmnesiaOwner', email: DEMO_LOGIN };
    setSession(user);
    return { success: true, user };
  }

  return {
    success: false,
    error: 'Неверный логин или пароль. Проверьте данные и попробуйте снова.',
  };
}

/**
 * @param {{ name: string, email: string, password: string }} userData
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function register(userData) {
  return {
    success: true,
    message: 'Регистрация будет доступна после подключения серверной части.',
  };
}

/**
 * @returns {Promise<void>}
 */
export async function logout() {
  clearSession();
}

/**
 * @returns {Promise<{ totalUsers: number, online: number, admins: number, messagesSent: number }>}
 */
export async function getStats() {
  return loadStats();
}

/**
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export async function getOnlineUsers() {
  return [...DEMO_USERS];
}

/**
 * @returns {Promise<Array<{ id: string, text: string, timestamp: string }>>}
 */
export async function getBroadcastMessages() {
  return loadBroadcastMessages();
}

/**
 * @param {string} text
 * @returns {Promise<{ success: boolean, message: object }>}
 */
export async function sendBroadcastMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, message: null };
  }

  const messages = loadBroadcastMessages();
  const entry = {
    id: crypto.randomUUID(),
    text: trimmed,
    timestamp: new Date().toISOString(),
  };

  messages.unshift(entry);
  saveBroadcastMessages(messages);

  const stats = loadStats();
  stats.messagesSent += 1;
  saveStats(stats);

  return { success: true, message: entry };
}

/**
 * @param {number} userId
 * @param {string} text
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendPrivateMessage(userId, text) {
  return {
    success: false,
    message: 'Функция станет доступна после подключения серверной части.',
  };
}
