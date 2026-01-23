# Technical Architecture: Real-Time Particle Tracking System

## Executive Summary

This document defines the technical architecture for a real-time particle visualization system that creates **exact visual clones** of hands and face using MediaPipe. The system renders 8,000-15,000 particles that are **strictly bound** to detected landmarks with zero stray particles.

---

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MAIN THREAD                                             │
│                                                                                      │
│  ┌──────────────┐      ┌──────────────────────────────────────────────────────────┐ │
│  │   Camera     │      │                   React Application                       │ │
│  │   Stream     │─────▶│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │ │
│  │  (30fps)     │      │  │ CameraCtx   │  │ TrackingCtx │  │ ParticleRenderer │  │ │
│  └──────────────┘      │  │ (Provider)  │  │ (State Hub) │  │    (WebGL)       │  │ │
│                        │  └─────────────┘  └──────┬──────┘  └────────▲─────────┘  │ │
│                        │                          │                  │            │ │
│                        └──────────────────────────┼──────────────────┼────────────┘ │
│                                                   │                  │              │
│  ┌────────────────────────────────────────────────┼──────────────────┼────────────┐ │
│  │                     STATE FLOW                 │                  │            │ │
│  │                                                ▼                  │            │ │
│  │  ┌───────────────┐   ┌─────────────────────────────────────┐     │            │ │
│  │  │ MediaPipe     │   │          Landmark Buffer            │     │            │ │
│  │  │ (Main Thread) │──▶│  ┌─────────┐ ┌─────────┐ ┌───────┐  │─────┘            │ │
│  │  │ ~33ms/frame   │   │  │ Hands[] │ │ Face[]  │ │ Meta  │  │                  │ │
│  │  └───────────────┘   │  │21×2 pts │ │468 pts  │ │ depth │  │                  │ │
│  │                      │  └─────────┘ └─────────┘ └───────┘  │                  │ │
│  │                      └─────────────────────────────────────┘                  │ │
│  │                                        │                                       │ │
│  │                                        ▼                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    INTERPOLATION LAYER (60fps)                          │  │ │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │  │ │
│  │  │  │ prevFrame  │  │ currFrame  │  │  lerp(t)   │  │ interpolatedLmks  │  │  │ │
│  │  │  │ landmarks  │  │ landmarks  │  │ 0.0 → 1.0  │  │ (smooth output)   │  │  │ │
│  │  │  └────────────┘  └────────────┘  └────────────┘  └───────────────────┘  │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │ │
│  │                                        │                                       │ │
│  │                                        ▼                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    PARTICLE BINDING ENGINE                               │  │ │
│  │  │                                                                          │  │ │
│  │  │   Landmark → Particle Pool (STRICT 1:N mapping, NO orphan particles)    │  │ │
│  │  │                                                                          │  │ │
│  │  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐   │  │ │
│  │  │   │ Hand Pool   │     │ Face Pool   │     │ Particle Assignment     │   │  │ │
│  │  │   │ 2,400 max   │     │ 12,000 max  │     │ - Pre-allocated         │   │  │ │
│  │  │   │ (1,200/hand)│     │ (468 × 25)  │     │ - No dynamic creation   │   │  │ │
│  │  │   └─────────────┘     └─────────────┘     │ - Index-based binding   │   │  │ │
│  │  │                                           └─────────────────────────┘   │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │ │
│  │                                        │                                       │ │
│  │                                        ▼                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                       WebGL RENDER PIPELINE                              │  │ │
│  │  │                                                                          │  │ │
│  │  │   Float32Array ──▶ GPU Buffer ──▶ Vertex Shader ──▶ Fragment Shader     │  │ │
│  │  │   (7 floats/particle: x, y, size, r, g, b, depth)                       │  │ │
│  │  │                                                                          │  │ │
│  │  │   Instanced Rendering: 1 draw call for ALL particles                    │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Critical Architecture Decisions

