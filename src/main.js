import './style.css';
import { createFluid } from './fluid.js';
import { loadLogo, createLogoTexture, drawPoster } from './logo-field.js';
import { vertexSource, fragmentSource } from './liquid-shader.js';
import { mountPortfolio } from './portfolio.js';
import { createBuildSequence } from './build-sequence.js';
import { mountPortfolioVelocity } from './portfolio-velocity.js';
import { mountPortfolioAnalytics, track as trackActivity } from './portfolio-analytics.js';

const track = document.querySelector('.intro-track');
const outro = document.querySelector('.outro-track');
const stage = document.querySelector('#intro-stage');
const canvas = document.querySelector('#liquid-canvas');
const poster = document.querySelector('#logo-fallback');
const portfolio = document.querySelector('#portfolio');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const dark = { light: false, paper: '#f3f0e9', ink: '#000', background: [243 / 255, 240 / 255, 233 / 255], color: [0, 0, 0] };
const light = { light: true, paper: '#000', ink: '#fff', background: [0, 0, 0], color: [1, 1, 1] };
const returnToDark = { ...dark, paper: '#fff', background: [1, 1, 1] };
const themeColor = document.querySelector('meta[name="theme-color"]');
let theme = new URLSearchParams(location.search).get('mode') === 'inverted' ? light : dark;
let entryPalette = theme;
let stagePalette = entryPalette;
const entryHash = location.hash;
if (entryHash) history.replaceState(history.state, '', location.pathname + location.search);
const openLinkedProject = mountPortfolio(portfolio);
mountPortfolioAnalytics(portfolio);
mountPortfolioVelocity(portfolio, reducedMotion);
const build = createBuildSequence(portfolio, reducedMotion);

const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, vx: 0, vy: 0, presence: 0, active: false };
let progress = 0;
let targetProgress = 0;
let flowTime = 0;
let covered = false;
let revealed = false;
let ending = false;
let reversingEntry = false;
let buildStarted = false;
let holdFrame = 0;
let holdTimer = 0;
let frame = 0;
let lastFrame = 0;
let renderer;
let logo;

function applyTheme(palette) {
  theme = palette;
  const root = document.documentElement;
  root.dataset.edition = palette.light ? 'light' : 'dark';
  root.style.setProperty('--paper', palette.paper);
  root.style.setProperty('--ink', palette.ink);
  root.style.setProperty('--skill-invert', palette.light ? '0' : '1');
  root.style.colorScheme = palette.light ? 'light' : 'dark';
  themeColor.content = revealed ? palette.ink : stagePalette.paper;
}

function setStagePalette(palette) {
  stagePalette = palette;
  stage.style.setProperty('--stage-paper', palette.paper);
  stage.style.setProperty('--stage-ink', palette.ink);
  renderer?.setPalette(palette);
  if (logo) drawPoster(poster, logo, palette.light);
}

applyTheme(theme);
setStagePalette(entryPalette);

function requestDraw() {
  if (!frame && renderer && !covered && !reducedMotion.matches && !document.hidden) {
    frame = requestAnimationFrame(draw);
  }
}

function setRevealed(value) {
  revealed = value;
  document.body.classList.toggle('is-revealed', value);
  portfolio.inert = !value;
  portfolio.setAttribute('aria-hidden', String(!value));
  stage.setAttribute('aria-hidden', String(value));
  themeColor.content = value ? theme.ink : stagePalette.paper;
  if (value && !buildStarted) {
    buildStarted = true;
    trackActivity('experience', 'entered');
    if (!openLinkedProject(entryHash)) void build.start();
  } else if (!value) build.stop();
}

function cancelHold() {
  cancelAnimationFrame(holdFrame);
  clearTimeout(holdTimer);
  holdFrame = holdTimer = 0;
}

function startHold() {
  if (document.hidden || holdFrame || holdTimer || (revealed && !ending)) return;
  if (reducedMotion.matches) {
    completeCover();
    return;
  }
  // A frame must paint the solid cover before the 400 ms clock starts.
  holdFrame = requestAnimationFrame(() => {
    holdFrame = requestAnimationFrame(() => {
      holdFrame = 0;
      holdTimer = setTimeout(() => {
        holdTimer = 0;
        if (covered && !document.hidden) completeCover();
      }, 400);
    });
  });
}

