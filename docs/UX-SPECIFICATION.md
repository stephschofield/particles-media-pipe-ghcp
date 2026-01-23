# MediaPipe Particle Simulator - UX Specification

## Executive Summary

A real-time hand and face particle visualization system using MediaPipe for tracking. Particles appear **exclusively** on detected body parts against a pure black canvas, creating a striking biometric visualization effect.

---

## 1. Visual Design Foundation

### 1.1 Background & Canvas

| Property | Value | Rationale |
|----------|-------|-----------|
| Background Color | `#000000` (pure black) | Maximum contrast, OLED-friendly, no distractions |
| Canvas Size | 100vw × 100vh | Edge-to-edge immersive experience |
| Z-Index Layering | Canvas (0) → UI (100) → Camera (200) | Proper visual hierarchy |

### 1.2 Core Constraint: Zero Stray Particles

**CRITICAL**: Particles MUST only appear on detected landmarks. Implementation rules:

```typescript
// Particle spawn logic - NO ambient/stray particles allowed
const spawnParticle = (landmark: Landmark) => {
  if (!landmark.visibility || landmark.visibility < 0.5) return null;
  // Particles ONLY from valid landmarks
};
```

- No background particles
- No ambient effects
- No particles outside tracked regions
- Clear visual boundary between tracked and untracked space

---

## 2. Particle Visual Parameters

### 2.1 Density Recommendations

| Body Part | Particle Count | Density Rationale |
|-----------|---------------|-------------------|
| **Per Hand** | 800-1,200 | 21 landmarks × ~50 particles each for dense coverage |
| **Face** | 4,000-6,000 | 468 landmarks need clustering for mesh effect |
| **Total Max** | ~15,000 | Performance ceiling for 60fps on mid-range GPU |

### 2.2 Size Parameters (Base Values)

| Particle Type | Base Size | Variance | Notes |
|---------------|-----------|----------|-------|
| Hand (fingertip) | 2px | ±0.5px | Precise, fine detail |
| Hand (knuckle) | 3px | ±1px | Slightly larger joints |
| Hand (palm) | 4px | ±1.5px | Denser center mass |
| Face (outline) | 1.5px | ±0.5px | Crisp edge definition |
| Face (features) | 2px | ±0.5px | Eyes, nose, mouth |
| Face (fill) | 1px | ±0.3px | Dense mesh interior |

### 2.3 Distribution Patterns

#### Hand Distribution (Golden Ratio Spiral)

```typescript
interface HandDistribution {
  fingertip: {
    spread: 1-2px,      // Tight clustering
    particlesPerLandmark: 30-40,
    pattern: 'radial'
  },
  fingerSegment: {
    spread: 3-5px,      // Medium spread
    particlesPerLandmark: 40-50,
    pattern: 'linear-along-bone'
  },
  palm: {
    spread: 8-12px,     // Widest spread
    particlesPerLandmark: 60-80,
    pattern: 'golden-spiral'
  }
}
```

**Golden Ratio Formula:**
```typescript
const phi = 1.618033988749;
const goldenAngle = Math.PI * 2 / (phi * phi);

const distributeParticles = (center: Point, count: number, maxRadius: number) => {
  return Array.from({ length: count }, (_, i) => {
    const angle = i * goldenAngle;
    const radius = maxRadius * Math.sqrt(i / count);
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };
  });
};
```

#### Face Distribution (Tight Mesh)

```typescript
interface FaceDistribution {
  landmark: {
    spread: 1-2px,       // Very tight
    particlesPerLandmark: 8-12,
    pattern: 'gaussian-cluster'
  },
  depthBoost: {
    nose: 1.3,           // Push forward
    cheekbones: 1.15,    // Subtle prominence  
    eyeSockets: 0.85,    // Recessed
    jawline: 1.1         // Slight definition
  }
}
```

### 2.4 Color Palettes

#### Default Theme: Body-Part Differentiation

| Element | Primary | Secondary | Glow |
|---------|---------|-----------|------|
| **Left Hand** | `#3B82F6` (blue-500) | `#60A5FA` (blue-400) | `rgba(59, 130, 246, 0.3)` |
| **Right Hand** | `#22C55E` (green-500) | `#4ADE80` (green-400) | `rgba(34, 197, 94, 0.3)` |
| **Face** | `#EC4899` (pink-500) | `#F472B6` (pink-400) | `rgba(236, 72, 153, 0.3)` |

#### Theme Presets

