import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountJournal } from '../src/journal.js';
import config from '../vite.config.js';

test('journal deep links and queries resolve without intercepting other pages', () => {
  let middleware;
  config.plugins[0].configureServer({ middlewares: { use: (handler) => { middleware = handler; } } });
  for (const [url, expected] of [
    ['/journal', '/journal/index.html'],
    ['/journal/', '/journal/index.html'],
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

function setup(writeText) {
  const buttons = [{ textContent: 'Copy the master prompt' }, { textContent: 'Copy the master prompt' }];
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
  mountJournal(root);
  return { buttons, status, focused: () => focused, click: (index) => click({ target: { closest: () => buttons[index] } }) };
}

test('both copy buttons copy the complete prompt and restore their labels', async () => {
  let copied;
  let finish;
  const ui = setup((text) => { copied = text; return new Promise((resolve) => { finish = resolve; }); });
  for (const index of [0, 1]) {
    const pending = ui.click(index);
    assert.ok(ui.buttons.every((button) => button.disabled && button.textContent === 'Copying…'));
    finish();
    await pending;
    assert.ok(copied.startsWith('You are a senior frontend engineer'));
    assert.ok(copied.includes('FINAL GOAL:'));
    assert.ok(ui.buttons.every((button) => !button.disabled && button.textContent === 'Copied'));
    assert.equal(ui.status.textContent, 'Master prompt copied to clipboard.');
  }
  await new Promise((resolve) => setTimeout(resolve, 2300));
  assert.ok(ui.buttons.every((button) => button.textContent === 'Copy the master prompt'));
});

test('either button handles clipboard rejection and focuses the manual fallback', async () => {
  const ui = setup(async () => { throw new Error('Permission denied'); });
  for (const index of [0, 1]) {
    await ui.click(index);
    assert.ok(ui.buttons.every((button) => !button.disabled && button.textContent === 'Try copying again'));
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
