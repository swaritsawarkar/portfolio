import { extend, measure, paper, paperPoint, renderInk, slots } from './signing-ink.js';
import { signingConfigured, signingStore } from './signing-store.js';
import './signing-wall.css';

const rowBatch = 12;
const firstSquares = 24;
const svgMarkup = '<svg viewBox="0 0 320 180" preserveAspectRatio="none" aria-hidden="true"></svg>';
const slotLabel = (slot) => String(slot + 1).padStart(3, '0');

export const signingWall = `
  <div class="signing-wall" data-part="frame" data-build-static>
    <div class="wall-legend"><span>Guestbook</span><span class="wall-count">— / ${slots} signed</span></div>
    <form class="wall-sign-form" hidden>
      <div class="wall-draft-top">
        <span class="wall-draft-slot"></span>
        <label>Your name <input name="signatureName" required maxlength="40" autocomplete="name" placeholder="Name shown on the wall"></label>
        <div class="wall-ink"><progress max="${paper.ink}" value="${paper.ink}" aria-label="Ink remaining"></progress><span class="wall-ink-count">100% ink</span></div>
      </div>
      <div class="wall-tools">
        <button type="button" data-wall-action="undo">Undo</button>
        <button type="button" data-wall-action="clear">Clear</button>
        <button type="button" data-wall-action="cancel">Cancel</button>
        <button type="submit" class="wall-primary">Sign the wall</button>
      </div>
      <p class="wall-draft-status" role="status"></p>
    </form>
    <div class="wall-grid" aria-label="Signature wall"></div>
    <div class="wall-foot">
      <p class="wall-status" role="status"></p>
      <button type="button" data-wall-action="more">More wall space ↓</button>
      <button type="button" data-wall-action="owner">Moderate</button>
      <button type="button" data-wall-action="refresh" hidden>Retry</button>
    </div>
    <form class="wall-owner-form" hidden>
      <label>Owner email<input name="email" type="email" required autocomplete="username"></label>
      <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
      <button type="submit" class="wall-primary">Sign in</button>
      <p class="wall-owner-status" role="status"></p>
    </form>
  </div>`;

