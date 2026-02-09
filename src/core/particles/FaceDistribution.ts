/**
 * FaceDistribution - Tight clustering distribution for face particles
 * 
 * Implements zone-specific particle distribution for 468 face landmarks:
 * - All zones: 1-2px spread (ultra-tight clustering for mesh effect)
 * - Depth enhancement: nose forward, cheekbones forward, eye sockets recessed
 * - Exponential depth-based scaling (reduced sensitivity vs hands)
 * 
 * Uses golden ratio for organic spiral placement.
 */

import { GOLDEN_ANGLE } from './HandDistribution';
import { calculateDepthScale, calculateDepthAlpha, FACE_DEPTH_SCALING } from './DepthScaling';

/**
 * Face landmark categories for depth-based distribution
 */
export const enum FaceLandmarkCategory {
  /** Nose bridge and tip - pushed forward */
  Nose = 0,
  /** Cheekbones - slightly forward */
  Cheekbone = 1,
  /** Eye socket area - recessed back */
  EyeSocket = 2,
  /** Lips - neutral depth */
  Lips = 3,
  /** Face oval/contour - neutral depth */
  Contour = 4,
  /** General face area - neutral depth */
  General = 5,
}

/**
 * Nose landmarks (pushed forward with depth boost)
 * Includes nose bridge, tip, and bridge sides
 */
export const NOSE_LANDMARKS = [
  1, 2, 3, 4, 5, 6, 168, 195, 197,      // Central nose
  19, 59, 166, 289,                      // Nose bridge sides
  45, 51, 97, 275, 281, 326,             // Nose tip area
  44, 64, 98, 274, 294, 327,             // Upper nose
  48, 115, 220, 278, 344, 440,           // Nostril area
  102, 131, 141, 209, 331, 360, 370, 429 // Nose root
] as const;

/**
 * Cheekbone landmarks (slightly pushed forward for prominence)
 */
export const CHEEKBONE_LANDMARKS = [
  93, 132, 323, 361,    // Main cheekbones from FaceMesh.tsx
  234, 454,             // Outer cheek prominences
  50, 101, 116, 117, 118, 119, 123, 147, 187, 203, 206, 207, // Left cheek area
  280, 330, 345, 346, 347, 348, 352, 376, 411, 423, 426, 427  // Right cheek area
] as const;

/**
 * Eye socket landmarks (recessed for depth)
 * Inner corners and areas around eyes that appear recessed
 */
export const EYE_SOCKET_LANDMARKS = [
  // Left eye socket area
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  130, 226, 133,        // Inner corners
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 56, 110, 111, 112, 113, 114, 
  // Right eye socket area
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
  359, 446, 362,        // Inner corners
  252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 286, 339, 340, 341, 342, 343
] as const;

/**
 * Lips landmarks (neutral depth)
 * Inner and outer lip contours
 */
export const LIPS_LANDMARKS = [
  // Outer lips
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95,
  // Inner lips
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
  // Additional lip area
  0, 11, 12, 37, 38, 39, 40, 41, 42, 72, 73, 74, 76, 77, 85, 86, 89, 90, 96,
  185, 267, 268, 269, 270, 271, 272, 302, 303, 304, 306, 307, 315, 316, 319, 320, 325, 409
] as const;

/**
 * Face oval/contour landmarks (neutral depth)
 */
export const CONTOUR_LANDMARKS = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
] as const;

// Pre-computed lookup set for faster category lookup
const noseLandmarkSet = new Set<number>(NOSE_LANDMARKS);
const cheekboneLandmarkSet = new Set<number>(CHEEKBONE_LANDMARKS);
const eyeSocketLandmarkSet = new Set<number>(EYE_SOCKET_LANDMARKS);
const lipsLandmarkSet = new Set<number>(LIPS_LANDMARKS);
const contourLandmarkSet = new Set<number>(CONTOUR_LANDMARKS);

/**
 * Get the category of a face landmark by index
 */
export function getFaceLandmarkCategory(index: number): FaceLandmarkCategory {
  if (noseLandmarkSet.has(index)) return FaceLandmarkCategory.Nose;
  if (cheekboneLandmarkSet.has(index)) return FaceLandmarkCategory.Cheekbone;
  if (eyeSocketLandmarkSet.has(index)) return FaceLandmarkCategory.EyeSocket;
  if (lipsLandmarkSet.has(index)) return FaceLandmarkCategory.Lips;
  if (contourLandmarkSet.has(index)) return FaceLandmarkCategory.Contour;
  return FaceLandmarkCategory.General;
}

/**
 * Zone-specific configuration for face particles
 */