```typescript
const themes = {
  default: {
    leftHand: ['#3B82F6', '#60A5FA', '#93C5FD'],
    rightHand: ['#22C55E', '#4ADE80', '#86EFAC'],
    face: ['#EC4899', '#F472B6', '#F9A8D4']
  },
  rainbow: {
    particles: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'],
    mode: 'cycle-per-particle'
  },
  fire: {
    gradient: ['#DC2626', '#EA580C', '#F59E0B', '#FCD34D'],
    mode: 'radial-from-center'
  },
  ocean: {
    gradient: ['#0C4A6E', '#0369A1', '#0EA5E9', '#7DD3FC', '#FFFFFF'],
    mode: 'depth-mapped'
  },
  galaxy: {
    gradient: ['#581C87', '#7E22CE', '#A855F7', '#E879F9', '#FFFFFF'],
    stars: true // Add sparkle effect
  },
  matrix: {
    primary: '#22C55E',
    variants: ['#14532D', '#166534', '#22C55E', '#4ADE80'],
    effect: 'digital-rain'
  }
};
```

---

## 3. Depth-Based Scaling

### 3.1 Scaling Formula

MediaPipe provides Z-coordinate (depth) normalized to wrist/nose. Convert to scale factor:

```typescript
interface DepthScaling {
  // Z typically ranges from -0.3 (close) to 0.3 (far)
  minZ: -0.3,
  maxZ: 0.3,
  
  // Scale multipliers
  closeScale: 1.8,    // Objects close to camera
  normalScale: 1.0,   // Baseline distance  
  farScale: 0.5       // Objects far from camera
}

const calculateScale = (z: number): number => {
  // Invert Z (negative = close = larger)
  const normalizedDepth = (z - minZ) / (maxZ - minZ); // 0 = close, 1 = far
  
  // Exponential curve feels more natural than linear
  const scale = closeScale * Math.pow(farScale / closeScale, normalizedDepth);
  
  return Math.max(0.3, Math.min(2.5, scale)); // Clamp for sanity
};
```

### 3.2 What Scales with Depth

| Property | Scales? | Formula |
|----------|---------|---------|
| Particle size | ✅ Yes | `baseSize * depthScale` |
| Particle spread | ✅ Yes | `baseSpread * depthScale` |
| Cluster density | ❌ No | Constant particles per landmark |
| Opacity | ✅ Subtle | `baseOpacity * (0.8 + 0.2 * depthScale)` |
| Glow intensity | ✅ Yes | `baseGlow * depthScale` |

### 3.3 Natural Feel Guidelines

1. **Close objects**: Large, slightly blurred particles with strong glow
2. **Mid-range**: Crisp, well-defined particles at base size
3. **Far objects**: Small, sharp particles with reduced glow
4. **Transition**: Smooth interpolation, no sudden jumps

---

## 4. UI Component Specifications

### 4.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ [Attract Mode] ●                      Loading... │ 2 hands + face │
│ [Hide Camera]                                                   │
│                                                                 │
│                     ┌──────────────────┐                        │
│                     │  Camera Preview  │                        │
│                     │    256 × 144     │                        │
│                     └──────────────────┘                        │
│                                                                 │
│                                                                 │
│                                                                 │
│                        (Particle Canvas)                        │
│                                                                 │
│                                                                 │
│                                                                 │
│                                         [SPACE] Attract/Repel   │
│                                         [V] Cycle Theme         │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Camera Preview Box

```typescript
interface CameraPreviewSpec {
  position: 'top-center',
  dimensions: { width: 256, height: 144 },  // 16:9 aspect
  offset: { top: 16 },
  
  styling: {
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden'
  },
  
  video: {
    transform: 'scaleX(-1)',  // Mirror horizontally
    objectFit: 'cover'
  },
  
  overlays: {
    handSkeleton: true,       // Draw bone connections
    faceMesh: true,           // Draw triangulated mesh
    overlayOpacity: 0.8
  }
}
```

### 4.3 Mode Toggle Button (Top Left)

**Design Philosophy**: Glassmorphism with teal accent

```typescript
interface ModeToggleSpec {
  position: { top: 16, left: 16 },
  
  button: {
    width: 140,
    height: 40,
    borderRadius: 20,          // Pill shape
    
    // Glassmorphism
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    
    // Typography
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: 0.5
  },
  
  states: {
    attract: {
      icon: '◉',               // Or magnetic icon
      label: 'Attract Mode',
      accentColor: '#14B8A6',  // teal-500
      glowColor: 'rgba(20, 184, 166, 0.3)'
    },
    repel: {
      icon: '○',               // Or push-away icon
      label: 'Repel Mode', 
      accentColor: '#F97316',  // orange-500
      glowColor: 'rgba(249, 115, 22, 0.3)'
    }
  },
  
  hover: {
    background: 'rgba(255, 255, 255, 0.1)',
    transform: 'scale(1.02)',
    transition: '150ms ease-out'
  },
  
  active: {
    transform: 'scale(0.98)'
  }
}
```

