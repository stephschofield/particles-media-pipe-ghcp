/**
 * HandDistribution - Golden ratio spiral distribution for hand particles
 * 
 * Implements zone-specific particle clustering:
 * - Fingertips: 1-2px spread (tight clustering)
 * - Finger segments: 3-5px spread (medium spread)
 * - Palm: 8-12px spread (widest spread)
 * 
 * Uses golden ratio (phi = 1.618033988749895) for organic spiral placement.
 * Applies exponential depth-based scaling per UX spec Section 3.
 */

import { HandLandmarkCategory, getHandLandmarkCategory } from './types';
import { calculateDepthScale, HAND_DEPTH_SCALING } from './DepthScaling';

// Golden ratio constants
export const PHI = 1.618033988749895;
export const GOLDEN_ANGLE = Math.PI * 2 / (PHI * PHI); // ~137.5 degrees

/**
 * Zone-specific spread configuration (in pixels)
 */
export interface HandZoneSpread {
  /** Minimum spread radius */
  readonly min: number;
  /** Maximum spread radius */
  readonly max: number;
  /** Particles per landmark in this zone */
  readonly particlesPerLandmark: number;
}

/**
 * Hand distribution configuration per zone
 */
export interface HandDistributionConfig {
  readonly fingertip: HandZoneSpread;
  readonly fingerMid: HandZoneSpread;
  readonly fingerBase: HandZoneSpread;
  readonly palm: HandZoneSpread;
}

/**
 * Default hand distribution configuration matching UX spec
 */
export const DEFAULT_HAND_DISTRIBUTION: HandDistributionConfig = {
  fingertip: {
    min: 1,
    max: 2,
    particlesPerLandmark: 35, // 30-40 per spec
  },
  fingerMid: {
    min: 3,
    max: 5,
    particlesPerLandmark: 45, // 40-50 per spec
  },
  fingerBase: {
    min: 3,
    max: 5,
    particlesPerLandmark: 50, // 40-50, slightly more for base
  },
  palm: {
    min: 8,
    max: 12,
    particlesPerLandmark: 70, // 60-80 per spec
  },
};

/**
 * Hand color palette
 */
export const HAND_COLORS = {
  left: {
    hex: '#3B82F6',
    r: 0.231, // 59/255
    g: 0.510, // 130/255
    b: 0.965, // 246/255
  },
  right: {
    hex: '#22C55E',
    r: 0.133, // 34/255
    g: 0.773, // 197/255
    b: 0.369, // 94/255
  },
} as const;

/**
 * Get the spread configuration for a hand landmark
 */
export function getHandZoneSpread(
  landmarkIndex: number,
  config: HandDistributionConfig = DEFAULT_HAND_DISTRIBUTION
): HandZoneSpread {
  const category = getHandLandmarkCategory(landmarkIndex);
  
  switch (category) {
    case HandLandmarkCategory.Fingertip:
      return config.fingertip;
    case HandLandmarkCategory.FingerMid:
      return config.fingerMid;
    case HandLandmarkCategory.FingerBase:
      return config.fingerBase;
    case HandLandmarkCategory.Palm:
      return config.palm;
    default:
      return config.fingerMid; // Fallback
  }
}

/**
 * Calculate particles per landmark based on zone
 */
export function getParticlesPerLandmark(
  landmarkIndex: number,
  config: HandDistributionConfig = DEFAULT_HAND_DISTRIBUTION
): number {
  return getHandZoneSpread(landmarkIndex, config).particlesPerLandmark;
}

/**
 * Calculate total particles for a hand (21 landmarks)
 * Returns a value between 800-1200 as per spec
 */
export function calculateHandParticleCount(
  config: HandDistributionConfig = DEFAULT_HAND_DISTRIBUTION
): number {
  let total = 0;
  
  for (let lm = 0; lm < 21; lm++) {
    total += getParticlesPerLandmark(lm, config);
  }
  
  return total; // Should be ~1000 with default config
}

/**
 * Generate golden ratio spiral distribution for particles around a landmark
 * 
 * @param centerX - Center X position
 * @param centerY - Center Y position
 * @param particleIndex - Index of the particle (0 to count-1)
 * @param totalParticles - Total number of particles for this landmark
 * @param spreadMin - Minimum spread radius in pixels
 * @param spreadMax - Maximum spread radius in pixels
 * @param depthScale - Optional depth scaling factor (default 1.0)
 * @returns { offsetX, offsetY } - Offset from center
 */
