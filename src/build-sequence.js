import { createTyping } from './build-typing.js';
import { createSignature } from './build-signature.js';

const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
function animate(duration, render, signal, clock) {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let previous;
    let elapsed = 0;
    let frame;
    function settle() {
      cancelAnimationFrame(frame);
      signal.removeEventListener('abort', settle);
      resolve();
    }
    function step(now) {
      previous ??= now;
      const delta = now - previous;
      const boosted = clock ? Math.max(0, Math.min(now, clock.boostUntil) - previous) : 0;
      elapsed += delta + boosted * 1.5;
      previous = now;
      const t = clamp(elapsed / duration);
      try {
        render(t);
      } catch (error) {
        signal.removeEventListener('abort', settle);
        reject(error);
        return;
      }
      if (t < 1) frame = requestAnimationFrame(step);
      else settle();
    }
    signal.addEventListener('abort', settle, { once: true });
    frame = requestAnimationFrame(step);
  });
}

const roles = [
  { name: 'ChatGPT', color: '#d9f959', station: [.14, .29], delay: .02, arc: -32 },
  { name: 'Claude', color: '#fbb8dc', station: [.68, .65], delay: .1, arc: 42 },
  { name: 'Grok', color: '#95d5ff', station: [.70, .16], delay: 0, arc: -20 },
  { name: 'me!!', color: '#ffab73', station: [.38, .52], delay: .05, arc: 28 },
  { name: 'Gemini', color: '#c6b2ff', station: [.36, .14], delay: .08, arc: -45 },
];
const viewportWidth = () => document.documentElement.clientWidth;
const pageTop = (node) => node.getBoundingClientRect().top + scrollY;
const rush = (t) => { t = clamp(t); return t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; };
const clickTime = 145;

function worker(layer, role) {
  const outline = document.createElement('div');
  outline.className = 'build-selection';
  outline.style.setProperty('--worker', role.color);
  outline.hidden = true;
  const node = document.createElement('div');
  node.className = 'build-worker';
  node.style.setProperty('--worker', role.color);
  node.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 1 21 14l-8 .8-3.5 7Z" fill="currentColor" stroke="#171717" stroke-width="1.15" stroke-linejoin="round"/></svg><span>' + role.name + '</span>';
  const caret = document.createElement('div');
  caret.className = 'build-caret';
  caret.style.setProperty('--worker', role.color);
  caret.hidden = true;
  const typo = document.createElement('span');
  caret.append(typo);
  layer.append(outline, caret, node);
  return {
    role, outline, caret, typo, x: -110, y: innerHeight * role.station[1],
    put(x, y, holding = false) {
      this.x = x;
      this.y = y;
      node.classList.toggle('is-grabbing', holding);
      node.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    },
    hover(x, y, holding = false) {
      this.put(clamp(x, 7, viewportWidth() - 86), clamp(y, 9, innerHeight - 70), holding);
    },
    select(rect, x, y, opacity) {
      const left = clamp(rect.left + x - 6, 0, viewportWidth());
      const right = clamp(rect.right + x + 6, 0, viewportWidth());
      const top = clamp(rect.top + y - 5, 0, innerHeight);
      const bottom = clamp(rect.bottom + y + 5, 0, innerHeight);
      outline.hidden = opacity <= 0 || right <= left || bottom <= top;
      if (outline.hidden) return;
      outline.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
      outline.style.width = right - left + 'px';
      outline.style.height = bottom - top + 'px';
      outline.style.opacity = opacity;
    },
  };
}

function prepare(scene, typing) {
  const selector = '[data-part], .portrait, .chapter-label';
  const pieces = [...scene.querySelectorAll(selector)].filter((target) => !target.parentElement.closest(selector));
  return pieces.map((target) => {
    const part = target.dataset.part;
    const lane = part === 'link' || target.matches('details, .contact-mail') ? 2
      : part === 'type' || part === 'copy' || target.matches('.chapter-label, .timeline-year, .about-copy') ? 0 : 1;
    target.classList.add('build-piece');
    target.dataset.buildState = 'waiting';
    const tracks = typing.prepare(target);
    const placement = target.matches('.portrait') ? 1250 : part === 'box' ? 850 : 510;
    return {
      target, lane, x: 0, y: 0, source: null, tracks, placement,
      duration: placement + tracks.reduce((total, track) => total + track.duration + clickTime, 0),
    };
  });
}

