// WebGL 2 Shaders for Particle Rendering
// Optimized for 15K particles with instanced rendering

export const VERTEX_SHADER = `#version 300 es
precision highp float;

// Per-particle attributes (from interleaved buffer)
in vec2 a_position;
in float a_size;
in vec3 a_color;
in float a_alpha;

// Uniforms
uniform vec2 u_resolution;
uniform float u_pixelRatio;

// Outputs to fragment shader
out vec3 v_color;
out float v_alpha;

void main() {
  // Convert pixel coordinates to clip space (-1 to 1)
  vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
  clipSpace.y *= -1.0; // Flip Y for canvas coordinates
  
  gl_Position = vec4(clipSpace, 0.0, 1.0);
  gl_PointSize = a_size * u_pixelRatio;
  
  v_color = a_color;
  v_alpha = a_alpha;
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec3 v_color;
in float v_alpha;

out vec4 fragColor;

void main() {
  // Discard invisible particles (alpha = 0)
  if (v_alpha < 0.01) discard;
  
  // Calculate distance from point center (gl_PointCoord is 0-1)
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  
  // Discard pixels outside circle
  if (dist > 0.5) discard;
  
  // Soft edge falloff for anti-aliasing and glow effect
  float alpha = smoothstep(0.5, 0.2, dist) * v_alpha;
  
  // Add subtle glow by boosting color near center
  float glow = smoothstep(0.5, 0.0, dist);
  vec3 glowColor = v_color + (v_color * 0.3 * glow);
  
  fragColor = vec4(glowColor, alpha);
}
`;

// Canvas 2D fallback shaders are not needed, but we track the fallback state
export const FALLBACK_MESSAGE = "WebGL 2 not available - using Canvas 2D fallback";

// ============================================================================
// Trail Fade Quad Shaders
// Used to draw a semi-transparent black overlay for particle trail effect
// ============================================================================

export const FADE_QUAD_VERTEX_SHADER = `#version 300 es
precision highp float;

// Fullscreen quad vertices (triangle strip)
const vec2 vertices[4] = vec2[4](
  vec2(-1.0, -1.0),
  vec2( 1.0, -1.0),
  vec2(-1.0,  1.0),
  vec2( 1.0,  1.0)
);

void main() {
  gl_Position = vec4(vertices[gl_VertexID], 0.0, 1.0);
}
`;

export const FADE_QUAD_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform float u_fadeAmount;

out vec4 fragColor;

void main() {
  // Draw semi-transparent black to fade previous frame
  // Lower alpha = longer trails, higher alpha = shorter trails
  fragColor = vec4(0.0, 0.0, 0.0, u_fadeAmount);
}
`;
