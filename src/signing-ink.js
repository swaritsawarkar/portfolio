export const paper = { width: 320, height: 180, ink: 900, lift: 8, strokes: 24, points: 600 };
export const slots = 120;

const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const inside = (value, size) => Math.max(2, Math.min(size - 2, Math.round(value)));

export function paperPoint(x, y, box) {
  return [inside((x - box.left) * paper.width / box.width, paper.width),
    inside((y - box.top) * paper.height / box.height, paper.height)];
}

export function measure(strokes) {
  return strokes.reduce((total, stroke) =>
    total + stroke.reduce((ink, point, i) => ink + (i ? distance(stroke[i - 1], point) : paper.lift), 0), 0);
}

export function extend(stroke, point, remaining) {
  const from = stroke.at(-1);
  const delta = distance(from, point);
  if (delta < 1.4 || remaining < 1.4) return false;
  if (delta <= remaining) {
    stroke.push(point);
    return true;
  }
  const proportion = (remaining - .75) / delta;
  const end = [Math.round(from[0] + (point[0] - from[0]) * proportion),
    Math.round(from[1] + (point[1] - from[1]) * proportion)];
  if (distance(from, end) < 1.4 || distance(from, end) > remaining) return false;
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
      dot.setAttribute('r', '1.4');
      return dot;
    }
    const path = document.createElementNS(ns, 'polyline');
    path.setAttribute('points', stroke.map((point) => point.join(',')).join(' '));
    return path;
  }));
}
