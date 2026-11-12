const prompt = `You are my AI web-design toolkit setup agent and senior frontend design researcher. Set up my coding agent with reliable design skills so they are ready for future website projects.

SETUP ONLY
Do not build, redesign, or change this website's source code or content. Inspect the current project and its existing agent configuration first. Preserve unrelated files and settings.

1. DETECT AND CHECK
Identify the coding agent I am using (Codex, Claude Code, Cursor, or another agent), the project-local install scope it supports, and whether Node.js, npm, and required tools are available. Do not guess an agent identifier or installation command.

2. REVIEW OFFICIAL SOURCES
Read the installation instructions from each official repository before running anything:
- Frontend Design by Anthropic: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- UI/UX Pro Max by NextLevelBuilder: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Impeccable by Paul Bakaus: https://github.com/pbakaus/impeccable
- Web Design Guidelines by Vercel: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines

3. INSTALL THESE FOUR FOR THIS PROJECT
Use their official project-local installation methods and the correct identifier for my detected agent. These are suggested commands; verify them against the current official instructions first:
npx skills add anthropics/skills --skill frontend-design
npx ui-ux-pro-max-cli init --ai AGENT_ID
npx impeccable install
npx skills add vercel-labs/agent-skills --skill web-design-guidelines

Do not install globally when a project-local option exists. If an installer would overwrite unrelated files or existing configuration, stop and explain the exact conflict before changing it. If a permission prompt is required, explain what it grants and wait for my approval.

4. FIND MORE USEFUL SKILLS
Look through trustworthy skill catalogs and official repositories for other skills that would help with future frontend work, such as accessibility, responsive design, performance, animation, or design review. Verify each candidate's source and instructions. Do not install a pile of loosely related skills: keep a short, relevant list and distinguish installed skills from recommendations.

5. LEAVE A FUTURE REFERENCE
Create a project-local file named AI-WEB-DESIGN-SKILLS.md with the installed skills, official links, what each is for, how I invoke it in this agent, the verified install commands, any reload/restart step, and a short list of useful additional candidates. If that file already exists, preserve its contents and add a clearly marked section instead of replacing it. Use the installed skills for later website tasks in this project when relevant.

6. VERIFY AND REPORT
Check that each of the four skills is present and discoverable by my coding agent. Clearly report installed, failed, and recommended-but-not-installed skills separately. Tell me exactly how to invoke each installed skill and whether I need to reload the agent. Do not claim success without checking.

STOP AFTER SETUP
Do not start a website project in this task. Leave the site ready for the next one.`;

const skills = [
  {
    name: 'Frontend Design', maker: 'Anthropic',
    url: 'https://github.com/anthropics/skills/tree/main/skills/frontend-design',
    line: 'Make your AI build something that actually looks designed.',
    body: 'Most AI-generated websites have no clear visual identity. Frontend Design asks your coding agent to consider typography, layout, color, hierarchy, motion, and responsive behavior before it ships a page.',
    install: 'npx skills add anthropics/skills --skill frontend-design',
    example: 'Use the frontend-design skill to build a portfolio with oversized editorial typography, asymmetrical layouts, a monochrome palette, and one memorable scroll-driven interaction. Avoid generic SaaS components.',
    when: 'Creating a new website or completely redesigning an existing one.',
  },
  {
    name: 'UI/UX Pro Max', maker: 'NextLevelBuilder',
    url: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
    line: 'Stop guessing your colors, fonts, and layouts.',
    body: 'Good design comes from decisions that work together. UI/UX Pro Max offers searchable references for interface styles, palettes, typography pairings, UX patterns, and design-system generation.',
    install: 'npx ui-ux-pro-max-cli init --ai codex',
    example: 'Use UI/UX Pro Max to recommend a cohesive design system for my creative developer portfolio. Define the typography, colors, spacing, component styles, and interaction patterns before implementation.',
    when: 'Establishing a consistent visual identity across multiple pages or components.',
  },
  {
    name: 'Impeccable', maker: 'Paul Bakaus',
    url: 'https://github.com/pbakaus/impeccable',
    line: 'Your website looks okay. Now make it feel finished.',
    body: 'An existing site may need stronger hierarchy, cleaner typography, better spacing, and more intentional animation. Impeccable provides focused commands to critique and refine the interface.',
    install: 'npx impeccable install',
    example: 'Use Impeccable to critique and polish my homepage. Preserve the existing brand identity, but improve spacing, typography, responsive behavior, and the overall visual hierarchy.',
    when: 'Improving a website that feels unfinished or generic.',
  },
  {
    name: 'Web Design Guidelines', maker: 'Vercel',
    url: 'https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines',
    line: 'A beautiful website still needs to be easy to use.',
    body: 'This skill reviews interface code against usability and accessibility guidance: keyboard access, clear labels, consistent interaction states, and motion that respects user preferences.',
    install: 'npx skills add vercel-labs/agent-skills --skill web-design-guidelines',
    example: 'Review my website using the web-design-guidelines skill. Identify accessibility, usability, and interaction issues. Prioritize the most important problems and fix them without changing the intended visual design.',
    when: 'Reviewing an interface before deployment.',
  },
];

