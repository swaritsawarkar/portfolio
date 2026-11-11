export function mountNavHeroMotion(hero) {
  const tracks = [...hero.querySelectorAll('.hero-track')];
  const groups = tracks.map((track) => track.querySelector('.hero-group'));
  const button = hero.querySelector('[data-hero-pause]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const horizontal = matchMedia('(max-width: 1099px)');
  let visible = false;
  let paused = false;
  let frame = 0;
  let previous = 0;
  let lastY = scrollY;
  let lastScroll = performance.now();
  let boost = 0;
  let speed = 24;
  let lengths = [0, 0];
  const offsets = [0, 0];

  function measure() {
    lengths = groups.map((group) => horizontal.matches ? group.getBoundingClientRect().width : group.getBoundingClientRect().height);
  }
  function paint(now) {
    const elapsed = previous ? Math.min(64, now - previous) : 0;
    previous = now;
    const target = 24 + boost * Math.exp(-(now - lastScroll) / 350);
    speed += (target - speed) * (1 - Math.exp(-elapsed / 180));
    tracks.forEach((track, index) => {
      const length = lengths[index];
      if (!length) return;
      offsets[index] = ((offsets[index] + speed * elapsed / 1000 * (index ? -1 : 1)) % length + length) % length;
      track.style.transform = horizontal.matches ? `translate3d(${-offsets[index]}px,0,0)` : `translate3d(0,${-offsets[index]}px,0)`;
    });
    frame = requestAnimationFrame(paint);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = previous = 0;
    const state = reduced.matches ? 'reduced' : paused ? 'paused' : document.hidden ? 'hidden' : visible ? 'running' : 'offscreen';
    hero.dataset.motionState = state;
    if (state === 'running') frame = requestAnimationFrame(paint);
    if (reduced.matches) tracks.forEach((track) => track.style.removeProperty('transform'));
  }
  function resize() {
    offsets.fill(0);
    tracks.forEach((track) => track.style.removeProperty('transform'));
    measure();
    sync();
  }
  function onScroll() {
    const now = performance.now();
    boost = Math.min(120, Math.abs(scrollY - lastY) / Math.max(16, now - lastScroll) * 32);
    lastY = scrollY;
    lastScroll = now;
  }
  function toggle() {
    paused = !paused;
    button.textContent = paused ? 'Resume motion' : 'Pause motion';
    button.setAttribute('aria-pressed', String(paused));
    boost = 0;
    speed = 24;
    sync();
  }
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  const size = new ResizeObserver(measure);
  groups.forEach((group) => size.observe(group));
  intersection.observe(hero);
  reduced.addEventListener('change', sync);
  horizontal.addEventListener('change', resize);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('scroll', onScroll, { passive: true });
  button.addEventListener('click', toggle);
  measure();
  sync();
  return () => {
    cancelAnimationFrame(frame);
    intersection.disconnect();
    size.disconnect();
    reduced.removeEventListener('change', sync);
    horizontal.removeEventListener('change', resize);
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('scroll', onScroll);
    button.removeEventListener('click', toggle);
    tracks.forEach((track) => track.style.removeProperty('transform'));
    delete hero.dataset.motionState;
  };
}
