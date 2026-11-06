import './portfolio-velocity.css';

const layers = [
  { selector: '.hero-type', distance: 19, shear: .28 },
  { selector: '.portrait', distance: -26, shear: 0 },
  { selector: '.chapter-head h2', distance: 22, shear: .48 },
  { selector: '.work-feature, .creative-grid > figure', distance: -14, shear: .16 },
  { selector: '.timeline-year > strong', distance: 11, shear: 0 },
];

export function mountPortfolioVelocity(portfolio, reducedMotion) {
  const root = document.documentElement;
  const body = document.body;
  const compact = matchMedia('(max-width: 720px)');
  const targets = new Map();
  for (const { selector, distance, shear } of layers) {
    for (const [index, node] of [...portfolio.querySelectorAll(selector)].entries()) {
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
    && body.classList.contains('is-revealed') && !body.classList.contains('is-outro')
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
    lifecycle.disconnect();
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', reset);
    reducedMotion.removeEventListener('change', reset);
    reset();
  };
}
