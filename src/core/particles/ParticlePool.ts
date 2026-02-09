/**
 * ParticlePool - Pre-allocated Float32Arrays for all particle data
 * Particles are NEVER created or destroyed at runtime
 * Each particle is statically bound to one landmark index
 */

import {
  type ParticleConfig,
  type ParticleBindings,
  type ParticlePhysicsState,
  type ParticleRange,
  type ParticleColors,
  DEFAULT_PARTICLE_CONFIG,
  DEFAULT_PARTICLE_COLORS,
  LandmarkType,
} from './types';

import {
  GOLDEN_ANGLE,
  DEFAULT_HAND_DISTRIBUTION,
  getParticlesPerLandmark,
  calculateParticleSpread,
} from './HandDistribution';

import {
  DEFAULT_FACE_DISTRIBUTION,
  getFaceParticlesPerLandmark,
  calculateFaceParticleSpread,
  FACE_COLOR,
} from './FaceDistribution';

/**
 * Pre-allocated particle pool with static landmark bindings
 */
export class ParticlePool {
  /** Configuration */
  public readonly config: ParticleConfig;
  
  /** Particle colors */
  public colors: ParticleColors;
  
  /** GPU-ready interleaved buffer (7 floats per particle) */
  public readonly gpuBuffer: Float32Array;
  
  /** Physics state (separate arrays for CPU updates) */
  public readonly physics: ParticlePhysicsState;
  
  /** Static bindings from landmarks to particles */
  public readonly bindings: ParticleBindings;
  
  /** Number of particles actually allocated */
  public readonly allocatedCount: number;
  
  /** Canvas dimensions for coordinate conversion */
  private canvasWidth = 1920;
  private canvasHeight = 1080;
  
  /** Base alpha values per particle (before detection state multiplier) */
  private readonly baseAlpha: Float32Array;
  
  /** Alpha multipliers per hand (from DetectionStateManager) */
  private handAlphaMultipliers: [number, number] = [1, 1];
  
  /** Alpha multiplier for face (from DetectionStateManager) */
  private faceAlphaMultiplier = 1;

  constructor(config: Partial<ParticleConfig> = {}) {
    this.config = { ...DEFAULT_PARTICLE_CONFIG, ...config };
    this.colors = { ...DEFAULT_PARTICLE_COLORS };
    
    // Create static bindings
    this.bindings = this.createBindings();
    this.allocatedCount = this.bindings.totalParticleCount;
    
    // Pre-allocate GPU buffer
    this.gpuBuffer = new Float32Array(this.allocatedCount * 7);
    
    // Pre-allocate base alpha array
    this.baseAlpha = new Float32Array(this.allocatedCount);
    
    // Pre-allocate physics arrays
    this.physics = {
      positionX: new Float32Array(this.allocatedCount),
      positionY: new Float32Array(this.allocatedCount),
      velocityX: new Float32Array(this.allocatedCount),
      velocityY: new Float32Array(this.allocatedCount),
      targetX: new Float32Array(this.allocatedCount),
      targetY: new Float32Array(this.allocatedCount),
      size: new Float32Array(this.allocatedCount),
      alpha: new Float32Array(this.allocatedCount),
      colorR: new Float32Array(this.allocatedCount),
      colorG: new Float32Array(this.allocatedCount),
      colorB: new Float32Array(this.allocatedCount),
      landmarkIndex: new Uint16Array(this.allocatedCount),
      landmarkType: new Uint8Array(this.allocatedCount),
      handIndex: new Uint8Array(this.allocatedCount),
    };
    
    // Initialize particle properties
    this.initializeParticles();
  }

