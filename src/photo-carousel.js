export function mountPhotoCarousel(root) {
  const stage = root.querySelector('.wins-stage');
  const rail = root.querySelector('.wins-rail');
  const slides = [...rail.querySelectorAll('.win-photo')];
  const previous = root.querySelector('[data-photo-step="-1"]');
  const next = root.querySelector('[data-photo-step="1"]');
  const count = root.querySelector('.wins-count');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const shortTouchScreen = matchMedia('(pointer: coarse) and (max-height: 440px)');
  let step = 0;
  let positions = [];
  let frame = 0;
  let index = -1;
  let touchStart;
  const last = slides.length - 1;
  const usesScrollTrack = () => !preference.matches && !shortTouchScreen.matches;
  const canScrub = () => usesScrollTrack()
    && document.body.classList.contains('is-revealed')
    && !document.documentElement.classList.contains('is-building');

  function update() {
    frame = 0;
    if (!positions.length) return;
    if (canScrub()) {
      const top = Number.parseFloat(getComputedStyle(stage).top) || 0;
      const distance = top - root.getBoundingClientRect().top;
      const progress = Math.min(last, Math.max(0, distance / step));
      const from = Math.floor(progress);
      const to = Math.min(last, from + 1);
      rail.scrollLeft = positions[from] + (positions[to] - positions[from]) * (progress - from);
    }
    const position = rail.scrollLeft;
    const active = positions.reduce((nearest, offset, candidate) =>
      Math.abs(offset - position) < Math.abs(positions[nearest] - position) ? candidate : nearest, 0);
    if (active === index) return;
    index = active;
    count.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    previous.setAttribute('aria-disabled', String(active === 0));
    next.setAttribute('aria-disabled', String(active === last));
  }

  function queue() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function measure() {
    step = Math.max(180, Math.min(430, innerHeight * .46));
    root.style.setProperty('--gallery-travel', step * last + 'px');
    root.classList.toggle('wins-scrub', usesScrollTrack());
    const width = rail.clientWidth;
    const limit = rail.scrollWidth - width;
    positions = width ? slides.map((slide) => {
      const inset = Number.parseFloat(getComputedStyle(slide).scrollMarginInlineStart) || 0;
      return Math.min(limit, Math.max(0, slide.offsetLeft - inset));
    }) : [];
    queue();
  }

  function go(delta) {
    if (index < 0) return;
    const target = Math.min(last, Math.max(0, index + delta));
    if (target === index) return;
    if (canScrub()) {
      const top = Number.parseFloat(getComputedStyle(stage).top) || 0;
      window.scrollTo({ top: scrollY + root.getBoundingClientRect().top - top + target * step, behavior: 'smooth' });
    } else {
      rail.scrollTo({ left: positions[target], behavior: preference.matches ? 'instant' : 'smooth' });
    }
  }

  previous.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  rail.addEventListener('pointerdown', (event) => {
    if (canScrub() && event.pointerType === 'touch' && event.isPrimary) {
      touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  }, { passive: true });
  rail.addEventListener('pointerup', (event) => {
    if (touchStart?.id !== event.pointerId) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = undefined;
    if (Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.35) go(dx < 0 ? 1 : -1);
  }, { passive: true });
  rail.addEventListener('pointercancel', (event) => {
    if (touchStart?.id === event.pointerId) touchStart = undefined;
  }, { passive: true });
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    go(event.key === 'ArrowLeft' ? -1 : 1);
  });
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  new ResizeObserver(measure).observe(rail);
  preference.addEventListener('change', measure);
  shortTouchScreen.addEventListener('change', measure);
  rail.addEventListener('scroll', () => { if (!canScrub()) queue(); }, { passive: true });
  measure();
}
