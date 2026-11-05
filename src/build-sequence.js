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
];
const viewportWidth = () => document.documentElement.clientWidth;
const pageTop = (node) => node.getBoundingClientRect().top + scrollY;
const rush = (t) => { t = clamp(t); return t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; };

function worker(layer, role) {
  const outline = document.createElement('div');
  outline.className = 'build-selection';
  outline.style.setProperty('--worker', role.color);
  outline.hidden = true;
  const node = document.createElement('div');
  node.className = 'build-worker';
  node.style.setProperty('--worker', role.color);
  node.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 1 21 14l-8 .8-3.5 7Z" fill="currentColor" stroke="#171717" stroke-width="1.15" stroke-linejoin="round"/></svg><span>' + role.name + '</span>';
  layer.append(outline, node);
  return {
    role, outline, x: -110, y: innerHeight * role.station[1],
    put(x, y, holding = false) {
      this.x = x;
      this.y = y;
      node.classList.toggle('is-grabbing', holding);
      node.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
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

function prepare(scene) {
  const selector = '[data-part], .portrait, .chapter-label';
  const pieces = [...scene.querySelectorAll(selector)].filter((target) => !target.parentElement.closest(selector));
  return pieces.map((target) => {
    const part = target.dataset.part;
    const lane = part === 'link' || target.matches('details, .contact-mail') ? 2
      : part === 'type' || part === 'copy' || target.matches('.chapter-label, .timeline-year, .about-copy') ? 0 : 1;
    if (getComputedStyle(target).display === 'inline') target.classList.add('build-inline');
    target.classList.add('build-piece');
    target.dataset.buildState = 'waiting';
    return { target, lane, x: 0, y: 0, source: null };
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
  actor.put(clamp(cursorX, 7, width - 91), clamp(cursorY, 9, height - 62), t > .27 && t < .87);

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
  actor.put(
    mix(from.x, viewportWidth() * x, rush(t)) + swing * (lane === 1 ? -54 : 50),
    mix(from.y, innerHeight * y, ease(t)) - swing * 42,
  );
}

function groupByView(scene, pieces) {
  if (scene.id === 'home') return [{ top: pageTop(scene), pieces }];
  const top = pageTop(scene);
  const height = innerHeight * .66;
  const batches = new Map();
  for (const piece of pieces) {
    const band = Math.max(0, Math.floor((pageTop(piece.target) - top) / height));
    if (!batches.has(band)) batches.set(band, []);
    batches.get(band).push(piece);
  }
  return [...batches.entries()].sort(([a], [b]) => a - b)
    .map(([band, items]) => ({ top: Math.round(top + band * height - innerHeight * .07), pieces: items }));
}

function balanceJobs(lanes) {
  // Share real layout pieces when a scene has more copy than media or links.
  // Keep at least one job in its original lane so each cursor still has a role.
  for (;;) {
    const ordered = [...lanes].sort((a, b) => a.items.length - b.items.length);
    const [available, , busiest] = ordered;
    if (busiest.items.length - available.items.length < 2) return;
    available.items.push(busiest.items.pop());
  }
}

async function assemble(batch, actors, signal, hero, clock) {
  const lanes = actors.map((actor, index) => ({
    actor, items: batch.pieces.filter((piece) => piece.lane === index),
    from: { x: actor.x, y: actor.y }, last: -1,
  }));
  if (!hero) balanceJobs(lanes);
  const speed = hero ? [1370, 1850, 620] : [930, 1030, 530];
  const duration = Math.max(1200, ...lanes.map(({items}, lane) => items.length * speed[lane]));
  await animate(duration, (p) => {
    lanes.forEach((lane, index) => {
      const { items, actor } = lane;
      if (!items.length) return restRoute(actor, lane.from, p, index);
      const step = p * items.length;
      const current = Math.min(items.length - 1, Math.floor(step));
      if (current !== lane.last) {
        items.slice(Math.max(0, lane.last), current).forEach(place);
        lane.last = current;
      }
      grab(actor, items[current], step - current, current);
    });
  }, signal, clock);
  if (!signal.aborted) batch.pieces.forEach(place);
  actors.forEach((actor) => { actor.outline.hidden = true; });
}

async function drawSmiley(layer, actors, signal) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('build-smiley');
  svg.setAttribute('viewBox', '0 0 200 200');
  const strokes = ['M66 64 Q62 72 66 80', 'M134 64 Q138 72 134 80', 'M48 115 Q100 168 152 115'];
  const paths = strokes.map((stroke) => {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', stroke);
    svg.append(path);
    return path;
  });
  layer.append(svg);
  const lengths = paths.map((path) => path.getTotalLength());
  paths.forEach((path, index) => {
    path.style.strokeDasharray = lengths[index];
    path.style.strokeDashoffset = lengths[index];
    path.style.visibility = 'hidden';
  });
  const origins = actors.map(({x, y}) => ({x, y}));
  await animate(1800, (t) => {
    layer.style.backgroundColor = 'color-mix(in srgb, var(--ink) ' + 88 * ease(t * 4) + '%, transparent)';
    const box = svg.getBoundingClientRect();
    actors.forEach((actor, index) => {
      const start = [.28, .34, .43][index];
      const end = [.62, .70, 1][index];
      const progress = ease((t - start) / (end - start));
      const point = paths[index].getPointAtLength(lengths[index] * progress);
      const x = box.left + point.x * box.width / 200;
      const y = box.top + point.y * box.height / 200;
      paths[index].style.strokeDashoffset = lengths[index] * (1 - progress);
      paths[index].style.visibility = t > start ? 'visible' : 'hidden';
      const approach = ease(t / start);
      const leave = index === 2 ? 0 : ease((t - end) / .2);
      actor.put(
        mix(mix(origins[index].x, x, approach), viewportWidth() * (index === 0 ? .14 : .67), leave),
        mix(mix(origins[index].y, y, approach), box.top - 32, leave),
        t >= start && t < end,
      );
    });
  }, signal);
  if (!signal.aborted) await animate(600, () => {}, signal);
}

export function createBuildSequence(portfolio, preference) {
  let completed = false;
  let state;
  const home = () => Math.ceil(pageTop(portfolio));

  function finish(toHome = false, focus = false) {
    if (!state) return;
    const { pieces, layer, controls, cleanup } = state;
    cleanup.abort();
    state = undefined;
    completed = true;
    for (const { target } of pieces) {
      target.classList.remove('build-piece', 'build-inline');
      delete target.dataset.buildState;
      for (const key of ['--piece-x', '--piece-y', '--piece-opacity']) target.style.removeProperty(key);
    }
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
    const scenes = [...portfolio.querySelectorAll('[data-scene]')].map((scene) => ({ scene, pieces: prepare(scene) }));
    state = { pieces: scenes.flatMap(({pieces}) => pieces), layer, controls, cleanup };
    const actors = roles.map((role) => worker(layer, role));
    document.documentElement.classList.add('is-building');
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
    skip.addEventListener('click', () => finish(true, true), { signal });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') finish(true, true);
    }, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) finish(true); }, { signal });
    preference.addEventListener('change', () => { if (preference.matches) finish(true); }, { signal });

    try {
      for (const { scene, pieces } of scenes) {
        if (signal.aborted) return;
        for (const batch of groupByView(scene, pieces)) {
          const from = scrollY;
          const target = clamp(batch.top, home(), document.documentElement.scrollHeight - innerHeight);
          if (Math.abs(target - from) > 8) {
            const origins = actors.map(({x, y}) => ({x, y}));
            await animate(clamp(Math.abs(target - from) * .78, 500, 1150), (t) => {
              scrollTo(0, mix(from, target, ease(t)));
              actors.forEach((actor, lane) => restRoute(actor, origins[lane], t, lane));
            }, signal, clock);
          }
          if (signal.aborted) return;
          await assemble(batch, actors, signal, scene.id === 'home', clock);
        }
      }
      if (signal.aborted) return;
      constructing = false;
      clearTimeout(hintTimer);
      boost.disabled = true;
      boost.classList.add('is-finished');
      await drawSmiley(layer, actors, signal);
      if (signal.aborted) return;
      const smiley = layer.querySelector('.build-smiley');
      const from = scrollY;
      const origins = actors.map(({x, y}) => ({x, y}));
      await animate(1500, (t) => {
        smiley.style.opacity = 1 - ease(t * 2);
        layer.style.backgroundColor = 'color-mix(in srgb, var(--ink) ' + 88 * (1 - ease(t * 2)) + '%, transparent)';
        scrollTo(0, mix(from, home(), ease(t)));
        actors.forEach((actor, lane) => restRoute(actor, origins[lane], t, lane));
      }, signal);
      if (signal.aborted) return;
      const exits = actors.map(({x, y}) => ({x, y}));
      await animate(600, (t) => {
        actors.forEach((actor, index) => {
          const p = rush((t - index * .08) / .84);
          actor.put(mix(exits[index].x, index === 0 ? -130 : viewportWidth() + 40, p),
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