function completeCover() {
  if (!ending) {
    reversingEntry = false;
    scrollTo({ top: track.offsetHeight, behavior: 'instant' });
    setRevealed(true);
    return;
  }
  // Swap editions under the solid cover. Keep the mounted content and build
  // controller, so neither the page nor the cursor sequence needs to restart.
  entryPalette = stagePalette;
  applyTheme(stagePalette.light ? light : dark);
  trackActivity('experience', theme.light ? 'light' : 'dark');
  scrollTo({ top: track.offsetHeight, behavior: 'instant' });
  ending = false;
  document.body.classList.remove('is-outro');
  stage.style.removeProperty('--outro-entry');
  stage.setAttribute('aria-hidden', 'true');
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  if (portfolio.contains(document.activeElement)) portfolio.querySelector('h1').focus({ preventScroll: true });
}

function updateProgress(value) {
  const wasCovered = covered;
  targetProgress = Math.min(1, Math.max(0, value));
  if (!renderer || reducedMotion.matches) progress = targetProgress;
  covered = targetProgress === 1 && progress === 1;
  if (covered !== wasCovered) document.body.classList.toggle('is-covered', covered);
  if (covered) {
    if (!wasCovered) {
      cancelAnimationFrame(frame);
      frame = 0;
      Object.assign(pointer, { active: false, presence: 0, vx: 0, vy: 0, x: pointer.targetX, y: pointer.targetY });
    }
    startHold();
  } else {
    cancelHold();
    if (revealed && !ending) setRevealed(false);
    requestDraw();
  }
}

function syncScroll() {
  const entryDistance = track.offsetHeight;
  const returnPoint = entryDistance - Math.round(Math.min(360, Math.max(192, innerHeight * .46)));
  if (revealed && !document.documentElement.classList.contains('is-building')) {
    const bounds = outro.getBoundingClientRect();
    if (bounds.top < innerHeight - 1) {
      if (!ending) {
        cancelHold();
        ending = true;
        progress = 0;
        setStagePalette(theme.light ? returnToDark : light);
        document.body.classList.add('is-outro');
        stage.setAttribute('aria-hidden', 'false');
      }
      stage.style.setProperty('--outro-entry', Math.max(0, bounds.top) + 'px');
      const distance = Math.max(1, bounds.height - innerHeight);
      updateProgress(bounds.bottom <= innerHeight + 1 ? 1 : -bounds.top / distance);
      return;
    }
  }
  if (ending) {
    cancelHold();
    ending = false;
    progress = 1;
    document.body.classList.remove('is-outro');
    stage.style.removeProperty('--outro-entry');
    stage.setAttribute('aria-hidden', 'true');
    setStagePalette(entryPalette);
  }
  if (revealed && scrollY >= returnPoint) {
    // The first few upward scrolls keep the hero at the top of the screen.
    const offset = Math.min(0, scrollY - entryDistance);
    if (offset) portfolio.style.setProperty('--entry-offset', '0 ' + offset + 'px');
    else portfolio.style.removeProperty('--entry-offset');
    updateProgress(1);
    return;
  }
  portfolio.style.removeProperty('--entry-offset');
  if (revealed) reversingEntry = true;
  updateProgress(scrollY / (reversingEntry ? returnPoint : entryDistance));
}

function recordPointer(event) {
  if (covered || !renderer || reducedMotion.matches || !event.isPrimary) return;
  const x = event.clientX / stage.clientWidth;
  const y = 1 - (event.clientY - stage.getBoundingClientRect().top) / stage.clientHeight;
  if (!pointer.active && pointer.presence < 0.01) {
    pointer.x = x;
    pointer.y = y;
  }
  pointer.targetX = x;
  pointer.targetY = y;
  pointer.active = true;
  requestDraw();
}

function releasePointer() {
  pointer.active = false;
  requestDraw();
}

