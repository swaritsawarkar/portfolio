import { portfolioStatsStore, signingConfigured } from './signing-store.js';
import { journalPage } from './journal-pages.js';

const sessionKey = 'portfolio.analytics.session.v1';
const idleWindow = 30 * 60 * 1000;
let session;

function enabled() {
  return signingConfigured && !navigator.globalPrivacyControl &&
    navigator.doNotTrack !== '1' && window.doNotTrack !== '1';
}

function source() {
  try {
    const { hostname } = new URL(document.referrer);
    if (hostname === location.hostname) return 'internal';
    const host = hostname.replace(/^www\./, '').toLowerCase();
    if (host.length <= 90 && /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(host)) return host;
  } catch { /* No usable referring site. */ }
  return 'direct';
}

function visit() {
  const now = Date.now();
  if (!session) {
    let previous;
    try { previous = JSON.parse(sessionStorage.getItem(sessionKey)); } catch { /* Storage is optional. */ }
    if (previous?.id && now - previous.last < idleWindow) {
      session = { ...previous, events: new Set() };
    }
  }
  if (!session || now - session.last >= idleWindow) {
    session = { id: crypto.randomUUID(), events: new Set() };
  }
  session.last = now;
  try { sessionStorage.setItem(sessionKey, JSON.stringify({ id: session.id, last: now })); } catch { /* Use memory. */ }
  const current = session;
  current.created ??= portfolioStatsStore.visit({
    id: current.id,
    device: matchMedia('(max-width: 620px)').matches ? 'phone'
      : matchMedia('(pointer: coarse) and (max-width: 1200px)').matches ? 'tablet' : 'desktop',
    source: source(),
  }).catch((error) => {
    if (error.code === '23505') return;
    current.created = undefined;
    throw error;
  });
  return current;
}

export function track(kind, detail) {
  if (!enabled()) return;
  const current = visit();
  const key = kind + ':' + detail;
  if (current.events.has(key)) return;
  current.events.add(key);
  void current.created.then(() => portfolioStatsStore.activity({ visit_id: current.id, kind, detail }))
    .catch((error) => { if (error.code !== '23505') current.events.delete(key); });
}

function outbound(link) {
  if (link.protocol === 'mailto:') return 'email';
  if (!['http:', 'https:'].includes(link.protocol) || link.origin === location.origin) return null;
  const host = link.hostname.replace(/^www\./, '');
  return ({
    'github.com': 'github', 'linkedin.com': 'linkedin', 'instagram.com': 'instagram',
    'open.spotify.com': 'spotify', 'jiostar.com': 'hotstar', 'hotstar.com': 'hotstar',
  })[host] ?? 'project-site';
}

export function mountJournalAnalytics() {
  const page = journalPage(location.pathname);
  if (!page) return;
  mountPortfolioAnalytics(document.body);
  track('journal', page);
}

export function mountPortfolioAnalytics(portfolio) {
  if (!enabled()) return;
  void visit().created.catch(() => {});
  const headers = [...portfolio.querySelectorAll('[data-scene]')].map((section) =>
    [section.querySelector('.chapter-head, .hero-type') ?? section, section.id]);
  const sections = new Map(headers);
  const root = document.documentElement;
  const canSee = () => !portfolio.inert && !document.hidden && !root.classList.contains('is-building');
  const observer = new IntersectionObserver((entries) => {
    if (!canSee()) return;
    for (const entry of entries) if (entry.isIntersecting) track('section', sections.get(entry.target));
  }, { rootMargin: '-12% 0px -32% 0px', threshold: .15 });
  for (const [header] of headers) observer.observe(header);

  const checkView = () => {
    if (!canSee()) return;
    for (const [header, id] of headers) {
      const { top, bottom } = header.getBoundingClientRect();
      if (top < innerHeight * .68 && bottom > innerHeight * .12) track('section', id);
    }
  };
  new MutationObserver(checkView).observe(root, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(checkView).observe(portfolio, { attributes: true, attributeFilter: ['inert'] });
  document.addEventListener('visibilitychange', checkView);
  const onLink = (event) => {
    if (!canSee() || (event.type === 'auxclick' && event.button !== 1)) return;
    const link = event.target.closest('a[href]');
    const category = link && outbound(link);
    if (category) track('outbound', category);
  };
  portfolio.addEventListener('click', onLink);
  portfolio.addEventListener('auxclick', onLink);
}
