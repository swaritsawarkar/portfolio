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
  'blur-text': () => <BlurText text="Clarity comes into focus." />,
  'split-flap-text': () => <SplitFlapText words={['MAKE IT', 'MOVE IT', 'SHIP IT']} padTo={7} fontSize={28} />,
  'tech-text': () => <TechText text="DESIGN" fontSize={72} color="#f3f0e9" accentColor="#ee5146" />,
  'true-focus': () => <TrueFocus sentence="Keep your focus" borderColor="#ee5146" glowColor="transparent" />,
};
for (const panel of document.querySelectorAll('[data-text-demo]')) {
  const stage = panel.querySelector('.text-demo-stage');
  const button = panel.querySelector('button');
  const label = stage.textContent;
  let root;
  function stop() {
    root?.unmount(); root = null;
    stage.textContent = label;
    button.textContent = 'Play demo';
    button.setAttribute('aria-pressed', 'false');
  }
  button.addEventListener('click', () => {
    if (root) return stop();
    if (reduced.matches) { button.textContent = 'Reduced motion enabled'; return; }
    stage.textContent = '';
    root = createRoot(stage);
    root.render(demos[panel.dataset.textDemo]());
    button.textContent = 'Stop / reset demo';
    button.setAttribute('aria-pressed', 'true');
  });
  reduced.addEventListener('change', stop);
  new IntersectionObserver(([entry]) => {
    const rect = panel.getBoundingClientRect();
    if (!entry.isIntersecting && (rect.bottom <= 0 || rect.top >= innerHeight)) stop();
  }).observe(panel);
}
