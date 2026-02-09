/**
 * Type definitions for the particle system
 * Pre-allocated, landmark-bound particles with physics simulation
 */

/**
 * Particle data layout in interleaved Float32Array
 * 7 floats per particle for GPU upload
 */
export interface ParticleBufferLayout {
  readonly stride: 7;
  readonly attributes: {
    readonly position: { readonly offset: 0; readonly size: 2 };  // x, y
    readonly size: { readonly offset: 2; readonly size: 1 };      // radius
    readonly color: { readonly offset: 3; readonly size: 3 };     // r, g, b
    readonly alpha: { readonly offset: 6; readonly size: 1 };     // visibility
  };
}

/**
 * Extended particle state for physics simulation
 * Stored in separate Float32Arrays for CPU-side updates
 */
export interface ParticlePhysicsState {
  // Current positions (updated each physics step)
  readonly positionX: Float32Array;
  readonly positionY: Float32Array;
  
  // Velocities for smooth motion
  readonly velocityX: Float32Array;
  readonly velocityY: Float32Array;
  
  // Target positions (from landmarks)
  readonly targetX: Float32Array;
  readonly targetY: Float32Array;
  
  // Per-particle properties
  readonly size: Float32Array;
  readonly alpha: Float32Array;
  
  // Color (r, g, b per particle)
  readonly colorR: Float32Array;
  readonly colorG: Float32Array;
  readonly colorB: Float32Array;
  
  // Binding info - which landmark owns this particle
  readonly landmarkIndex: Uint16Array;
  readonly landmarkType: Uint8Array; // 0 = none, 1 = hand, 2 = face
  readonly handIndex: Uint8Array;    // 0 = first hand, 1 = second hand
}

/**
 * Range of particle indices for a landmark
 */
export interface ParticleRange {
  readonly start: number;
  readonly count: number;
}

/**
 * Particle bindings - maps landmarks to particle ranges
 */
export interface ParticleBindings {
  // Each entry maps landmark index to particle range
  readonly hand: Map<number, ParticleRange>;
  readonly face: Map<number, ParticleRange>;
  
  // Pre-computed totals
  readonly handParticleCount: number;
  readonly faceParticleCount: number;
  readonly totalParticleCount: number;
}

/**
 * Configuration for the particle system
 */
export interface ParticleConfig {
  /** Maximum total particles (default 15000) */
  readonly maxParticles: number;
  
  /** Particles per hand landmark (21 landmarks per hand) */
  readonly handParticlesPerLandmark: number;
  
  /** Particles per face landmark (468 landmarks) */
  readonly faceParticlesPerLandmark: number;
  
  /** Base particle size in pixels */
  readonly baseSize: number;
  
  /** Size variance (+/-) */
  readonly sizeVariance: number;
  
  /** Attraction force strength (spring constant) */
  readonly attractionStrength: number;
  
  /** Velocity damping (0-1, higher = more friction) */
  readonly damping: number;
  
  /** Max spread radius from landmark center */
  readonly maxSpreadRadius: number;
}

/**
 * Default particle configuration
 */
export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  maxParticles: 15000,
  handParticlesPerLandmark: 50,
  faceParticlesPerLandmark: 12,
  baseSize: 3,
  sizeVariance: 1.5,
  attractionStrength: 0.15,
  damping: 0.92,
  maxSpreadRadius: 15,
};

/**
 * Landmark types for categorization
 */
export const enum LandmarkType {
  None = 0,
  Hand = 1,
  Face = 2,
}

/**
 * Hand landmark categories for variable density
 */
export const enum HandLandmarkCategory {
  Fingertip = 0,
  FingerMid = 1,
  FingerBase = 2,
  Palm = 3,
}

/**
 * Get the category of a hand landmark by index
 */
export function getHandLandmarkCategory(index: number): HandLandmarkCategory {
  // Fingertips: 4, 8, 12, 16, 20
  if (index === 4 || index === 8 || index === 12 || index === 16 || index === 20) {
    return HandLandmarkCategory.Fingertip;
  }
  // Finger mid (PIP/IP): 3, 7, 11, 15, 19
  if (index === 3 || index === 7 || index === 11 || index === 15 || index === 19) {
    return HandLandmarkCategory.FingerMid;
  }
  // Finger base (MCP): 2, 5, 6, 9, 10, 13, 14, 17, 18
  if (
    index === 2 || index === 5 || index === 6 ||
    index === 9 || index === 10 || index === 13 ||
    index === 14 || index === 17 || index === 18
  ) {
    return HandLandmarkCategory.FingerBase;
  }
  // Palm: 0 (wrist), 1 (thumb CMC)
  return HandLandmarkCategory.Palm;
}

/**
 * Color definitions for body parts
 */
export interface ParticleColors {
  leftHand: { r: number; g: number; b: number };
  rightHand: { r: number; g: number; b: number };
  face: { r: number; g: number; b: number };
}

export const DEFAULT_PARTICLE_COLORS: ParticleColors = {
  leftHand: { r: 0.23, g: 0.51, b: 0.96 },   // Blue
  rightHand: { r: 0.13, g: 0.77, b: 0.37 },  // Green
  face: { r: 0.92, g: 0.29, b: 0.60 },       // Pink
};

/**
 * Interpolated landmark data from the interpolator
 */
export interface InterpolatedLandmarks {
  /** Interpolated positions (x, y, z, visibility) for all landmarks */
  readonly data: Float32Array;
  
  /** Number of hand landmarks (21 per hand × numHands) */
  readonly handLandmarkCount: number;
  
  /** Number of face landmarks (468 if detected, 0 otherwise) */
  readonly faceLandmarkCount: number;
  
  /** Which hands are visible (index 0 = first, 1 = second) */
  readonly handsVisible: boolean[];
  
  /** Whether face is visible */
  readonly faceVisible: boolean;
  
  /** Handedness for each hand */
  readonly handedness: ('Left' | 'Right')[];
}
