import { createTyping } from './build-typing.js';
import { createSignature } from './build-signature.js';
import { prepareRules, scheduleRules } from './build-rules.js';

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
  { name: 'ChatGPT', color: '#d9f959', station: [.14, .29], entrance: [-.23, .30], delay: .02, arc: -32 },
  { name: 'Claude', color: '#fbb8dc', station: [.68, .65], entrance: [.67, -.12], delay: .1, arc: 42 },
  { name: 'Grok', color: '#95d5ff', station: [.70, .16], entrance: [1.10, .18], delay: 0, arc: -20 },
  { name: 'me!!', color: '#ffab73', station: [.38, .52], entrance: [1.13, .65], delay: .05, arc: 28 },
  { name: 'Gemini', color: '#c6b2ff', station: [.36, .14], entrance: [.36, 1.12], delay: .08, arc: -45 },
];
const viewportWidth = () => document.documentElement.clientWidth;
const pageTop = (node) => node.getBoundingClientRect().top + scrollY;
const rush = (t) => { t = clamp(t); return t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; };
const clickTime = 100;
const pickupRoutes = {
  media: [[-1, -.30], [.42, 1], [1, -.25], [-.45, -1]],
  skill: [[-.8, -.75], [.65, .95], [.9, -.75], [-.65, .9]],
  link: [[.9, -.15], [-.82, .12], [.35, -.85], [-.32, .7]],
  box: [[.75, -.36], [-.70, .5], [.22, .94], [-.4, -.82]],
};