export interface FaceZoneConfig {
  /** Minimum spread radius in pixels (ultra-tight 1-2px for mesh effect) */
  readonly spreadMin: number;
  /** Maximum spread radius in pixels */
  readonly spreadMax: number;
  /** Depth boost multiplier (>1 = forward, <1 = recessed) */
  readonly depthBoost: number;
  /** Particles per landmark in this zone */
  readonly particlesPerLandmark: number;
}

/**
 * Face distribution configuration per zone
 */
export interface FaceDistributionConfig {
  readonly nose: FaceZoneConfig;
  readonly cheekbone: FaceZoneConfig;
  readonly eyeSocket: FaceZoneConfig;
  readonly lips: FaceZoneConfig;
  readonly contour: FaceZoneConfig;
  readonly general: FaceZoneConfig;
}

/**
 * Default face distribution configuration matching UX spec
 * - Ultra-tight 1-2px clustering across all 468 landmarks
 * - Depth boost for 3D effect: nose forward, eye sockets recessed
 * - ~12 particles per landmark = ~5,616 total particles
 */
export const DEFAULT_FACE_DISTRIBUTION: FaceDistributionConfig = {
  nose: {
    spreadMin: 1,
    spreadMax: 2,
    depthBoost: 1.3,   // Push forward (per UX spec)
    particlesPerLandmark: 14, // Slightly more for prominent feature
  },
  cheekbone: {
    spreadMin: 1,
    spreadMax: 2,
    depthBoost: 1.15,  // Subtle prominence (per UX spec)
    particlesPerLandmark: 12,
  },
  eyeSocket: {
    spreadMin: 1,
    spreadMax: 2,
    depthBoost: 0.85,  // Recessed (per UX spec)
    particlesPerLandmark: 12,
  },
  lips: {
    spreadMin: 1,
    spreadMax: 2,
    depthBoost: 1.0,   // Neutral
    particlesPerLandmark: 12,
  },
  contour: {
    spreadMin: 1,
    spreadMax: 2,
    depthBoost: 1.0,   // Neutral
    particlesPerLandmark: 11, // Slightly fewer for outline
  },
  general: {
    spreadMin: 1,
    spreadMax: 2,
    depthBoost: 1.0,   // Neutral
    particlesPerLandmark: 12,
  },
};

/**
 * Face color palette - Pink/Magenta #EC4899
 */
export const FACE_COLOR = {
  hex: '#EC4899',
  r: 0.925, // 236/255
  g: 0.282, // 72/255
  b: 0.600, // 153/255
} as const;

/**
 * Get the zone configuration for a face landmark
 */
export function getFaceZoneConfig(
  landmarkIndex: number,
  config: FaceDistributionConfig = DEFAULT_FACE_DISTRIBUTION
): FaceZoneConfig {
  const category = getFaceLandmarkCategory(landmarkIndex);
  
  switch (category) {
    case FaceLandmarkCategory.Nose:
      return config.nose;
    case FaceLandmarkCategory.Cheekbone:
      return config.cheekbone;
    case FaceLandmarkCategory.EyeSocket:
      return config.eyeSocket;
    case FaceLandmarkCategory.Lips:
      return config.lips;
    case FaceLandmarkCategory.Contour:
      return config.contour;
    default:
      return config.general;
  }
}

/**
 * Calculate particles per face landmark based on zone
 */
export function getFaceParticlesPerLandmark(
  landmarkIndex: number,
  config: FaceDistributionConfig = DEFAULT_FACE_DISTRIBUTION
): number {
  return getFaceZoneConfig(landmarkIndex, config).particlesPerLandmark;
}

/**
 * Calculate total particles for face (468 landmarks)
 * Returns a value between 4,000-6,000 as per spec
 */
export function calculateFaceParticleCount(
  config: FaceDistributionConfig = DEFAULT_FACE_DISTRIBUTION
): number {
  let total = 0;
  
  for (let lm = 0; lm < 468; lm++) {
    total += getFaceParticlesPerLandmark(lm, config);
  }
  
  return total; // Should be ~5,600 with default config
}

/**
 * Get depth boost multiplier for a face landmark
 * >1.0 = pushed forward, <1.0 = recessed
 */
export function getFaceDepthBoost(
  landmarkIndex: number,
  config: FaceDistributionConfig = DEFAULT_FACE_DISTRIBUTION
): number {
  return getFaceZoneConfig(landmarkIndex, config).depthBoost;
}

/**
 * Calculate tight cluster offset for face particles
 * Uses golden spiral for organic distribution with ultra-tight 1-2px spread
 * Applies depth-based spread scaling for natural perspective
 * 
 * @param particleIndex - Index of the particle (0 to count-1)
 * @param totalParticles - Total number of particles for this landmark
 * @param spreadMin - Minimum spread radius in pixels (typically 1)
 * @param spreadMax - Maximum spread radius in pixels (typically 2)
 * @param depthBoost - Depth boost multiplier for this landmark zone
 * @param landmarkZ - Original z-depth of the landmark
 * @param spreadDepthScale - Depth-based spread scale factor (default 1.0)
 * @returns { offsetX, offsetY, adjustedZ } - Offset from center and adjusted Z
 */