  /**
   * Create static bindings from landmarks to particle ranges
   * Called once at initialization
   * Uses zone-specific particle counts for golden ratio distribution
   */
  private createBindings(): ParticleBindings {
    const handBindings = new Map<number, ParticleRange>();
    const faceBindings = new Map<number, ParticleRange>();
    
    let currentIndex = 0;
    
    // Hand particles: 21 landmarks × 2 hands
    const handLandmarkCount = 21;
    const handsCount = 2;
    
    // Use zone-specific particle counts from HandDistribution
    // This produces 800-1200 particles per hand as per spec
    const getHandParticleCount = (landmarkIdx: number): number => {
      return getParticlesPerLandmark(landmarkIdx, DEFAULT_HAND_DISTRIBUTION);
    };
    
    // Create bindings for both hands
    for (let hand = 0; hand < handsCount; hand++) {
      for (let lm = 0; lm < handLandmarkCount; lm++) {
        const compositeKey = hand * 100 + lm; // Unique key per hand+landmark
        const count = getHandParticleCount(lm);
        
        handBindings.set(compositeKey, {
          start: currentIndex,
          count,
        });
        
        currentIndex += count;
      }
    }
    
    const handParticleCount = currentIndex;
    
    // Face particles: 468 landmarks with zone-specific particle counts
    // Uses FaceDistribution for 4,000-6,000 particles total
    const faceLandmarkCount = 468;
    const faceStartIndex = currentIndex;
    
    for (let lm = 0; lm < faceLandmarkCount; lm++) {
      const count = getFaceParticlesPerLandmark(lm, DEFAULT_FACE_DISTRIBUTION);
      faceBindings.set(lm, {
        start: currentIndex,
        count,
      });
      currentIndex += count;
    }
    
    const faceParticleCount = currentIndex - faceStartIndex;
    
    // Clamp to max particles if needed
    const totalParticleCount = Math.min(currentIndex, this.config.maxParticles);
    
    return {
      hand: handBindings,
      face: faceBindings,
      handParticleCount: Math.min(handParticleCount, this.config.maxParticles),
      faceParticleCount: Math.min(faceParticleCount, this.config.maxParticles - handParticleCount),
      totalParticleCount,
    };
  }

  /**
   * Initialize all particles with default values
   */
  private initializeParticles(): void {
    const { physics, bindings, config } = this;
    
    // Initialize hand particles
    for (const [compositeKey, range] of bindings.hand) {
      const handIndex = Math.floor(compositeKey / 100);
      const landmarkIndex = compositeKey % 100;
      
      for (let i = 0; i < range.count; i++) {
        const idx = range.start + i;
        if (idx >= this.allocatedCount) break;
        
        // Set binding info
        physics.landmarkIndex[idx] = landmarkIndex;
        physics.landmarkType[idx] = LandmarkType.Hand;
        physics.handIndex[idx] = handIndex;
        
        // Initial size with variance using golden angle distribution
        const angle = i * GOLDEN_ANGLE;
        const sizeVariation = Math.sin(angle * 3) * config.sizeVariance;
        physics.size[idx] = config.baseSize + sizeVariation;
        
        // Start invisible
        physics.alpha[idx] = 0;
        
        // Position off-screen initially
        physics.positionX[idx] = -1000;
        physics.positionY[idx] = -1000;
        physics.targetX[idx] = -1000;
        physics.targetY[idx] = -1000;
        physics.velocityX[idx] = 0;
        physics.velocityY[idx] = 0;
      }
    }
    
    // Initialize face particles
    for (const [landmarkIndex, range] of bindings.face) {
      for (let i = 0; i < range.count; i++) {
        const idx = range.start + i;
        if (idx >= this.allocatedCount) break;
        
        // Set binding info
        physics.landmarkIndex[idx] = landmarkIndex;
        physics.landmarkType[idx] = LandmarkType.Face;
        physics.handIndex[idx] = 0;
        
        // Size (face particles slightly smaller)
        const angle = i * GOLDEN_ANGLE;
        const sizeVariation = Math.sin(angle * 3) * config.sizeVariance * 0.8;
        physics.size[idx] = config.baseSize * 0.8 + sizeVariation;
        
        // Start invisible
        physics.alpha[idx] = 0;
        
        // Position off-screen initially
        physics.positionX[idx] = -1000;
        physics.positionY[idx] = -1000;
        physics.targetX[idx] = -1000;
        physics.targetY[idx] = -1000;
        physics.velocityX[idx] = 0;
        physics.velocityY[idx] = 0;
      }
    }
  }