function offset(piece, x, y, opacity) {
  piece.x = x;
  piece.y = y;
  piece.target.style.setProperty('--piece-x', x + 'px');
  piece.target.style.setProperty('--piece-y', y + 'px');
  piece.target.style.setProperty('--piece-opacity', opacity);
}

function place(piece) {
  offset(piece, 0, 0, 1);
  piece.target.dataset.buildState = 'placed';
}

function pieceRect(piece) {
  const rect = piece.target.getBoundingClientRect();
  return {
    left: rect.left - piece.x, right: rect.right - piece.x,
    top: rect.top - piece.y, bottom: rect.bottom - piece.y,
    width: rect.width, height: rect.height,
  };
}

function grab(actor, piece, time, index) {
  const delay = actor.role.delay + (index % 2) * .035;
  const t = clamp((time - delay) / (1 - delay));
  const rect = pieceRect(piece);
  const width = viewportWidth();
  const height = innerHeight;
  const portrait = piece.target.matches('.portrait');
  const timeline = piece.target.closest('.timeline-year');
  if (!piece.source) {
    const room = Math.max(0, width - rect.right - 24);
    const year = timeline && piece.target.matches('strong');
    const distance = year ? 19 : width * (piece.lane === 2 ? .16 : .12);
    piece.source = {
      x: portrait ? Math.min(180, width * .15) : Math.min(room, distance),
      // Timeline text has dedicated baselines. Drag along each line so nearby
      // entries cannot travel through each other.
      y: timeline ? 0 : Math.min(portrait ? 105 : 78, height * .12),
      actorX: actor.x, actorY: actor.y,
    };
  }
  const source = piece.source;
  const lift = ease((t - .20) / .12);
  const travel = rush((t - .33) / .52);
  const arc = timeline ? 0 : Math.sin(travel * Math.PI) * Math.min(36, height * .06);
  const x = source.x * (1 - travel);
  const y = source.y * (1 - travel) - arc;
  const anchorX = rect.left + Math.min(rect.width * (portrait ? .34 : .20), 120);
  const anchorY = rect.top + Math.min(rect.height * (portrait ? .50 : .36), portrait ? 230 : 64);
  const approach = ease(t / .28);
  const release = ease((t - .87) / .13);
  const swoop = Math.sin(approach * Math.PI) * actor.role.arc;
  const cursorX = mix(mix(source.actorX, anchorX + x, approach) + swoop * .58, anchorX + 26, release);
  const cursorY = mix(mix(source.actorY, anchorY + y, approach) + swoop, anchorY + 22, release);
  actor.hover(cursorX, cursorY, t > .27 && t < .87);

  if (t >= .20) {
    piece.target.dataset.buildState = t >= .87 ? 'placed' : 'dragging';
    offset(piece, x, y, lift);
  }
  actor.select(rect, x, y, lift * (1 - release));
}

function restRoute(actor, from, t, lane) {
  const [x, y] = actor.role.station;
  const swing = Math.sin(Math.PI * t);
  actor.outline.hidden = true;
  actor.hover(
    mix(from.x, viewportWidth() * x, rush(t)) + swing * (lane === 1 ? -54 : 50),
    mix(from.y, innerHeight * y, ease(t)) - swing * 42,
  );
}