### 2.1 MediaPipe: Main Thread (NOT Web Worker)

**Decision**: Run MediaPipe on the **main thread**.

**Rationale**:
| Factor | Main Thread | Web Worker |
|--------|-------------|------------|
| **Video frame transfer** | Direct access | Requires `transferToImageBitmap()` + postMessage (~5-8ms overhead) |
| **MediaPipe design** | Optimized for main thread | Unofficial worker support |
| **Canvas access** | Direct | Requires `OffscreenCanvas` (limited browser support) |
| **Latency** | ~33ms | ~40-45ms |
| **Complexity** | Simple | Significant message passing overhead |

**Implementation**:
```typescript
// MediaPipe runs in main thread with requestAnimationFrame decoupled from render
class TrackingEngine {
  private lastDetectionTime = 0;
  private readonly DETECTION_INTERVAL = 33; // ~30fps detection

  async processFrame(video: HTMLVideoElement, timestamp: number) {
    // Throttle detection to 30fps even if render is 60fps
    if (timestamp - this.lastDetectionTime < this.DETECTION_INTERVAL) {
      return this.getCachedLandmarks();
    }
    
    this.lastDetectionTime = timestamp;
    const results = await this.mediapipe.detect(video);
    this.updateLandmarkBuffer(results);
    return this.landmarks;
  }
}
```

### 2.2 Particle System: WebGL Instanced Rendering

**Decision**: Use **WebGL 2 with instanced rendering**.

**Rationale**:
| Approach | 15K Particles | Draw Calls | Memory | Complexity |
|----------|---------------|------------|--------|------------|
| **Canvas 2D** | 15-25ms/frame | N/A | Moderate | Low |
| **WebGL Point Sprites** | 2-4ms/frame | 1 | Low | Medium |
| **WebGL Instancing** | 1-2ms/frame | 1 | Low | Medium |
| **Three.js** | 3-5ms/frame | Varies | High | High |

**Why not Canvas 2D?**
- 15,000 `arc()` calls = ~20ms minimum
- No hardware acceleration for particle glow
- Cannot achieve 60fps on mid-range hardware

**WebGL Instanced Implementation**:
```typescript
// Single draw call for ALL particles
gl.drawArraysInstanced(gl.POINTS, 0, 1, activeParticleCount);
```

### 2.3 Landmark Binding: Deterministic Particle Assignment

**Decision**: **Static pre-allocation** with index-based binding (NO dynamic particle creation).

**The Zero-Stray-Particle Guarantee**:
```typescript
interface ParticlePool {
  // Fixed-size pools - particles NEVER exist outside these
  handParticles: Float32Array;    // 2,400 particles (1,200 per hand)
  faceParticles: Float32Array;    // 12,000 particles (468 landmarks × ~25)
  
  // Binding tables - each particle knows its landmark
  handBindings: Uint16Array;      // particle index → landmark index
  faceBindings: Uint16Array;      // particle index → landmark index
}

// CRITICAL: Particles without a visible landmark are set to alpha=0
// They are NOT removed/created - just hidden
const updateParticleVisibility = (landmarks: Landmark[], particles: ParticlePool) => {
  for (let i = 0; i < particles.length; i++) {
    const landmarkIdx = particles.bindings[i];
    const landmark = landmarks[landmarkIdx];
    
    // Particle exists ONLY if landmark is visible
    particles.alpha[i] = landmark?.visibility > 0.5 ? 1.0 : 0.0;
  }
};
```

---

## 3. File Organization

