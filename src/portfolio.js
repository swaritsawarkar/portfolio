import { projects } from './data/projects';
import { genZCoverItem, davinciPanels, davinciPosterSeries, davinciTeamSeries } from './data/creative';
import { mountPhotoCarousel } from './photo-carousel.js';
import { mountSigningWall, signingWall } from './signing-wall.js';
import { track } from './portfolio-analytics.js';
import './portfolio.css';

const base = import.meta.env.BASE_URL;
const photo = (name) => base + 'photos/' + name;
const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const arrow = '<span aria-hidden="true">↗</span>';
const link = (text, href, attributes = '') => '<a href="' + escape(href) + '" ' + attributes + '>' + escape(text) + '</a>';

function frame(src, alt) {
  return '<figure><div class="media-frame" data-part="media"><img src="' + escape(src) +
    '" alt="' + escape(alt) + '" loading="lazy" decoding="async"></div></figure>';
}

function chapter(id, title, description, content) {
  return '<section class="chapter" id="' + id + '" data-scene aria-labelledby="' + id + '-title">' +
    '<header class="chapter-head">' +
    '<h2 id="' + id + '-title" data-part="type">' + title +
    '</h2>' + (description ? '<p data-part="copy">' + description + '</p>' : '') + '</header>' + content + '</section>';
}

const featured = ['strikeout-os', 'pixelcut-pro', '10thhojayega']
  .map((slug) => projects.find((project) => project.slug === slug));
const mu20Win = 'MU20 Hackathon winner with STRIKEOUT · ₹35,000 prize.';
const wins = [
  ['mu20', 1500, 2000, mu20Win],
  ['wsro-national', 414, 572, 'WSRO Nationals', 'Robo Race · second place'],
  ['amd-award', 517, 582, 'AMD Build Masters', 'Event photo'],
  ['wsro-regional', 444, 598, 'WSRO Regionals', 'Robo Race qualifier'],
  ['amd-fifa', 478, 616, 'AMD Build Masters FIFA', '2025'],
  ['ai-ignite', 462, 446, 'AI Ignite', '2026'],
];
const photoRatio = ([, width, height]) => width / height;

