import { extend, measure, overlaps, paper, paperPoint, renderInk, renderMark, wallBounds } from './signing-ink.js';
import { signingConfigured, signingStore } from './signing-store.js';
import { track } from './portfolio-analytics.js';
import './signing-wall.css';

const visitorKey = 'portfolio.wall.visitor.v1';
const signedKey = 'portfolio.wall.signed.v1';
const signedMessage = 'You’ve already signed. The same wall carries across both editions.';

function getVisitor() {
  try {
    let id = localStorage.getItem(visitorKey);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(visitorKey, id);
    }
    return { id, signed: localStorage.getItem(signedKey) === id };
  } catch {
    return { id: null, signed: false };
  }
}

export const signingWall = `
  <div class="signing-wall" data-part="frame" data-build-static>
    <form class="wall-controls">
      <label>Your name<input name="signatureName" required maxlength="40" autocomplete="name" placeholder="Shown below your signature"></label>
      <div class="wall-ink"><progress max="${paper.ink}" value="${paper.ink}" aria-label="Ink remaining"></progress><span class="wall-ink-count">100% ink</span></div>
      <div class="wall-tools">
        <button type="button" data-wall-action="pan" aria-pressed="false">Pan the wall</button>
        <button type="button" data-wall-action="undo">Undo</button>
        <button type="button" data-wall-action="clear">Clear</button>
        <button type="submit" class="wall-primary">Sign the wall</button>
      </div>
    </form>
    <p class="wall-signed-note" role="status" hidden></p>
    <div class="wall-viewport" tabindex="0" aria-label="Scrollable signature wall">
      <svg class="wall-board" aria-label="Draw a signature anywhere on the wall" xmlns="http://www.w3.org/2000/svg">
        <g class="wall-saved"></g><g class="wall-draft"></g>
      </svg>
    </div>
    <div class="wall-foot">
      <p class="wall-status" role="status"></p>
      <span class="wall-count"></span>
      <button type="button" data-wall-action="extend">More wall space ↓</button>
      <button type="button" data-wall-action="refresh" hidden>Retry</button>
    </div>
  </div>`;

