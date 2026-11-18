#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// Mesh-gradient background: five soft light blobs drifting over a navy ground.
// The blob colours come in three stages (top, middle and bottom of the page) and are
// blended by uScroll, so scrolling shifts the whole field from indigo toward blue and teal.

uniform vec2 uResolution;
uniform float uTime;
uniform float uScroll;       // 0..1, smoothed page progress
uniform vec3 uBase;          // ground colour
uniform vec3 uPalette[15];   // stage-major: [0..4] top, [5..9] middle, [10..14] bottom

const int BLOBS = 5;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float t = uTime;
  float s = clamp(uScroll, 0.0, 1.0);

  // A slow domain warp makes the blobs flow into each other instead of sliding past.
  vec2 warp = vec2(
    noise(p * 1.3 + vec2(t * 0.045, 0.0)),
    noise(p * 1.3 + vec2(7.3, -t * 0.038))
  ) - 0.5;
  p += warp * 0.38;

  vec3 col = uBase;

  for (int i = 0; i < BLOBS; i++) {
    float fi = float(i);
    float speed = 0.065 + fi * 0.019;

    vec2 centre = vec2(
      sin(t * speed + fi * 2.1) * 0.5 * aspect,
      cos(t * speed * 1.13 + fi * 1.7) * 0.42
    );
    // Parallax: each blob drifts upward at its own rate while the page scrolls.
    centre.y -= s * (0.22 + fi * 0.07);

    float radius = 0.36 + fi * 0.028 + 0.07 * sin(t * 0.1 + fi * 3.0);
    float d = length(p - centre);
    float weight = exp(-(d * d) / (radius * radius));

    vec3 tint = mix(
      mix(uPalette[i], uPalette[i + 5], smoothstep(0.0, 0.5, s)),
      uPalette[i + 10],
      smoothstep(0.45, 1.0, s)
    );
    col += tint * weight * 0.6;
  }

  // Soft tone curve so overlapping blobs do not clip to white.
  col = 1.0 - exp(-col * 1.3);

  // Static dither hides banding in the dark gradients.
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
