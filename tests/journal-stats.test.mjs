import assert from 'node:assert/strict';
import { test } from 'node:test';
import { journalPage, journalPages } from '../src/journal-pages.js';
import { renderStats } from '../src/wall-stats.js';

test('only known journal paths become analytics details', () => {
  for (const path of Object.keys(journalPages)) {
    assert.equal(journalPage(path), path);
    assert.equal(journalPage(path + '/'), path);
  }
  for (const path of ['/', '/admin/stats', '/journal/private-draft', '/journal/3d-websites/extra', '/journal?secret=example']) {
    assert.equal(journalPage(path), null);
  }
});

test('stats show journal totals, article names and safe recent activity', () => {
  const container = {};
  renderStats(container, {
    visits: 2, recently_active: 1, entered: 0, signed: 0, journal_readers: 2, journal_reads: 3,
    daily: [], sources: [], devices: [],
    breakdown: [{kind:'journal', detail:'/journal/3d-websites', count:2}],
    latest: [{visitor:'example', device:'phone', source:'direct', last_seen:'2026-11-13T00:00:00Z',
      actions:[{kind:'journal', detail:'/journal/3d-websites'}, {kind:'journal', detail:'<script>bad</script>'}]}],
  });
  assert.match(container.innerHTML, /Journal readers<\/h2><strong>2/);
  assert.match(container.innerHTML, /Journal page reads<\/h2><strong>3/);
  assert.match(container.innerHTML, /<h2>Journal pages<\/h2>/);
  assert.match(container.innerHTML, /Visited 3D websites/);
  assert.ok(!container.innerHTML.includes('<script>'));
  assert.match(container.innerHTML, /earlier journal visits are unavailable/);
});