function winPhoto(entry, index) {
  const [file, width, height, title] = entry;
  const src = photo(file + '.webp');
  return '<figure class="win-photo" style="--photo-ratio:' + photoRatio(entry) + ';--slide-progress:' +
    index / (wins.length - 1) + '"><div class="media-frame" data-part="media"><img src="' + src + '" alt="' + escape(title) + '" width="' + width +
    '" height="' + height + '" loading="lazy" decoding="async"></div></figure>';
}
const timeline = [
  ['2023', ['Entered boarding school', 'NUS + NTU Data Science Workshop', 'SGFI football · state level']],
  ['2024', ['Indian Debating League · national qualifier', 'Harvard Sustainability Summit at FLAME University']],
  ['2025', ['Robo Race Nationals · second place', 'SBI Life Spell Bee · national top 20', 'Technoxian']],
  ['2026', [mu20Win, 'One Million Founders · Five-day program covering ideas, prototypes, and pitching.',
    'Team Captain, DaVinci 027', 'Shoolini Summer Lab Program',
    'WSRO Nationals Junior Drone · top eight', 'Blix · top ten', 'Round Square Zoom Postcard',
    'AI Ignite Bootcamp', 'The Innovation Story AI + Robotics Bootcamp', 'IIT Madras eight-week course']],
];
const skills = [
  ['Programming', [['Python', 'python.svg'], ['JavaScript', 'javascript.svg'], ['TypeScript', 'typescript.svg'],
    ['React', 'react.svg'], ['HTML', 'html5.svg'], ['CSS', 'css.svg'], ['C++', 'cplusplus.svg'], ['Arduino', 'arduino.svg']]],
  ['AI & automation', [['ChatGPT', 'chatgpt.png'], ['Google Gemini', 'googlegemini.svg'], ['Anthropic', 'anthropic.svg'],
    ['LangChain', 'langchain.svg'], ['n8n', 'n8n.svg'], ['YouTube API', 'youtube.svg'], ['Auth0', 'auth0.svg']]],
  ['Backend & tools', [['SQLite', 'sqlite.svg'], ['Streamlit', 'streamlit.svg'], ['FFmpeg', 'ffmpeg.svg'],
    ['Git', 'git.svg'], ['GitHub', 'github.svg'], ['Vercel', 'vercel.svg']]],
  ['Creative', [['Premiere Pro', 'premierepro.png'], ['After Effects', 'aftereffects.png'], ['Photoshop', 'photoshop.png'],
    ['Notion', 'notion.svg'], ['YouTube', 'youtube.svg'], ['Instagram', 'instagram.svg']]],
];
const socials = [
  ['GitHub', 'https://github.com/swaritsawarkar', '<img src="' + base + 'skills/github.svg" alt="">'],
  ['LinkedIn', 'https://www.linkedin.com/in/swarit-sawarkar-48385b368/',
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M5 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.3 10h3.4v10H3.3V10Zm6.3 0h3.2v1.4a3.6 3.6 0 0 1 3.1-1.7c3.3 0 4.1 2 4.1 4.7V20h-3.4v-5c0-1.2-.1-2.6-1.7-2.6s-1.9 1.3-1.9 2.5V20H9.6V10Z"/></svg>'],
  ['Instagram', 'https://instagram.com/swaritlol', '<img src="' + base + 'skills/instagram.svg" alt="">'],
  ['Spotify', 'https://open.spotify.com/user/3142zzj7ecghcqkrqvytezbznjui',
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 0a12 12 0 100 24 12 12 0 000-24zm5.5 17.3a.75.75 0 01-1 .25c-2.7-1.65-6.1-2-10.1-1.1a.75.75 0 11-.33-1.46c4.36-1 8.1-.59 11.1 1.25.36.21.47.7.33 1.06zm1.47-3.27a.94.94 0 01-1.28.31c-3.1-1.9-7.83-2.46-11.5-1.34a.94.94 0 11-.55-1.8c4.2-1.27 9.4-.66 12.96 1.55.43.27.57.85.37 1.28zm.13-3.4C15.4 8.5 8.6 8.27 5.06 9.34a1.13 1.13 0 11-.66-2.16c4.07-1.24 11.6-1 16.04 1.65a1.13 1.13 0 01-1.16 1.94z"/></svg>'],
];

function projectDetails(project) {
  const media = project.media?.filter((item) => item.kind === 'image') ?? [];
  return '<div class="project-body"><p>' + escape(project.desc) + '</p>' +
    (project.features?.length ? '<ul>' + project.features.map((feature) => '<li>' + escape(feature) + '</li>').join('') + '</ul>' : '') +
    '<p class="stack">' + escape(project.stack.join(' / ')) + '</p><div class="inline-links">' +
    project.links.map(({label, href}) => link(label, href)).join('') + '</div>' +
    (media.length ? '<div class="media-grid">' + media.map(({src, alt}) => frame(src, alt)).join('') + '</div>' : '') +
    '</div>';
}

function feature({slug, media, name, summary, links}) {
  const lead = slug === 'strikeout-os';
  const [image] = media;
  return '<article class="work-feature' + (lead ? ' work-lead' : '') + '">' +
    '<div class="work-image" data-part="frame"><img data-part="media" src="' + escape(image.src) + '" alt="' + escape(image.alt) +
    '" loading="lazy" decoding="async"></div><div class="work-caption">' +
    '<h3 data-part="type">' + escape(name) + '</h3>' +
    '<p class="work-summary" data-part="copy">' + escape(summary) + '</p>' +
    '<div class="work-links">' +
    links.filter(({label}) => label === 'Visit website' || label === 'View on GitHub')
      .map(({label, href}) => link(label === 'Visit website' ? 'Visit site ↗' : 'GitHub ↗', href, 'data-part="link"')).join('') +
    link('Project details ↗', '#' + slug, 'data-part="link" data-project aria-haspopup="dialog" aria-label="' +
      escape(name + ' project details') + '"') + '</div></div></article>';
}

function mountWorkDialogs(root) {
  const dialog = root.querySelector('.work-dialog');
  const heading = dialog.querySelector('h2');
  const content = dialog.querySelector('.work-dialog-content');
  const close = dialog.querySelector('.work-close');
  const archiveButton = root.querySelector('[data-work-archive]');
  const archive = '<div class="work-archive-grid">' + projects.filter((project) => !featured.includes(project)).map((project) => {
    const image = project.media?.find(({kind}) => kind === 'image');
    return '<a href="#' + escape(project.slug) + '" data-project class="work-archive-item">' +
      (image ? '<img src="' + escape(image.src) + '" alt="' + escape(image.alt) + '" loading="lazy">' : '') +
      '<strong>' + escape(project.name) + '</strong><p>' +
      escape(project.summary) + '</p></a>';
  }).join('') + '</div>';
  let opener;
  let returnHash = '';
  let fromArchive = false;

  function show(project, trigger) {
    if (!dialog.open) {
      opener = trigger;
      returnHash = location.hash === '#' + project?.slug ? '#work' : location.hash;
      fromArchive = false;
    }
    heading.textContent = project?.name ?? 'More experiments';
    content.innerHTML = project
      ? (fromArchive ? '<button type="button" class="work-back" data-work-back>← All experiments</button>' : '') + projectDetails(project)
      : archive;
    if (!dialog.open) dialog.showModal();
    if (project) track('project', project.slug);
    dialog.scrollTop = 0;
    close.focus({ preventScroll: true });
  }

  function showHash(hash = location.hash) {
    if (root.inert) return false;
    const project = projects.find(({slug}) => hash === '#' + slug);
    if (!project) {
      if (dialog.open && heading.textContent !== 'More experiments') dialog.close();
      return false;
    }
    const trigger = [...root.querySelectorAll('.work-feature [data-project]')]
      .find((anchor) => anchor.hash === hash) ?? archiveButton;
    if (location.hash !== hash) history.replaceState(history.state, '', hash);
    if (!dialog.open) trigger.closest('.work-feature, #work').scrollIntoView({ block: 'start', behavior: 'instant' });
    show(project, trigger);
    return true;
  }

  root.addEventListener('click', (event) => {
    const anchor = event.target.closest('[data-project]');
    if (anchor && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      const project = projects.find(({slug}) => anchor.hash === '#' + slug);
      if (!project) return;
      event.preventDefault();
      if (dialog.open && heading.textContent === 'More experiments') fromArchive = true;
      show(project, anchor);
      if (location.hash !== anchor.hash) history.pushState(history.state, '', anchor.hash);
    } else if (event.target.closest('[data-work-archive], [data-work-back]')) {
      if (dialog.open && projects.some(({slug}) => location.hash === '#' + slug)) {
        history.replaceState(history.state, '', returnHash || location.pathname + location.search);
      }
      show(null, archiveButton);
    }
  });
  dialog.addEventListener('close', () => {
    if (projects.some(({slug}) => location.hash === '#' + slug)) {
      history.replaceState(history.state, '', returnHash || location.pathname + location.search);
    }
    opener?.focus({ preventScroll: true });
  });
  window.addEventListener('hashchange', () => showHash());
  return showHash;
}

export function mountPortfolio(root) {
  const work = '<div class="work-grid">' + featured.map(feature).join('') + '</div>' +
    '<button type="button" class="work-more" data-work-archive data-part="link" aria-haspopup="dialog">More experiments ↗</button>' +
    '<dialog class="work-dialog" aria-labelledby="work-dialog-title"><header><h2 id="work-dialog-title"></h2>' +
    '<form method="dialog"><button class="work-close" aria-label="Close project panel">Close <span aria-hidden="true">×</span></button></form>' +
    '</header><div class="work-dialog-content"></div></dialog>';
  const creative = '<div class="creative-grid">' +
    frame(genZCoverItem.src, genZCoverItem.alt) +
    frame(davinciTeamSeries[0].src, davinciTeamSeries[0].alt) + '</div>' +
    '<details class="creative-archive"><summary data-part="copy">DaVinci design archive <span aria-hidden="true">+</span></summary>' +
    '<div class="media-grid">' + [...davinciPanels, ...davinciPosterSeries, ...davinciTeamSeries.slice(1)]
      .map(({src, alt}) => frame(src, alt)).join('') + '</div></details>';
  const about = '<div class="about-grid"><h3 class="statement" data-part="copy">I build things, race drones, and turn ideas into reality.</h3>' +
    '<div class="about-copy"><p data-part="copy">I\'m Swarit Sawarkar, a 15-year-old developer, maker, and creative. ' +
    'My interests span AI, coding, software development, robotics, FPV drones, video editing, and digital design. ' +
    'I love experimenting with technology, learning things on my own, and turning random ideas into actual projects.</p>' +
    '<p data-part="copy">I\'ve built software like LOCK IN, helped create the hackathon-winning STRIKEOUT, and competed nationally in robotics. ' +
    'Outside of engineering, I\'m into FPV flying, filmmaking, content creation, and writing about how the internet shapes our generation.</p>' +
    '<p data-part="copy">I don\'t really stick to one field. I enjoy the process of figuring things out, building something from scratch, ' +
    'and seeing how far I can take it.</p></div></div>';
  const achievements = '<div class="wins-carousel" role="region" aria-label="Achievements photos"><div class="wins-stage">' +
    '<div class="wins-rail" id="wins-photos" tabindex="0" aria-label="Achievement photos">' + wins.map(winPhoto).join('') + '</div>' +
    '<div class="wins-controls" data-part="link"><span class="wins-count" aria-live="off">01 / 06</span><div>' +
    '<button type="button" data-photo-step="-1" aria-label="Previous photo" aria-controls="wins-photos" aria-disabled="true">←</button>' +
    '<button type="button" data-photo-step="1" aria-label="Next photo" aria-controls="wins-photos">→</button>' +
    '</div></div></div></div>' +
    '<p class="milestone" data-part="copy">SBI Life Spell Bee · National top 20</p>' +
    link('Watch on JioHotstar ↗', 'https://www.hotstar.com/in/shows/sbi-life-spell-bee-in-association-with-mirchi/1971311981',
      'class="text-link" data-part="link"');
  const history = '<div class="timeline-list">' + timeline.map(([year, entries]) =>
    '<div class="timeline-year"><strong data-part="box">' + year + '</strong><ul>' +
    entries.map((entry, index) => '<li data-part="' + (index % 2 === 0 ? 'copy' : 'link') + '">' +
      escape(entry) + '</li>').join('') + '</ul></div>').join('') + '</div>';
  const stack = '<div class="skills-grid">' + skills.map(([title, tools]) =>
    '<section class="skill-row"><h3 data-part="copy">' + escape(title) + '</h3><ul aria-label="' + escape(title) + '">' +
    tools.map(([name, icon]) => '<li data-part="skill"><button class="skill-tile" type="button" aria-label="' + escape(name) + '" aria-pressed="false">' +
      '<img src="' + base + 'skills/' + icon + '" width="42" height="42" alt="" decoding="async">' +
      '<span aria-hidden="true">' + escape(name) + '</span></button></li>').join('') + '</ul></section>').join('') + '</div>';
  const contact = '<div class="contact-grid"><div class="contact-mail" data-part="box">' +
    '<a href="mailto:sawarkarswarit@gmail.com">sawarkarswarit@gmail.com ' + arrow + '</a></div>' +
    '<div class="social-links">' + socials.map(([name, href, icon]) => '<a href="' + escape(href) +
      '" aria-label="' + escape(name) + '" title="' + escape(name) + '" data-part="link">' + icon + '</a>').join('') + '</div></div>';

  root.innerHTML = '<main class="portfolio-shell">' +
    '<section class="hero-scene" id="home" data-scene aria-labelledby="portfolio-name">' +
    '<nav class="portfolio-nav" aria-label="Portfolio"><a class="wordmark" href="#home" data-part="link">Swarit Sawarkar</a>' +
    '<div><a href="#work" data-part="link">Work</a><a href="#creative" data-part="link">Creative</a>' +
    '<a href="/journal" data-part="link">Journal</a><a href="#about" data-part="link">About</a><a href="#contact" data-part="link">Contact</a></div></nav>' +
    '<div class="hero-grid"><div class="hero-type"><h1 id="portfolio-name" tabindex="-1" data-part="type"><span>Swarit</span><span>Sawarkar</span></h1>' +
    '<p class="hero-deck" data-part="copy">Robotics, software, and visual systems.</p>' +
    '<a class="hero-link" href="#work" data-part="link">Explore work <span aria-hidden="true">↘</span></a></div>' +
    '<figure class="portrait"><picture><source media="(max-width: 720px)" srcset="' + photo('swarit-mobile.webp') + '">' +
    '<img src="' + photo('swarit.png') + '" alt="Portrait of Swarit Sawarkar" width="1254" height="1254" fetchpriority="high" decoding="async"></picture></figure></div></section>' +
    chapter('work', 'Work.', 'Software, experiments, and prototypes.', work) +
    chapter('creative', 'Creative.', 'Cover design and visual systems for DaVinci 027.', creative) +
    chapter('journal', 'Journal.', 'Notes on design, tools, and things I’m building.',
      '<a class="text-link" href="/journal" data-part="link">Read the journal ↗</a>') +
    chapter('about', 'About.', '<strong>Developer · FPV Enthusiast · Creator</strong>', about) +
    chapter('achievements', 'Field notes.', 'Photos from competitions and events.', achievements) +
    chapter('timeline', 'Along the way.', 'School, competitions, and projects since 2023.', history) +
    chapter('skills', 'Skills.', '', stack) +
    chapter('signatures', 'Sign the wall.', 'Draw anywhere there’s room and leave your name under your mark.', signingWall) +
    chapter('contact', 'Contact.', 'Get in touch.', contact) + '</main>';

  mountPhotoCarousel(root.querySelector('.wins-carousel'));
  mountSigningWall(root.querySelector('#signatures'));
  root.addEventListener('click', (event) => {
    const skill = event.target.closest('.skill-tile');
    if (skill) {
      const selected = root.querySelector('.skill-tile[aria-pressed="true"]');
      selected?.setAttribute('aria-pressed', 'false');
      if (skill !== selected) skill.setAttribute('aria-pressed', 'true');
    }
  });
  return mountWorkDialogs(root);
}
