// Semi-Lagrangian velocity and material transport on a square logo-space grid.
// Pressure projection keeps the moving ink approximately incompressible.
export function createFluid(gl) {
  const size = 64;
  const span = 2.8;
  const spacing = span / (size - 1);
  const count = size * size;
  let vx = new Float32Array(count), vy = new Float32Array(count);
  let dx = new Float32Array(count), dy = new Float32Array(count);
  let nextX = new Float32Array(count), nextY = new Float32Array(count);
  let nextDX = new Float32Array(count), nextDY = new Float32Array(count);
  let pressure = new Float32Array(count), nextPressure = new Float32Array(count);
  const divergence = new Float32Array(count);
  const pixels = new Float32Array(count * 4);
  let elapsed = 0;
  let accumulator = 0;
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, size, size, 0, gl.RGBA, gl.FLOAT, pixels);

  function sample(field, x, y) {
    x = Math.max(0, Math.min(size - 1.001, x));
    y = Math.max(0, Math.min(size - 1.001, y));
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const i = iy * size + ix;
    return (field[i] * (1 - fx) + field[i + 1] * fx) * (1 - fy)
      + (field[i + size] * (1 - fx) + field[i + size + 1] * fx) * fy;
  }

  function step(dt, pointer) {
    elapsed += dt;
    const arrival = Math.min(1, elapsed / 2);
    // Shape retention and momentum act continuously, including during a drag.
    // Stopping the pointer never switches the fluid into a recovery mode.
    const recovery = Math.exp(-dt * 1.15);
    const drag = Math.exp(-dt * 1.2);
    const ambient = 0.32;
    const centers = [
      [-0.22 + 0.16 * Math.sin(elapsed * 0.23), 0.27, 1],
      [0.24, -0.25 + 0.13 * Math.cos(elapsed * 0.19), -1],
      [0.18 * Math.cos(elapsed * 0.17), 0.06, 0.7],
    ];
    for (let y = 1; y < size - 1; y += 1) {
      for (let x = 1; x < size - 1; x += 1) {
        const i = y * size + x;
        const px = x * spacing - span / 2, py = y * spacing - span / 2;
        const backX = x - vx[i] * dt / spacing, backY = y - vy[i] * dt / spacing;
        let forceX = 0, forceY = 0;
        for (const [cx, cy, direction] of centers) {
          const rx = px - cx, ry = py - cy;
          const curl = Math.exp(-(rx * rx + ry * ry) / 0.15) * direction * ambient * arrival;
          forceX -= ry * curl;
          forceY += rx * curl;
        }
        const rx = px - pointer.x, ry = py - pointer.y;
        // A moving pointer stirs a forward current with returning flow on
        // either side. A stationary pointer exerts no attraction.
        const radiusSquared = 0.13;
        const influence = Math.exp(-(rx * rx + ry * ry) / radiusSquared) * pointer.presence;
        const circulation = (pointer.vx * ry - pointer.vy * rx) * 2 / radiusSquared;
        forceX += (pointer.vx - ry * circulation) * 1.7 * influence;
        forceY += (pointer.vy + rx * circulation) * 1.7 * influence;
        nextX[i] = sample(vx, backX, backY) * drag + forceX * dt;
        nextY[i] = sample(vy, backX, backY) * drag + forceY * dt;
      }
    }
    [vx, nextX] = [nextX, vx];
    [vy, nextY] = [nextY, vy];
    pressure.fill(0);
    nextPressure.fill(0);
    for (let y = 1; y < size - 1; y += 1) {
      for (let x = 1; x < size - 1; x += 1) {
        const i = y * size + x;
        divergence[i] = (vx[i + 1] - vx[i - 1] + vy[i + size] - vy[i - size]) * spacing * 0.5;
      }
    }
    for (let iteration = 0; iteration < 12; iteration += 1) {
      for (let y = 1; y < size - 1; y += 1) {
        for (let x = 1; x < size - 1; x += 1) {
          const i = y * size + x;
          nextPressure[i] = (pressure[i - 1] + pressure[i + 1]
            + pressure[i - size] + pressure[i + size] - divergence[i]) * 0.25;
        }
      }
      [pressure, nextPressure] = [nextPressure, pressure];
    }
    for (let y = 1; y < size - 1; y += 1) {
      for (let x = 1; x < size - 1; x += 1) {
        const i = y * size + x;
        vx[i] -= (pressure[i + 1] - pressure[i - 1]) / (2 * spacing);
        vy[i] -= (pressure[i + size] - pressure[i - size]) / (2 * spacing);
        const backX = x - vx[i] * dt / spacing, backY = y - vy[i] * dt / spacing;
        nextDX[i] = (sample(dx, backX, backY) - vx[i] * dt) * recovery;
        nextDY[i] = (sample(dy, backX, backY) - vy[i] * dt) * recovery;
      }
    }
    [dx, nextDX] = [nextDX, dx];
    [dy, nextDY] = [nextDY, dy];
  }

  return {
    update(dt, pointer) {
      accumulator = Math.min(accumulator + dt, 0.067);
      while (accumulator >= 1 / 60) {
        step(1 / 60, pointer);
        accumulator -= 1 / 60;
      }
      for (let i = 0; i < count; i += 1) {
        pixels[i * 4] = dx[i];
        pixels[i * 4 + 1] = dy[i];
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, size, size, gl.RGBA, gl.FLOAT, pixels);
    },
  };
}