```
src/
├── app/
│   ├── page.tsx                    # Main entry point
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
│
├── components/
│   ├── ParticleCanvas/
│   │   ├── ParticleCanvas.tsx      # React wrapper component
│   │   ├── useParticleRenderer.ts  # WebGL setup hook
│   │   └── index.ts
│   │
│   ├── CameraPreview/
│   │   ├── CameraPreview.tsx       # Camera + overlay component
│   │   ├── HandSkeleton.tsx        # Hand bone drawing
│   │   ├── FaceMesh.tsx            # Face mesh drawing
│   │   └── index.ts
│   │
│   └── UI/
│       ├── ModeToggle.tsx          # Attract/Repel button
│       ├── StatusIndicator.tsx     # Detection status
│       ├── KeyboardHints.tsx       # Shortcut panel
│       └── index.ts
│
├── core/                           # CRITICAL: Pure TypeScript, no React
│   ├── tracking/
│   │   ├── TrackingEngine.ts       # MediaPipe orchestration
│   │   ├── HandTracker.ts          # Hand-specific logic
│   │   ├── FaceTracker.ts          # Face-specific logic
│   │   ├── LandmarkBuffer.ts       # Double-buffered landmark storage
│   │   └── Interpolator.ts         # 30fps → 60fps smoothing
│   │
│   ├── particles/
│   │   ├── ParticleSystem.ts       # Main particle coordinator
│   │   ├── ParticlePool.ts         # Pre-allocated particle arrays
│   │   ├── ParticleDistributor.ts  # Golden ratio / mesh distribution
│   │   ├── DepthScaler.ts          # Z-based size/spread scaling
│   │   └── types.ts                # Particle interfaces
│   │
│   ├── renderer/
│   │   ├── WebGLRenderer.ts        # WebGL context management
│   │   ├── ParticleShader.ts       # GLSL shaders
│   │   ├── BufferManager.ts        # GPU buffer updates
│   │   └── RenderLoop.ts           # RAF orchestration
│   │
│   └── utils/
│       ├── math.ts                 # Vector ops, lerp, clamp
│       ├── performance.ts          # FPS monitoring, adaptive quality
│       └── constants.ts            # Magic numbers centralized
│
├── contexts/
│   ├── TrackingContext.tsx         # Landmark state provider
│   ├── ParticleContext.tsx         # Particle system state
│   └── ThemeContext.tsx            # Color theme state
│
├── hooks/
│   ├── useCamera.ts                # Camera stream management
│   ├── useMediaPipe.ts             # MediaPipe lifecycle
│   ├── useParticles.ts             # Particle system hook
│   └── useKeyboardShortcuts.ts     # Global keyboard handlers
│
└── types/
    ├── landmarks.ts                # MediaPipe landmark types
    ├── particles.ts                # Particle system types
    └── tracking.ts                 # Tracking result types
```

---

## 4. Key Algorithms

### 4.1 Particle Assignment (Strict Landmark Binding)

