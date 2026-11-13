import './portfolio-velocity.css';

const layers = [
  { selector: '.text-motion-track', distance: 85, shear: .5 },
  { selector: '.text-effects-page .text-demo', distance: -32, shear: .65 },
  { selector: '.journal-hero h1, .journal-hero-bottom > p, .journal-copy-cta, .journal-repo, .journal-skill > .journal-copy, .journal-article > .journal-copy, .journal-prompt > *, .journal-nav > *, .journal-footer > *, .journal-entry-link > *, .hero-heading, .nav-example > header, .guide-opening, .guide-ending', distance: 18, shear: .12 },
  { selector: '.hero-type', distance: 19, shear: .28 },
  { selector: '.portrait', distance: -26, shear: 0 },
  { selector: '.chapter-head > *', distance: 22, shear: .32 },
  { selector: '.work-feature, .creative-grid > figure, .work-archive-item, .win-photo', distance: -14, shear: .16 },
  { selector: '.journal-shot, .spatial-reference', distance: -22, shear: .2 },
  { selector: '.work-caption > *, .work-links > *, .about-grid > *, .skill-row > *, .timeline-year > *, .contact-grid > *', distance: 11, shear: .08 },
];

export function mountPortfolioVelocity(portfolio, reducedMotion) {
  const root = document.documentElement;
  const body = document.body;
  const compact = matchMedia('(max-width: 720px)');
  const targets = new Map();
  const observeTargets = (node) => {
    if (!(node instanceof Element)) return;
    for (const { selector, distance, shear } of layers) {
      if (!node.matches(selector)) continue;
      targets.set(node, { distance: distance * (targets.size % 2 ? .82 : 1), shear });
      viewport.observe(node);
    }
  };
  for (const { selector, distance, shear } of layers) {
    for (const [index, node] of [...portfolio.querySelectorAll(selector)].entries()) {
      if (node.matches('.text-effects-page .journal-skill > .journal-copy')) continue;
      targets.set(node, { distance: distance * (index % 2 ? .82 : 1), shear });
    }
  }

  const inView = new Set();
  const moving = new Set();
  let frame = 0;
  let lastFrame = 0;
  let lastY = scrollY;
  let lastScroll = performance.now();
  let impulse = 0;
  let velocity = 0;

  const canMove = () => !reducedMotion.matches && !document.hidden && !portfolio.inert
    && (body.classList.contains('is-revealed') || body.classList.contains('journal-page')) && !body.classList.contains('is-outro')
    && !root.classList.contains('is-building');

  function clear(node) {
    if (!moving.delete(node)) return;
    node.classList.remove('is-velocity-moving');
    node.style.removeProperty('--portfolio-drift');
    node.style.removeProperty('--portfolio-shear');
  }

  function reset() {
    cancelAnimationFrame(frame);
    frame = lastFrame = impulse = velocity = 0;
    lastY = scrollY;
    lastScroll = performance.now();
    moving.forEach(clear);
  }

  function paint(now) {
    frame = 0;
    if (!canMove()) return reset();

    const elapsed = lastFrame ? Math.min(48, now - lastFrame) : 16;
    lastFrame = now;
    const age = now - lastScroll;
    const input = impulse * Math.exp(-Math.max(0, age - 26) / 92);
    velocity += (input - velocity) * (1 - Math.exp(-elapsed / 42));
    if (age > 65 && Math.abs(velocity) < .006) return reset();

    const weight = compact.matches ? .58 : 1;
    for (const node of inView) {
      const { distance, shear } = targets.get(node);
      node.style.setProperty('--portfolio-drift', (velocity * weight * distance).toFixed(2) + 'px');
      node.style.setProperty('--portfolio-shear', (velocity * weight * shear).toFixed(2) + 'deg');
      if (!moving.has(node)) {
        moving.add(node);
        node.classList.add('is-velocity-moving');
      }
    }
    frame = requestAnimationFrame(paint);
  }

  function onScroll() {
    const now = performance.now();
    const delta = scrollY - lastY;
    const elapsed = Math.max(10, Math.min(52, now - lastScroll));
    if (!canMove() || Math.abs(delta) > innerHeight * .92) return reset();
    if (!delta) return;

    lastY = scrollY;
    lastScroll = now;
    impulse = Math.min(1, Math.max(-1, delta / elapsed / 1.8));
    if (!frame) frame = requestAnimationFrame(paint);
  }

  const viewport = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) inView.add(target);
      else {
        inView.delete(target);
        clear(target);
      }
    }
  }, { rootMargin: '100px 0px' });
  targets.forEach((_, node) => viewport.observe(node));
  const addedContent = new MutationObserver((entries) => {
    for (const { addedNodes } of entries) for (const node of addedNodes) {
      observeTargets(node);
      if (node instanceof Element) node.querySelectorAll(layers.map(({selector}) => selector).join(',')).forEach(observeTargets);
    }
  });
  addedContent.observe(portfolio, { childList: true, subtree: true });

  // Intro and theme changes may move the scroll position in the same frame.
  // Clearing the previous sample prevents that jump from turning into motion.
  const lifecycle = new MutationObserver(reset);
  lifecycle.observe(root, { attributes: true, attributeFilter: ['class'] });
  lifecycle.observe(body, { attributes: true, attributeFilter: ['class'] });
  lifecycle.observe(portfolio, { attributes: true, attributeFilter: ['inert'] });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', reset);
  reducedMotion.addEventListener('change', reset);

  return () => {
    viewport.disconnect();
    addedContent.disconnect();
    lifecycle.disconnect();
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', reset);
    reducedMotion.removeEventListener('change', reset);
    reset();
  };
}