  /**
   * Update canvas dimensions for coordinate conversion
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * Update hand landmark targets from normalized coordinates
   * Uses zone-specific spread: fingertips 1-2px, finger segments 3-5px, palm 8-12px
   * @param handIndex 0 or 1
   * @param landmarks Array of 21 normalized landmarks
   * @param handedness 'Left' or 'Right' for color selection
   * @param alphaMultiplier Alpha multiplier from detection state (0-1)
   */
  updateHandTargets(
    handIndex: number,
    landmarks: { x: number; y: number; z: number; visibility?: number }[],
    handedness: 'Left' | 'Right',
    alphaMultiplier = 1
  ): void {
    const { physics, bindings, colors } = this;
    const color = handedness === 'Left' ? colors.leftHand : colors.rightHand;
    
    // Store the alpha multiplier for this hand
    this.handAlphaMultipliers[handIndex] = alphaMultiplier;
    
    for (let lm = 0; lm < landmarks.length && lm < 21; lm++) {
      const compositeKey = handIndex * 100 + lm;
      const range = bindings.hand.get(compositeKey);
      if (!range) continue;
      
      const landmark = landmarks[lm];
      // Convert normalized to screen coords (mirror X for selfie view)
      const screenX = (1 - landmark.x) * this.canvasWidth;
      const screenY = landmark.y * this.canvasHeight;
      const visibility = landmark.visibility ?? 1;
      
      for (let i = 0; i < range.count; i++) {
        const idx = range.start + i;
        if (idx >= this.allocatedCount) break;
        
        // Calculate golden spiral offset with zone-specific spread and depth scaling
        const { offsetX, offsetY } = calculateParticleSpread(
          lm,
          i,
          range.count,
          landmark.z
        );
        
        physics.targetX[idx] = screenX + offsetX;
        physics.targetY[idx] = screenY + offsetY;
        
        // Store base alpha based on visibility (before multiplier)
        const baseAlphaValue = visibility > 0.5 ? 0.7 + Math.random() * 0.3 : 0;
        this.baseAlpha[idx] = baseAlphaValue;
        
        // Apply detection state multiplier
        physics.alpha[idx] = baseAlphaValue * alphaMultiplier;
        
        // Set color based on handedness
        physics.colorR[idx] = color.r;
        physics.colorG[idx] = color.g;
        physics.colorB[idx] = color.b;
      }
    }
  }

  /**
   * Update face landmark targets from normalized coordinates
   * Uses zone-specific tight clustering (1-2px) and depth boost
   * @param landmarks Array of 468 normalized landmarks
   * @param alphaMultiplier Alpha multiplier from detection state (0-1)
   */
  updateFaceTargets(
    landmarks: { x: number; y: number; z: number; visibility?: number }[],
    alphaMultiplier = 1
  ): void {
    const { physics, bindings } = this;
    // Use the face color from FaceDistribution module
    const color = { r: FACE_COLOR.r, g: FACE_COLOR.g, b: FACE_COLOR.b };
    
    // Store the alpha multiplier for face
    this.faceAlphaMultiplier = alphaMultiplier;
    
    for (let lm = 0; lm < landmarks.length && lm < 468; lm++) {
      const range = bindings.face.get(lm);
      if (!range) continue;
      
      const landmark = landmarks[lm];
      const screenX = (1 - landmark.x) * this.canvasWidth;
      const screenY = landmark.y * this.canvasHeight;
      const visibility = landmark.visibility ?? 1;
      
      for (let i = 0; i < range.count; i++) {
        const idx = range.start + i;
        if (idx >= this.allocatedCount) break;
        
        // Use zone-aware face particle spread with depth boost
        const { offsetX, offsetY, alpha } = calculateFaceParticleSpread(
          lm,
          i,
          range.count,
          landmark.z,
          DEFAULT_FACE_DISTRIBUTION
        );
        
        physics.targetX[idx] = screenX + offsetX;
        physics.targetY[idx] = screenY + offsetY;
        
        // Store base alpha based on visibility and depth-adjusted alpha
        const baseAlphaValue = visibility > 0.5 ? alpha : 0;
        this.baseAlpha[idx] = baseAlphaValue;
        
        // Apply detection state multiplier
        physics.alpha[idx] = baseAlphaValue * alphaMultiplier;
        
        // Set face color (pink/magenta #EC4899)
        physics.colorR[idx] = color.r;
        physics.colorG[idx] = color.g;
        physics.colorB[idx] = color.b;
      }
    }
  }

