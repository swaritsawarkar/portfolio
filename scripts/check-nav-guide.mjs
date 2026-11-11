import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const server = await createServer({ root, server: { port: 5178, strictPort: true }, logLevel: 'error' });
const fixtureRoot = resolve(root, 'node_modules/.cache/nav-standalone');
await mkdir(fixtureRoot, { recursive: true });
await mkdir(resolve(root, 'dist'), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let fixtureServer;
try {
  await server.listen();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.copied = text; } } }));
  const url = 'http://localhost:5178/journal/bottom-navigation-styles';
  await page.goto(url);
  await page.locator('.nav-example').last().waitFor();
  const hero = page.locator('.hero-layout');
  await page.waitForFunction(() => document.querySelector('.hero-layout').dataset.motionState === 'running');
  const transforms = () => page.locator('.hero-track').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).transform));
  const beforeMotion = await transforms();
  await page.waitForTimeout(200);
  assert.notDeepEqual(await transforms(), beforeMotion);
  const positions = () => page.locator('.hero-track').evaluateAll((nodes) => nodes.map((node) => new DOMMatrix(getComputedStyle(node).transform).m42));
  const firstPositions = await positions();
  await page.waitForTimeout(150);
  const nextPositions = await positions();
  assert.ok(nextPositions[0] < firstPositions[0] && nextPositions[1] > firstPositions[1], 'opposite column directions');
  for (const rail of await page.locator('.hero-rail').all()) {
    const sizes = await rail.locator('.hero-group').evaluateAll((nodes) => nodes.map((node) => node.offsetHeight));
    assert.equal(sizes[0], sizes[1], 'identical loop groups');
  }
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await hero.getAttribute('data-motion-state'), 'hidden');
  const hidden = await transforms();
  await page.waitForTimeout(120);
  assert.deepEqual(await transforms(), hidden);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await page.locator('.hero-rail:not([inert])').count(), 0);
  assert.equal(await page.locator('.hero-rail:not([aria-hidden="true"])').count(), 0);
  const heading = await page.locator('.hero-heading').boundingBox();
  const heroBox = await hero.boundingBox();
  assert.ok(Math.abs(heading.x + heading.width / 2 - heroBox.x - heroBox.width / 2) < 2);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const paused = await transforms();
  await page.waitForTimeout(150);
  assert.deepEqual(await transforms(), paused);
  await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
  await page.waitForTimeout(150);
  assert.notDeepEqual(await transforms(), paused);
  await page.screenshot({ path: resolve(root, 'dist/nav-hero-desktop.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('.hero-layout').dataset.motionState === 'reduced');
  assert.equal(await hero.getAttribute('data-motion-state'), 'reduced');
  assert.equal(await page.locator('[data-hero-pause]').isVisible(), false);
  assert.ok((await transforms()).every((value) => value === 'none'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const examples = page.locator('.nav-example');
  assert.equal(await examples.count(), 8);
  assert.equal(await page.locator('.example-line, .example-caution, .guide-jumps, .guide-setup, .guide-signoff, .demo-row .panel').count(), 0);
  assert.equal(await page.getByRole('heading', { name: 'Before you ship it', exact: true }).count(), 0);
  assert.equal(await page.locator('body').textContent().then(text => text.includes('A little space of your own.')), false);
  for (const nav of await page.locator('.hero-rail nav, .demo-row nav').all()) {
    assert.ok(await nav.evaluate(el => ['borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius'].every(key => parseFloat(getComputedStyle(el)[key]) > 0)), 'all navbar corners are curved');
  }
  const names = [];
  for (const section of await examples.all()) {
    const slug = await section.getAttribute('id');
    names.push(slug);
    const buttons = section.locator('button[data-destination]');
    for (const button of await buttons.all()) {
      await button.hover();
      assert.ok(await button.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius) >= 12), `${slug}: rounded hover`);
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await section.locator('button[data-destination][aria-pressed="true"]').count(), 1);
      const size = await button.boundingBox();
      assert.ok(size.width >= 48 && size.height >= 48, `${slug}: touch target ${size.width} x ${size.height}`);
      const navBox = await section.locator('.demo-row nav').boundingBox();
      assert.ok(size.x >= navBox.x && size.x + size.width <= navBox.x + navBox.width + 1, `${slug}: highlight inside navigation`);
      await button.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
      const activeBackground = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
      await page.mouse.move(0, 0);
      assert.equal(await button.evaluate((el) => getComputedStyle(el).backgroundColor), activeBackground);
    }
    await buttons.first().focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await buttons.nth(1).getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('End');
    assert.equal(await buttons.last().getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Home');
    assert.equal(await buttons.first().getAttribute('aria-pressed'), 'true');
    await section.locator('.copy-component').click();
    const source = await section.locator('.source-side code').textContent();
    assert.equal(await page.evaluate(() => window.copied), source);
    assert.equal(source, await readFile(resolve(root, `src/nav-examples/${slug}.jsx`), 'utf8'));
    await writeFile(resolve(fixtureRoot, `${slug}.jsx`), source);
  }
  await examples.first().getByRole('button', { name: 'Search', exact: true }).click();
  assert.equal(await examples.nth(1).getByRole('button', { name: 'Home', exact: true }).getAttribute('aria-pressed'), 'true');
  const center = page.locator('#center-action');
  await center.getByRole('button', { name: 'Create a note', exact: true }).click();
  await center.getByLabel('Note title', { exact: true }).fill('A working creation example');
  await page.getByRole('button', { name: 'Create note', exact: true }).click();
  assert.match(await center.locator('.demo-row [role="status"]').textContent(), /Created locally: A working creation example/);
  await center.getByRole('button', { name: 'Create a note', exact: true }).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(), 0);
  assert.equal(await hero.getAttribute('data-motion-state'), 'offscreen');
  const offscreen = await transforms();
  await page.waitForTimeout(120);
  assert.deepEqual(await transforms(), offscreen);
  await center.getByRole('button', { name: 'Create a note', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.equal(await page.locator('dialog[open]').count(), 0);
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Denied'); }; });
  await examples.first().locator('.copy-component').click();
  assert.match(await examples.first().locator('[role="status"]').textContent(), /copy it manually/);
  assert.equal(await examples.first().locator('pre').evaluate((el) => el === document.activeElement), true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await examples.first().locator('button[data-destination]').first().evaluate((el) => getComputedStyle(el).transitionDuration), '0s');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    await page.locator('.nav-example').last().waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
    for (const section of await examples.all()) {
      const copy = await section.locator('.copy-component').boundingBox();
      const nav = await section.locator('.demo-row nav').boundingBox();
      assert.ok(copy.x >= nav.x && Math.abs(copy.y - nav.y) < 80, `copy beside preview at ${width}`);
    }
    if ([1440, 390].includes(width)) await page.screenshot({ path: resolve(root, `dist/nav-guide-${width}.png`), fullPage: true });
    if (width === 390) await page.screenshot({ path: resolve(root, 'dist/nav-hero-mobile.png') });
  }
  await page.reload();
  await page.locator('.nav-example').last().waitFor();
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const phone = await touch.newPage();
  await phone.goto(url);
  await phone.locator('.nav-example').last().waitFor();
  assert.equal(await phone.evaluate(() => matchMedia('(hover:hover) and (pointer:fine)').matches), false);
  for (const section of await phone.locator('.nav-example').all()) {
    const inactive = section.locator('button[data-destination]').nth(1);
    await inactive.hover();
    assert.equal(await inactive.evaluate((el) => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
  }
  await touch.close();
  await page.goto('http://localhost:5178/journal/ai-web-design-skills');
  await page.locator('[data-copy-prompt]').first().waitFor();
  assert.equal(await page.locator('.nav-example').count(), 0);
  assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some((x) => /react-dom/.test(x.name))), false);
  for (const width of [533, 390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const mobileCopy = page.locator('.journal-copy-cta .journal-copy-prompt').first();
    const layout = await mobileCopy.evaluate((button) => ({ x: button.getBoundingClientRect().x, parentX: button.parentElement.getBoundingClientRect().x, height: button.getBoundingClientRect().height, width: button.getBoundingClientRect().width, parentWidth: button.parentElement.getBoundingClientRect().width, arrow: getComputedStyle(document.querySelector('.journal-arrow-draw')).display, pageWidth: document.documentElement.scrollWidth }));
    assert.ok(layout.height <= 58, `copy button label stays on one line at ${width}px`);
    assert.ok(Math.abs(layout.x - layout.parentX) <= 1, `copy button aligns with its content at ${width}px`);
    assert.ok(layout.width <= layout.parentWidth, `copy button fits its container at ${width}px`);
    assert.equal(layout.arrow, 'none', `decorative arrow is hidden at ${width}px`);
    assert.ok(layout.pageWidth <= width, `article has no horizontal overflow at ${width}px`);
  }

  // The copied source runs in a separate app with no portfolio CSS or helpers.
  await writeFile(resolve(fixtureRoot, 'index.html'), '<html><body><div id="root"></div><script type="module" src="/app.jsx"></script></body></html>');
  await writeFile(resolve(fixtureRoot, 'app.jsx'), `import React from 'react'; import {createRoot} from 'react-dom/client';\n${names.map((slug, i) => `import Nav${i} from './${slug}.jsx';`).join('\n')}\ncreateRoot(document.getElementById('root')).render(<main>${names.map((slug, i) => `<section id="${slug}"><Nav${i} onNavigate={value=>window.lastDestination=value}/></section>`).join('')}</main>);`);
  fixtureServer = await createServer({ configFile: false, root: fixtureRoot, server: { port: 5179, strictPort: true }, logLevel: 'error' });
  await fixtureServer.listen();
  await page.goto('http://localhost:5179');
  await page.locator('nav').last().waitFor();
  assert.equal(await page.locator('nav').count(), 8);
  for (const slug of names) {
    await page.locator(`#${slug}`).getByRole('button', { name: 'Search', exact: true }).click();
    assert.equal(await page.locator(`#${slug}`).getByRole('button', { name: 'Search', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => window.lastDestination), 'Search');
  }
  // The journal cover is a capture of three real components from this clean app.
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.addStyleTag({ content: `body{margin:0;background:#f3f0e9;color:#25241f;padding:48px 72px;box-sizing:border-box}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-content:center;min-height:624px}main>section{display:block}.stage{padding:8px!important}.stage span{display:none}nav{min-height:60px}svg{width:28px!important;height:28px!important}` });
  await page.screenshot({ path: resolve(root, 'dist/bottom-navigation-cover.png') });
  assert.deepEqual(errors, []);
  console.log('PASS: rounded hover states, touch behavior, hero motion/pause/visibility, 8 interactive demos, exact copied source, standalone React app, dialog, keyboard, reduced motion, 4 viewport sizes, and existing article.');
} finally {
  await browser.close();
  await server.close();
  await fixtureServer?.close();
}
