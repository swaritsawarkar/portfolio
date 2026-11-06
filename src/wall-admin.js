import { renderInk } from './signing-ink.js';
import { signingConfigured, signingStore } from './signing-store.js';
import './portfolio.css';
import './signing-wall.css';
import './wall-admin.css';

const root = document.querySelector('.wall-admin');
const form = root.querySelector('form');
const actions = root.querySelector('.admin-actions');
const status = root.querySelector('.admin-status');
const list = root.querySelector('.admin-signatures');
let token;
let confirmed;
let revision = 0;

function setSession(value) {
  token = value;
  confirmed = undefined;
  revision++;
  form.hidden = Boolean(token);
  actions.hidden = !token;
  if (!token) list.replaceChildren();
}

async function refresh() {
  const current = ++revision;
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

if (!signingConfigured) {
  form.querySelector('button').disabled = true;
  status.textContent = 'The shared wall is awaiting setup.';
}
