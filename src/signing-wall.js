import { extend, measure, paper, paperPoint, renderInk, slots } from './signing-ink.js';
import { signingConfigured, signingStore } from './signing-store.js';
import './signing-wall.css';

const sheetSize = 12;
const sheets = slots / sheetSize;
const svgMarkup = '<svg viewBox="0 0 320 180" aria-hidden="true"></svg>';
const slotLabel = (slot) => String(slot + 1).padStart(3, '0');

export const signingWall = `
  <div class="signing-wall" data-part="frame" data-build-static>
    <div class="wall-legend"><span>Guestbook</span><span class="wall-count">— / ${slots} signed</span></div>
    <div class="wall-grid" aria-label="Signature squares"></div>
    <div class="wall-foot">
      <p class="wall-status" role="status"></p>
      <nav class="wall-pager" aria-label="Signature sheets">
        <button type="button" data-wall-action="previous" aria-label="Previous sheet">←</button>
        <span class="wall-sheet" aria-live="polite"></span>
        <button type="button" data-wall-action="next" aria-label="Next sheet">→</button>
      </nav>
      <button type="button" class="wall-moderate" data-wall-action="owner">Moderate</button>
      <button type="button" data-wall-action="refresh" hidden>Retry</button>
    </div>
  </div>
  <dialog class="signing-dialog" aria-labelledby="wall-dialog-title">
    <header>
      <h3 id="wall-dialog-title"></h3>
      <button type="button" data-wall-action="close" aria-label="Close signature panel">×</button>
    </header>
    <form class="wall-sign-form" hidden>
      <label>Your name<input name="signatureName" required maxlength="40" autocomplete="name" placeholder="Name shown on the wall"></label>
      <div class="wall-paper" aria-label="Draw your signature with a mouse, stylus, or finger">${svgMarkup}</div>
      <div class="wall-ink"><progress max="${paper.ink}" value="${paper.ink}" aria-label="Ink remaining"></progress><span class="wall-ink-count">100% ink</span></div>
      <div class="wall-tools">
        <button type="button" data-wall-action="undo">Undo</button>
        <button type="button" data-wall-action="clear">Clear</button>
        <button type="submit" class="wall-primary">Sign the wall</button>
      </div>
    </form>
    <form class="wall-owner-form" hidden>
      <label>Owner email<input name="email" type="email" required autocomplete="username"></label>
      <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
      <button type="submit" class="wall-primary">Sign in</button>
    </form>
    <div class="wall-view" hidden>
      <div class="wall-paper">${svgMarkup}</div>
      <button type="button" class="wall-remove" data-wall-action="remove" hidden>Delete signature</button>
    </div>
    <p class="wall-dialog-status" role="status"></p>
  </dialog>`;

