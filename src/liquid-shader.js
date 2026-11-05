export const vertexSource = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const fragmentSource = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uMask;
uniform sampler2D uFlow;
uniform vec2 uResolution;
uniform vec2 uMaskScale;
uniform float uProgress;
uniform float uTime;
uniform float uMarkAspect;
uniform vec3 uBackground;
uniform vec3 uInk;

// The texture stores signed distance, original coverage, and a smoothed
// signed distance used only for the matte surface.
vec3 sampleLogo(vec2 p) {
  vec2 uv = p * uMaskScale + 0.5;
  vec2 edge = clamp(uv, 0.0, 1.0);
  vec3 mask = texture(uMask, edge).rgb;
  float outside = length((uv - edge) / uMaskScale);
  return mask + vec3(outside, 0.0, outside);
}

float surfaceHeight(vec2 p, float contour) {
  float depth = max(contour - sampleLogo(p).z + 0.009, 0.0);
  return 0.145 * (1.0 - exp(-depth * 13.0));
}

// Cubic reconstruction makes transported material smooth across grid cells,
// including the surface normals used by the matte lighting.
vec2 flowAt(vec2 uv) {
  vec2 size = vec2(textureSize(uFlow, 0));
  vec2 grid = uv * size - 0.5;
  vec2 cell = floor(grid);
  vec2 f = fract(grid);
  vec2 w0 = pow(1.0 - f, vec2(3.0)) / 6.0;
  vec2 w1 = (3.0 * f * f * f - 6.0 * f * f + 4.0) / 6.0;
  vec2 w2 = (-3.0 * f * f * f + 3.0 * f * f + 3.0 * f + 1.0) / 6.0;
  vec2 w3 = f * f * f / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 lo = (cell - 1.0 + w1 / g0 + 0.5) / size;
  vec2 hi = (cell + 1.0 + w3 / g1 + 0.5) / size;
  return texture(uFlow, lo).rg * g0.x * g0.y
    + texture(uFlow, vec2(hi.x, lo.y)).rg * g1.x * g0.y
    + texture(uFlow, vec2(lo.x, hi.y)).rg * g0.x * g1.y
    + texture(uFlow, hi).rg * g1.x * g1.y;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  float markWidth = min(aspect * 0.4, uMarkAspect * 0.86);
  vec2 viewSize = vec2(aspect, 1.0);
  vec2 screen = (vUv - 0.5) * viewSize;
  // This displacement is transported by the persistent fluid simulation.
  // The cursor supplies forces to that simulation, never a direct shape jump.
  vec2 material = screen / markWidth;
  vec2 flow = flowAt(material / 2.8 + 0.5);
  float influence = 1.0 - smoothstep(0.7, 1.0, uProgress);
  vec2 warped = material + flow * influence;
  vec2 logo = vec2(warped.x, -warped.y);
  vec3 mask = sampleLogo(logo);
  vec2 corner = viewSize / (2.0 * markWidth);
  float extent = max(max(sampleLogo(corner).x, sampleLogo(-corner).x),
    max(sampleLogo(corner * vec2(1.0, -1.0)).x, sampleLogo(corner * vec2(-1.0, 1.0)).x));
  // Broad fronts advance at different rates, merging into a continuous pool.
  // Fade the unevenness at the endpoint so every corner is fully covered.
  float swell = pow(uProgress, 1.65) * (extent + 0.035);
  float pouring = sin(uProgress * 3.14159);
  float contour = swell + pouring * extent * (
    0.16 * sin(screen.x * 3.7 + screen.y * 2.8 + uTime * 0.23)
    + 0.10 * cos(screen.y * 5.1 - screen.x * 2.3 - uTime * 0.19)
    + 0.05 * sin(screen.x * 7.0 - screen.y * 4.0 + uTime * 0.31)
  );
  float field = mask.x - contour;
  float edge = max(fwidth(field) * 0.58, 0.0004);
  float grownCoverage = 1.0 - smoothstep(-edge, edge, field);
  float opacity = mix(mask.y, grownCoverage, smoothstep(0.0, 0.024, uProgress));
  vec2 screenDx = dFdx(logo);
  vec2 screenDy = dFdy(logo);
  if (opacity <= 0.0) {
    outColor = vec4(uBackground, 1.0);
    return;
  }

  // Sample the softened height for stable normals, then carry those normals
  // through the pointer warp using the local screen-space derivatives.
  const float spread = 0.009;
  vec2 x = vec2(spread, 0.0);
  vec2 y = vec2(0.0, spread);
  vec2 gradient = vec2(
    surfaceHeight(logo + x, contour) - surfaceHeight(logo - x, contour),
    surfaceHeight(logo + y, contour) - surfaceHeight(logo - y, contour)
  ) / (2.0 * spread);
  vec2 slope = vec2(dot(screenDx, gradient), dot(screenDy, gradient)) * uResolution.y * markWidth;
  vec3 normal = normalize(vec3(-slope, 1.0));
  float key = max(dot(normal, normalize(vec3(-0.63, 0.58, 0.48))), 0.0);
  float fill = max(dot(normal, normalize(vec3(0.52, -0.48, 0.59))), 0.0);
  float inkBlack = 0.027 + 0.24 * pow(key, 4.0) + 0.085 * pow(fill, 4.0);
  float inkWhite = 0.62 + 0.34 * pow(key, 1.25) + 0.10 * fill;
  vec3 matte = vec3(mix(inkBlack, min(1.0, inkWhite), uInk.r));
  matte = mix(matte, uInk, smoothstep(0.56, 1.0, uProgress));
  outColor = vec4(mix(uBackground, matte, opacity), 1.0);
}`;