function draw(now) {
  frame = 0;
  if (!renderer || covered || reducedMotion.matches || document.hidden) return;
  const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0.016;
  lastFrame = now;
  flowTime += dt;
  progress += (targetProgress - progress) * (1 - Math.exp(-dt * 4.2));
  if (Math.abs(targetProgress - progress) < 0.001) progress = targetProgress;
  const previousX = pointer.x, previousY = pointer.y;
  pointer.x = pointer.targetX;
  pointer.y = pointer.targetY;
  pointer.presence = Number(pointer.active);
  pointer.vx = (pointer.x - previousX) / Math.max(dt, 0.001);
  pointer.vy = (pointer.y - previousY) / Math.max(dt, 0.001);
  renderer.draw(dt);

  syncScroll();
  requestDraw();
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function createRenderer(gl, logo) {
  const program = gl.createProgram();
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));

  gl.useProgram(program);
  const uniform = (name) => gl.getUniformLocation(program, name);
  gl.uniform2f(uniform('uMaskScale'), logo.markWidth / logo.width, logo.markWidth / logo.height);
  gl.uniform1f(uniform('uMarkAspect'), logo.markWidth / logo.markHeight);
  const backgroundUniform = uniform('uBackground');
  const inkUniform = uniform('uInk');
  gl.uniform1i(uniform('uMask'), 0);
  gl.activeTexture(gl.TEXTURE0);
  createLogoTexture(gl, logo);
  const fluid = createFluid(gl);
  gl.uniform1i(uniform('uFlow'), 1);

  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const resolution = uniform('uResolution');
  const swell = uniform('uProgress');
  const time = uniform('uTime');

  return {
    setPalette(palette) {
      gl.uniform3fv(backgroundUniform, palette.background);
      gl.uniform3fv(inkUniform, palette.color);
    },
    resize() {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1200000 / (width * height)));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
    },
    draw(dt) {
      const aspect = stage.clientWidth / stage.clientHeight;
      const markWidth = Math.min(aspect * 0.4, logo.markWidth / logo.markHeight * 0.86);
      fluid.update(dt, {
        x: (pointer.x - 0.5) * aspect / markWidth,
        y: (pointer.y - 0.5) / markWidth,
        vx: Math.max(-2, Math.min(2, pointer.vx * aspect / markWidth)),
        vy: Math.max(-2, Math.min(2, pointer.vy / markWidth)),
        presence: pointer.presence,
      });
      gl.uniform1f(swell, progress);
      gl.uniform1f(time, flowTime);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!document.body.classList.contains('has-liquid')) document.body.classList.add('has-liquid');
    },
  };
}

async function start() {
  logo = await loadLogo();
  drawPoster(poster, logo, stagePalette.light);
  const heightLimit = 86 * logo.markWidth / logo.markHeight;
  poster.style.setProperty('--poster-width', 'calc(min(40vw, ' + heightLimit + 'dvh) * ' + logo.width / logo.markWidth + ')');
  if (reducedMotion.matches) return;

  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
  if (!gl) return;

  function enableLiquid() {
    try {
      renderer = createRenderer(gl, logo);
      renderer.setPalette(stagePalette);
      renderer.resize();
      requestDraw();
    } catch (error) {
      renderer = undefined;
      console.error('Could not initialize liquid rendering.', error);
    }
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer = undefined;
    document.body.classList.remove('has-liquid');
  });
  canvas.addEventListener('webglcontextrestored', enableLiquid);
  enableLiquid();
}

stage.addEventListener('pointermove', recordPointer, { passive: true });
stage.addEventListener('pointerdown', recordPointer, { passive: true });
stage.addEventListener('pointerleave', releasePointer);
stage.addEventListener('pointercancel', releasePointer);
stage.addEventListener('pointerup', (event) => {
  if (event.pointerType !== 'mouse') releasePointer();
});
window.addEventListener('scroll', syncScroll, { passive: true });
window.addEventListener('resize', () => {
  renderer?.resize();
  syncScroll();
}, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    releasePointer();
    cancelHold();
  } else {
    syncScroll();
  }
});
reducedMotion.addEventListener('change', () => {
  if (!revealed) location.reload();
});
setRevealed(false);
syncScroll();
start().catch((error) => console.error('Could not load the logo artwork.', error));