```typescript
// core/particles/ParticleDistributor.ts

/**
 * CRITICAL: This function creates a STATIC binding between particles and landmarks.
 * Called ONCE at initialization. Particles never change their landmark assignment.
 */
export function createParticleBindings(config: ParticleConfig): ParticleBindings {
  const bindings: ParticleBindings = {
    hand: new Map<number, ParticleRange>(),  // landmarkIdx → particle indices
    face: new Map<number, ParticleRange>(),
  };
  
  // HAND PARTICLES: Variable density by landmark type
  const handDensity: Record<HandLandmarkType, number> = {
    fingertip: 35,      // INDEX_FINGER_TIP, MIDDLE_FINGER_TIP, etc.
    fingerMid: 45,      // INDEX_FINGER_PIP, etc.
    fingerBase: 50,     // INDEX_FINGER_MCP, etc.
    palm: 70,           // WRIST, PALM_BASE
  };
  
  let handParticleIndex = 0;
  for (let landmarkIdx = 0; landmarkIdx < 21; landmarkIdx++) {
    const type = getHandLandmarkType(landmarkIdx);
    const count = handDensity[type];
    
    bindings.hand.set(landmarkIdx, {
      start: handParticleIndex,
      count: count,
    });
    handParticleIndex += count;
  }
  
  // FACE PARTICLES: Uniform density (468 landmarks × ~12-25 each)
  let faceParticleIndex = 0;
  const faceParticlesPerLandmark = Math.floor(config.maxFaceParticles / 468);
  
  for (let landmarkIdx = 0; landmarkIdx < 468; landmarkIdx++) {
    bindings.face.set(landmarkIdx, {
      start: faceParticleIndex,
      count: faceParticlesPerLandmark,
    });
    faceParticleIndex += faceParticlesPerLandmark;
  }
  
  return bindings;
}

/**
 * Distribute particles around a landmark using golden ratio spiral
 * Creates organic, non-uniform distribution
 */
export function distributeParticlesAroundLandmark(
  centerX: number,
  centerY: number,
  particleCount: number,
  maxSpread: number,
  depthScale: number
): Float32Array {
  const PHI = 1.618033988749;
  const GOLDEN_ANGLE = Math.PI * 2 / (PHI * PHI); // ~137.5°
  
  const positions = new Float32Array(particleCount * 2);
  const scaledSpread = maxSpread * depthScale;
  
  for (let i = 0; i < particleCount; i++) {
    const angle = i * GOLDEN_ANGLE;
    const radius = scaledSpread * Math.sqrt(i / particleCount);
    
    positions[i * 2] = centerX + Math.cos(angle) * radius;
    positions[i * 2 + 1] = centerY + Math.sin(angle) * radius;
  }
  
  return positions;
}
```

### 4.2 Interpolation (30fps → 60fps Smoothing)

```typescript
// core/tracking/Interpolator.ts

/**
 * Double-buffered interpolation WITHOUT prediction.
 * Uses pure linear interpolation between known frames.
 */
export class LandmarkInterpolator {
  private prevLandmarks: Float32Array | null = null;
  private currLandmarks: Float32Array | null = null;
  private prevTimestamp = 0;
  private currTimestamp = 0;
  
  // Output buffer - reused every frame
  private interpolatedLandmarks: Float32Array;
  
  constructor(landmarkCount: number) {
    // 3 floats per landmark: x, y, z
    this.interpolatedLandmarks = new Float32Array(landmarkCount * 3);
  }
  
  /**
   * Called when MediaPipe produces new detection (~30fps)
   */
  pushNewFrame(landmarks: Float32Array, timestamp: number): void {
    // Shift current to previous
    this.prevLandmarks = this.currLandmarks;
    this.prevTimestamp = this.currTimestamp;
    
    // Set new current
    this.currLandmarks = landmarks;
    this.currTimestamp = timestamp;
  }
  
  /**
   * Called every render frame (~60fps)
   * Returns interpolated landmarks based on current time
   */
  getInterpolatedLandmarks(renderTimestamp: number): Float32Array {
    // No interpolation possible yet
    if (!this.prevLandmarks || !this.currLandmarks) {
      return this.currLandmarks || this.interpolatedLandmarks;
    }
    
    // Calculate interpolation factor (0.0 to 1.0)
    const frameDuration = this.currTimestamp - this.prevTimestamp;
    const elapsed = renderTimestamp - this.currTimestamp;
    
    // Clamp t to [0, 1] - no extrapolation/prediction
    const t = Math.max(0, Math.min(1, elapsed / frameDuration));
    
    // Linear interpolation for each landmark component
    for (let i = 0; i < this.interpolatedLandmarks.length; i++) {
      this.interpolatedLandmarks[i] = 
        this.prevLandmarks[i] + (this.currLandmarks[i] - this.prevLandmarks[i]) * t;
    }
    
    return this.interpolatedLandmarks;
  }
}
```

**Why No Prediction?**
- Prediction causes overshoot artifacts on direction changes
- Human motion is unpredictable at <100ms scales
- Linear interpolation introduces max 16.6ms lag (acceptable)
- Prediction requires velocity tracking which adds complexity

### 4.3 Depth Scaling

