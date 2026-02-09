/**
 * DepthScaling - Exponential depth-based scaling for particles
 * 
 * MediaPipe landmarks have a z-coordinate indicating depth:
 * - Negative z = closer to camera (larger particles)
 * - Positive z = farther from camera (smaller particles)
 * 
 * Implements exponential scaling curve for natural perspective feel.
 * Per UX Specification Section 3.
 */

/**
 * Depth scaling configuration
 */
export interface DepthScalingConfig {
  /** Minimum z value (closest to camera, typically -0.3) */
  readonly minZ: number;
  /** Maximum z value (farthest from camera, typically 0.3) */
  readonly maxZ: number;
  /** Scale multiplier when closest (1.8 per spec) */
  readonly closeScale: number;
  /** Scale multiplier when farthest (0.5 per spec) */
  readonly farScale: number;
  /** Minimum allowed scale (floor) */
  readonly minScale: number;
  /** Maximum allowed scale (ceiling) */
  readonly maxScale: number;
}

/**
 * Default depth scaling for hands - full range scaling
 * Per UX spec: 0.5x (far) to 1.8x (close)
 */
export const HAND_DEPTH_SCALING: DepthScalingConfig = {
  minZ: -0.3,
  maxZ: 0.3,
  closeScale: 1.8,
  farScale: 0.5,
  minScale: 0.3,
  maxScale: 2.5,
};

/**
 * Default depth scaling for face - reduced sensitivity
 * Face uses 60% of hand sensitivity: 0.7x (far) to 1.4x (close)
 * This prevents face particles from becoming too large/small
 */
export const FACE_DEPTH_SCALING: DepthScalingConfig = {
  minZ: -0.3,
  maxZ: 0.3,
  closeScale: 1.4,  // Less aggressive than hands
  farScale: 0.7,    // Floor is higher (less shrinking)
  minScale: 0.5,
  maxScale: 1.8,
};

/**
 * Calculate depth scale factor using exponential curve
 * 
 * Exponential scaling feels more natural than linear for perspective:
 * - Linear: scale = lerp(closeScale, farScale, t)
 * - Exponential: scale = closeScale * pow(farScale/closeScale, t)
 * 
 * @param z - The z-coordinate from MediaPipe landmark (-0.3 to 0.3 typical)
 * @param config - Depth scaling configuration
 * @returns Scale factor (0.5 to 1.8 for hands by default)
 */
export function calculateDepthScale(
  z: number,
  config: DepthScalingConfig = HAND_DEPTH_SCALING
): number {
  const { minZ, maxZ, closeScale, farScale, minScale, maxScale } = config;
  
  // Normalize z to 0-1 range (0 = close, 1 = far)
  // Clamp z to prevent extreme values
  const clampedZ = Math.max(minZ, Math.min(maxZ, z));
  const normalizedDepth = (clampedZ - minZ) / (maxZ - minZ);
  
  // Exponential curve: closeScale * pow(farScale/closeScale, t)
  // When t=0 (close): closeScale * pow(ratio, 0) = closeScale * 1 = closeScale
  // When t=1 (far): closeScale * pow(ratio, 1) = closeScale * ratio = farScale
  const ratio = farScale / closeScale;
  const scale = closeScale * Math.pow(ratio, normalizedDepth);
  
  // Clamp to safety bounds
  return Math.max(minScale, Math.min(maxScale, scale));
}

/**
 * Calculate depth-based alpha adjustment
 * 
 * Farther particles become slightly more transparent for depth perception.
 * Per UX spec: baseOpacity * (0.8 + 0.2 * depthScale)
 * 
 * @param depthScale - The computed depth scale (0.5 to 1.8)
 * @param baseAlpha - Base alpha value (0-1)
 * @param sensitivity - How much depth affects alpha (default 0.2)
 * @returns Adjusted alpha value (0-1)
 */
export function calculateDepthAlpha(
  depthScale: number,
  baseAlpha: number,
  sensitivity: number = 0.2
): number {
  // Normalize depth scale to 0-1 range for alpha calculation
  // Assuming depth scale ranges from ~0.5 to ~1.8
  const normalizedScale = (depthScale - 0.5) / (1.8 - 0.5);
  
  // Alpha adjustment: base * (1 - sensitivity + sensitivity * normalizedScale)
  // When close (scale=1.8, normalized=1): alpha * 1.0
  // When far (scale=0.5, normalized=0): alpha * (1 - sensitivity)
  const alphaMultiplier = (1 - sensitivity) + sensitivity * normalizedScale;
  
  return Math.max(0.1, Math.min(1.0, baseAlpha * alphaMultiplier));
}

/**
 * Get combined depth scaling for spread and alpha
 * 
 * @param z - The z-coordinate from MediaPipe landmark
 * @param config - Depth scaling configuration
 * @param baseAlpha - Base alpha value (0-1)
 * @returns Object with spreadScale and alphaMultiplier
 */
export function getDepthAdjustments(
  z: number,
  config: DepthScalingConfig = HAND_DEPTH_SCALING,
  baseAlpha: number = 1.0
): { spreadScale: number; alpha: number } {
  const spreadScale = calculateDepthScale(z, config);
  const alpha = calculateDepthAlpha(spreadScale, baseAlpha);
  
  return { spreadScale, alpha };
}

/**
 * Interpolate between two depth scales for smooth transitions
 * Used when blending between current and previous frame
 * 
 * @param current - Current depth scale
 * @param target - Target depth scale
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated scale
 */
export function lerpDepthScale(
  current: number,
  target: number,
  t: number
): number {
  return current + (target - current) * t;
}

/**
 * Validate a depth scaling configuration
 */
export function validateDepthScalingConfig(
  config: DepthScalingConfig
): { valid: boolean; message: string } {
  const issues: string[] = [];
  
  if (config.minZ >= config.maxZ) {
    issues.push('minZ must be less than maxZ');
  }
  if (config.closeScale <= 0) {
    issues.push('closeScale must be positive');
  }
  if (config.farScale <= 0) {
    issues.push('farScale must be positive');
  }
  if (config.closeScale <= config.farScale) {
    issues.push('closeScale should be greater than farScale');
  }
  if (config.minScale <= 0 || config.minScale > config.maxScale) {
    issues.push('minScale/maxScale bounds are invalid');
  }
  
  return {
    valid: issues.length === 0,
    message: issues.length === 0
      ? 'Configuration is valid'
      : `Issues: ${issues.join(', ')}`,
  };
}
