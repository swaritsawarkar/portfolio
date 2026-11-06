import { overlaps } from './signing-ink.js';

// These are display coordinates only. Stored handwriting is never rewritten.
export function packMarks(marks, width = 1800) {
  const placed = [];
  return marks.map(entry => {
    const points = entry.strokes.flat();
    const left = Math.min(...points.map(p => p[0])) - 8;
    const top = Math.min(...points.map(p => p[1])) - 8;
    const w = Math.max(...points.map(p => p[0])) + 8 - left;
    const h = Math.max(...points.map(p => p[1])) + 8 - top;
    const scale = Math.min(1, 260 / w, 110 / h);
    const labelWidth = Math.min(280, Math.max(80, [...entry.name].length * 12));
    const boxWidth = Math.max(w * scale, labelWidth) + 28;
    const boxHeight = h * scale + 56;
    const xs = [...new Set([20, ...placed.map(b => b[2])])].sort((a,b) => a-b);
    const ys = [...new Set([22, ...placed.map(b => b[3])])].sort((a,b) => a-b);
    let box;
    for (const y of ys) {
      for (const x of xs) {
        const candidate = [x, y, x + boxWidth, y + boxHeight];
        if (candidate[2] <= width - 20 && !placed.some(b => overlaps(b, candidate))) {
          box = candidate;
          break;
        }
      }
      if (box) break;
    }
    placed.push(box);
    return { entry, box, left, top, scale, inkHeight: h * scale };
  });
}
