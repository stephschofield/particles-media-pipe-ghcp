/**
 * ParticleSystem - Main coordinator for particle physics and rendering
 * Binds particles to landmarks, manages interpolation, and orchestrates updates
 * Handles smooth transitions when detection is lost or regained
 */

import type { TrackingResult } from '@/lib/types';
import { ParticlePool } from './ParticlePool';
import { LandmarkInterpolator } from './LandmarkInterpolator';
import { ParticlePhysics, PhysicsMode, type RepulsionConfig } from './ParticlePhysics';
import { DetectionStateManager } from './DetectionStateManager';
import type { ParticleConfig, ParticleColors } from './types';
import { DEFAULT_PARTICLE_CONFIG, DEFAULT_PARTICLE_COLORS } from './types';

export interface ParticleSystemConfig extends Partial<ParticleConfig> {
  colors?: Partial<ParticleColors>;
}

/**
 * Main particle system coordinator
 * Integrates particle pool, interpolation, physics, and detection state management
 */
export class ParticleSystem {
  /** Particle data pool */
  public readonly pool: ParticlePool;
  
  /** Landmark interpolator for smooth 60fps */
  public readonly interpolator: LandmarkInterpolator;
  
  /** Physics simulation */
  public readonly physics: ParticlePhysics;
  
  /** Detection state manager for smooth transitions */
  public readonly detectionState: DetectionStateManager;
  
  /** Configuration */
  public readonly config: ParticleConfig;
  
  /** Whether system is initialized */
  private initialized = false;
  
  /** Last tracking result timestamp */
  private lastTrackingTimestamp = 0;
  
  /** Track which hands were visible last frame */
  private prevHandsVisible: boolean[] = [false, false];
  
  /** Track if face was visible last frame */
  private prevFaceVisible = false;
  
  /** First detection flag (for snap-to-target) */
  private isFirstDetection = true;
  
  /** Last handedness per hand slot (for re-detection position lerping) */
  private lastHandedness: ('Left' | 'Right')[] = ['Left', 'Right'];

  constructor(config: ParticleSystemConfig = {}) {
    this.config = { ...DEFAULT_PARTICLE_CONFIG, ...config };
    
    // Create particle pool
    this.pool = new ParticlePool(this.config);
    
    // Apply custom colors if provided
    if (config.colors) {
      this.pool.colors = { ...DEFAULT_PARTICLE_COLORS, ...config.colors };
    }
    
    // Create interpolator
    this.interpolator = new LandmarkInterpolator();
    
    // Create physics
    this.physics = new ParticlePhysics(this.pool);
    
    // Create detection state manager for smooth transitions
    this.detectionState = new DetectionStateManager();
    
    this.initialized = true;
  }

  /**
   * Set canvas dimensions (required for coordinate conversion)
   */
  setCanvasSize(width: number, height: number): void {
    this.pool.setCanvasSize(width, height);
  }

  /**
   * Push new tracking result from MediaPipe (~30fps)
   */
  pushTrackingResult(result: TrackingResult): void {
    if (!this.initialized) return;
    
    // Avoid processing duplicate frames
    if (result.timestamp === this.lastTrackingTimestamp) return;
    this.lastTrackingTimestamp = result.timestamp;
    
    // Push to interpolator for smoothing
    this.interpolator.pushFrame(result);
  }

  /**
   * Update particle system (called every render frame ~60fps)
   * @param renderTimestamp Current timestamp from requestAnimationFrame
   */
  update(renderTimestamp: number): void {
    if (!this.initialized) return;
    
    // Get interpolated landmarks
    const interpolated = this.interpolator.getInterpolated(renderTimestamp);
    
    // Update detection state manager with current visibility
    this.detectionState.update(
      renderTimestamp,
      interpolated.handsVisible,
      interpolated.faceVisible
    );
    
    // Update particle targets and apply alpha multipliers based on detection state
    this.updateParticleTargets(interpolated.handsVisible, interpolated.faceVisible, renderTimestamp);
    
    // Run physics simulation (includes drift for fading particles)
    this.physics.update(renderTimestamp, this.detectionState);
    
    // Snap to targets on first detection for instant response
    if (this.isFirstDetection && this.interpolator.hasValidData()) {
      this.physics.snapToTargets();
      this.isFirstDetection = false;
    }
    
    // Update GPU buffer for rendering
    this.pool.updateGPUBuffer();
    
    // Store visibility for next frame
    this.prevHandsVisible = [...interpolated.handsVisible];
    this.prevFaceVisible = interpolated.faceVisible;
  }