export function mountSigningWall(section, store = signingStore, configured = signingConfigured) {
  const find = (selector) => section.querySelector(selector);
  const action = (name) => find('[data-wall-action="' + name + '"]');
  const grid = find('.wall-grid');
  const dialog = find('.signing-dialog');
  const title = find('#wall-dialog-title');
  const signForm = find('.wall-sign-form');
  const ownerForm = find('.wall-owner-form');
  const viewer = find('.wall-view');
  const notice = find('.wall-status');
  const feedback = find('.wall-dialog-status');
  const pad = signForm.querySelector('.wall-paper');
  const canvas = pad.querySelector('svg');
  const submit = signForm.querySelector('[type="submit"]');
  const nameInput = signForm.elements.signatureName;
  const entries = new Map();
  let sheet = 0;
  let available = false;
  let requestId = 0;
  let token;
  let slot;
  let viewed;
  let opener;
  let busy = false;
  let confirmDelete = false;
  let strokes = [];
  let pointer;
  let drawingBox;

  function paintBoard() {
    const focused = document.activeElement?.dataset.slot;
    const tiles = Array.from({ length: sheetSize }, (_, i) => {
      const cell = sheet * sheetSize + i;
      const entry = entries.get(cell);
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'wall-tile';
      tile.dataset.slot = cell;
      tile.disabled = !available && !entry;
      tile.setAttribute('aria-label', entry ? 'View signature by ' + entry.name : 'Sign square ' + slotLabel(cell));
      tile.innerHTML = '<span class="wall-slot-number"></span>' + (entry ? svgMarkup : '<span class="wall-plus" aria-hidden="true">+</span>') +
        '<span class="wall-signer"></span>';
      tile.querySelector('.wall-slot-number').textContent = slotLabel(cell);
      tile.querySelector('.wall-signer').textContent = entry?.name ?? 'Sign here';
      if (entry) {
        tile.classList.add('is-signed');
        renderInk(tile.querySelector('svg'), entry.strokes);
      }
      return tile;
    });
    grid.replaceChildren(...tiles);
    if (focused !== undefined) grid.querySelector('[data-slot="' + focused + '"]')?.focus({ preventScroll: true });
    find('.wall-count').textContent = (available || entries.size ? entries.size : '—') + ' / ' + slots + ' signed';
    find('.wall-sheet').textContent = (sheet + 1) + ' / ' + sheets;
    action('previous').disabled = sheet === 0;
    action('next').disabled = sheet === sheets - 1;
    action('owner').disabled = !configured;
    action('owner').textContent = token ? 'Sign out' : 'Moderate';
  }

  async function refresh() {
    if (!configured) return false;
    const current = ++requestId;
    try {
      const rows = await store.list();
      if (current !== requestId) return false;
      entries.clear();
      for (const entry of rows) entries.set(entry.slot, entry);
      available = true;
      notice.textContent = entries.size === slots ? 'Every square is signed.' : 'Choose an empty square.';
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
    renderInk(canvas, strokes);
    find('.wall-ink progress').value = remaining;
    find('.wall-ink-count').textContent = remaining < 2 ? 'Out of ink' : Math.ceil(remaining / paper.ink * 100) + '% ink';
    submit.disabled = busy || !strokes.length || slot === undefined;
    action('undo').disabled = busy || !strokes.length;
    action('clear').disabled = busy || !strokes.length;
  }

  function open(panel, heading, trigger) {
    opener = trigger;
    feedback.textContent = '';
    title.textContent = heading;
    signForm.hidden = panel !== signForm;
    ownerForm.hidden = panel !== ownerForm;
    viewer.hidden = panel !== viewer;
    dialog.showModal();
    if (panel === ownerForm) ownerForm.elements.email.focus({ preventScroll: true });
  }

  function setBusy(value) {
    busy = value;
    action('close').disabled = value;
    action('remove').disabled = value;
    ownerForm.querySelector('[type="submit"]').disabled = value;
    paintInk();
  }

  pad.addEventListener('pointerdown', (event) => {
    if (busy || pointer !== undefined || event.button !== 0 ||
        strokes.length >= paper.strokes || measure(strokes) + paper.lift > paper.ink ||
        strokes.reduce((n, stroke) => n + stroke.length, 0) >= paper.points) return;
    if (document.activeElement === nameInput) nameInput.blur();
    drawingBox = canvas.getBoundingClientRect();
    pointer = event.pointerId;
    pad.setPointerCapture(pointer);
    strokes.push([paperPoint(event.clientX, event.clientY, drawingBox)]);
    paintInk();
  });
  pad.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer || strokes.reduce((n, stroke) => n + stroke.length, 0) >= paper.points) return;
    if (extend(strokes.at(-1), paperPoint(event.clientX, event.clientY, drawingBox), paper.ink - measure(strokes))) paintInk();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    pad.addEventListener(event, (e) => { if (e.pointerId === pointer) pointer = undefined; });
  }

  grid.addEventListener('click', (event) => {
    const tile = event.target.closest('[data-slot]');
    if (!tile) return;
    slot = Number(tile.dataset.slot);
    viewed = entries.get(slot);
    if (viewed) {
      renderInk(viewer.querySelector('svg'), viewed.strokes);
      confirmDelete = false;
      action('remove').hidden = !token;
      action('remove').textContent = 'Delete signature';
      open(viewer, viewed.name, tile);
    } else if (available) {
      strokes = [];
      signForm.reset();
      paintInk();
      open(signForm, 'Sign square ' + slotLabel(slot), tile);
    }
  });

  signForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || slot === undefined || !strokes.length) return;
    const name = nameInput.value.trim();
    if (!name) {
      feedback.textContent = 'Enter your name before signing.';
      nameInput.focus();
      return;
    }
    feedback.textContent = 'Saving your signature…';
    setBusy(true);
    try {
      const entry = await store.sign(slot, name, strokes);
      ++requestId;
      entries.set(entry.slot, entry);
      paintBoard();
      notice.textContent = 'Your signature is on the wall.';
      dialog.close();
    } catch (error) {
      if (error.code !== '23505') {
        feedback.textContent = 'Couldn’t save your signature. Your draft is still here.';
      } else if (await refresh()) {
        slot = Array.from({ length: slots }, (_, index) => index).find((index) => !entries.has(index));
        if (slot === undefined) feedback.textContent = 'The last square was taken. The wall is full.';
        else {
          sheet = Math.floor(slot / sheetSize);
          paintBoard();
          title.textContent = 'Sign square ' + slotLabel(slot);
          feedback.textContent = 'Someone took that square. Your draft is in a free square. Sign again to confirm.';
        }
      } else feedback.textContent = 'Someone took that square. Try again when the wall reconnects.';
    } finally {
      setBusy(false);
    }
  });

  ownerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      token = await store.login(ownerForm.elements.email.value, ownerForm.elements.password.value);
      paintBoard();
      notice.textContent = 'Moderation on. Select a signature to review it.';
      dialog.close();
    } catch {
      feedback.textContent = 'Couldn’t sign in with that owner account.';
    } finally {
      ownerForm.elements.password.value = '';
      setBusy(false);
    }
  });

  async function removeSignature() {
    if (!token || !viewed || busy) return;
    if (!confirmDelete) {
      confirmDelete = true;
      feedback.textContent = 'Delete this signature and free its square?';
      action('remove').textContent = 'Confirm deletion';
      return;
    }
    setBusy(true);
    try {
      await store.remove(viewed.id, token);
      ++requestId;
      entries.delete(viewed.slot);
      paintBoard();
      notice.textContent = 'Signature deleted. The square is available.';
      dialog.close();
    } catch {
      feedback.textContent = 'Couldn’t delete this signature. Refresh the wall or sign in again.';
    } finally {
      setBusy(false);
    }
  }

  section.addEventListener('click', (event) => {
    const command = event.target.closest('[data-wall-action]')?.dataset.wallAction;
    if (command === 'previous' || command === 'next') {
      sheet += command === 'next' ? 1 : -1;
      paintBoard();
    } else if (command === 'refresh') void refresh();
    else if (command === 'undo' || command === 'clear') {
      if (command === 'undo') strokes.pop();
      else strokes = [];
      pointer = undefined;
      paintInk();
    } else if (command === 'owner') {
      if (token) {
        token = undefined;
        paintBoard();
        notice.textContent = 'Signed out of moderation.';
      } else open(ownerForm, 'Wall moderation', action('owner'));
    } else if (command === 'remove') void removeSignature();
    else if (command === 'close' && !busy) dialog.close();
  });
  dialog.addEventListener('cancel', (event) => { if (busy) event.preventDefault(); });
  dialog.addEventListener('close', () => {
    pointer = undefined;
    const cell = opener?.dataset.slot;
    if (cell !== undefined) grid.querySelector('[data-slot="' + cell + '"]')?.focus({ preventScroll: true });
    else opener?.focus({ preventScroll: true });
  });

  paintBoard();
  notice.textContent = configured ? 'Loading the wall…' : 'The shared wall is awaiting setup.';
  if (configured) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void refresh();
    });
    observer.observe(section);
    window.addEventListener('focus', () => { if (!busy) void refresh(); });
  }
}
