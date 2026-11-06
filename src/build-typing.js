const pendingName = 'build-pending';
const selectionName = 'build-edit';
const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

function rangeFor(node, start, end = start) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
}

function makeTrack(node, index, start, limit) {
  const content = node.data.slice(start, limit);
  const characters = segmenter
    ? Array.from(segmenter.segment(content), ({segment}) => segment)
    : Array.from(content);
  const word = /\p{L}{4,}/u.exec(content.slice(Math.floor(content.length * .25)));
  const editAt = word ? start + Math.floor(content.length * .25) + word.index : -1;
  const wrongLetter = word?.[0][0].toLowerCase() === 'x' ? 'z' : 'x';
  const events = [{ time: 0, end: start }];
  let time = 45;
  let end = start;
  let edit = index % 5;
  characters.forEach((char, i) => {
    if (end >= editAt && editAt >= 0 && edit === 0) {
      events.push({ time, end, typo: wrongLetter });
      time += 210;
      events.push({ time, end });
      time += 95;
      edit = -1;
    }
    const charStart = end;
    end += char.length;
    events.push({ time, end });
    time += 22 + (i * 17 + index * 11) % 26;
    if (/[.!?,;:]/u.test(char)) time += 67;
    if (edit === 2 && editAt >= 0 && end >= editAt + word[0].length && charStart < editAt + word[0].length) {
      events.push({ time, end, selection: editAt });
      time += 190;
      events.push({ time, end: editAt });
      time += 75;
      for (const letter of word[0]) {
        const previous = events.at(-1).end;
        events.push({ time, end: previous + letter.length });
        time += 31;
      }
      edit = -1;
    }
  });
  return { node, start, limit, events, duration: time + 100, hidden: rangeFor(node, start, limit), current: -1 };
}

function sections(text) {
  const starts = [0];
  if (text.length >= 165) {
    for (const match of text.matchAll(/[.!?]\s+(?=[A-Z])/g)) {
      const next = match.index + match[0].length;
      if (next - starts.at(-1) >= 52 && text.length - next >= 45) starts.push(next);
    }
  }
  return starts.map((start, index) => [start, starts[index + 1] ?? text.length]);
}

function textNodes(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.data.trim() || node.parentElement.closest('[aria-hidden="true"], .wins-count, [data-photo-step]') ||
          !node.parentElement.getClientRects().length) {
        return NodeFilter.FILTER_REJECT;
      }
      const closed = node.parentElement.closest('details:not([open])');
      if (closed && !closed.querySelector(':scope > summary')?.contains(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

export function createTyping() {
  const registry = globalThis.CSS?.highlights;
  const pending = registry ? new Highlight() : null;
  const selected = registry ? new Highlight() : null;
  let count = 0;
  if (registry) {
    registry.set(pendingName, pending);
    selected.priority = 1;
    registry.set(selectionName, selected);
  }
  return {
    prepare(element) {
      if (!pending) return [];
      return textNodes(element).flatMap((node) => sections(node.data).map(([start, end]) => {
        const track = makeTrack(node, count++, start, end);
        pending.add(track.hidden);
        return track;
      }));
    },
    type(track, elapsed, pen) {
      let index = track.current;
      while (track.events[index + 1]?.time <= elapsed) index++;
      const layout = innerWidth + ':' + innerHeight;
      if (track.current === index && track.layout === layout && !pen.caret.hidden) return track.caret;
      track.current = index;
      track.layout = layout;
      const event = track.events[Math.max(index, 0)];
      pending.delete(track.hidden);
      track.hidden.setStart(track.node, event.end);
      if (event.end < track.limit) pending.add(track.hidden);
      if (track.selection) selected.delete(track.selection);
      track.selection = event.selection === undefined ? null : rangeFor(track.node, event.selection, event.end);
      if (track.selection) selected.add(track.selection);

      const caret = track.caret = rangeFor(track.node, event.end).getBoundingClientRect();
      pen.caret.hidden = !caret.height;
      if (!caret.height) return caret;
      const style = getComputedStyle(track.node.parentElement);
      pen.typo.textContent = event.typo || '';
      pen.typo.style.font = style.font;
      pen.typo.style.letterSpacing = style.letterSpacing;
      pen.typo.style.lineHeight = '1';
      pen.caret.style.height = caret.height + 'px';
      pen.caret.style.transform = 'translate3d(' + caret.left + 'px,' + caret.top + 'px,0)';
      return caret;
    },
    reveal(track) {
      pending?.delete(track.hidden);
      if (track.selection) selected?.delete(track.selection);
    },
    dispose() {
      registry?.delete(pendingName);
      registry?.delete(selectionName);
    },
  };
}
