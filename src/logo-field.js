// The half-luminance contour of the supplied white-on-black artwork is the mask.
export async function loadLogo() {
  const image = new Image();
  image.src = import.meta.env.BASE_URL + 'logo-outline.png';
  await image.decode();

  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const context = source.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, source.width, source.height);

  let left = source.width;
  let top = source.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (data[(y * source.width + x) * 4] < 128) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right <= left || bottom <= top) throw new Error('The supplied logo has no white silhouette.');

  const markWidth = right - left + 1;
  const markHeight = bottom - top + 1;
  const padding = 12;
  const width = markWidth + 2 * padding;
  const height = markHeight + 2 * padding;
  const coverage = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const sourceY = top + y - padding;
    if (sourceY < 0 || sourceY >= source.height) continue;
    for (let x = 0; x < width; x += 1) {
      const sourceX = left + x - padding;
      if (sourceX < 0 || sourceX >= source.width) continue;
      const value = data[(sourceY * source.width + sourceX) * 4];
      coverage[y * width + x] = Math.min(255, Math.max(0, (value - 12) * 255 / 231));
    }
  }
  return { width, height, markWidth, markHeight, coverage };
}

// Exact squared Euclidean distance in two separable passes. Each line keeps
// the lower envelope of the parabolas originating at its sample positions.
function squaredDistance({ coverage, width, height }, toInk) {
  const size = Math.max(width, height);
  const input = new Float32Array(size);
  const envelope = new Int32Array(size);
  const breaks = new Float64Array(size + 1);
  const distance = new Float32Array(coverage.length);

  function transformLine(length, offset, stride) {
    let last = 0;
    envelope[0] = 0;
    breaks[0] = -Infinity;
    breaks[1] = Infinity;
    for (let q = 1; q < length; q += 1) {
      let intersection;
      while (true) {
        const p = envelope[last];
        intersection = (input[q] - input[p] + q * q - p * p) / (2 * (q - p));
        if (intersection > breaks[last]) break;
        last -= 1;
      }
      last += 1;
      envelope[last] = q;
      breaks[last] = intersection;
      breaks[last + 1] = Infinity;
    }
    last = 0;
    for (let q = 0; q < length; q += 1) {
      while (breaks[last + 1] < q) last += 1;
      const p = envelope[last];
      distance[offset + q * stride] = (q - p) ** 2 + input[p];
    }
  }

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      input[x] = (coverage[row + x] >= 128) === toInk ? 0 : 1e9;
    }
    transformLine(width, row, 1);
  }
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) input[y] = distance[y * width + x];
    transformLine(height, x, width);
  }
  return distance;
}

function softenSurface(field, width, height, radius) {
  const temporary = new Float32Array(field.length);
  const result = field.slice();
  const span = radius * 2 + 1;

  function blur(input, output, count, length, lineStride, step) {
    for (let line = 0; line < count; line += 1) {
      const origin = line * lineStride;
      let sum = input[origin] * (radius + 1);
      for (let i = 1; i <= radius; i += 1) sum += input[origin + i * step];
      for (let i = 0; i < length; i += 1) {
        output[origin + i * step] = sum / span;
        const before = Math.max(i - radius, 0);
        const after = Math.min(i + radius + 1, length - 1);
        sum += input[origin + after * step] - input[origin + before * step];
      }
    }
  }

  for (let pass = 0; pass < 3; pass += 1) {
    blur(result, temporary, height, width, width, 1);
    blur(temporary, result, width, height, 1, width);
  }
  return result;
}

export function createLogoTexture(gl, logo) {
  const { coverage, markWidth, width, height } = logo;
  const toInk = squaredDistance(logo, true);
  const toPaper = squaredDistance(logo, false);
  const distance = new Float32Array(coverage.length);
  for (let i = 0; i < coverage.length; i += 1) {
    const signed = coverage[i] >= 128 ? 0.5 - Math.sqrt(toPaper[i]) : Math.sqrt(toInk[i]) - 0.5;
    distance[i] = signed / markWidth;
  }
  const surface = softenSurface(distance, width, height, Math.round(markWidth * 0.023));
  const pixels = new Float32Array(coverage.length * 4);
  for (let i = 0; i < coverage.length; i += 1) {
    pixels[4 * i] = distance[i];
    pixels[4 * i + 1] = coverage[i] / 255;
    pixels[4 * i + 2] = surface[i];
    pixels[4 * i + 3] = 1;
  }

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, pixels);
  return texture;
}

export function drawPoster(canvas, { coverage, width, height }, inverted) {
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const pixels = context.createImageData(width, height);
  for (let i = 0; i < coverage.length; i += 1) {
    const offset = i * 4;
    pixels.data[offset] = pixels.data[offset + 1] = pixels.data[offset + 2] = inverted ? 255 : 17;
    pixels.data[offset + 3] = coverage[i];
  }
  context.putImageData(pixels, 0, 0);
}