const examples = [
  ['agrumea.webp', 'Agrumea Farm', 'Product scale, color, and a bold editorial composition.', 'Agrumea Farm website showing oversized jars arranged over a burgundy shape.'],
  ['bennys-light.webp', 'Benny’s Light', 'Typography carries the visual idea; an image breaks through it.', 'Benny’s Light poster with oversized cream type and a central figure.'],
  ['linear.webp', 'Linear', 'Quiet interface details under a strong, readable headline.', 'Linear website with a large headline and a dark product interface.'],
  ['floema.webp', 'Floema', 'A memorable visual centerpiece inside a restrained frame.', 'Floema website with a sculptural natural stone letterform.'],
];

const gallery = '<div class="journal-gallery">' + examples.map(([image, , , alt]) =>
  '<figure class="journal-shot" data-part="media"><div class="media-frame"><img src="/journal/' + image + '" alt="' + alt + '" loading="lazy" decoding="async"></div>' +
  '</figure>').join('') + '</div>';

const repoImages = [
  ['frontend-design', 'Anthropic logo', 'Anthropic · official repository owner', true],
  ['ui-ux-pro-max', 'UI/UX Pro Max website showcase from its official repository', 'UI/UX Pro Max · official project showcase', false],
  ['impeccable', 'Villa Castagneto design example published in the Impeccable repository', 'Design example from the Impeccable repository', false],
  ['web-design-guidelines', 'Vercel Labs logo', 'Vercel Labs · official repository owner', true],
];
const skillSections = skills.map((skill, index) =>
  '<section class="journal-skill has-repo-image"><aside class="journal-repo">' +
  '<figure class="journal-repo-preview"><a href="' + skill.url + '" target="_blank" rel="noopener noreferrer"><img class="' + (repoImages[index][3] ? 'repo-logo' : 'repo-shot') + '" src="/journal/' + repoImages[index][0] + '-repo.webp" alt="' + repoImages[index][1] + '" loading="lazy" decoding="async"></a></figure></aside>' +
  '<div class="journal-copy" data-part="copy"><h2>' + skill.name + '</h2><p class="journal-deck"><em>' + skill.line + '</em></p>' +
  '<p>' + skill.body + '</p><p>It focuses on:</p><ul>' + (index === 0
    ? '<li>Typography that gives your website personality.</li><li>Layouts beyond the same cards and grids.</li><li>Intentional color palettes, hierarchy, and motion.</li><li>Responsive, functional interfaces instead of static mockups.</li>'
    : index === 1
      ? '<li>UI styles and searchable design references.</li><li>Color palettes and typography pairings.</li><li>UX recommendations and design-system generation.</li>'
      : index === 2
        ? '<li><code>polish</code> for a final visual refinement.</li><li><code>critique</code> for finding design weaknesses.</li><li><code>typeset</code> and <code>layout</code> for typography and composition.</li><li><code>animate</code> and <code>audit</code> for motion and usability.</li>'
        : '<li>Keyboard navigation.</li><li>Clearly labeled controls.</li><li>Consistent interaction states.</li><li>Reduced-motion support.</li>') +
  '</ul><p><strong>Official repository:</strong> <a href="' + skill.url + '" target="_blank" rel="noopener noreferrer">' + skill.url + ' ↗</a></p>' +
  '<p><strong>Install:</strong></p><pre><code>' + skill.install + '</code></pre>' +
  (index === 1 ? '<p>For Claude Code, replace <code>codex</code> with <code>claude</code> in the init command.</p>' : '') +
  (index === 2 ? '<p>Reload your coding agent after installation. In Codex use <code>$impeccable init</code>; in Claude Code use <code>/impeccable init</code>.</p>' : '') +
  '<p><strong>Example prompt:</strong></p><blockquote>“' + skill.example + '”</blockquote><p><strong>When to use it:</strong> ' + skill.when + '</p></div></section>'
).join('');