### 4.4 Hide Camera Button (Below Mode Toggle)

```typescript
interface HideCameraSpec {
  position: { top: 64, left: 16 },  // 8px below mode toggle
  
  button: {
    width: 140,
    height: 36,
    borderRadius: 18,
    
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    
    fontSize: 13,
    fontWeight: 400,
    color: 'rgba(255, 255, 255, 0.6)'
  },
  
  states: {
    visible: { label: 'Hide Camera', icon: '👁' },
    hidden: { label: 'Show Camera', icon: '👁‍🗨' }
  }
}
```

### 4.5 Status Indicator (Top Right)

```typescript
interface StatusIndicatorSpec {
  position: { top: 16, right: 16 },
  
  container: {
    padding: '8px 16px',
    borderRadius: 20,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  
  states: {
    loading: {
      content: 'Loading...',
      color: '#A1A1AA',        // zinc-400
      animation: 'pulse 1.5s infinite'
    },
    noDetection: {
      content: 'Show your hands 👋',
      color: '#71717A',        // zinc-500
      animation: 'none'
    },
    detected: {
      template: '{hands} + {face}',  // e.g., "2 hands + face"
      color: '#22C55E',        // green-500
      icon: '●',               // Status dot
      animation: 'none'
    }
  },
  
  typography: {
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'SF Mono, Menlo, monospace'
  }
}
```

**Dynamic Content Logic:**
```typescript
const formatStatus = (hands: number, faceDetected: boolean): string => {
  const parts: string[] = [];
  
  if (hands === 1) parts.push('1 hand');
  else if (hands === 2) parts.push('2 hands');
  
  if (faceDetected) parts.push('face');
  
  if (parts.length === 0) return 'Show your hands 👋';
  return parts.join(' + ') + ' detected';
};
```

### 4.6 Keyboard Shortcuts Panel (Bottom Right)

```typescript
interface KeyboardPanelSpec {
  position: { bottom: 24, right: 24 },
  
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    opacity: 0.6
  },
  
  shortcut: {
    layout: 'row',  // [KEY] Description
    
    key: {
      padding: '4px 8px',
      borderRadius: 4,
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'SF Mono, Menlo, monospace',
      minWidth: 56,
      textAlign: 'center'
    },
    
    description: {
      marginLeft: 12,
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.5)'
    }
  },
  
  items: [
    { key: 'SPACE', description: 'Toggle Attract/Repel' },
    { key: 'V', description: 'Cycle Color Theme' }
  ]
}
```

---

## 5. Interaction Feedback Patterns

### 5.1 Loading States

```typescript
interface LoadingSequence {
  stages: [
    {
      id: 'init',
      message: 'Initializing...',
      duration: '~500ms',
      indicator: 'spinner'
    },
    {
      id: 'mediapipe',
      message: 'Loading AI Models...',
      duration: '2-5s',
      indicator: 'progress-bar',
      subtext: 'Hand tracking • Face mesh'
    },
    {
      id: 'camera',
      message: 'Starting Camera...',
      duration: '~1s',
      indicator: 'spinner'
    },
    {
      id: 'ready',
      message: 'Ready',
      duration: '1s fade',
      indicator: 'checkmark'
    }
  ],
  
  visualStyle: {
    overlay: 'rgba(0, 0, 0, 0.95)',
    spinner: 'teal-500 rotating ring',
    text: 'white, centered, fade transitions'
  }
}
```

### 5.2 Detection Feedback

| Event | Visual Feedback | Duration |
|-------|-----------------|----------|
| Hand enters frame | Particles spawn from center, fan outward | 300ms ease-out |
| Hand leaves frame | Particles drift and fade | 500ms ease-in |
| Face detected | Particles bloom from nose outward | 400ms |
| Face lost | Particles collapse inward then fade | 400ms |
| Mode switch | Brief flash on particles | 200ms |
| Theme change | Cross-fade colors | 400ms |

### 5.3 Gesture Feedback

```typescript
interface GestureFeedback {
  fistDetected: {
    // Theme cycling gesture
    visualCue: 'brief color pulse on hand particles',
    haptic: 'none (web)',
    audio: 'optional soft click',
    cooldown: 1000  // Prevent rapid cycling
  }
}
```

### 5.4 Error States