export function mountSigningWall(section) {
  const find = (selector) => section.querySelector(selector);
  const button = (name) => find('[data-wall-action="' + name + '"]');
  const viewport = find('.wall-viewport');
  const board = find('.wall-board');
  const saved = find('.wall-saved');
  const draft = find('.wall-draft');
  const form = find('.wall-controls');
  const nameInput = form.elements.signatureName;
  const notice = find('.wall-status');
  const signedNote = find('.wall-signed-note');
  const submit = form.querySelector('[type="submit"]');
  const visitor = getVisitor();
  let marks = [];
  let strokes = [];
  let height = 1200;
  let ready = false;
  let busy = false;
  let pan = false;
  let near = false;
  let requestId = 0;
  let pointer;
  let blocked = false;

  function lockSigning(remember = true) {
    visitor.signed = true;
    pointer = undefined;
    strokes = [];
    form.reset();
    if (remember) {
      try { localStorage.setItem(signedKey, visitor.id); } catch { /* The database still has the visitor ID. */ }
    }
    paintDraft();
  }

  function setHeight(next) {
    height = Math.min(paper.height, Math.max(height, next));
    board.setAttribute('viewBox', '0 0 ' + paper.width + ' ' + height);
    button('extend').hidden = height === paper.height;
  }

  function paintSaved() {
    const groups = marks.map((entry) => {
      const group = document.createElementNS(board.namespaceURI, 'g');
      group.dataset.mark = entry.id;
      renderMark(group, entry);
      return group;
    });
    saved.replaceChildren(...groups);
    find('.wall-count').textContent = marks.length + (marks.length === 1 ? ' signature' : ' signatures');
    setHeight(Math.max(1200, ...marks.map(({bounds}) => bounds[3] + 150)));
  }

  function collides() {
    if (!strokes.length) return false;
    const bounds = wallBounds(strokes, nameInput.value.trim());
    return marks.some((mark) => overlaps(bounds, mark.bounds));
  }

  function paintDraft() {
    if (strokes.length) {
      const name = nameInput.value.trim();
      if (name) renderMark(draft, { name, strokes, bounds: wallBounds(strokes, name) });
      else renderInk(draft, strokes);
    } else draft.replaceChildren();
    const remaining = Math.max(0, paper.ink - measure(strokes));
    find('progress').value = remaining;
    find('.wall-ink-count').textContent = remaining < 2 ? 'Out of ink' : Math.ceil(remaining / paper.ink * 100) + '% ink';
    const locked = visitor.signed || !visitor.id;
    nameInput.disabled = locked;
    submit.disabled = locked || busy || !ready || !strokes.length || collides();
    submit.textContent = visitor.signed ? 'Already signed' : 'Sign the wall';
    button('undo').disabled = locked || busy || !strokes.length;
    button('clear').disabled = locked || busy || !strokes.length;
    button('pan').disabled = locked;
    button('pan').textContent = locked ? 'View only' : pan ? 'Switch to draw' : 'Pan the wall';
    board.classList.toggle('is-panning', pan || locked);
    signedNote.hidden = !locked;
    signedNote.textContent = visitor.signed ? signedMessage : locked ? 'Enable site storage to sign the wall.' : '';
  }

  async function refresh() {
    if (!signingConfigured) return false;
    const current = ++requestId;
    try {
      const rows = await signingStore.list();
      if (current !== requestId) return false;
      marks = rows;
      ready = true;
      button('refresh').hidden = true;
      if (!strokes.length) notice.textContent = visitor.signed ? signedMessage
        : 'Draw anywhere there’s room. Your name goes below your mark.';
      paintSaved();
    } catch {
      if (current !== requestId) return false;
      ready = false;
      notice.textContent = 'The wall couldn’t load. Try again.';
      button('refresh').hidden = false;
    }
    paintDraft();
    return ready;
  }

  const point = (event, bounds) => paperPoint(event.clientX, event.clientY, bounds, height);
  const pointsUsed = () => strokes.reduce((count, stroke) => count + stroke.length, 0);

  board.addEventListener('pointerdown', (event) => {
    if (!visitor.id || visitor.signed || !ready || pan || busy || pointer !== undefined || event.button !== 0 ||
        strokes.length >= paper.strokes || measure(strokes) + paper.lift > paper.ink || pointsUsed() >= paper.points) return;
    if (document.activeElement === nameInput) nameInput.blur();
    strokes.push([point(event, board.getBoundingClientRect())]);
    if (collides()) {
      strokes.pop();
      notice.textContent = 'That area is taken. Try a clear spot.';
      return;
    }
    event.preventDefault();
    pointer = event.pointerId;
    blocked = false;
    board.setPointerCapture(pointer);
    track('wall', 'started');
    notice.textContent = 'Your ink stays on this wall after you sign.';
    paintDraft();
  });

  board.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer || blocked || pointsUsed() >= paper.points) return;
    const samples = event.getCoalescedEvents?.() ?? [];
    const bounds = board.getBoundingClientRect();
    const stroke = strokes.at(-1);
    let changed = false;
    for (const sample of samples.length ? samples : [event]) {
      if (pointsUsed() >= paper.points) break;
      if (!extend(stroke, point(sample, bounds), paper.ink - measure(strokes))) continue;
      if (collides()) {
        stroke.pop();
        blocked = true;
        notice.textContent = 'You reached another signature. Lift your pen and leave some space.';
        break;
      }
      changed = true;
    }
    if (changed) paintDraft();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    board.addEventListener(event, (e) => { if (e.pointerId === pointer) pointer = undefined; });
  }

  nameInput.addEventListener('input', () => {
    if (collides()) notice.textContent = 'Your name needs a little more room. Clear some space or shorten it.';
    else if (strokes.length) notice.textContent = 'Your name will appear below your mark.';
    paintDraft();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!visitor.id || visitor.signed || !ready || busy || !strokes.length) return;
    if (!name) {
      notice.textContent = 'Enter your name before signing.';
      nameInput.focus();
      return;
    }
    if (collides()) {
      notice.textContent = 'Your signature needs a clear spot.';
      return;
    }
    busy = true;
    pointer = undefined;
    paintDraft();
    notice.textContent = 'Saving your signature…';
    try {
      const entry = await signingStore.sign(name, strokes, visitor.id);
      track('signed', entry.id);
      ++requestId;
      marks.push(entry);
      lockSigning();
      paintSaved();
      notice.textContent = 'Your signature is on the wall.';
    } catch (error) {
      if (error.code === '23505') {
        lockSigning();
        await refresh();
      } else if (error.code === '23P01') {
        await refresh();
        notice.textContent = 'Someone signed there first. Clear your draft and find another spot.';
      } else notice.textContent = 'Couldn’t save. Your draft is still here.';
    } finally {
      busy = false;
      paintDraft();
    }
  });

  section.addEventListener('click', (event) => {
    const action = event.target.closest('[data-wall-action]')?.dataset.wallAction;
    if (action === 'undo' || action === 'clear') {
      if (action === 'undo') strokes.pop();
      else strokes = [];
      pointer = undefined;
      notice.textContent = 'Draw anywhere there’s room.';
      paintDraft();
    } else if (action === 'pan') {
      pan = !pan;
      pointer = undefined;
      board.classList.toggle('is-panning', pan);
      button('pan').setAttribute('aria-pressed', String(pan));
      button('pan').textContent = pan ? 'Switch to draw' : 'Pan the wall';
      notice.textContent = pan ? 'Pan to a clear spot, then switch to draw.' : 'Draw anywhere there’s room.';
    } else if (action === 'extend') {
      const previous = height;
      setHeight(height + 700);
      viewport.scrollTop = previous / paper.width * board.getBoundingClientRect().width - 70;
    } else if (action === 'refresh') void refresh();
  });

  window.addEventListener('storage', (event) => {
    if (event.key === signedKey && visitor.id && event.newValue === visitor.id && !visitor.signed) {
      lockSigning(false);
      if (near) void refresh();
    }
  });
  setHeight(height);
  paintDraft();
  notice.textContent = signingConfigured ? 'Loading the wall…' : 'The shared wall is awaiting setup.';
  if (signingConfigured) {
    const root = document.documentElement;
    const loadIfReady = () => {
      if (near && !root.classList.contains('is-building') && !busy && !strokes.length) void refresh();
    };
    new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      loadIfReady();
    }).observe(section);
    new MutationObserver(loadIfReady).observe(root, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('focus', loadIfReady);
  }
}