function groupByView(scene, pieces) {
  if (scene.id === 'home') return [{ top: pageTop(scene), pieces }];
  const top = pageTop(scene);
  const height = innerHeight * .66;
  const batches = new Map();
  let firstPhoto;
  for (const piece of pieces) {
    const position = pageTop(piece.target);
    const band = Math.max(0, Math.floor((position - top) / height));
    const photo = piece.target.closest('.win-photo');
    if (photo && (!firstPhoto || photo.offsetLeft + photo.offsetWidth - firstPhoto.offsetLeft > photo.parentElement.clientWidth)) {
      firstPhoto = photo;
    }
    const key = photo ? firstPhoto : band;
    if (!batches.has(key)) {
      const viewTop = photo ? position - innerHeight * .06 : top + band * height - innerHeight * .07;
      batches.set(key, { top: viewTop, position, photo, pieces: [] });
    }
    const batch = batches.get(key);
    if (photo) {
      const caption = photo.querySelector('figcaption');
      batch.top = Math.max(batch.top, pageTop(caption) + caption.offsetHeight - innerHeight * .83);
    }
    batch.pieces.push(piece);
  }
  return [...batches.values()].sort((a, b) => a.position - b.position);
}

function distribute(pieces, actors) {
  const queues = actors.map((actor) => ({ actor, items: [], duration: 0 }));
  const order = new Map(pieces.map((piece, index) => [piece, index]));
  const longestFirst = [...pieces].sort((a, b) => b.duration - a.duration);
  for (const piece of longestFirst) {
    const preferred = queues[piece.lane];
    const shortest = queues.reduce((best, queue) => queue.duration < best.duration ? queue : best);
    const queue = preferred.duration <= shortest.duration ? preferred : shortest;
    queue.items.push(piece);
    queue.duration += piece.duration;
  }
  queues.forEach(({items}) => items.sort((a, b) => order.get(a) - order.get(b)));
  return queues;
}

async function assemble(batch, actors, signal, clock, typing) {
  const queues = distribute(batch.pieces, actors);
  await Promise.all(queues.map(async ({actor, items}, lane) => {
    for (const [index, piece] of items.entries()) {
      await animate(piece.placement, (t) => grab(actor, piece, t, index), signal, clock);
      if (signal.aborted) return;
      place(piece);
      actor.outline.hidden = true;
      for (const track of piece.tracks) {
        const from = { x: actor.x, y: actor.y };
        const rect = track.node.parentElement.getBoundingClientRect();
        const clickX = rect.left + 5;
        const clickY = rect.top + 4;
        const perchY = rect.top > 52 ? rect.top - 40 : rect.bottom + 5;
        await animate(track.duration + clickTime, (t) => {
          const elapsed = t * (track.duration + clickTime);
          if (elapsed <= clickTime) {
            const p = ease(elapsed / clickTime);
            actor.hover(mix(from.x, clickX, p), mix(from.y, clickY, p), p > .72);
          } else {
            const stepBack = ease((elapsed - clickTime) / 190);
            actor.hover(clickX - stepBack * 8, mix(clickY, perchY, stepBack));
            typing.type(track, elapsed - clickTime, actor);
          }
        }, signal, clock);
        actor.caret.hidden = true;
        if (signal.aborted) return;
        typing.reveal(track);
      }
    }
    if (signal.aborted) return;
    const from = { x: actor.x, y: actor.y };
    await animate(items.length ? 320 : 580, (t) => restRoute(actor, from, t, lane), signal, clock);
  }));
}