export function calculateFaceParticleOffset(
  particleIndex: number,
  totalParticles: number,
  spreadMin: number,
  spreadMax: number,
  depthBoost: number,
  landmarkZ: number = 0,
  spreadDepthScale: number = 1.0
): { offsetX: number; offsetY: number; adjustedZ: number } {
  // Golden angle distribution for organic spiral
  const angle = particleIndex * GOLDEN_ANGLE;
  
  // Normalized radius (0 to 1) using sqrt for uniform area distribution
  const normalizedRadius = Math.sqrt(particleIndex / Math.max(1, totalParticles));
  
  // Interpolate between min and max spread (ultra-tight 1-2px)
  const spreadRange = (spreadMax - spreadMin) * normalizedRadius;
  const baseRadius = spreadMin + spreadRange;
  
  // Apply depth-based spread scaling (cluster size scales with depth)
  const radius = baseRadius * spreadDepthScale;
  
  // Calculate offset using golden spiral
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius;
  
  // Apply depth boost to z-coordinate
  // depthBoost > 1 = forward (more negative z in MediaPipe convention)
  // depthBoost < 1 = recessed (less negative z)
  const adjustedZ = landmarkZ * depthBoost;
  
  return { offsetX, offsetY, adjustedZ };
}

/**
 * Calculate face particle spread with zone-aware settings
 * Uses exponential depth scaling with reduced sensitivity (face less sensitive than hands)
 * 
 * @param landmarkIndex - Index of the face landmark (0-467)
 * @param particleIndex - Index of the particle for this landmark
 * @param totalParticles - Total particles allocated to this landmark
 * @param landmarkZ - Z-depth from MediaPipe
 * @param config - Distribution configuration
 * @returns { offsetX, offsetY, adjustedZ, alpha }
 */
export function calculateFaceParticleSpread(
  landmarkIndex: number,
  particleIndex: number,
  totalParticles: number,
  landmarkZ: number = 0,
  config: FaceDistributionConfig = DEFAULT_FACE_DISTRIBUTION
): { offsetX: number; offsetY: number; adjustedZ: number; alpha: number } {
  const zoneConfig = getFaceZoneConfig(landmarkIndex, config);
  
  // Calculate exponential depth scale with face-specific reduced sensitivity
  // Face uses 0.7x (far) to 1.4x (close) vs hands' 0.5x to 1.8x
  const spreadDepthScale = calculateDepthScale(landmarkZ, FACE_DEPTH_SCALING);
  
  const { offsetX, offsetY, adjustedZ } = calculateFaceParticleOffset(
    particleIndex,
    totalParticles,
    zoneConfig.spreadMin,
    zoneConfig.spreadMax,
    zoneConfig.depthBoost,
    landmarkZ,
    spreadDepthScale
  );
  
  // Calculate depth-adjusted alpha using centralized function
  // Farther particles become slightly more transparent for depth perception
  const baseAlpha = 0.6 + Math.random() * 0.25;
  const alpha = calculateDepthAlpha(spreadDepthScale, baseAlpha, 0.15);
  
  return { offsetX, offsetY, adjustedZ, alpha };
}

/**
 * Validate face distribution produces particles within spec range (4,000-6,000)
 */
export function validateFaceDistribution(
  config: FaceDistributionConfig = DEFAULT_FACE_DISTRIBUTION
): { valid: boolean; count: number; message: string } {
  const count = calculateFaceParticleCount(config);
  const valid = count >= 4000 && count <= 6000;
  
  return {
    valid,
    count,
    message: valid
      ? `Valid: ${count} particles for face (range: 4,000-6,000)`
      : `Invalid: ${count} particles for face (expected 4,000-6,000)`,
  };
}

/**
 * Get face landmark region name for debugging
 */
export function getFaceLandmarkRegion(index: number): string {
  const category = getFaceLandmarkCategory(index);
  
  switch (category) {
    case FaceLandmarkCategory.Nose:
      return 'NOSE';
    case FaceLandmarkCategory.Cheekbone:
      return 'CHEEKBONE';
    case FaceLandmarkCategory.EyeSocket:
      return 'EYE_SOCKET';
    case FaceLandmarkCategory.Lips:
      return 'LIPS';
    case FaceLandmarkCategory.Contour:
      return 'CONTOUR';
    default:
      return 'GENERAL';
  }
}