  /**
   * Update particle targets from interpolated landmarks
   * Applies alpha multipliers based on detection state
   */
  private updateParticleTargets(
    handsVisible: boolean[],
    faceVisible: boolean,
    renderTimestamp: number
  ): void {
    // Update hand particles
    for (let h = 0; h < 2; h++) {
      const alphaMultiplier = this.detectionState.getHandAlphaMultiplier(h);
      
      if (this.detectionState.shouldUpdateHandTargets(h)) {
        // Hand is detected or fading in - update targets with new positions
        const landmarks = this.interpolator.getHandLandmarks(h);
        if (landmarks) {
          const handedness = this.interpolator.getInterpolated(renderTimestamp).handedness[h];
          this.lastHandedness[h] = handedness;
          this.pool.updateHandTargets(h, landmarks, handedness, alphaMultiplier);
        }
      } else if (this.detectionState.isHandVisible(h)) {
        // Hand is fading out or occluded - just update alpha, keep last positions
        this.pool.applyHandAlphaMultiplier(h, alphaMultiplier);
      }
    }
    
    // Update face particles
    const faceAlphaMultiplier = this.detectionState.getFaceAlphaMultiplier();
    
    if (this.detectionState.shouldUpdateFaceTargets()) {
      // Face is detected or fading in - update targets with new positions
      const landmarks = this.interpolator.getFaceLandmarks();
      if (landmarks) {
        this.pool.updateFaceTargets(landmarks, faceAlphaMultiplier);
      }
    } else if (this.detectionState.isFaceVisible()) {
      // Face is fading out or occluded - just update alpha, keep last positions
      this.pool.applyFaceAlphaMultiplier(faceAlphaMultiplier);
    }
  }

  /**
   * Get GPU-ready particle buffer
   */
  getGPUBuffer(): Float32Array {
    return this.pool.gpuBuffer;
  }

  /**
   * Get number of allocated particles
   */
  getParticleCount(): number {
    return this.pool.allocatedCount;
  }

  /**
   * Get number of visible particles
   */
  getVisibleParticleCount(): number {
    return this.pool.getVisibleParticleCount();
  }

  /**
   * Set physics mode (attract/repel)
   */
  setPhysicsMode(mode: PhysicsMode): void {
    this.physics.setMode(mode);
  }

  /**
   * Toggle physics mode
   */
  togglePhysicsMode(): PhysicsMode {
    return this.physics.toggleMode();
  }

  /**
   * Get current physics mode
   */
  getPhysicsMode(): PhysicsMode {
    return this.physics.mode;
  }

  /**
   * Get current physics mode as string (for UI display)
   */
  getPhysicsModeName(): 'attract' | 'repel' {
    return this.physics.getModeName();
  }

  /**
   * Check if physics is currently transitioning between modes
   */
  isPhysicsTransitioning(): boolean {
    return this.physics.isTransitioning();
  }

  /**
   * Configure repulsion behavior for Repel mode
   */
  setRepulsionConfig(config: Partial<RepulsionConfig>): void {
    this.physics.setRepulsionConfig(config);
  }

  /**
   * Get current repulsion configuration
   */
  getRepulsionConfig(): RepulsionConfig {
    return this.physics.getRepulsionConfig();
  }

  /**
   * Update color theme
   */
  setColors(colors: Partial<ParticleColors>): void {
    this.pool.colors = { ...this.pool.colors, ...colors };
  }

  /**
   * Apply visual impulse (for effects)
   */
  applyImpulse(forceX: number, forceY: number): void {
    this.physics.applyImpulse(forceX, forceY);
  }

  /**
   * Reset the particle system
   */
  reset(): void {
    this.interpolator.reset();
    this.physics.reset();
    this.detectionState.reset();
    this.prevHandsVisible = [false, false];
    this.prevFaceVisible = false;
    this.isFirstDetection = true;
    this.lastTrackingTimestamp = 0;
    this.lastHandedness = ['Left', 'Right'];
    
    // Hide all particles
    this.pool.hideHand(0);
    this.pool.hideHand(1);
    this.pool.hideFace();
    this.pool.updateGPUBuffer();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.reset();
    this.initialized = false;
  }

  /**
   * Check if system is in idle state (no detection for 500ms+)
   */
  isIdle(): boolean {
    return this.detectionState.isIdle();
  }
}
