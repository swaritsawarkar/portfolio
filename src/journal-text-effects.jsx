import React from 'react';
import { createRoot } from 'react-dom/client';
import RotatingText from './text-effects/RotatingText';
import BlurText from './text-effects/BlurText';
import SplitFlapText from './text-effects/SplitFlapText';
import TechText from './text-effects/TechText';
import TrueFocus from './text-effects/TrueFocus';
import './journal-text-effects.css';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const demos = {
  'rotating-text': () => <RotatingText texts={['Make it move.', 'Make it yours.', 'Make it matter.']} />,
  'blur-text': () => <BlurText text="Clarity comes into focus." loop loopDelay={2} />,
  'split-flap-text': () => <SplitFlapText fontSize="clamp(22px, 5.8vw, 78px)" gap={3} />,
  'tech-text': () => <TechText fontSize={150} fontFamily="Manrope" fontWeight={800} color="#f3f0e9" accentColor="#ee5146" />,
  'true-focus': () => <TrueFocus />,
};
for (const panel of document.querySelectorAll('[data-text-demo]')) {
  const stage = panel.querySelector('.text-demo-stage');
  const button = panel.querySelector('button');
  const label = stage.textContent;
  let root;
  let inView = false;
  let paused = false;
  function stop() {
    root?.unmount(); root = null;
    stage.textContent = label;
    button.textContent = reduced.matches ? 'Reduced motion enabled' : paused ? 'Resume animation' : 'Animation starts on scroll';
    button.setAttribute('aria-pressed', 'false');
  }
  function start() {
    if (root || paused || reduced.matches || document.hidden || !inView) return;
    stage.textContent = '';
    root = createRoot(stage);
    root.render(demos[panel.dataset.textDemo]());
    button.textContent = 'Pause animation';
    button.setAttribute('aria-pressed', 'true');
  }
  button.addEventListener('click', () => {
    paused = !paused;
    if (paused) stop(); else start();
  });
  button.disabled = false;
  reduced.addEventListener('change', () => { stop(); start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) start(); else stop();
  }, { threshold: .2 }).observe(stage);
}
