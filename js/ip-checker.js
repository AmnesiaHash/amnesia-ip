/**
 * AmnesiaIP — IP address checker
 * Fetches geo data from ipwho.is with ipapi.co fallback.
 */

const FETCH_TIMEOUT_MS = 8000;

const API = {
  primary: 'https://ipwho.is/',
  fallback: 'https://ipapi.co/json/',
  ipv6: 'https://api64.ipify.org?format=json',
};

const state = {
  ipv4: null,
  isLoading: false,
};

const els = {
  dataList: document.getElementById('data-list'),
  spinner: document.getElementById('loading-spinner'),
  statusText: document.getElementById('status-text'),
  errorBanner: document.getElementById('error-banner'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),
  copyBtn: document.getElementById('copy-btn'),
  refreshBtn: document.getElementById('refresh-btn'),
  toast: document.getElementById('toast'),
  card: document.querySelector('.card'),
  fields: {
    ipv4: document.getElementById('val-ipv4'),
    ipv6: document.getElementById('val-ipv6'),
    country: document.getElementById('val-country'),
    city: document.getElementById('val-city'),
    region: document.getElementById('val-region'),
    isp: document.getElementById('val-isp'),
    asn: document.getElementById('val-asn'),
    org: document.getElementById('val-org'),
    coords: document.getElementById('val-coords'),
    timezone: document.getElementById('val-timezone'),
    useragent: document.getElementById('val-useragent'),
    connection: document.getElementById('val-connection'),
  },
};

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

function isIpv6(ip) {
  return ip && ip.includes(':');
}

function formatCoords(lat, lon) {
  if (lat == null || lon == null) return 'Не определено';
  return `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`;
}

function formatAsn(asn) {
  if (!asn) return 'Не определено';
  return asn.toString().startsWith('AS') ? asn : `AS${asn}`;
}

function formatTimezone(tz) {
  if (!tz) return 'Не определено';
  if (typeof tz === 'string') return tz;
  const id = tz.id || '';
  const utc = tz.utc ? ` (UTC${tz.utc})` : '';
  return id ? `${id}${utc}` : 'Не определено';
}

function setField(key, value, { muted = false } = {}) {
  const el = els.fields[key];
  if (!el) return;
  el.textContent = value || 'Не определено';
  el.classList.toggle('data-row__value--muted', muted);
}

function setLoading(loading) {
  state.isLoading = loading;
  els.dataList.classList.toggle('is-loading', loading);
  els.spinner.hidden = !loading;
  els.copyBtn.disabled = loading;
  els.refreshBtn.disabled = loading;
  els.statusText.textContent = loading ? 'Загрузка данных…' : 'Данные обновлены';
}

function showError(message) {
  els.errorBanner.hidden = false;
  els.errorMessage.textContent = message;
  els.statusText.textContent = 'Ошибка загрузки';
}

function hideError() {
  els.errorBanner.hidden = true;
}

async function fetchFromIpWhoIs() {
  const res = await fetchWithTimeout(API.primary);
  if (!res.ok) throw new Error(`ipwho.is HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'ipwho.is returned error');
  return normalizeIpWhoIs(data);
}

async function fetchFromIpApiCo() {
  const res = await fetchWithTimeout(API.fallback);
  if (!res.ok) throw new Error(`ipapi.co HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.reason || 'ipapi.co returned error');
  return normalizeIpApiCo(data);
}

async function fetchIpData() {
  try {
    return await fetchFromIpWhoIs();
  } catch (primaryErr) {
    console.warn('ipwho.is failed, trying fallback:', primaryErr.message);
    return await fetchFromIpApiCo();
  }
}

async function fetchIpv6() {
  try {
    const res = await fetchWithTimeout(API.ipv6);
    if (!res.ok) return null;
    const data = await res.json();
    const ip = data.ip;
    return isIpv6(ip) ? ip : null;
  } catch {
    return null;
  }
}

function normalizeIpWhoIs(data) {
  return {
    ipv4: isIpv6(data.ip) ? null : data.ip,
    country: data.flag?.emoji ? `${data.flag.emoji} ${data.country}` : data.country,
    city: data.city,
    region: data.region,
    isp: data.connection?.isp,
    asn: data.connection?.asn,
    org: data.connection?.org,
    lat: data.latitude,
    lon: data.longitude,
    timezone: data.timezone,
  };
}

function normalizeIpApiCo(data) {
  return {
    ipv4: data.ip,
    country: data.country_name,
    city: data.city,
    region: data.region,
    isp: data.org,
    asn: data.asn,
    org: data.org,
    lat: data.latitude,
    lon: data.longitude,
    timezone: data.timezone,
  };
}

function getClientInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let connectionType = 'Не определено';
  if (conn) {
    const parts = [conn.effectiveType, conn.type].filter(Boolean);
    if (parts.length) connectionType = parts.join(' / ');
  }
  return { userAgent: navigator.userAgent, connectionType };
}

function renderData(geo, ipv6, client) {
  if (geo.ipv4) {
    state.ipv4 = geo.ipv4;
    setField('ipv4', geo.ipv4);
  } else if (geo.ipv4 === null && !isIpv6(state.ipv4)) {
    setField('ipv4', 'Не определено');
  }
  if (ipv6) {
    setField('ipv6', ipv6);
  } else {
    setField('ipv6', 'Не доступен', { muted: true });
  }
  setField('country', geo.country);
  setField('city', geo.city);
  setField('region', geo.region);
  setField('isp', geo.isp);
  setField('asn', formatAsn(geo.asn));
  setField('org', geo.org);
  setField('coords', formatCoords(geo.lat, geo.lon));
  setField('timezone', formatTimezone(geo.timezone));
  setField('useragent', client.userAgent);
  setField('connection', client.connectionType);
}

async function loadData() {
  if (!navigator.onLine) {
    showError('Нет подключения к интернету. Проверьте сеть и попробуйте снова.');
    setLoading(false);
    return;
  }
  hideError();
  setLoading(true);
  try {
    const [geo, ipv6] = await Promise.all([fetchIpData(), fetchIpv6()]);
    const client = getClientInfo();
    renderData(geo, ipv6, client);
    setLoading(false);
  } catch (err) {
    console.error('Failed to load IP data:', err);
    const msg =
      err.name === 'AbortError'
        ? 'Превышено время ожидания ответа от сервера.'
        : 'Не удалось получить данные. Попробуйте обновить страницу.';
    showError(msg);
    setLoading(false);
  }
}

async function refresh() {
  els.card.classList.add('is-refreshing');
  els.refreshBtn.classList.add('btn--refreshing');
  await loadData();
  els.card.classList.remove('is-refreshing');
  els.refreshBtn.classList.remove('btn--refreshing');
}

async function copyIp() {
  const ip = state.ipv4 || els.fields.ipv4.textContent;
  if (!ip || ip === '—' || ip === 'Не определено') return;
  try {
    await navigator.clipboard.writeText(ip);
    showToast('Скопировано!');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = ip;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Скопировано!');
  }
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
  }, 2500);
}

function init() {
  if (!els.copyBtn) return;
  els.copyBtn.addEventListener('click', copyIp);
  els.refreshBtn.addEventListener('click', refresh);
  els.retryBtn.addEventListener('click', refresh);
  window.addEventListener('online', () => {
    if (els.errorBanner.hidden === false) refresh();
  });
  loadData();
}

document.addEventListener('DOMContentLoaded', init);
