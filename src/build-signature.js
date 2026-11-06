// Traced in the coordinate space of Swarit’s supplied drawing. The initial S
// and the rest of the signature meet at (188, 174).
const strokes = [
  [
    'M58 222 C63 212 79 199 97 181 C117 161 131 139 150 117 C163 102 175 88 177 78 C180 68 174 66 167 67 C158 69 149 77 146 85 C141 95 144 111 148 120 C155 136 173 156 188 174 C198 187 204 202 198 214 C188 229 162 232 141 233 C117 234 92 228 84 216 C77 206 80 192 85 184 C97 165 112 164 134 165 C153 165 170 172 188 174',
  ],
  [
    'M188 174 C200 177 215 178 224 177 C235 176 237 167 240 154 L244 133 Q245 128 247 139 C251 154 254 174 260 181 Q263 185 270 177 C280 169 284 163 287 147 Q288 144 289 153 C290 164 292 173 295 174 C299 172 306 150 311 142 C319 148 321 159 332 160 C343 161 352 156 356 146 C347 146 341 153 342 164 C342 178 348 180 356 174 C365 169 363 153 364 146 C365 160 366 174 371 179 C374 182 382 173 385 169 C388 165 385 156 387 152 C392 149 398 148 404 147 C405 155 402 166 408 174 C413 180 423 178 433 178 L438 152 C440 158 437 177 442 182 C450 184 454 180 461 174 C470 166 472 157 476 144 C480 132 484 124 486 112 C486 120 481 130 480 141 L478 164 C478 171 490 174 501 174 C507 174 514 176 518 173',
  ],
  ['M38 139 l.2 .15', 'M432 119 l.15 .1', 'M457 132 C467 131 477 133 495 134'],
  ['M642 86 C640 105 642 119 645 138', 'M701 86 C700 102 702 114 701 137'],
  ['M622 188 C628 199 633 205 645 209 C658 212 668 211 680 213 C689 215 692 207 699 199 C705 192 710 189 712 183'],
];

export function createSignature(layer) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('build-signature');
  svg.setAttribute('viewBox', '26 54 699 193');
  layer.append(svg);
  const tracks = strokes.map((lines) => lines.map((line) => {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', line);
    path.style.visibility = 'hidden';
    svg.append(path);
    return { path, length: path.getTotalLength() };
  }));
  return { svg, tracks };
}