```typescript
// core/particles/DepthScaler.ts

export interface DepthScaleResult {
  sizeMultiplier: number;    // Apply to base particle size
  spreadMultiplier: number;  // Apply to distribution radius
  opacityMultiplier: number; // Subtle opacity variation
}

/**
 * MediaPipe Z-coordinate interpretation:
 * - Negative Z = closer to camera
 * - Positive Z = further from camera
 * - Range typically: -0.3 to +0.3 (normalized to wrist/nose)
 */
export function calculateDepthScale(z: number): DepthScaleResult {
  // Clamp Z to expected range
  const MIN_Z = -0.3;
  const MAX_Z = 0.3;
  const clampedZ = Math.max(MIN_Z, Math.min(MAX_Z, z));
  
  // Normalize: 0 = closest, 1 = furthest
  const normalizedDepth = (clampedZ - MIN_Z) / (MAX_Z - MIN_Z);
  
  // Exponential curve for natural perspective feel
  const CLOSE_SCALE = 1.8;
  const FAR_SCALE = 0.5;
  
  const sizeMultiplier = CLOSE_SCALE * Math.pow(FAR_SCALE / CLOSE_SCALE, normalizedDepth);
  
  return {
    sizeMultiplier: Math.max(0.3, Math.min(2.5, sizeMultiplier)),
    spreadMultiplier: sizeMultiplier, // Spread scales with size
    opacityMultiplier: 0.8 + (1 - normalizedDepth) * 0.2, // Closer = slightly more opaque
  };
}

/**
 * For face mesh: use average depth of face region, not per-landmark
 * This prevents weird depth discontinuities across the face
 */
export function calculateFaceRegionDepth(faceLandmarks: Float32Array): number {
  // Use nose tip (landmark 1) as reference point
  const noseZ = faceLandmarks[1 * 3 + 2]; // z component of landmark 1
  return noseZ;
}
```

---

## 5. Data Structures (Typed Arrays)

### 5.1 Particle Buffer Layout

```typescript
// core/particles/types.ts

/**
 * Interleaved particle data for efficient GPU upload
 * Total: 7 floats × 15,000 particles = 420KB
 */
export interface ParticleBufferLayout {
  // Per-particle data (interleaved)
  stride: 7; // floats per particle
  
  attributes: {
    position: { offset: 0, size: 2 },  // x, y
    size: { offset: 2, size: 1 },      // radius in pixels
    color: { offset: 3, size: 3 },     // r, g, b (0-1)
    alpha: { offset: 6, size: 1 },     // visibility (0 or 1)
  };
}

/**
 * Pre-allocated particle pool - NEVER resized at runtime
 */
export class ParticlePool {
  // Main data buffer (interleaved)
  readonly data: Float32Array;
  
  // Binding indices (which landmark owns each particle)
  readonly landmarkBindings: Uint16Array;
  
  // Metadata
  readonly maxParticles: number;
  private activeCount: number = 0;
  
  constructor(maxParticles: number) {
    this.maxParticles = maxParticles;
    this.data = new Float32Array(maxParticles * 7);
    this.landmarkBindings = new Uint16Array(maxParticles);
  }
  
  // Fast typed array access
  setPosition(index: number, x: number, y: number): void {
    const offset = index * 7;
    this.data[offset] = x;
    this.data[offset + 1] = y;
  }
  
  setVisibility(index: number, visible: boolean): void {
    this.data[index * 7 + 6] = visible ? 1.0 : 0.0;
  }
}
```

### 5.2 Landmark Buffer (Double-Buffered)