export const journalContent = '<header class="journal-hero">' +
  '<h1>4 AI skills that make your websites look <em>insane.</em></h1>' +
  '<div class="journal-hero-bottom"><p data-part="copy">Stop building websites that look AI-generated. Give your coding agent better design direction, stronger systems, and a real review process.</p>' +
  '<div class="journal-copy-cta"><svg class="journal-arrow-draw" viewBox="0 0 240 150" aria-hidden="true"><path class="journal-arrow-line" pathLength="1" d="M 12 55 C 74 -4 162 20 214 126"/><path class="journal-arrow-head" pathLength="1" d="M 179 99 L 214 126 L 214 74"/></svg>' +
  '<button class="journal-copy-prompt" type="button" data-copy-prompt>Copy the master prompt</button></div></div></header>' +
  '<div class="journal-velocity" aria-hidden="true"><div>DESIGN DIRECTION&nbsp; ✳ &nbsp;VISUAL SYSTEMS&nbsp; ✳ &nbsp;POLISH&nbsp; ✳ &nbsp;USABILITY&nbsp; ✳ &nbsp;</div><div>DESIGN DIRECTION&nbsp; ✳ &nbsp;VISUAL SYSTEMS&nbsp; ✳ &nbsp;POLISH&nbsp; ✳ &nbsp;USABILITY&nbsp; ✳ &nbsp;</div></div>' +
  '<div class="journal-article"><section class="journal-copy" data-part="copy"><p>You prompt Claude or GPT for a website. It gives you the same rounded cards, predictable layout, random gradients, and animations you have seen a thousand times.</p><p>The code works. The website looks fine. But nothing about it stands out.</p><p>The problem is not always the model. It is how much design direction you give it. Agent skills add focused instructions, design references, and review workflows instead of making you explain good UI from scratch every time.</p><p>Here are four worth exploring, plus a complete copy-and-paste prompt and a soft monochrome preset.</p><h2>Study the details.</h2></section>' + gallery + skillSections +
  '<section class="journal-skill"><div class="journal-copy" data-part="copy"><h2>How to use all four together</h2><ol><li><strong>Define the design.</strong> Use UI/UX Pro Max to establish typography, spacing, color, and layout principles.</li><li><strong>Build.</strong> Use Frontend Design to make a distinctive, working interface.</li><li><strong>Refine.</strong> Use Impeccable to critique the result and polish weak spots.</li><li><strong>Review.</strong> Use Web Design Guidelines to find usability and accessibility issues before shipping.</li></ol><p>Then test it yourself on desktop and phone. Click every button, check navigation, and make sure motion respects reduced-motion preferences. Skills can guide decisions, but they do not replace looking at the finished site.</p></div></section>' +
  '<section class="journal-skill"><div class="journal-copy" data-part="copy"><h2>Soft monochrome</h2><p>A reusable visual direction, not another downloadable skill: minimal, experimental, editorial, and slightly cinematic. Typography and movement do most of the visual work.</p><p><strong>Colors:</strong> background <code>#0B0B0B</code>, primary text <code>#F6F5F1</code>, secondary text <code>#C8C8C8</code>, borders <code>#303030</code>, secondary surfaces <code>#181818</code>.</p><p><strong>Use:</strong> oversized expressive headlines, simple body text, large hero sections, asymmetrical compositions, negative space, restrained rounded components, subtle hover feedback, and one memorable hero animation. Design mobile layouts intentionally and respect reduced motion.</p><p><strong>Avoid:</strong> unnecessary purple gradients, excessive glow, generic SaaS grids, random decoration, purposeless animation, and repeating the same card everywhere.</p><p>Make the website memorable without making it complicated to use.</p></div></section>' +
  '<section class="journal-prompt" id="master-prompt"><div class="journal-copy" data-part="copy"><p>Paste this into your coding agent from your project folder. It will install the toolkit, find useful additions, and save a reference for future work.</p><pre tabindex="0" aria-label="Master prompt"><code>' + prompt + '</code></pre><button class="journal-copy-prompt" type="button" data-copy-prompt>Copy the master prompt</button></div></section>' +
  '<section class="journal-skill"><div class="journal-copy" data-part="copy"><h2>Useful tools, not magic.</h2><ol><li><strong>These are agent skills, not magic prompts.</strong> They work with compatible coding tools that can load instructions and access your project. Typing their names into a normal chat does not install them.</li><li><strong>Not every project needs all four.</strong> Frontend Design might be enough for a quick landing page; Impeccable may be more useful on a site that already exists.</li><li><strong>More animation is not automatically better.</strong> Two useful scroll effects can be better than twenty. Removing clutter can do more than adding another library.</li><li><strong>Do not blindly trust the output.</strong> Review unfamiliar installation commands and test what your agent produces. A skill guides the agent; it does not guarantee the result.</li></ol></div></section>' +
  '<section class="journal-skill journal-ending"><div class="journal-copy" data-part="copy"><h2>Generate less. <em>Design better.</em></h2><p>AI has made building websites ridiculously accessible. But generating a website and designing a good one are different things. You can have perfect code and a completely forgettable interface.</p><p>These four skills give coding agents more direction around design, consistency, refinement, and usability. Study websites you like. Figure out what makes their typography, layouts, and interactions work. Then build something of your own.</p><p class="journal-last-line">Don’t just generate more websites. Build better ones.</p><p>If you found this through my Instagram carousel, that’s the complete setup. More website designs, presets, prompts, and tools coming soon.</p><p><strong>Swarit Sawarkar</strong><br><a href="https://swaritsawarkar.s3r0.com">swaritsawarkar.s3r0.com ↗</a></p></div></section></div>';