```typescript
interface ErrorStates {
  cameraPermissionDenied: {
    message: 'Camera access required',
    subtext: 'Please allow camera access to use this experience',
    action: { label: 'Retry', handler: requestCamera }
  },
  
  mediapipeLoadFailed: {
    message: 'Failed to load AI models',
    subtext: 'Check your connection and refresh',
    action: { label: 'Refresh', handler: reload }
  },
  
  lowPerformance: {
    message: 'Performance Warning',
    subtext: 'Reducing particle count for smoother experience',
    autoAction: 'reduce particles to 8000'
  }
}
```

---

## 6. Responsive Considerations

### 6.1 Viewport Adaptations

| Viewport | Particle Count | Camera Preview | UI Scale |
|----------|---------------|----------------|----------|
| Desktop (1920×1080+) | 15,000 | 256×144 | 1.0 |
| Laptop (1366×768) | 12,000 | 256×144 | 1.0 |
| Tablet (1024×768) | 8,000 | 192×108 | 0.9 |
| Mobile (≤768px) | 5,000 | 160×90 | 0.85 |

### 6.2 Performance Fallbacks

```typescript
const performanceConfig = {
  targetFPS: 60,
  
  fallbacks: [
    { threshold: 45, action: 'reduce particles by 20%' },
    { threshold: 30, action: 'disable glow effects' },
    { threshold: 20, action: 'switch to Canvas2D' }
  ],
  
  detection: {
    sampleFrames: 60,
    measurementInterval: 1000
  }
};
```

---

## 7. Accessibility

### 7.1 ARIA Labels

```typescript
const ariaLabels = {
  modeToggle: `Particle mode: ${mode}. Press to switch to ${otherMode}`,
  hideCamera: `Camera preview: ${visible ? 'visible' : 'hidden'}. Press to ${visible ? 'hide' : 'show'}`,
  statusIndicator: `Detection status: ${statusText}`,
  canvas: 'Particle visualization canvas showing hand and face tracking'
};
```

### 7.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between UI controls |
| `Enter`/`Space` (on button) | Activate focused button |
| `Space` (global) | Toggle attract/repel mode |
| `V` (global) | Cycle color theme |
| `Escape` | Hide/show UI overlay |

### 7.3 Reduced Motion

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  config.particleTrails = false;
  config.transitionDuration = 0;
  config.glowAnimations = false;
}
```

---

## 8. Implementation Priorities

### Phase 1: Core Experience
1. Black canvas with WebGL particle rendering
2. Hand tracking with blue/green differentiation
3. Face tracking with pink particles
4. Basic depth scaling

### Phase 2: UI Polish
1. Camera preview with overlays
2. Mode toggle button
3. Status indicator
4. Keyboard shortcuts panel

### Phase 3: Enhanced Interactions
1. Theme cycling
2. Fist gesture detection
3. Particle trails
4. Advanced depth scaling

### Phase 4: Optimization
1. Performance monitoring
2. Adaptive particle count
3. Mobile responsiveness
4. Error handling

---

## 9. Technical Notes

### WebGL Particle Rendering

```typescript
// Recommended particle shader approach
const particleVertex = `
  attribute vec2 position;
  attribute float size;
  attribute vec3 color;
  attribute float depth;
  
  uniform mat4 projection;
  uniform float depthScale;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    float scale = 1.0 + (1.0 - depth) * depthScale;
    gl_Position = projection * vec4(position, 0.0, 1.0);
    gl_PointSize = size * scale;
    vColor = color;
    vAlpha = 0.8 + depth * 0.2;
  }
`;

const particleFragment = `
  precision mediump float;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;
```

### Particle Buffer Structure

```typescript
interface ParticleBuffer {
  // Interleaved vertex data for performance
  // [x, y, size, r, g, b, depth] × particleCount
  data: Float32Array;
  stride: 7;  // floats per particle
  
  attributes: {
    position: { offset: 0, size: 2 },
    size: { offset: 2, size: 1 },
    color: { offset: 3, size: 3 },
    depth: { offset: 6, size: 1 }
  };
}
```

---

## Summary Recommendations

| Question | Recommendation |
|----------|----------------|
| **Optimal particle density** | 800-1,200 per hand, 4,000-6,000 for face = recognizable shapes |
| **Finger vs palm distribution** | Golden ratio spiral; 1-2px at fingertips, 8-12px at palm |
| **Depth scaling approach** | Exponential curve from 0.5× (far) to 1.8× (close), clamp to [0.3, 2.5] |
| **UI styling** | Glassmorphism with blur, 5% white backgrounds, teal accent |
| **Loading feedback** | Multi-stage progress with status text, ~3-6s total load time |
