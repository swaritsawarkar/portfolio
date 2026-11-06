const projectNames = {
  'strikeout-os': 'STRIKEOUT OS', 'pixelcut-pro': 'PixelCut Pro', '10thhojayega': '10thHoJayega',
  'shorts-channel-os': 'Shorts Channel OS', 'ai-attention-analyzer': 'AI Attention Analyzer',
  'chess-tracker-ai': 'Chess Tracker AI', 'dust-to-dollars': 'Dust to Dollars',
  'gen-z-is-cooked': 'Gen Z Is Cooked', 'gesture-to-text-wearable': 'Gesture-to-Text Wearable',
  'webcam-latency-tester': 'Webcam Latency Tester',
};
const labels = {
  home: 'Home', work: 'Work', creative: 'Creative', about: 'About', achievements: 'Field notes',
  timeline: 'Along the way', skills: 'Skills', signatures: 'Signing wall', contact: 'Contact',
  entered: 'Entered the portfolio', 'build-completed': 'Watched the build',
  'build-skipped': 'Skipped the build', boosted: 'Boosted the cursors',
  light: 'Switched to light', dark: 'Switched to dark', github: 'GitHub', linkedin: 'LinkedIn',
  instagram: 'Instagram', spotify: 'Spotify', email: 'Email', 'project-site': 'Project website', hotstar: 'JioHotstar',
  direct: 'Direct or unknown', internal: 'Portfolio', phone: 'Phone', tablet: 'Tablet', desktop: 'Desktop',
};
const formatNumber = new Intl.NumberFormat();
const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const escape = (text) => String(text ?? '').replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const label = (value) => projectNames[value] ?? labels[value] ?? value;

function rows(title, entries) {
  const max = Math.max(1, ...entries.map(({count}) => count));
  return '<section class="stats-panel"><h2>' + title + '</h2>' + (entries.length
    ? '<ul class="stats-bars">' + entries.map(({label: name, count}) =>
      '<li><span>' + escape(label(name)) + '</span><strong>' + formatNumber.format(count) +
      '</strong><div aria-hidden="true" style="--fill:' + count / max * 100 + '%"></div></li>').join('') + '</ul>'
    : '<p class="stats-muted">No activity in this period.</p>') + '</section>';
}

function activityLabel({kind, detail}) {
  if (kind === 'section') return 'Viewed ' + label(detail);
  if (kind === 'project') return 'Opened ' + label(detail);
  if (kind === 'outbound') return 'Clicked ' + label(detail);
  if (kind === 'wall') return 'Started drawing';
  if (kind === 'signed') return detail ? 'Signed as ' + detail : 'Signed the wall';
  return label(detail);
}

export function renderStats(container, data) {
  const cards = [
    ['Visits', data.visits, 'Anonymous sessions in this range'],
    ['Active recently', data.recently_active, 'Arrival or action in the last 5 min'],
    ['Entered portfolio', data.entered, 'Reached the page after the intro'],
    ['Signed the wall', data.signed, 'Visits with a saved signature'],
  ];
  const peak = Math.max(1, ...data.daily.map(({count}) => count));
  const breakdown = (kind) => data.breakdown.filter((entry) => entry.kind === kind).slice(0, 8)
    .map(({detail, count}) => ({label: detail, count}));
  container.innerHTML = '<div class="stats-cards">' + cards.map(([name, count, note]) =>
    '<section><h2>' + name + '</h2><strong>' + formatNumber.format(count) + '</strong><p>' + note + '</p></section>').join('') +
    '</div><section class="stats-panel stats-trend"><h2>Visits by day <small>UTC</small></h2>' +
    '<ol class="stats-chart">' + data.daily.map(({day, count}, index) => {
      const date = dayFormat.format(new Date(day + 'T00:00:00Z'));
      const text = date + ' · ' + formatNumber.format(count) + ' visits';
      return '<li title="' + escape(text) + '" aria-label="' + escape(text) + '"><div style="--height:' +
        count / peak * 100 + '%"></div><span>' + (data.daily.length <= 7 || index === 0 || index === data.daily.length - 1 ? escape(date) : '') + '</span></li>';
    }).join('') + '</ol></section><div class="stats-splits">' +
    rows('Traffic sources', data.sources) + rows('Devices', data.devices) +
    rows('Sections viewed', breakdown('section')) + rows('Projects opened', breakdown('project')) +
    rows('Links clicked', breakdown('outbound')) + rows('Intro and build', breakdown('experience')) +
    '</div><section class="stats-panel"><h2>Recent visitors</h2>' + (data.latest.length
      ? '<div class="stats-visitors">' + data.latest.map((visitor) =>
        '<article><header><strong>Visitor ' + escape(visitor.visitor) + '</strong><span>' +
        escape(label(visitor.device)) + ' · ' + escape(label(visitor.source)) + '</span><time datetime="' +
        escape(visitor.last_seen) + '">' + escape(dateFormat.format(new Date(visitor.last_seen))) + '</time></header>' +
        (visitor.actions.length ? '<ul>' + visitor.actions.map((action) =>
          '<li>' + escape(activityLabel(action)) + '</li>').join('') + '</ul>' : '<p class="stats-muted">Arrived at the intro.</p>') +
        '</article>').join('') + '</div>' : '<p class="stats-muted">No visits in this period.</p>') +
    '</section><p class="stats-muted">Stats start from the day tracking was added. Visitors are anonymous unless they sign the wall.</p>';
}