```typescript
// core/tracking/LandmarkBuffer.ts

/**
 * Double-buffered landmark storage for thread-safe updates
 */
export class LandmarkBuffer {
  // Two buffers for double-buffering
  private bufferA: Float32Array;
  private bufferB: Float32Array;
  private writeToA = true;
  
  // Metadata
  readonly handLandmarkCount = 21 * 2; // 2 hands
  readonly faceLandmarkCount = 468;
  readonly componentsPerLandmark = 4; // x, y, z, visibility
  
  constructor() {
    const totalFloats = (this.handLandmarkCount + this.faceLandmarkCount) * this.componentsPerLandmark;
    this.bufferA = new Float32Array(totalFloats);
    this.bufferB = new Float32Array(totalFloats);
  }
  
  getWriteBuffer(): Float32Array {
    return this.writeToA ? this.bufferA : this.bufferB;
  }
  
  getReadBuffer(): Float32Array {
    return this.writeToA ? this.bufferB : this.bufferA;
  }
  
  swap(): void {
    this.writeToA = !this.writeToA;
  }
}
```

---

## 6. WebGL Shader Code

### 6.1 Vertex Shader

```glsl
// core/renderer/shaders/particle.vert
#version 300 es

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
```

### 6.2 Fragment Shader

```glsl
// core/renderer/shaders/particle.frag
#version 300 es
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
  
  // Soft edge falloff for anti-aliasing
  float alpha = smoothstep(0.5, 0.3, dist) * v_alpha;
  
  fragColor = vec4(v_color, alpha);
}
```

---

## 7. Performance Optimization Checklist

### 7.1 Critical Optimizations (Must Have)

| Optimization | Impact | Implementation |
|--------------|--------|----------------|
| **Typed Arrays everywhere** | 10-20× faster than objects | `Float32Array`, `Uint16Array` for all data |
| **Object pooling** | Zero GC pauses | Pre-allocate all particles at init |
| **Single draw call** | 50× fewer GPU state changes | WebGL instanced rendering |
| **Avoid array creation in loops** | Prevents GC thrashing | Reuse output buffers |
| **Throttle MediaPipe to 30fps** | CPU headroom | Only process every other frame |

### 7.2 Memory Layout

```typescript
// GOOD: Interleaved data (cache-friendly)
const particles = new Float32Array([
  // particle 0: x, y, size, r, g, b, alpha
  100, 200, 2.0, 1.0, 0.5, 0.0, 1.0,
  // particle 1
  150, 250, 2.5, 0.0, 1.0, 0.5, 1.0,
  // ...
]);

// BAD: Separate arrays (cache misses)
const positions = new Float32Array([100, 200, 150, 250]);
const sizes = new Float32Array([2.0, 2.5]);
const colors = new Float32Array([1.0, 0.5, 0.0, 0.0, 1.0, 0.5]);
```

### 7.3 Frame Budget Breakdown (16.67ms target)

```
┌─────────────────────────────────────────────────────────┐
│                    60fps Frame Budget                    │
├─────────────────────────────────────────────────────────┤
│ MediaPipe Detection (30fps, amortized)    │   ~11ms    │
│ Interpolation                             │   ~0.5ms   │
│ Particle Position Update                  │   ~1ms     │
│ GPU Buffer Upload                         │   ~1ms     │
│ WebGL Draw Call                           │   ~1-2ms   │
│ React Reconciliation                      │   ~1ms     │
│ ─────────────────────────────────────────────────────── │
│ TOTAL                                     │   ~15.5ms  │
│ HEADROOM                                  │   ~1.2ms   │
└─────────────────────────────────────────────────────────┘
```

### 7.4 Avoid These Anti-Patterns

```typescript
// ❌ BAD: Creating objects every frame
function updateParticles(landmarks: Landmark[]) {
  return landmarks.map(lm => ({  // Creates new object every frame!
    x: lm.x * width,
    y: lm.y * height,
  }));
}

// ✅ GOOD: Mutate pre-allocated buffer
function updateParticles(landmarks: Float32Array, output: Float32Array, width: number, height: number) {
  for (let i = 0; i < landmarks.length / 3; i++) {
    output[i * 2] = landmarks[i * 3] * width;
    output[i * 2 + 1] = landmarks[i * 3 + 1] * height;
  }
}

// ❌ BAD: Array methods in hot path
particles.filter(p => p.visible).forEach(p => render(p));

// ✅ GOOD: Simple loops
for (let i = 0; i < particleCount; i++) {
  if (particles.data[i * 7 + 6] > 0) {  // Check alpha directly
    // render inline
  }
}
```

