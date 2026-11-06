import { projects } from './data/projects';
import { genZCoverItem, davinciPanels, davinciPosterSeries, davinciTeamSeries } from './data/creative';
import { mountPhotoCarousel } from './photo-carousel.js';
import './portfolio.css';

const base = import.meta.env.BASE_URL;
const photo = (name) => base + 'photos/' + name;
const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const arrow = '<span aria-hidden="true">↗</span>';
const link = (text, href, attributes = '') => '<a href="' + escape(href) + '" ' + attributes + '>' + escape(text) + '</a>';

function frame(src, alt, caption, className = '') {
  return '<figure class="' + className + '" data-part="box"><div class="media-frame"><img src="' + escape(src) +
    '" alt="' + escape(alt) + '" loading="lazy" decoding="async"></div><figcaption>' + escape(caption) + '</figcaption></figure>';
}

function chapter(id, title, description, content, label) {
  return '<section class="chapter" id="' + id + '" data-scene aria-labelledby="' + id + '-title">' +
    '<header class="chapter-head">' + (label ? '<span class="chapter-label">' + label + '</span>' : '') +
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
  const [file, width, height, title, note] = entry;
  const src = photo(file + '.webp');
  return '<figure class="win-photo" data-part="box" style="--photo-ratio:' + photoRatio(entry) + ';--slide-progress:' +
    index / (wins.length - 1) + '"><div class="media-frame"><img src="' + src + '" alt="' + escape(title) + '" width="' + width +
    '" height="' + height + '" loading="lazy" decoding="async"></div><figcaption><strong>' + escape(title) +
    '</strong>' + (note ? '<span>' + escape(note) + '</span>' : '') + '</figcaption></figure>';
}
const timeline = [
  ['2023', ['Entered boarding school', 'NUS + NTU Data Science Workshop', 'SGFI football · state level']],
  ['2024', ['Indian Debating League · national qualifier', 'Harvard Sustainability Summit at FLAME University']],
  ['2025', ['Robo Race Nationals · second place', 'SBI Life Spell Bee · national top 20', 'Technoxian', 'Ex-CMO, MUNIFY']],
  ['2026', [mu20Win, 'One Million Founders · Five-day program covering ideas, prototypes, and pitching.',
    'Team Captain, DaVinci 027', 'Shoolini Summer Lab Program', 'Technical Head, Content Creation Club',
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

function projectRow(project) {
  const media = project.media?.filter((item) => item.kind === 'image') ?? [];
  return '<details class="project-row" id="' + escape(project.slug) + '" data-part="box">' +
    '<summary><span class="row-number">' + escape(project.n) + '</span><strong>' + escape(project.name) +
    '</strong><span class="row-summary">' + escape(project.summary) + '</span><span class="row-plus" aria-hidden="true">+</span></summary>' +
    '<div class="project-body"><p>' + escape(project.desc) + '</p>' +
    (project.features?.length ? '<ul>' + project.features.map((feature) => '<li>' + escape(feature) + '</li>').join('') + '</ul>' : '') +
    '<p class="stack">' + escape(project.stack.join(' / ')) + '</p><div class="inline-links">' +
    project.links.map(({label, href}) => link(label, href)).join('') + '</div>' +
    (media.length ? '<div class="media-grid">' + media.map(({src, alt, caption}) => frame(src, alt, caption)).join('') + '</div>' : '') +
    '</div></details>';
}

export function mountPortfolio(root) {
  const work = '<div class="feature-grid">' + featured.map(({slug, media, name, summary}) =>
    (slug === 'strikeout-os' ? '<div class="feature-lead">' : '<div>') +
    frame(media[0].src, media[0].alt, name) + '<p class="feature-copy" data-part="copy">' + escape(summary) +
    '</p>' + link('Project details ↘', '#' + slug, 'class="text-link" data-part="link" data-project') + '</div>').join('') +
    '</div><div class="project-index">' + projects.map(projectRow).join('') + '</div>';
  const creative = '<div class="creative-grid">' +
    frame(genZCoverItem.src, genZCoverItem.alt, genZCoverItem.caption) +
    frame(davinciTeamSeries[0].src, davinciTeamSeries[0].alt, davinciTeamSeries[0].caption) + '</div>' +
    '<details class="creative-archive" data-part="link"><summary>DaVinci design archive <span aria-hidden="true">+</span></summary>' +
    '<div class="media-grid">' + [...davinciPanels, ...davinciPosterSeries, ...davinciTeamSeries.slice(1)]
      .map(({src, alt, caption}) => frame(src, alt, caption)).join('') + '</div></details>';
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
    '<section class="skill-row"><h3 data-part="copy">' + escape(title) + '</h3><ul data-part="box" aria-label="' + escape(title) + '">' +
    tools.map(([name, icon]) => '<li><button class="skill-tile" type="button" aria-label="' + escape(name) + '" aria-pressed="false">' +
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
    '<a href="#about" data-part="link">About</a><a href="#contact" data-part="link">Contact</a></div></nav>' +
    '<div class="hero-grid"><div class="hero-type"><h1 id="portfolio-name" tabindex="-1" data-part="type"><span>Swarit</span><span>Sawarkar</span></h1>' +
    '<p class="hero-deck" data-part="copy">Robotics, software, and visual systems.</p>' +
    '<a class="hero-link" href="#work" data-part="link">Explore work <span aria-hidden="true">↘</span></a></div>' +
    '<figure class="portrait"><picture><source media="(max-width: 720px)" srcset="' + photo('swarit-mobile.webp') + '">' +
    '<img src="' + photo('swarit.png') + '" alt="Portrait of Swarit Sawarkar" width="1254" height="1254" fetchpriority="high" decoding="async"></picture></figure></div></section>' +
    chapter('work', 'Work.', 'Software, experiments, and prototypes.', work) +
    chapter('creative', 'Creative.', 'Cover design and visual systems for DaVinci 027.', creative) +
    chapter('about', 'About.', '<strong>Developer · FPV Enthusiast · Creator</strong>', about) +
    chapter('achievements', 'Field notes.', 'Photos from competitions and events.', achievements, 'Achievements') +
    chapter('timeline', 'Along the way.', 'School, competitions, and projects since 2023.', history, 'Timeline') +
    chapter('skills', 'Skills.', '', stack) +
    chapter('contact', 'Contact.', 'Get in touch.', contact) + '</main>';

  mountPhotoCarousel(root.querySelector('.wins-carousel'));
  root.addEventListener('click', (event) => {
    const anchor = event.target.closest('[data-project]');
    if (anchor) document.getElementById(anchor.hash.slice(1)).open = true;
    const skill = event.target.closest('.skill-tile');
    if (skill) {
      const selected = root.querySelector('.skill-tile[aria-pressed="true"]');
      selected?.setAttribute('aria-pressed', 'false');
      if (skill !== selected) skill.setAttribute('aria-pressed', 'true');
    }
  });
}