  /**
   * Apply alpha multiplier to a hand (for smooth transitions)
   * @param handIndex 0 or 1
   * @param multiplier Alpha multiplier (0-1)
   */
  applyHandAlphaMultiplier(handIndex: number, multiplier: number): void {
    const { physics, bindings } = this;
    this.handAlphaMultipliers[handIndex] = multiplier;
    
    for (let lm = 0; lm < 21; lm++) {
      const compositeKey = handIndex * 100 + lm;
      const range = bindings.hand.get(compositeKey);
      if (!range) continue;
      
      for (let i = 0; i < range.count; i++) {
        const idx = range.start + i;
        if (idx >= this.allocatedCount) break;
        physics.alpha[idx] = this.baseAlpha[idx] * multiplier;
      }
    }
  }

  /**
   * Apply alpha multiplier to face (for smooth transitions)
   * @param multiplier Alpha multiplier (0-1)
   */
  applyFaceAlphaMultiplier(multiplier: number): void {
    const { physics, bindings } = this;
    this.faceAlphaMultiplier = multiplier;
    
    for (const [, range] of bindings.face) {
      for (let i = 0; i < range.count; i++) {
        const idx = range.start + i;
        if (idx >= this.allocatedCount) break;
        physics.alpha[idx] = this.baseAlpha[idx] * multiplier;
      }
    }
  }

  /**
   * Hide all particles for a specific hand (instant, sets multiplier to 0)
   */
  hideHand(handIndex: number): void {
    this.applyHandAlphaMultiplier(handIndex, 0);
  }

  /**
   * Hide all face particles (instant, sets multiplier to 0)
   */
  hideFace(): void {
    this.applyFaceAlphaMultiplier(0);
  }

  /**
   * Get current alpha multiplier for a hand
   */
  getHandAlphaMultiplier(handIndex: number): number {
    return this.handAlphaMultipliers[handIndex] ?? 0;
  }

  /**
   * Get current alpha multiplier for face
   */
  getFaceAlphaMultiplier(): number {
    return this.faceAlphaMultiplier;
  }

  /**
   * Copy physics state to GPU buffer for rendering
   */
  updateGPUBuffer(): void {
    const { physics, gpuBuffer, allocatedCount } = this;
    
    for (let i = 0; i < allocatedCount; i++) {
      const offset = i * 7;
      gpuBuffer[offset] = physics.positionX[i];
      gpuBuffer[offset + 1] = physics.positionY[i];
      gpuBuffer[offset + 2] = physics.size[i];
      gpuBuffer[offset + 3] = physics.colorR[i];
      gpuBuffer[offset + 4] = physics.colorG[i];
      gpuBuffer[offset + 5] = physics.colorB[i];
      gpuBuffer[offset + 6] = physics.alpha[i];
    }
  }

  /**
   * Get particle count for stats
   */
  getVisibleParticleCount(): number {
    let count = 0;
    for (let i = 0; i < this.allocatedCount; i++) {
      if (this.physics.alpha[i] > 0.01) count++;
    }
    return count;
  }
}
