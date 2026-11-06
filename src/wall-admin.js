import { renderInk } from './signing-ink.js';
import { portfolioStatsStore, signingConfigured, signingStore } from './signing-store.js';
import { renderStats } from './wall-stats.js';
import './portfolio.css';
import './signing-wall.css';
import './wall-admin.css';

const root = document.querySelector('.wall-admin');
const form = root.querySelector('form');
const actions = root.querySelector('.admin-actions');
const status = root.querySelector('.admin-status');
const list = root.querySelector('.admin-signatures');
const heading = root.querySelector('h1');
const nav = root.querySelector('.admin-nav');
const stats = root.querySelector('.admin-stats');
const statsContent = root.querySelector('.stats-content');
const range = stats.querySelector('select');
let token;
let confirmed;
let revision = 0;
let view;

function showView() {
  view = location.pathname.replace(/\/+$/, '') === '/admin/stats' ||
    new URLSearchParams(location.search).get('view') === 'stats' ? 'stats' : 'wall';
  heading.textContent = view === 'stats' ? 'Portfolio stats.' : 'Wall admin.';
  document.title = view === 'stats' ? 'Portfolio stats · Admin' : 'Signing wall · Admin';
  list.hidden = !token || view !== 'wall';
  stats.hidden = !token || view !== 'stats';
  for (const link of nav.querySelectorAll('[data-admin-view]')) {
    if (link.dataset.adminView === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function setSession(value) {
  token = value;
  confirmed = undefined;
  revision++;
  form.hidden = Boolean(token);
  actions.hidden = !token;
  nav.hidden = !token;
  if (!token) {
    list.replaceChildren();
    statsContent.replaceChildren();
  }
  showView();
}

async function refresh() {
  if (!token) return;
  const current = ++revision;
  if (view === 'stats') {
    status.textContent = 'Loading visitor stats…';
    try {
      const data = await portfolioStatsStore.summary(Number(range.value), token);
      if (!token || current !== revision) return;
      if (!data) throw Object.assign(new Error('Owner access required.'), { status: 403 });
      renderStats(statsContent, data);
      status.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (error) {
      if (current !== revision) return;
      if (error.status === 401 || error.status === 403) {
        setSession(undefined);
        status.textContent = 'Sign in again to view visitor stats.';
      } else status.textContent = 'Couldn’t load visitor stats. Try Refresh.';
    }
    return;
  }
  status.textContent = 'Loading signatures…';
  try {
    const rows = await signingStore.list();
    if (!token || current !== revision) return;
    list.replaceChildren(...rows.map((entry) => {
      const card = document.createElement('article');
      const [left, top, right, bottom] = entry.bounds;
      const preview = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      preview.setAttribute('viewBox', [left, top, right - left, bottom - top].join(' '));
      preview.setAttribute('aria-hidden', 'true');
      renderInk(preview, entry.strokes);
      const name = document.createElement('strong');
      name.textContent = entry.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.markId = entry.id;
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', 'Delete signature by ' + entry.name);
      card.append(preview, name, remove);
      return card;
    }));
    status.textContent = rows.length ? rows.length + ' on the wall' : 'The wall is empty.';
  } catch {
    if (current === revision) status.textContent = 'Couldn’t load the wall. Try Refresh.';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  status.textContent = 'Signing in…';
  try {
    setSession(await signingStore.login(form.elements.username.value, form.elements.password.value));
    await refresh();
  } catch {
    status.textContent = 'Couldn’t sign in with those details.';
  } finally {
    form.elements.password.value = '';
    button.disabled = false;
  }
});

root.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button || !token) return;
  if (button.dataset.admin === 'logout') {
    setSession(undefined);
    status.textContent = 'Signed out.';
    return;
  }
  if (button.dataset.admin === 'refresh') {
    confirmed = undefined;
    await refresh();
    return;
  }
  const id = button.dataset.markId;
  if (!id) return;
  if (confirmed !== id) {
    list.querySelectorAll('button').forEach((item) => { item.textContent = 'Delete'; });
    confirmed = id;
    button.textContent = 'Confirm deletion';
    status.textContent = 'Confirm to remove this signature permanently.';
    return;
  }
  button.disabled = true;
  try {
    await signingStore.remove(id, token);
    confirmed = undefined;
    if (token) await refresh();
  } catch {
    if (token) status.textContent = 'Couldn’t delete it. Sign in again or refresh the wall.';
  } finally {
    button.disabled = false;
  }
});

nav.addEventListener('click', (event) => {
  const link = event.target.closest('[data-admin-view]');
  if (!link || !token || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (view === link.dataset.adminView) return;
  history.pushState(null, '', link.href);
  showView();
  window.scrollTo(0, 0);
  void refresh();
});
window.addEventListener('popstate', () => {
  showView();
  if (token) void refresh();
});
range.addEventListener('change', () => { statsContent.replaceChildren(); void refresh(); });
setInterval(() => {
  if (token && view === 'stats' && !document.hidden) void refresh();
}, 30000);

showView();
if (!signingConfigured) {
  form.querySelector('button').disabled = true;
  status.textContent = 'The shared wall is awaiting setup.';
}
