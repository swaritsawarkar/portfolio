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
  const examples = page.locator('.nav-example');
  assert.equal(await examples.count(), 8);
  const names = [];
  for (const section of await examples.all()) {
    const slug = await section.getAttribute('id');
    names.push(slug);
    const buttons = section.locator('button[data-destination]');
    for (const button of await buttons.all()) {
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await section.locator('.panel strong').textContent(), await button.getAttribute('aria-label'));
      const size = await button.boundingBox();
      assert.ok(size.width >= 48 && size.height >= 48, `${slug}: touch target ${size.width} x ${size.height}`);
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
  assert.equal(await examples.nth(1).locator('.panel strong').textContent(), 'Home');
  const center = page.locator('#center-action');
  await center.getByRole('button', { name: 'Create a note', exact: true }).click();
  await page.getByLabel('Note title', { exact: true }).fill('A working creation example');
  await page.getByRole('button', { name: 'Create note', exact: true }).click();
  assert.match(await center.locator('.panel').textContent(), /Created locally: A working creation example/);
  await center.getByRole('button', { name: 'Create a note', exact: true }).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(), 0);
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
  }
  await page.reload();
  await page.locator('.nav-example').last().waitFor();
  await page.goto('http://localhost:5178/journal/ai-web-design-skills');
  await page.locator('[data-copy-prompt]').first().waitFor();
  assert.equal(await page.locator('.nav-example').count(), 0);
  assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some((x) => /react-dom/.test(x.name))), false);

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
    assert.equal(await page.locator(`#${slug} .panel strong`).textContent(), 'Search');
    assert.equal(await page.evaluate(() => window.lastDestination), 'Search');
  }
  // The journal cover is a capture of three real components from this clean app.
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.addStyleTag({ content: `body{margin:0;background:#f3f0e9;color:#25241f;padding:54px 100px;box-sizing:border-box}main{display:grid;gap:20px}main:before{content:'Navigation, with character.';font:46px Georgia;margin-bottom:12px}main>section{display:none}main>section:is(#minimal,#pill-highlight,#ios-inspired-dock){display:block} .panel{display:none!important}.stage{padding:12px!important}nav{min-height:76px}button{font-size:16px!important}svg{width:26px!important;height:26px!important}` });
  await page.screenshot({ path: resolve(root, 'dist/bottom-navigation-cover.png') });
  assert.deepEqual(errors, []);
  console.log('PASS: 8 interactive demos, exact clipboard source, standalone React app, dialog, keyboard, reduced motion, 4 viewport sizes, and existing article.');
} finally {
  await browser.close();
  await server.close();
  await fixtureServer?.close();
}
