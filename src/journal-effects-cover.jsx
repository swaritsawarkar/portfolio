import React from 'react';
import { createRoot } from 'react-dom/client';
import FluxLines from './effects/FluxLines';

const root = createRoot(document.querySelector('[data-effects-cover]'));
const button = document.querySelector('[data-cover-pause]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;

function render() {
  root.render(<FluxLines colors={['#ff4b32', '#f7b8a5', '#e9e0ff']} speed={0.45} scale={1.5}
    transparent={false} backgroundColor="#09090c" dpr={1} paused={paused} />);
  button.textContent = paused ? 'Play preview' : 'Pause preview';
  button.setAttribute('aria-pressed', String(paused));
}

button.addEventListener('click', () => { paused = !paused; render(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; render(); });
render();
