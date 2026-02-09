/**
 * ParticlePhysics - Fixed timestep physics simulation
 * Implements attraction force with spring-like behavior and damping
 * Particles feel organic like flowing liquid
 * 
 * Supports two modes:
 * - Attract: Particles flow toward landmarks (default)
 * - Repel: Particles push away from landmarks, creating negative space
 * 
 * Also handles drift behavior for fading particles to prevent freezing
 */

import type { ParticlePool } from './ParticlePool';
import type { ParticleConfig } from './types';
import { LandmarkType } from './types';
import type { DetectionStateManager } from './DetectionStateManager';

/**
 * Physics update modes
 */
export const enum PhysicsMode {
  Attract = 0,
  Repel = 1,
}

/**
 * Repulsion configuration for interesting negative space effects
 */
export interface RepulsionConfig {
  /** Minimum distance particles maintain from landmarks (pixels) */
  minRadius: number;
  /** Maximum distance particles can travel from landmarks (pixels) */
  maxRadius: number;
  /** Strength of the repulsion force (0-1) */
  strength: number;
  /** How quickly particles settle at equilibrium distance */
  damping: number;
}

const DEFAULT_REPULSION_CONFIG: RepulsionConfig = {
  minRadius: 30,
  maxRadius: 120,
  strength: 0.12,
  damping: 0.88,
};

/**
 * Physics simulation for particle system
 * Runs at fixed timestep independent of render loop
 */
export class ParticlePhysics {
  /** Reference to particle pool */
  private pool: ParticlePool;
  
  /** Physics configuration */
  private config: ParticleConfig;
  
  /** Current physics mode */
  public mode: PhysicsMode = PhysicsMode.Attract;
  
  /** Pre-allocated reusable noise result object to avoid per-particle allocation */
  private readonly noiseResult: { x: number; y: number } = { x: 0, y: 0 };
  
  /** Repulsion configuration */
  private repulsionConfig: RepulsionConfig = { ...DEFAULT_REPULSION_CONFIG };
  
  /** Fixed timestep in ms */
  private readonly FIXED_TIMESTEP = 16.67; // 60Hz physics
  
  /** Accumulated time for fixed timestep */
  private accumulatedTime = 0;
  
  /** Last update timestamp */
  private lastTimestamp = 0;
  
  /** Max physics steps per frame (prevent spiral of death) */
  private readonly MAX_STEPS_PER_FRAME = 4;
  
  /** Interpolation alpha for smooth rendering */
  private interpolationAlpha = 0;
  
  /** Mode transition progress (0 = fully in old mode, 1 = fully in new mode) */
  private modeTransitionProgress = 1;
  
  /** Previous mode (for smooth transitions) */
  private previousMode: PhysicsMode = PhysicsMode.Attract;
  
  /** Detection state manager reference (for drift behavior) */
  private detectionStateManager: DetectionStateManager | null = null;

  constructor(pool: ParticlePool) {
    this.pool = pool;
    this.config = pool.config;
  }

  /**
   * Update physics simulation
   * Should be called every render frame with current timestamp
   * @param timestamp Current timestamp from performance.now()
   * @param detectionState Optional detection state manager for drift behavior
   */
  update(timestamp: number, detectionState?: DetectionStateManager): void {
    // Store detection state reference for use in fixedUpdate
    this.detectionStateManager = detectionState ?? null;
    
    // Calculate delta time
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      return;
    }
    
    const deltaTime = Math.min(timestamp - this.lastTimestamp, 100); // Cap at 100ms
    this.lastTimestamp = timestamp;
    this.accumulatedTime += deltaTime;
    
    // Fixed timestep updates
    let steps = 0;
    while (this.accumulatedTime >= this.FIXED_TIMESTEP && steps < this.MAX_STEPS_PER_FRAME) {
      this.fixedUpdate();
      this.accumulatedTime -= this.FIXED_TIMESTEP;
      steps++;
    }
    