export function calculateGoldenSpiralOffset(
  particleIndex: number,
  totalParticles: number,
  spreadMin: number,
  spreadMax: number,
  depthScale: number = 1.0
): { offsetX: number; offsetY: number } {
  // Golden angle distribution
  const angle = particleIndex * GOLDEN_ANGLE;
  
  // Normalized radius (0 to 1) using sqrt for uniform area distribution
  const normalizedRadius = Math.sqrt(particleIndex / Math.max(1, totalParticles));
  
  // Interpolate between min and max spread, scaled by depth
  const spreadRange = (spreadMax - spreadMin) * normalizedRadius;
  const baseRadius = spreadMin + spreadRange;
  const radius = baseRadius * depthScale;
  
  // Calculate offset using golden spiral
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;
  
  return { offsetX, offsetY };
}

/**
 * Get spread values for a landmark category with smooth transitions
 * Returns interpolated values between zones for organic feel
 */
export function getZoneSpreadRange(
  landmarkIndex: number,
  config: HandDistributionConfig = DEFAULT_HAND_DISTRIBUTION
): { min: number; max: number } {
  const zone = getHandZoneSpread(landmarkIndex, config);
  return { min: zone.min, max: zone.max };
}

/**
 * Calculate zone-aware spread for a specific particle
 * Uses exponential depth scaling per UX spec Section 3.1
 * 
 * @param landmarkIndex - Index of the hand landmark (0-20)
 * @param particleIndex - Index of the particle for this landmark
 * @param totalParticles - Total particles allocated to this landmark
 * @param depthZ - Z-depth from MediaPipe (negative = closer, positive = farther)
 * @param config - Hand distribution configuration
 * @returns { offsetX, offsetY } - Offset from landmark center
 */
export function calculateParticleSpread(
  landmarkIndex: number,
  particleIndex: number,
  totalParticles: number,
  depthZ: number = 0,
  config: HandDistributionConfig = DEFAULT_HAND_DISTRIBUTION
): { offsetX: number; offsetY: number } {
  const { min, max } = getZoneSpreadRange(landmarkIndex, config);
  
  // Exponential depth-based scaling per UX spec
  // Uses HAND_DEPTH_SCALING: 0.5x (far) to 1.8x (close)
  const depthScale = calculateDepthScale(depthZ, HAND_DEPTH_SCALING);
  
  return calculateGoldenSpiralOffset(
    particleIndex,
    totalParticles,
    min,
    max,
    depthScale
  );
}

/**
 * Get hand landmark name for debugging
 */
export function getHandLandmarkName(index: number): string {
  const names = [
    'WRIST',
    'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
    'INDEX_MCP', 'INDEX_PIP', 'INDEX_DIP', 'INDEX_TIP',
    'MIDDLE_MCP', 'MIDDLE_PIP', 'MIDDLE_DIP', 'MIDDLE_TIP',
    'RING_MCP', 'RING_PIP', 'RING_DIP', 'RING_TIP',
    'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP',
  ];
  return names[index] ?? `UNKNOWN_${index}`;
}

/**
 * Get fingertip landmark indices
 */
export const FINGERTIP_LANDMARKS = [4, 8, 12, 16, 20] as const;

/**
 * Get palm landmark indices (wrist and base of fingers)
 */
export const PALM_LANDMARKS = [0, 1, 5, 9, 13, 17] as const;

/**
 * Get finger segment landmark indices (PIP and DIP joints)
 */
export const FINGER_SEGMENT_LANDMARKS = [
  2, 3, 6, 7, 10, 11, 14, 15, 18, 19
] as const;

/**
 * Finger bone structure for natural distribution along bone lines
 * Each finger is defined by its landmark indices from base to tip
 */
export const FINGER_BONES = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
} as const;

/**
 * Validate hand distribution produces particles within spec range (800-1200)
 */
export function validateHandDistribution(
  config: HandDistributionConfig = DEFAULT_HAND_DISTRIBUTION
): { valid: boolean; count: number; message: string } {
  const count = calculateHandParticleCount(config);
  const valid = count >= 800 && count <= 1200;
  
  return {
    valid,
    count,
    message: valid
      ? `Valid: ${count} particles per hand (range: 800-1200)`
      : `Invalid: ${count} particles per hand (expected 800-1200)`,
  };
}