async function drawSignature(layer, actors, signal) {
  const { svg, tracks } = createSignature(layer);
  const windows = [[420, 2590], [2590, 4980], [1450, 4150], [800, 2630], [2750, 4520]];
  const routes = tracks.map((track, index) => {
    const [start, end] = windows[index];
    const weight = track.reduce((sum, stroke) => sum + Math.max(18, stroke.length), 0);
    const travel = 280;
    const budget = end - start - travel * (track.length - 1);
    let next = start;
    return track.map(({path, length}) => {
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      const duration = budget * Math.max(18, length) / weight;
      const stroke = { path, length, start: next, end: next + duration };
      next = stroke.end + travel;
      return stroke;
    });
  });
  const origins = actors.map(({x, y}) => ({x, y}));
  await animate(5000, (t) => {
    layer.style.setProperty('--build-dim', ease(t * 10));
    const matrix = svg.getScreenCTM();
    const time = t * 5000;
    routes.forEach((route, index) => {
      let point = new DOMPoint(origins[index].x, origins[index].y);
      let previousEnd = Math.max(0, route[0].start - 650);
      let drawing = false;
      for (const stroke of route) {
        if (time < stroke.start) {
          const next = stroke.path.getPointAtLength(0).matrixTransform(matrix);
          const p = ease((time - previousEnd) / (stroke.start - previousEnd));
          point = new DOMPoint(mix(point.x, next.x, p), mix(point.y, next.y, p));
          break;
        }
        const progress = clamp((time - stroke.start) / (stroke.end - stroke.start));
        stroke.path.style.strokeDashoffset = stroke.length * (1 - progress);
        stroke.path.style.visibility = 'visible';
        point = stroke.path.getPointAtLength(stroke.length * progress).matrixTransform(matrix);
        if (progress < 1) {
          drawing = true;
          break;
        }
        previousEnd = stroke.end;
      }
      const finished = ease((time - route.at(-1).end) / 500);
      const [x, y] = actors[index].role.station;
      actors[index].put(mix(point.x, viewportWidth() * x, finished),
        mix(point.y, innerHeight * y, finished), drawing);
    });
  }, signal);
  if (!signal.aborted) await animate(600, () => {}, signal);
  return svg;
}