    // Store interpolation alpha for smooth rendering
    this.interpolationAlpha = this.accumulatedTime / this.FIXED_TIMESTEP;
  }

  /**
   * Fixed timestep physics update
   */
  private fixedUpdate(): void {
    const { physics } = this.pool;
    const { attractionStrength, damping } = this.config;
    const count = this.pool.allocatedCount;
    
    // Update mode transition (smooth blending over ~300ms = 18 frames)
    if (this.modeTransitionProgress < 1) {
      this.modeTransitionProgress = Math.min(1, this.modeTransitionProgress + 0.055);
    }
    
    for (let i = 0; i < count; i++) {
      // Skip invisible particles
      if (physics.alpha[i] < 0.01) continue;
      
      // Check if this particle's entity is fading (for drift behavior)
      const isFading = this.isParticleFading(i);
      
      // Calculate vector from particle to target
      const dx = physics.targetX[i] - physics.positionX[i];
      const dy = physics.targetY[i] - physics.positionY[i];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize direction (avoid division by zero)
      const nx = distance > 0.01 ? dx / distance : 0;
      const ny = distance > 0.01 ? dy / distance : 0;
      
      let forceX = 0;
      let forceY = 0;
      let effectiveDamping = damping;
      
      if (isFading) {
        // Fading particles: drift gently with reduced attraction
        // Add drift velocity to make particles float rather than freeze
        const driftStrength = 0.5;
        const driftNoiseX = Math.sin(this.lastTimestamp * 0.001 + i * 0.1) * driftStrength;
        const driftNoiseY = Math.cos(this.lastTimestamp * 0.0012 + i * 0.15) * driftStrength;
        
        // Very weak attraction to last known position (keeps particles from flying away)
        forceX = dx * attractionStrength * 0.1 + driftNoiseX;
        forceY = dy * attractionStrength * 0.1 + driftNoiseY;
        
        // Slightly less damping for floaty feel
        effectiveDamping = damping * 0.97;
      } else if (this.mode === PhysicsMode.Attract) {
        // Attract mode: spring-like attraction toward target
        forceX = dx * attractionStrength;
        forceY = dy * attractionStrength;
      } else {
        // Repel mode: push away from target with radius capping
        const { minRadius, maxRadius, strength } = this.repulsionConfig;
        effectiveDamping = this.repulsionConfig.damping;
        
        if (distance < minRadius) {
          // Too close: strong push outward
          const pushStrength = (1 - distance / minRadius) * strength * 2;
          forceX = -nx * pushStrength * 10;
          forceY = -ny * pushStrength * 10;
        } else if (distance < maxRadius) {
          // In the "orbit zone": gentle equilibrium force
          // Particles settle at a distance between min and max radius
          const equilibrium = (minRadius + maxRadius) / 2;
          const offset = distance - equilibrium;
          // Gentle spring toward equilibrium distance
          forceX = -nx * offset * strength * 0.1;
          forceY = -ny * offset * strength * 0.1;
          // Add tangential drift for interesting movement
          const tangentX = -ny * 0.02;
          const tangentY = nx * 0.02;
          forceX += tangentX;
          forceY += tangentY;
        } else {
          // Beyond max radius: gently pull back toward max boundary
          const pullBack = (distance - maxRadius) * strength * 0.5;
          forceX = nx * pullBack;
          forceY = ny * pullBack;
        }
      }
      
      // Add some organic noise for liquid feel (reduced when fading)
      const noiseMultiplier = isFading ? 0.3 : 1;
      const noise = this.getOrganicNoise(i, physics.positionX[i], physics.positionY[i]);
      
      // Update velocity with force and noise
      physics.velocityX[i] = (physics.velocityX[i] + forceX + noise.x * noiseMultiplier) * effectiveDamping;
      physics.velocityY[i] = (physics.velocityY[i] + forceY + noise.y * noiseMultiplier) * effectiveDamping;
      
      // Clamp velocity for stability
      const maxVelocity = 50;
      physics.velocityX[i] = Math.max(-maxVelocity, Math.min(maxVelocity, physics.velocityX[i]));
      physics.velocityY[i] = Math.max(-maxVelocity, Math.min(maxVelocity, physics.velocityY[i]));
      
      // Update position
      physics.positionX[i] += physics.velocityX[i];
      physics.positionY[i] += physics.velocityY[i];
    }
  }

  /**
   * Check if a particle's entity is currently fading (for drift behavior)
   */
  private isParticleFading(particleIndex: number): boolean {
    if (!this.detectionStateManager) return false;
    
    const { physics } = this.pool;
    const landmarkType = physics.landmarkType[particleIndex];
    const handIndex = physics.handIndex[particleIndex];
    
    if (landmarkType === LandmarkType.Hand) {
      return this.detectionStateManager.isHandFading(handIndex);
    } else if (landmarkType === LandmarkType.Face) {
      return this.detectionStateManager.isFaceFading();
    }
    
    return false;
  }

  /**
   * Generate subtle organic noise for liquid feel
   * OPTIMIZED: Reuses pre-allocated object to avoid per-particle allocation
   */
  private getOrganicNoise(
    index: number,
    x: number,
    y: number
  ): { x: number; y: number } {
    // Use position and index for deterministic but organic-looking noise
    const t = this.lastTimestamp * 0.001;
    const noiseScale = 0.3;
    
    // Simple perlin-like noise approximation
    // PERF: Reuse pre-allocated object instead of creating new one
    this.noiseResult.x = Math.sin(x * 0.01 + t + index * 0.1) * noiseScale;
    this.noiseResult.y = Math.cos(y * 0.01 + t * 1.1 + index * 0.1) * noiseScale;
    
    return this.noiseResult;
  }

  /**
   * Instantly snap particles to their targets (for initial placement)
   */
  snapToTargets(): void {
    const { physics } = this.pool;
    const count = this.pool.allocatedCount;
    
    for (let i = 0; i < count; i++) {
      physics.positionX[i] = physics.targetX[i];
      physics.positionY[i] = physics.targetY[i];
      physics.velocityX[i] = 0;
      physics.velocityY[i] = 0;
    }
  }

  /**
   * Set physics mode with smooth transition
   */
  setMode(mode: PhysicsMode): void {
    if (this.mode !== mode) {
      this.previousMode = this.mode;
      this.mode = mode;
      this.modeTransitionProgress = 0; // Start transition
    }
  }

  /**
   * Toggle between attract and repel modes with smooth transition
   */
  toggleMode(): PhysicsMode {
    this.previousMode = this.mode;
    this.mode = this.mode === PhysicsMode.Attract ? PhysicsMode.Repel : PhysicsMode.Attract;
    this.modeTransitionProgress = 0; // Start transition
    return this.mode;
  }

  /**
   * Get current mode name as string (for UI display)
   */
  getModeName(): 'attract' | 'repel' {
    return this.mode === PhysicsMode.Attract ? 'attract' : 'repel';
  }

  /**
   * Check if currently transitioning between modes
   */
  isTransitioning(): boolean {
    return this.modeTransitionProgress < 1;
  }

  /**
   * Configure repulsion behavior
   */
  setRepulsionConfig(config: Partial<RepulsionConfig>): void {
    this.repulsionConfig = { ...this.repulsionConfig, ...config };
  }

  /**
   * Get current repulsion configuration
   */
  getRepulsionConfig(): RepulsionConfig {
    return { ...this.repulsionConfig };
  }

  /**
   * Get current interpolation alpha for smooth rendering
   */
  getInterpolationAlpha(): number {
    return this.interpolationAlpha;
  }

  /**
   * Reset physics state
   */
  reset(): void {
    const { physics } = this.pool;
    const count = this.pool.allocatedCount;
    
    for (let i = 0; i < count; i++) {
      physics.velocityX[i] = 0;
      physics.velocityY[i] = 0;
    }
    
    this.accumulatedTime = 0;
    this.lastTimestamp = 0;
    this.modeTransitionProgress = 1; // Complete any transition
  }

  /**
   * Apply impulse to all particles (for visual effects)
   */
  applyImpulse(forceX: number, forceY: number): void {
    const { physics } = this.pool;
    const count = this.pool.allocatedCount;
    
    for (let i = 0; i < count; i++) {
      if (physics.alpha[i] < 0.01) continue;
      physics.velocityX[i] += forceX;
      physics.velocityY[i] += forceY;
    }
  }
}
