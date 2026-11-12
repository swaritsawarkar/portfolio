import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

test('every copyable effect includes its example, component, and required CSS', () => {
  for (const name of ['FluxLines', 'CRTWarp', 'LaserFlow', 'HalftoneReveal']) {
    const example = new URL(`../src/effect-examples/${name}Demo.jsx`, import.meta.url);
    const component = new URL(`../src/effects/${name}.jsx`, import.meta.url);
    const source = readFileSync(component, 'utf8');
    assert.match(readFileSync(example, 'utf8'), new RegExp(`from '../effects/${name}'`));
    assert.ok(source.includes(`import './${name}.css'`));
    assert.ok(readFileSync(new URL(`../src/effects/${name}.css`, import.meta.url), 'utf8').length > 0);
    assert.ok(source.includes('Copyright (c) 2026 David Haz'));
    for (const [, path] of source.matchAll(/from ['"](.*?)['"]/g)) assert.equal(path, 'react');
  }
  assert.ok(existsSync(new URL('../public/photos/swarit.png', import.meta.url)));
});