export function createBuildSequence(portfolio, preference) {
  let completed = false;
  let state;
  const home = () => Math.ceil(pageTop(portfolio));

  function revealPieces({ pieces, typing, rail }) {
    for (const { target } of pieces.splice(0)) {
      target.classList.remove('build-piece');
      delete target.dataset.buildState;
      for (const key of ['--piece-x', '--piece-y', '--piece-opacity']) target.style.removeProperty(key);
    }
    typing.dispose();
    rail.scrollLeft = 0;
  }

  function finish(toHome = false, focus = false) {
    if (!state) return;
    const { layer, controls, cleanup } = state;
    cleanup.abort();
    revealPieces(state);
    state = undefined;
    completed = true;
    document.documentElement.classList.remove('is-building');
    layer.remove();
    controls.remove();
    const revealed = document.body.classList.contains('is-revealed');
    portfolio.inert = !revealed;
    if (revealed && toHome) scrollTo(0, home());
    if (revealed && focus) portfolio.querySelector('h1').focus({ preventScroll: true });
  }

  async function start() {
    if (completed || preference.matches || state) return;
    const layer = document.createElement('div');
    layer.className = 'build-layer';
    layer.setAttribute('aria-hidden', 'true');
    const skip = document.createElement('button');
    skip.className = 'build-skip';
    skip.type = 'button';
    skip.textContent = 'Skip build';
    const controls = document.createElement('div');
    controls.className = 'build-controls';
    const boost = document.createElement('button');
    boost.className = 'build-boost';
    boost.type = 'button';
    boost.textContent = 'tap to make them work faster!!';
    boost.setAttribute('aria-description', 'Speeds up construction for two seconds. Tap again to extend.');
    boost.hidden = true;
    controls.append(boost, skip);
    const clock = { boostUntil: 0 };
    let constructing = true;
    const cleanup = new AbortController();
    const { signal } = cleanup;
    const construction = new AbortController();
    signal.addEventListener('abort', () => construction.abort(), { once: true });
    const buildSignal = construction.signal;
    const typing = createTyping();
    const rail = portfolio.querySelector('.wins-rail');
    document.documentElement.classList.add('is-building');
    const scenes = [...portfolio.querySelectorAll('[data-scene]')].map((scene) => ({ scene, pieces: prepare(scene, typing) }));
    state = { pieces: scenes.flatMap(({pieces}) => pieces), layer, controls, cleanup, typing, rail };
    const actors = roles.map((role) => worker(layer, role));
    portfolio.inert = true;
    document.body.append(layer, controls);
    const hintTimer = setTimeout(() => { boost.hidden = false; }, 1000);
    signal.addEventListener('abort', () => clearTimeout(hintTimer), { once: true });
    function speedUp() {
      if (!constructing || signal.aborted) return;
      clock.boostUntil = performance.now() + 2000;
      boost.getAnimations().forEach((animation) => animation.cancel());
      boost.animate([
        { transform: 'scale(1)', backgroundColor: '#242424' },
        { transform: 'scale(1.04)', backgroundColor: '#3b4825', offset: .35 },
        { transform: 'scale(1)', backgroundColor: '#242424' },
      ], { duration: 320 });
    }
    layer.addEventListener('click', speedUp, { signal });
    boost.addEventListener('click', speedUp, { signal });
    scrollTo(0, home());
    function beginEnding() {
      constructing = false;
      clearTimeout(hintTimer);
      boost.disabled = true;
      boost.classList.add('is-finished');
      skip.textContent = 'Skip ending';
      actors.forEach((actor) => {
        actor.caret.hidden = actor.outline.hidden = true;
      });
      revealPieces(state);
    }
    skip.addEventListener('click', () => {
      if (!constructing) {
        finish(true, true);
        return;
      }
      construction.abort();
      beginEnding();
    }, { signal });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') finish(true, true);
    }, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) finish(true); }, { signal });
    preference.addEventListener('change', () => { if (preference.matches) finish(true); }, { signal });

    try {
      constructionLoop: for (const { scene, pieces } of scenes) {
        for (const batch of groupByView(scene, pieces)) {
          if (buildSignal.aborted) break constructionLoop;
          const from = scrollY;
          const target = clamp(batch.top, home(), document.documentElement.scrollHeight - innerHeight);
          const railFrom = rail.scrollLeft;
          const railTarget = batch.photo ? Math.min(batch.photo.offsetLeft, rail.scrollWidth - rail.clientWidth) : railFrom;
          const distance = Math.max(Math.abs(target - from), Math.abs(railTarget - railFrom));
          if (distance > 8) {
            const origins = actors.map(({x, y}) => ({x, y}));
            await animate(clamp(distance * .78, 500, 1150), (t) => {
              scrollTo(0, mix(from, target, ease(t)));
              if (batch.photo) rail.scrollLeft = mix(railFrom, railTarget, ease(t));
              actors.forEach((actor, lane) => restRoute(actor, origins[lane], t, lane));
            }, buildSignal, clock);
          }
          if (buildSignal.aborted) break constructionLoop;
          await assemble(batch, actors, buildSignal, clock, typing);
        }
      }
      if (signal.aborted) return;
      if (constructing) beginEnding();
      const signature = await drawSignature(layer, actors, signal);
      if (signal.aborted) return;
      const from = scrollY;
      const origins = actors.map(({x, y}) => ({x, y}));
      await animate(1500, (t) => {
        const remaining = 1 - ease(t * 2);
        signature.style.opacity = remaining;
        layer.style.setProperty('--build-dim', remaining);
        scrollTo(0, mix(from, home(), ease(t)));
        actors.forEach((actor, lane) => restRoute(actor, origins[lane], t, lane));
      }, signal);
      if (signal.aborted) return;
      const exits = actors.map(({x, y}) => ({x, y}));
      await animate(600, (t) => {
        actors.forEach((actor, index) => {
          const p = rush((t - index * .065) / .74);
          actor.put(mix(exits[index].x, index % 2 === 0 ? -130 : viewportWidth() + 40, p),
            exits[index].y - Math.sin(p * Math.PI / 2) * 120);
        });
      }, signal);
      if (!signal.aborted) finish(true, controls.contains(document.activeElement));
    } catch (error) {
      console.error('Portfolio assembly ended early.', error);
      finish(true);
    }
  }

  return { start, stop: () => finish() };
}
