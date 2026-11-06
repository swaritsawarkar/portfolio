export const paper = { width: 1800, height: 8200, ink: 1800, lift: 8, strokes: 48, points: 1200 };

const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export function paperPoint(x, y, box, height, width = paper.width) {
  return [
    Math.max(14, Math.min(width - 14, Math.round((x - box.left) * width / box.width))),
    Math.max(14, Math.min(height - 54, paper.height - 54, Math.round((y - box.top) * height / box.height))),
  ];
}

export function wallBounds(strokes, name) {
  let left = paper.width, top = paper.height, right = 0, bottom = 0;
  for (const stroke of strokes) {
    for (const [x, y] of stroke) {
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  const labelWidth = Math.min(360, Math.max(120, [...name].length * 14 + 10));
  left = Math.min(left - 12, paper.width - labelWidth - 24);
  return [left, top - 12, Math.max(right + 12, left + labelWidth + 12), bottom + 54];
}

export function overlaps(a, b) {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}

export function measure(strokes) {
  return strokes.reduce((total, stroke) =>
    total + stroke.reduce((ink, point, i) => ink + (i ? distance(stroke[i - 1], point) : paper.lift), 0), 0);
}

export function extend(stroke, point, remaining) {
  const from = stroke.at(-1);
  const delta = distance(from, point);
  if (delta < 2 || remaining < 2) return false;
  if (delta <= remaining) {
    stroke.push(point);
    return true;
  }
  const proportion = (remaining - .75) / delta;
  const end = [Math.round(from[0] + (point[0] - from[0]) * proportion),
    Math.round(from[1] + (point[1] - from[1]) * proportion)];
  if (distance(from, end) < 2 || distance(from, end) > remaining) return false;
  stroke.push(end);
  return true;
}

export function renderInk(svg, strokes) {
  const ns = 'http://www.w3.org/2000/svg';
  svg.replaceChildren(...strokes.map((stroke) => {
    if (stroke.length === 1) {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', stroke[0][0]);
      dot.setAttribute('cy', stroke[0][1]);
      dot.setAttribute('r', '3.75');
      return dot;
    }
    const path = document.createElementNS(ns, 'path');
    const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const segments = stroke.slice(1, -1).map((point, index) =>
      'Q' + point.join(' ') + ' ' + midpoint(point, stroke[index + 2]).join(' '));
    path.setAttribute('d', 'M' + stroke[0].join(' ') + ' ' + segments.join(' ') + ' L' + stroke.at(-1).join(' '));
    return path;
  }));
}

export function renderMark(group, entry) {
  renderInk(group, entry.strokes);
  const [left, , right, bottom] = entry.bounds;
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  label.setAttribute('x', left + 12);
  label.setAttribute('y', bottom - 42);
  label.setAttribute('width', right - left - 18);
  label.setAttribute('height', 39);
  const text = document.createElement('div');
  text.className = 'wall-name';
  text.textContent = entry.name;
  text.title = entry.name;
  label.append(text);
  group.append(label);
}