function worker(layer, role) {
  const stroke = document.createElement('div');
  stroke.className = 'build-rule-stroke';
  stroke.hidden = true;
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
  const x = viewportWidth() * role.entrance[0];
  const y = innerHeight * role.entrance[1];
  node.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  layer.append(stroke, outline, caret, node);
  return {
    role, outline, stroke, caret, typo, x, y,
    put(x, y, holding = false) {
      this.x = x;
      this.y = y;
      node.classList.toggle('is-grabbing', holding);
      node.classList.toggle('label-left', x > viewportWidth() - 88);
      node.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    },
    hover(x, y, holding = false) {
      this.put(clamp(x, 7, viewportWidth() - 24), clamp(y, 9, innerHeight - 64), holding);
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

function prepare(scene, typing, sceneIndex) {
  const targets = [...scene.querySelectorAll('[data-part], .portrait')].filter((target) => {
    const disclosure = target.closest('details:not([open])');
    return !disclosure || disclosure === target || target === disclosure.querySelector(':scope > summary');
  });
  const opening = ['#portfolio-name', '.hero-deck', '.wordmark', '.portrait', '.hero-link']
    .map((selector) => scene.querySelector(selector));
  if (scene.id === 'home') {
    targets.sort((a, b) => (opening.includes(a) ? opening.indexOf(a) : opening.length)
      - (opening.includes(b) ? opening.indexOf(b) : opening.length));
  }
  const counts = new Map();
  const pieces = targets.map((target) => {
    const kind = target.dataset.part || 'media';
    const order = counts.get(kind) ?? 0;
    counts.set(kind, order + 1);
    const openingLane = opening.indexOf(target);
    const preferred = openingLane >= 0 ? openingLane
      : kind === 'frame' ? 1 : kind === 'link' ? 2 : kind === 'media' ? 3
      : kind === 'skill' || target.closest('.timeline-list') ? 4 : kind === 'box' ? 1 : 0;
    const basePlacement = kind === 'skill' ? 225 : kind === 'frame' ? 460
      : kind === 'media' || kind === 'box' ? 495 : 260;
    const placement = basePlacement * (.88 + (order * 3 % 5) * .065);
    target.classList.add('build-piece');
    target.dataset.buildState = 'waiting';
    return { target, kind, order, route: order + sceneIndex, preferred, placement, tracks: typing.prepare(target), x: 0, y: 0 };
  });
  const lookup = new Map(pieces.map((piece) => [piece.target, piece]));
  for (const piece of pieces) {
    const { target } = piece;
    const frame = target.parentElement.closest('[data-part="frame"]');
    const photo = target.dataset.buildAfter === 'media' && target.closest('figure');
    piece.after = lookup.get(frame || (photo && photo.querySelector('[data-part="media"]')));
  }
  return pieces;
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

function pickupOffset(piece, rect) {
  const width = viewportWidth();
  const height = innerHeight;
  const timeline = piece.target.closest('.timeline-year');
  const routes = pickupRoutes[piece.kind] ?? pickupRoutes.box;
  const [across, down] = routes[piece.route % routes.length];
  const media = piece.kind === 'media';
  const reach = Math.min(media ? 225 : 112, width * (media ? .26 : .19));
  const drop = Math.min(media ? 150 : 75, height * (media ? .19 : .12));
  return {
    x: clamp(across * reach, Math.min(0, 26 - rect.right), Math.max(0, width - 26 - rect.left)),
    y: timeline ? 0 : clamp(down * drop, Math.min(0, 24 - rect.bottom), Math.max(0, height - 54 - rect.top)),
    bend: timeline ? 0 : Math.sign(across) * (media ? 30 : 13),
  };
}

function grab(actor, piece, time, from) {
  const delay = actor.role.delay + (piece.order % 3) * .023;
  const t = clamp((time - delay) / (1 - delay));
  const rect = pieceRect(piece);
  const width = viewportWidth();
  const height = innerHeight;
  const portrait = piece.target.matches('.portrait');
  const source = piece.source ??= pickupOffset(piece, rect);
  const pickup = piece.kind === 'media' ? .31 : .24;
  const dropAt = piece.kind === 'skill' ? .78 : .88;
  const lift = ease((t - pickup * .77) / .12);
  const travel = ease((t - pickup) / (dropAt - pickup));
  const bend = Math.sin(travel * Math.PI) * source.bend;
  const x = source.x * (1 - travel) + bend * .52;
  const y = source.y * (1 - travel) - bend;
  const anchorX = rect.left + Math.min(rect.width * (portrait ? .34 : .20), 120);
  const anchorY = rect.top + Math.min(rect.height * (portrait ? .50 : .36), portrait ? 230 : 64);
  const approach = ease(t / pickup);
  const release = ease((t - dropAt) / (1 - dropAt));
  const swoop = Math.sin(approach * Math.PI) * actor.role.arc * .66;
  const cursorX = mix(mix(from.x, clamp(anchorX + x, 7, width - 24), approach) + swoop * .58, anchorX + 16, release);
  const cursorY = mix(mix(from.y, clamp(anchorY + y, 9, height - 64), approach) + swoop, anchorY + 13, release);
  if (t < pickup) actor.put(cursorX, cursorY);
  else actor.hover(cursorX, cursorY, t < dropAt);

  if (t >= pickup * .77) {
    piece.target.dataset.buildState = t >= dropAt ? 'placed' : 'dragging';
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

const sceneTimes = {
  home: 5600, work: 8600, creative: 4200, about: 5500,
  achievements: 6800, timeline: 5400, skills: 5600, contact: 3600,
};

function planJobs(pieces, actors, opening) {
  const jobs = [];
  const placements = new Map();
  for (const piece of pieces) {
    const direct = opening && piece.kind !== 'media';
    let placement;
    if (!direct || !piece.tracks.length) {
      placement = { piece, direct, duration: piece.placement, preferred: piece.preferred };
      placements.set(piece, placement);
      jobs.push(placement);
    }
    const click = direct ? 52 : clickTime;
    const primary = piece.tracks.filter((track) => track.start === 0);
    const parallel = piece.tracks.filter((track) => track.start > 0).map((track) => [track]);
    for (const tracks of [primary, ...parallel]) {
      if (!tracks.length) continue;
      jobs.push({
        piece, tracks, after: placement, preferred: piece.preferred, direct, click,
        duration: click + tracks.reduce((sum, track) => sum + track.duration, 0),
      });
    }
  }
  for (const [piece, job] of placements) job.after = placements.get(piece.after);

  const free = actors.map(() => 0);
  const ordered = [];
  while (jobs.length) {
    const firstFree = Math.min(...free);
    let nextIndex = -1;
    let earliest = Infinity;
    for (const [index, job] of jobs.entries()) {
      const dependency = job.after ? job.after.end : 0;
      if (dependency === undefined) continue;
      const start = Math.max(firstFree, dependency);
      if (start < earliest) {
        nextIndex = index;
        earliest = start;
      }
    }
    const [job] = jobs.splice(nextIndex, 1);
    const preferred = job.preferred;
    job.lane = free[preferred] <= earliest + 35 ? preferred : free.indexOf(firstFree);
    job.start = Math.max(free[job.lane], earliest);
    job.end = job.start + job.duration;
    free[job.lane] = job.end;
    ordered.push(job);
  }
  return { jobs: ordered, duration: Math.max(...free) };
}

function drawFrame(actor, piece, t, from) {
  const rect = pieceRect(piece);
  const approach = ease(t / .26);
  const growth = ease((t - .22) / .72);
  const reverse = piece.order % 2 === 1;
  const startX = reverse ? rect.right - 1 : rect.left + 1;
  const endX = mix(startX, reverse ? rect.left : rect.right, growth);
  const bottom = mix(rect.top + 1, rect.bottom, growth);
  actor.hover(mix(from.x, endX, approach), mix(from.y, bottom, approach), t > .22);
  actor.select({ ...rect, left: reverse ? endX : rect.left, right: reverse ? rect.right : endX, bottom }, 0, 0, ease(t / .22));
}

function drawRule(actor, job, t) {
  const { rule, from, reverse } = job;
  const box = rule.target.getBoundingClientRect();
  const left = Math.max(0, box.left);
  const right = Math.min(viewportWidth() - 1, box.right - 1);
  const top = Math.max(0, box.top);
  const bottom = Math.min(innerHeight - 34, box.bottom - 1);
  const x = reverse ? right : left;
  const y = rule.edge === 'Bottom' ? box.bottom - 1 : top;
  const approach = ease(t / .27);
  const p = ease((t - .27) / .73);
  const length = rule.vertical ? (bottom - top) * p : (right - left) * p;
  const tipX = x + (rule.vertical ? 0 : (reverse ? -length : length));
  const tipY = y + (rule.vertical ? length : 0);
  actor.put(mix(from.x, tipX, approach), mix(from.y, tipY, approach), p > 0 && p < 1);

  actor.stroke.hidden = length <= 0;
  if (length <= 0) return;
  actor.stroke.style.backgroundColor = rule.color;
  const originX = reverse ? tipX : x;
  const scale = rule.vertical ? 'scaleY(' : 'scaleX(';
  actor.stroke.style.transform = 'translate3d(' + originX + 'px,' + y + 'px,0) ' + scale + length + ')';
  if (p > .14) rule.revealDot();
}

function setTypeArea(actor, piece, t, from) {
  const rect = pieceRect(piece);
  const p = ease(t / .8);
  const arc = Math.sin(p * Math.PI) * actor.role.arc * .65;
  const x = clamp(rect.left + 8, 7, viewportWidth() - 24);
  const y = clamp(rect.top + 6, 9, innerHeight - 64);
  actor.put(mix(from.x, x, p) + arc, mix(from.y, y, p) - Math.abs(arc), t > .64 && t < .83);
  if (t > .78 && piece.target.dataset.buildState !== 'placed') place(piece);
}

function paintText(actor, job, time, typing) {
  const { tracks, from, click, piece } = job;
  let elapsed = Math.max(0, time - click);
  while (job.trackIndex < tracks.length - 1 && elapsed >= tracks[job.trackIndex].duration) {
    const complete = tracks[job.trackIndex++];
    typing.reveal(complete);
  }
  const track = tracks[job.trackIndex];
  for (let i = 0; i < job.trackIndex; i++) elapsed -= tracks[i].duration;
  if (time < click) {
    const range = document.createRange();
    range.setStart(track.node, track.start);
    range.collapse(true);
    const start = range.getBoundingClientRect();
    const p = ease(time / click);
    const x = clamp(start.left + 5, 7, viewportWidth() - 24);
    const y = clamp(start.top + 5, 9, innerHeight - 64);
    actor.put(mix(from.x, x, p), mix(from.y, y, p), p > .72);
    return;
  }

  if (job.direct && piece.target.dataset.buildState !== 'placed') place(piece);
  const caret = typing.type(track, Math.max(0, elapsed), actor);
  if (!caret?.height) return;
  const rect = track.node.parentElement.getBoundingClientRect();
  const y = caret.top > 54 ? caret.top - 42 : caret.bottom + 9;
  const reach = mix(rect.left, caret.left, .48);
  const settle = .24;
  actor.hover(mix(actor.x, reach + Math.sin(elapsed / 230) * 18, settle), mix(actor.y, y, settle));
}

function finishJob(actor, job, typing) {
  if (job.rule) {
    job.rule.restore();
    actor.stroke.hidden = true;
    return;
  }
  if (job.tracks) {
    if (job.direct && job.piece.target.dataset.buildState !== 'placed') place(job.piece);
    job.tracks.forEach(typing.reveal);
    actor.caret.hidden = true;
  } else place(job.piece);
  actor.outline.hidden = true;
}

function planBuild(scenes, actors, rail, home) {
  const lanes = actors.map(() => []);
  const camera = [];
  let duration = 0;
  const limit = document.documentElement.scrollHeight - innerHeight;
  const railLimit = rail.scrollWidth - rail.clientWidth;
  for (const {scene, pieces} of scenes) {
    const batches = groupByView(scene, pieces).map((batch) => ({
      ...batch, ...planJobs(batch.pieces, actors, scene.id === 'home'),
    }));
    const weights = batches.map((batch) => 300 + batch.duration ** .83);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    for (const [index, batch] of batches.entries()) {
      const slot = sceneTimes[scene.id] * weights[index] / total;
      const previous = camera.at(-1) ?? { top: home, rail: rail.scrollLeft };
      const top = clamp(batch.top, home, limit);
      const left = batch.photo ? clamp(batch.photo.offsetLeft, 0, railLimit) : previous.rail;
      const travel = Math.abs(top - previous.top) > 8 || Math.abs(left - previous.rail) > 8
        ? Math.min(540, slot * .34) : 0;
      const lead = travel && previous.scene?.id !== 'timeline' ? Math.min(130, duration * .12) : 0;
      camera.push({ start: duration - lead, end: duration + travel, from: previous, top, rail: left, scene });

      const scale = (slot - travel) / Math.max(1, batch.duration);
      for (const job of batch.jobs) {
        const start = duration + travel + job.start * scale;
        const end = duration + travel + job.end * scale;
        lanes[job.lane].push({ ...job, start, end, trackIndex: 0 });
      }
      duration += slot;
    }
  }
  return { lanes, camera, duration };
}

async function assemble(scenes, actors, rail, home, signal, clock, typing, rules) {
  const { lanes, camera, duration } = planBuild(scenes, actors, rail, home);
  const releases = scheduleRules(rules, lanes, camera, duration, innerHeight);
  const indices = actors.map(() => 0);
  let view = 0;
  let release = 0;
  await animate(duration, (t) => {
    const time = t * duration;
    while (releases[release]?.time <= time) releases[release++].rule.restore();
    while (camera[view + 1]?.start <= time) view++;
    const shot = camera[view];
    const movement = shot.end > shot.start ? ease((time - shot.start) / (shot.end - shot.start)) : 1;
    const top = Math.round(mix(shot.from.top, shot.top, movement));
    if (scrollY !== top) scrollTo(0, top);
    if (shot.from.rail !== shot.rail) rail.scrollLeft = mix(shot.from.rail, shot.rail, movement);

    actors.forEach((actor, lane) => {
      const jobs = lanes[lane];
      while (jobs[indices[lane]]?.end <= time + .01) finishJob(actor, jobs[indices[lane]++], typing);
      const job = jobs[indices[lane]];
      if (!job) return;
      job.from ??= { x: actor.x, y: actor.y };
      if (time < job.start) {
        if (job.rule) return;
        const available = jobs[indices[lane] - 1]?.end ?? 0;
        const approach = Math.max(available, job.start - 220);
        if (time < approach) return;
        const rect = pieceRect(job.piece);
        const p = ease((time - approach) / (job.start - approach));
        const pickup = !job.tracks && pickupRoutes[job.piece.kind] ? pickupOffset(job.piece, rect) : { x: 0, y: 0 };
        const x = clamp(rect.left + pickup.x + 18, 7, viewportWidth() - 24);
        const y = clamp(rect.top + pickup.y - 22, 9, innerHeight - 64);
        actor.put(mix(job.from.x, x, p), mix(job.from.y, y, p));
        return;
      }
      if (!job.active) {
        job.from = { x: actor.x, y: actor.y };
        job.active = true;
      }
      const p = clamp((time - job.start) / (job.end - job.start));
      if (job.rule) drawRule(actor, job, p);
      else if (job.tracks) paintText(actor, job, p * job.duration, typing);
      else if (job.piece.kind === 'frame') drawFrame(actor, job.piece, p, job.from);
      else if (job.direct || job.piece.kind === 'copy' || job.piece.kind === 'type') setTypeArea(actor, job.piece, p, job.from);
      else grab(actor, job.piece, p, job.from);
    });
  }, signal, clock);
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
  await animate(5600, (t) => {
    layer.style.setProperty('--build-dim', ease(t * 10));
    const matrix = svg.getScreenCTM();
    const time = t * 5600;
    routes.forEach((route, index) => {
      let point = new DOMPoint(origins[index].x, origins[index].y);
      let previousEnd = 0;
      let drawing = false;
      for (const stroke of route) {
        if (time < stroke.start) {
          const next = stroke.path.getPointAtLength(0).matrixTransform(matrix);
          const p = ease((time - previousEnd) / (stroke.start - previousEnd));
          const arc = Math.sin(Math.PI * p) * actors[index].role.arc;
          point = new DOMPoint(mix(point.x, next.x, p) + arc, mix(point.y, next.y, p) - arc * .65);
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
      const finished = ease((time - route.at(-1).end) / (5600 - route.at(-1).end));
      const [x, y] = actors[index].role.station;
      const arc = Math.sin(Math.PI * finished) * actors[index].role.arc;
      actors[index].put(mix(point.x, viewportWidth() * x, finished) + arc,
        mix(point.y, innerHeight * y, finished) + arc * .7, drawing);
    });
  }, signal);
  return svg;
}

export function createBuildSequence(portfolio, preference) {
  let completed = false;
  let state;
  const home = () => Math.ceil(pageTop(portfolio));

  function revealPieces({ pieces, typing, rail, rules }) {
    for (const { target } of pieces.splice(0)) {
      target.classList.remove('build-piece');
      delete target.dataset.buildState;
      for (const key of ['--piece-x', '--piece-y', '--piece-opacity']) target.style.removeProperty(key);
    }
    typing.dispose();
    rules.splice(0).forEach((rule) => rule.restore());
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
    const scenes = [...portfolio.querySelectorAll('[data-scene]')]
      .map((scene, index) => ({ scene, pieces: prepare(scene, typing, index) }));
    const rules = prepareRules(portfolio);
    state = { pieces: scenes.flatMap(({pieces}) => pieces), layer, controls, cleanup, typing, rail, rules };
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
        actor.caret.hidden = actor.outline.hidden = actor.stroke.hidden = true;
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
      await assemble(scenes, actors, rail, home(), buildSignal, clock, typing, rules);
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