---

## 8. Technology Choices Summary

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | Server components, streaming, React 19 |
| **MediaPipe** | `@mediapipe/tasks-vision` | Latest official SDK, better perf than legacy |
| **Rendering** | WebGL 2 | Instanced rendering, shaders, 15K particles |
| **State** | React Context + useRef | Context for UI, refs for hot-path data |
| **Styling** | Tailwind CSS | Rapid iteration, consistent design tokens |
| **Types** | TypeScript strict | Catch errors at compile time |
| **Bundler** | Next.js built-in (Turbopack) | Fast HMR, tree-shaking |

---

## 9. Latency Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    END-TO-END LATENCY BREAKDOWN                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Camera Capture          │████████│           ~16ms (1 frame)   │
│                          │        │                             │
│  MediaPipe Detection     │████████████████████████│   ~33ms     │
│                          │                        │             │
│  Interpolation Buffer    │██│                     ~0.5ms        │
│                          │  │                                   │
│  Particle Update         │██│                     ~1ms          │
│                          │  │                                   │
│  GPU Upload + Render     │████│                   ~2ms          │
│                          │    │                                 │
│  ────────────────────────────────────────────────────────────── │
│  TOTAL PIPELINE LATENCY                           ~52.5ms       │
│  ────────────────────────────────────────────────────────────── │
│                                                                 │
│  NOTE: With interpolation, perceived latency is ~35ms           │
│  (MediaPipe's inherent ~33ms is unavoidable)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **MediaPipe >50ms on slow devices** | Medium | Adaptive detection interval (40ms fallback) |
| **WebGL not supported** | Low | Canvas 2D fallback with reduced particle count |
| **GC pauses causing jank** | Medium | Strict object pooling, no allocations in render |
| **Mobile performance issues** | High | Reduce to 5,000 particles, disable glow |
| **Camera permission denied** | Medium | Clear error UI with retry option |

---

## 11. Implementation Order

1. **Core Infrastructure** (Task 1, 8)
   - Next.js setup
   - WebGL canvas initialization
   - Particle buffer creation

2. **MediaPipe Integration** (Task 4, 6)
   - Hand tracking
   - Face tracking
   - Landmark buffer

3. **Particle Binding** (Task 9, 10, 11)
   - Particle-to-landmark assignment
   - Distribution algorithms
   - Depth scaling

4. **Render Pipeline** (Task 5, 7)
   - WebGL shaders
   - Draw loop
   - Overlays

5. **Polish & Optimization** (Task 20)
   - Performance profiling
   - Adaptive quality
   - Mobile testing

---

## Appendix: Quick Reference

### Landmark Indices

**Hand (21 landmarks)**:
```
0: WRIST
1-4: THUMB (CMC, MCP, IP, TIP)
5-8: INDEX_FINGER (MCP, PIP, DIP, TIP)
9-12: MIDDLE_FINGER
13-16: RING_FINGER
17-20: PINKY
```

**Face (key landmarks)**:
```
1: Nose tip
33, 133: Eye corners (left)
362, 263: Eye corners (right)
61, 291: Mouth corners
```

### Particle Distribution Formula

```typescript
// Golden angle distribution
const PHI = 1.618033988749;
const GOLDEN_ANGLE = 2.39996; // radians

for (let i = 0; i < count; i++) {
  const angle = i * GOLDEN_ANGLE;
  const radius = maxRadius * Math.sqrt(i / count);
  x = centerX + Math.cos(angle) * radius;
  y = centerY + Math.sin(angle) * radius;
}
```