export function mountJournal(root, promptText = prompt) {
  const status = document.createElement('p');
  status.className = 'journal-copy-status';
  status.setAttribute('role', 'status');
  root.querySelector('.journal-hero-bottom').append(status);
  root.addEventListener('error', (event) => {
    const preview = event.target.closest?.('.journal-repo-preview');
    if (!preview) return;
    preview.closest('.journal-skill').classList.remove('has-repo-image');
    preview.remove();
  }, true);
  let resetTimer;
  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-prompt]');
    if (!button) return;
    const buttons = root.querySelectorAll('[data-copy-prompt]');
    clearTimeout(resetTimer);
    buttons.forEach((item) => { item.textContent = 'Copying…'; item.disabled = true; item.dataset.copyState = 'loading'; });
    try {
      await navigator.clipboard.writeText(promptText);
      buttons.forEach((item) => { item.textContent = 'Copied'; item.dataset.copyState = 'success'; });
      status.textContent = 'Master prompt copied to clipboard.';
    } catch {
      buttons.forEach((item) => { item.textContent = 'Try copying again'; item.dataset.copyState = 'error'; });
      status.textContent = 'Clipboard access failed. Select the prompt below and copy it manually.';
      root.querySelector('#master-prompt pre').focus();
    } finally {
      buttons.forEach((item) => { item.disabled = false; });
      resetTimer = setTimeout(() => buttons.forEach((item) => { item.textContent = 'Copy the master prompt'; item.dataset.copyState = 'idle'; }), 2200);
    }
  });
}
