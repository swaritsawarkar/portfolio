import assert from 'node:assert/strict';
import { test } from 'node:test';
import { journalContent, mountJournal } from '../src/journal.js';
import config from '../vite.config.js';

test('journal deep links and queries resolve without intercepting other pages', () => {
  let middleware;
  config.plugins[0].configureServer({ middlewares: { use: (handler) => { middleware = handler; } } });
  for (const [url, expected] of [
    ['/journal', '/journal/index.html'],
    ['/journal/', '/journal/index.html'],
    ['/journal/bottom-navigation-styles', '/journal/bottom-navigation-styles/index.html'],
    ['/journal/3d-websites', '/journal/3d-websites/index.html'],
    ['/journal/3d-websites/?from=journal', '/journal/3d-websites/index.html?from=journal'],
    ['/journal/bottom-navigation-styles/?from=journal', '/journal/bottom-navigation-styles/index.html?from=journal'],
    ['/journal?from=home', '/journal/index.html?from=home'],
    ['/journal/ai-web-design-skills', '/journal/ai-web-design-skills/index.html'],
    ['/journal/ai-web-design-skills/?from=home', '/journal/ai-web-design-skills/index.html?from=home'],
    ['/admin/stats', '/admin/index.html'],
    ['/', '/'],
    ['/journal/missing', '/journal/missing'],
    ['/journal/linear.webp', '/journal/linear.webp'],
  ]) {
    const request = { url };
    let nextCalled = false;
    middleware(request, null, () => { nextCalled = true; });
    assert.equal(request.url, expected);
    assert.equal(nextCalled, true);
  }
});

function setup(writeText, promptText) {
  const buttons = [{ textContent: 'Copy the master prompt', dataset: {} }, { textContent: 'Copy the master prompt', dataset: {} }];
  const status = { setAttribute() {} };
  let focused = false;
  let click;
  const root = {
    querySelector: (selector) => selector === '.journal-hero-bottom'
      ? { append: (node) => assert.equal(node, status) }
      : { focus: () => { focused = true; } },
    querySelectorAll: () => buttons,
    addEventListener: (_type, handler) => { click = handler; },
  };
  globalThis.document = { createElement: () => status };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText } } });
  mountJournal(root, promptText);
  return { buttons, status, focused: () => focused, click: (index) => click({ target: { closest: () => buttons[index] } }) };
}

test('a new article copies its own prompt instead of the design skills prompt', async () => {
  let copied;
  const ui = setup(async (text) => { copied = text; }, 'Build a readable website with one purposeful 3D interaction.');
  await ui.click(0);
  assert.equal(copied, 'Build a readable website with one purposeful 3D interaction.');
});

test('both copy buttons copy the complete prompt and restore their labels', async () => {
  let copied;
  let finish;
  const ui = setup((text) => { copied = text; return new Promise((resolve) => { finish = resolve; }); });
  for (const index of [0, 1]) {
    const pending = ui.click(index);
    assert.ok(ui.buttons.every((button) => button.disabled && button.textContent === 'Copying…'));
    assert.ok(ui.buttons.every((button) => button.dataset.copyState === 'loading'));
    finish();
    await pending;
    const displayedPrompt = journalContent.match(/id="master-prompt"[\s\S]*?<pre[^>]*><code>([\s\S]*?)<\/code>/)[1];
    assert.ok(displayedPrompt.length > 1000);
    assert.equal(copied, displayedPrompt);
    assert.ok(ui.buttons.every((button) => !button.disabled && button.textContent === 'Copied'));
    assert.ok(ui.buttons.every((button) => button.dataset.copyState === 'success'));
    assert.equal(ui.status.textContent, 'Master prompt copied to clipboard.');
  }
  await new Promise((resolve) => setTimeout(resolve, 2300));
  assert.ok(ui.buttons.every((button) => button.textContent === 'Copy the master prompt'));
  assert.ok(ui.buttons.every((button) => button.dataset.copyState === 'idle'));
});

test('either button handles clipboard rejection and focuses the manual fallback', async () => {
  const ui = setup(async () => { throw new Error('Permission denied'); });
  for (const index of [0, 1]) {
    await ui.click(index);
    assert.ok(ui.buttons.every((button) => !button.disabled && button.textContent === 'Try copying again'));
    assert.ok(ui.buttons.every((button) => button.dataset.copyState === 'error'));
    assert.match(ui.status.textContent, /copy it manually/);
    assert.equal(ui.focused(), true);
  }
});

test('missing clipboard support also offers manual copy', async () => {
  const ui = setup();
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  await ui.click(1);
  assert.equal(ui.focused(), true);
  assert.match(ui.status.textContent, /copy it manually/);
});
