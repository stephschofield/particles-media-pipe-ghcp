/**
 * Particle System Module
 * Pre-allocated, landmark-bound particles with physics simulation
 */

export { ParticleSystem, type ParticleSystemConfig } from './ParticleSystem';
export { ParticlePool } from './ParticlePool';
export { LandmarkInterpolator } from './LandmarkInterpolator';
export { ParticlePhysics, PhysicsMode, type RepulsionConfig } from './ParticlePhysics';
export { DetectionStateManager, DetectionState, DETECTION_TIMING } from './DetectionStateManager';

// Performance utilities
export {
  FPSCounter,
  LODManager,
  ExponentialSmoother,
  Point2DSmoother,
  measureTime,
  measureTimeAsync,
  type PerformanceMetrics,
} from '../performance';

// Theme system
export {
  type ThemeName,
  type ColorTheme,
  THEMES,
  THEME_COUNT,
  RAINBOW_THEME,
  FIRE_THEME,
  OCEAN_THEME,
  GALAXY_THEME,
  MATRIX_THEME,
  ThemeManager,
  themeManager,
  getCurrentTheme,
  cycleTheme,
  getThemeByName,
} from '../themes';

// Hand distribution with golden ratio spiral
export {
  PHI,
  GOLDEN_ANGLE,
  DEFAULT_HAND_DISTRIBUTION,
  HAND_COLORS,
  FINGERTIP_LANDMARKS,
  PALM_LANDMARKS,
  FINGER_SEGMENT_LANDMARKS,
  FINGER_BONES,
  getHandZoneSpread,
  getParticlesPerLandmark,
  calculateHandParticleCount,
  calculateGoldenSpiralOffset,
  getZoneSpreadRange,
  calculateParticleSpread,
  getHandLandmarkName,
  validateHandDistribution,
  type HandZoneSpread,
  type HandDistributionConfig,
} from './HandDistribution';

export {
  type ParticleConfig,
  type ParticleColors,
  type ParticleBindings,
  type ParticleRange,
  type ParticlePhysicsState,
  type ParticleBufferLayout,
  type InterpolatedLandmarks,
  DEFAULT_PARTICLE_CONFIG,
  DEFAULT_PARTICLE_COLORS,
  LandmarkType,
  HandLandmarkCategory,
  getHandLandmarkCategory,
} from './types';

// Face distribution with tight clustering
export {
  DEFAULT_FACE_DISTRIBUTION,
  FACE_COLOR,
  NOSE_LANDMARKS,
  CHEEKBONE_LANDMARKS,
  EYE_SOCKET_LANDMARKS,
  LIPS_LANDMARKS,
  CONTOUR_LANDMARKS,
  FaceLandmarkCategory,
  getFaceLandmarkCategory,
  getFaceZoneConfig,
  getFaceParticlesPerLandmark,
  calculateFaceParticleCount,
  getFaceDepthBoost,
  calculateFaceParticleOffset,
  calculateFaceParticleSpread,
  validateFaceDistribution,
  getFaceLandmarkRegion,
  type FaceZoneConfig,
  type FaceDistributionConfig,
} from './FaceDistribution';