export function mountSigningWall(section) {
  const find = (selector) => section.querySelector(selector);
  const action = (name) => find('[data-wall-action="' + name + '"]');
  const grid = find('.wall-grid');
  const form = find('.wall-sign-form');
  const ownerForm = find('.wall-owner-form');
  const notice = find('.wall-status');
  const feedback = find('.wall-draft-status');
  const submit = form.querySelector('[type="submit"]');
  const nameInput = form.elements.signatureName;
  const entries = new Map();
  let shown = firstSquares;
  let available = false;
  let requestId = 0;
  let token;
  let slot;
  let confirmed;
  let busy = false;
  let nearWall = false;
  let strokes = [];
  let pointer;
  let drawingBox;

  function showThrough(index) {
    shown = Math.max(shown, Math.ceil((index + 1) / rowBatch) * rowBatch);
  }

  function paintBoard() {
    const focus = document.activeElement?.closest('[data-slot]')?.dataset.slot;
    const tiles = Array.from({ length: shown }, (_, index) => {
      const entry = entries.get(index);
      const editing = !entry && slot === index;
      const tile = document.createElement(entry || editing ? 'div' : 'button');
      tile.className = 'wall-tile';
      tile.dataset.slot = index;
      if (!entry && !editing) {
        tile.type = 'button';
        tile.disabled = !available || busy;
        tile.setAttribute('aria-label', 'Sign square ' + slotLabel(index));
      }
      tile.innerHTML = '<span class="wall-slot-number"></span>' +
        (entry ? svgMarkup : editing ? '<div class="wall-paper" aria-label="Draw in this square">' + svgMarkup + '</div>'
          : '<span class="wall-plus" aria-hidden="true">+</span>') + '<span class="wall-signer"></span>';
      tile.querySelector('.wall-slot-number').textContent = slotLabel(index);
      tile.querySelector('.wall-signer').textContent = entry?.name ?? (editing ? 'Draw here' : '');
      if (entry) {
        tile.classList.add('is-signed');
        renderInk(tile.querySelector('svg'), entry.strokes);
        if (token) {
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'wall-remove';
          remove.dataset.removeId = entry.id;
          remove.textContent = confirmed === entry.id ? 'Confirm delete' : 'Delete';
          remove.setAttribute('aria-label', remove.textContent + ' signature by ' + entry.name);
          remove.disabled = busy;
          tile.append(remove);
        }
      } else if (editing) {
        tile.classList.add('is-editing');
        renderInk(tile.querySelector('svg'), strokes);
      }
      return tile;
    });
    grid.replaceChildren(...tiles);
    if (focus !== undefined) grid.querySelector('button[data-slot="' + focus + '"]')?.focus({ preventScroll: true });
    find('.wall-count').textContent = (available || entries.size ? entries.size : '—') + ' / ' + slots + ' signed';
    action('more').hidden = shown >= slots;
    action('owner').disabled = !signingConfigured;
    action('owner').textContent = token ? 'Sign out' : ownerForm.hidden ? 'Moderate' : 'Close moderation';
  }

  async function refresh() {
    if (!signingConfigured) return false;
    const current = ++requestId;
    try {
      const rows = await signingStore.list();
      if (current !== requestId) return false;
      entries.clear();
      for (const entry of rows) {
        entries.set(entry.slot, entry);
        showThrough(entry.slot);
      }
      available = true;
      notice.textContent = entries.size === slots ? 'Every square is signed.' : 'Pick a free square to sign.';
      action('refresh').hidden = true;
    } catch {
      if (current !== requestId) return false;
      available = false;
      notice.textContent = 'The wall couldn’t load. Try again.';
      action('refresh').hidden = false;
    }
    paintBoard();
    return available;
  }

  function paintInk() {
    const remaining = Math.max(0, paper.ink - measure(strokes));
    const canvas = grid.querySelector('.is-editing svg');
    if (canvas) renderInk(canvas, strokes);
    find('.wall-ink progress').value = remaining;
    find('.wall-ink-count').textContent = remaining < 2 ? 'Out of ink' : Math.ceil(remaining / paper.ink * 100) + '% ink';
    submit.disabled = busy || !strokes.length || slot === undefined;
    action('undo').disabled = busy || !strokes.length;
    action('clear').disabled = busy || !strokes.length;
    action('cancel').disabled = busy;
  }

  function endDraft() {
    slot = pointer = undefined;
    strokes = [];
    form.reset();
    form.hidden = true;
    feedback.textContent = '';
  }

  function choose(index) {
    if (busy || !available || entries.has(index)) return;
    slot = index;
    showThrough(index);
    form.hidden = false;
    find('.wall-draft-slot').textContent = 'Square ' + slotLabel(index);
    feedback.textContent = '';
    paintBoard();
    paintInk();
    grid.querySelector('.is-editing').scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  const pointsUsed = () => strokes.reduce((n, stroke) => n + stroke.length, 0);
  grid.addEventListener('pointerdown', (event) => {
    const pad = event.target.closest('.is-editing .wall-paper');
    if (!pad || busy || pointer !== undefined || event.button !== 0 || strokes.length >= paper.strokes ||
        measure(strokes) + paper.lift > paper.ink || pointsUsed() >= paper.points) return;
    if (document.activeElement === nameInput) nameInput.blur();
    drawingBox = pad.querySelector('svg').getBoundingClientRect();
    pointer = event.pointerId;
    pad.setPointerCapture(pointer);
    strokes.push([paperPoint(event.clientX, event.clientY, drawingBox)]);
    paintInk();
  });
  grid.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer || pointsUsed() >= paper.points) return;
    if (extend(strokes.at(-1), paperPoint(event.clientX, event.clientY, drawingBox), paper.ink - measure(strokes))) paintInk();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    grid.addEventListener(event, (e) => { if (e.pointerId === pointer) pointer = undefined; });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || slot === undefined || !strokes.length) return;
    const name = nameInput.value.trim();
    if (!name) {
      feedback.textContent = 'Enter your name before signing.';
      nameInput.focus();
      return;
    }
    busy = true;
    paintInk();
    feedback.textContent = 'Saving your signature…';
    try {
      const entry = await signingStore.sign(slot, name, strokes);
      ++requestId;
      entries.set(entry.slot, entry);
      endDraft();
      notice.textContent = 'Your signature is on the wall.';
      grid.querySelector('[data-slot="' + entry.slot + '"]')?.scrollIntoView({ block: 'nearest' });
    } catch (error) {
      if (error.code !== '23505') {
        feedback.textContent = 'Couldn’t save. Your draft is still here.';
      } else if (await refresh()) {
        const next = Array.from({ length: slots }, (_, index) => index).find((index) => !entries.has(index));
        busy = false;
        if (next === undefined) {
          slot = undefined;
          feedback.textContent = 'The last square was taken. The wall is full.';
        } else {
          choose(next);
          feedback.textContent = 'That square was taken. Your draft moved to a free square. Save again to confirm.';
        }
      } else feedback.textContent = 'That square was taken. Try again when the wall reconnects.';
    } finally {
      busy = false;
      paintBoard();
      paintInk();
    }
  });

  ownerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    try {
      token = await signingStore.login(ownerForm.elements.email.value, ownerForm.elements.password.value);
      ownerForm.hidden = true;
      notice.textContent = 'Moderation on. Choose a signature to delete.';
    } catch {
      find('.wall-owner-status').textContent = 'Couldn’t sign in with that owner account.';
    } finally {
      ownerForm.elements.password.value = '';
      busy = false;
      paintBoard();
      paintInk();
    }
  });

  async function removeSignature(id) {
    if (!token || busy) return;
    if (confirmed !== id) {
      confirmed = id;
      paintBoard();
      grid.querySelector('[data-remove-id="' + id + '"]')?.focus({ preventScroll: true });
      return;
    }
    busy = true;
    paintBoard();
    try {
      await signingStore.remove(id, token);
      ++requestId;
      for (const [cell, entry] of entries) if (entry.id === id) entries.delete(cell);
      notice.textContent = 'Signature deleted. Its square is available.';
    } catch {
      notice.textContent = 'Couldn’t delete. Refresh the wall or sign in again.';
    } finally {
      confirmed = undefined;
      busy = false;
      paintBoard();
    }
  }

  section.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.slot !== undefined) choose(Number(target.dataset.slot));
    if (target.dataset.removeId) void removeSignature(target.dataset.removeId);
    const command = target.dataset.wallAction;
    if (command === 'more') {
      const next = shown;
      shown = Math.min(slots, shown + rowBatch);
      paintBoard();
      grid.querySelector('[data-slot="' + next + '"]')?.scrollIntoView({ block: 'nearest' });
    } else if (command === 'refresh') void refresh();
    else if (command === 'undo' || command === 'clear') {
      if (command === 'undo') strokes.pop();
      else strokes = [];
      pointer = undefined;
      paintInk();
    } else if (command === 'cancel') {
      const previous = slot;
      endDraft();
      paintBoard();
      grid.querySelector('button[data-slot="' + previous + '"]')?.focus({ preventScroll: true });
    } else if (command === 'owner') {
      if (token) {
        token = confirmed = undefined;
        notice.textContent = 'Signed out of moderation.';
      } else {
        ownerForm.hidden = !ownerForm.hidden;
        find('.wall-owner-status').textContent = '';
        if (!ownerForm.hidden) ownerForm.elements.email.focus();
      }
      paintBoard();
    }
  });

  paintBoard();
  notice.textContent = signingConfigured ? 'Loading the wall…' : 'The shared wall is awaiting setup.';
  if (signingConfigured) {
    const root = document.documentElement;
    const loadIfReady = () => {
      if (nearWall && !root.classList.contains('is-building') && !busy && slot === undefined) void refresh();
    };
    new IntersectionObserver(([entry]) => {
      nearWall = entry.isIntersecting;
      loadIfReady();
    }).observe(section);
    new MutationObserver(loadIfReady).observe(root, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('focus', loadIfReady);
  }
}
