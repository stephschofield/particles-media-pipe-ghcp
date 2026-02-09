/**
 * LandmarkInterpolator - Double-buffered interpolation for smooth 60fps rendering
 * Takes 30fps MediaPipe detections and produces smooth interpolated positions
 * Uses pure linear interpolation (NO prediction to avoid overshoot)
 */

import type { TrackingResult, HandLandmarks, Landmark } from '@/lib/types';
import type { InterpolatedLandmarks } from './types';

// 4 floats per landmark: x, y, z, visibility
const FLOATS_PER_LANDMARK = 4;

// Max landmarks: 21 per hand × 2 hands + 468 face
const MAX_HAND_LANDMARKS = 21 * 2;
const MAX_FACE_LANDMARKS = 468;
const MAX_TOTAL_LANDMARKS = MAX_HAND_LANDMARKS + MAX_FACE_LANDMARKS;

/**
 * Double-buffered landmark interpolator
 * Smooths 30fps detection → 60fps render
 */
export class LandmarkInterpolator {
  // Double buffers for landmark data
  private prevBuffer: Float32Array;
  private currBuffer: Float32Array;
  private outputBuffer: Float32Array;
  
  // Timestamps for interpolation
  private prevTimestamp = 0;
  private currTimestamp = 0;
  
  // Visibility tracking
  private prevHandsVisible: boolean[] = [false, false];
  private currHandsVisible: boolean[] = [false, false];
  private prevFaceVisible = false;
  private currFaceVisible = false;
  
  // Handedness tracking
  private prevHandedness: ('Left' | 'Right')[] = ['Left', 'Right'];
  private currHandedness: ('Left' | 'Right')[] = ['Left', 'Right'];
  
  // Output structure (reused)
  private output: InterpolatedLandmarks;
  
  // Pre-allocated landmark arrays for getHandLandmarks/getFaceLandmarks
  // PERF: Avoids per-frame array allocation in hot paths
  private handLandmarkCache: [Landmark[], Landmark[]];
  private faceLandmarkCache: Landmark[];
  
  // First frame flag
  private hasData = false;

  constructor() {
    const bufferSize = MAX_TOTAL_LANDMARKS * FLOATS_PER_LANDMARK;
    
    this.prevBuffer = new Float32Array(bufferSize);
    this.currBuffer = new Float32Array(bufferSize);
    this.outputBuffer = new Float32Array(bufferSize);
    
    // Pre-allocate landmark arrays (PERF: avoids per-frame allocation)
    this.handLandmarkCache = [
      Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 })),
      Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 })),
    ];
    this.faceLandmarkCache = Array.from({ length: 468 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }));
    
    // Initialize output structure
    this.output = {
      data: this.outputBuffer,
      handLandmarkCount: 0,
      faceLandmarkCount: 0,
      handsVisible: [false, false],
      faceVisible: false,
      handedness: ['Left', 'Right'],
    };
  }

  /**
   * Push a new detection frame (called at ~30fps by MediaPipe)
   */
  pushFrame(result: TrackingResult): void {
    // Swap buffers
    const temp = this.prevBuffer;
    this.prevBuffer = this.currBuffer;
    this.currBuffer = temp;
    
    // Copy visibility state
    this.prevHandsVisible = [...this.currHandsVisible];
    this.prevFaceVisible = this.currFaceVisible;
    this.prevHandedness = [...this.currHandedness];
    
    // Update timestamps
    this.prevTimestamp = this.currTimestamp;
    this.currTimestamp = result.timestamp;
    
    // Reset visibility
    this.currHandsVisible = [false, false];
    this.currFaceVisible = false;
    
    // Copy hand landmarks
    let offset = 0;
    const sortedHands = this.sortHandsByPosition(result.hands);
    
    for (let h = 0; h < 2; h++) {
      const hand = sortedHands[h];
      if (hand) {
        this.currHandsVisible[h] = true;
        this.currHandedness[h] = hand.handedness;
        
        for (const landmark of hand.landmarks) {
          this.currBuffer[offset++] = landmark.x;
          this.currBuffer[offset++] = landmark.y;
          this.currBuffer[offset++] = landmark.z;
          this.currBuffer[offset++] = landmark.visibility ?? 1;
        }
      } else {
        // No hand - fill with last known or zeros
        for (let i = 0; i < 21; i++) {
          const prevOffset = h * 21 * FLOATS_PER_LANDMARK + i * FLOATS_PER_LANDMARK;
          this.currBuffer[offset++] = this.prevBuffer[prevOffset] || 0;
          this.currBuffer[offset++] = this.prevBuffer[prevOffset + 1] || 0;
          this.currBuffer[offset++] = this.prevBuffer[prevOffset + 2] || 0;
          this.currBuffer[offset++] = 0; // visibility = 0
        }
      }
    }
    
    // Copy face landmarks
    const faceOffset = MAX_HAND_LANDMARKS * FLOATS_PER_LANDMARK;
    offset = faceOffset;
    
    if (result.face) {
      this.currFaceVisible = true;
      for (const landmark of result.face.landmarks) {
        this.currBuffer[offset++] = landmark.x;
        this.currBuffer[offset++] = landmark.y;
        this.currBuffer[offset++] = landmark.z;
        this.currBuffer[offset++] = landmark.visibility ?? 1;
      }
    } else {
      // No face - fill with last known or zeros
      for (let i = 0; i < 468; i++) {
        const prevOffset = faceOffset + i * FLOATS_PER_LANDMARK;
        this.currBuffer[offset++] = this.prevBuffer[prevOffset] || 0;
        this.currBuffer[offset++] = this.prevBuffer[prevOffset + 1] || 0;
        this.currBuffer[offset++] = this.prevBuffer[prevOffset + 2] || 0;
        this.currBuffer[offset++] = 0;
      }
    }
    
    this.hasData = true;
  }

  /**
   * Sort hands by X position for consistent indexing
   * (prevents hand swapping when crossing)
   */
  private sortHandsByPosition(hands: HandLandmarks[]): (HandLandmarks | null)[] {
    if (hands.length === 0) return [null, null];
    if (hands.length === 1) {
      // Single hand - put in slot based on X position
      const wristX = hands[0].landmarks[0].x;
      if (wristX < 0.5) {
        return [hands[0], null]; // Left side of screen
      } else {
        return [null, hands[0]]; // Right side of screen
      }
    }
    
    // Two hands - sort by X position
    const sorted = [...hands].sort((a, b) => a.landmarks[0].x - b.landmarks[0].x);
    return [sorted[0], sorted[1]];
  }

  /**
   * Get interpolated landmarks for current render frame
   * @param renderTimestamp Current render timestamp (performance.now())
   */
  getInterpolated(renderTimestamp: number): InterpolatedLandmarks {
    if (!this.hasData) {
      return this.output;
    }
    
    // Calculate interpolation factor
    const frameDuration = this.currTimestamp - this.prevTimestamp;
    const elapsed = renderTimestamp - this.currTimestamp;
    
    // Clamp t to [0, 1] - no extrapolation/prediction
    let t = 0;
    if (frameDuration > 0) {
      t = Math.max(0, Math.min(1, elapsed / frameDuration));
    }
    
    // Interpolate all landmarks
    const totalFloats = MAX_TOTAL_LANDMARKS * FLOATS_PER_LANDMARK;
    for (let i = 0; i < totalFloats; i++) {
      this.outputBuffer[i] = this.prevBuffer[i] + (this.currBuffer[i] - this.prevBuffer[i]) * t;
    }
    
    // Interpolate visibility (special handling for appearing/disappearing)
    // Update output structure
    const handCount = (this.currHandsVisible[0] ? 21 : 0) + (this.currHandsVisible[1] ? 21 : 0);
    
    // Create new output object with updated values
    (this.output as { handLandmarkCount: number }).handLandmarkCount = handCount;
    (this.output as { faceLandmarkCount: number }).faceLandmarkCount = this.currFaceVisible ? 468 : 0;
    (this.output as { handsVisible: boolean[] }).handsVisible = [...this.currHandsVisible];
    (this.output as { faceVisible: boolean }).faceVisible = this.currFaceVisible;
    (this.output as { handedness: ('Left' | 'Right')[] }).handedness = [...this.currHandedness];
    
    return this.output;
  }

  /**
   * Get raw landmark data for a specific hand
   * OPTIMIZED: Reuses pre-allocated landmark array
   * @param handIndex 0 or 1
   */
  getHandLandmarks(handIndex: number): Landmark[] | null {
    if (!this.currHandsVisible[handIndex]) return null;
    
    const landmarks = this.handLandmarkCache[handIndex];
    const baseOffset = handIndex * 21 * FLOATS_PER_LANDMARK;
    
    for (let i = 0; i < 21; i++) {
      const offset = baseOffset + i * FLOATS_PER_LANDMARK;
      const lm = landmarks[i];
      lm.x = this.outputBuffer[offset];
      lm.y = this.outputBuffer[offset + 1];
      lm.z = this.outputBuffer[offset + 2];
      lm.visibility = this.outputBuffer[offset + 3];
    }
    
    return landmarks;
  }

  /**
   * Get raw landmark data for face
   * OPTIMIZED: Reuses pre-allocated landmark array
   */
  getFaceLandmarks(): Landmark[] | null {
    if (!this.currFaceVisible) return null;
    
    const landmarks = this.faceLandmarkCache;
    const baseOffset = MAX_HAND_LANDMARKS * FLOATS_PER_LANDMARK;
    
    for (let i = 0; i < 468; i++) {
      const offset = baseOffset + i * FLOATS_PER_LANDMARK;
      const lm = landmarks[i];
      lm.x = this.outputBuffer[offset];
      lm.y = this.outputBuffer[offset + 1];
      lm.z = this.outputBuffer[offset + 2];
      lm.visibility = this.outputBuffer[offset + 3];
    }
    
    return landmarks;
  }

  /**
   * Check if we have any valid data
   */
  hasValidData(): boolean {
    return this.hasData;
  }

  /**
   * Reset interpolator state
   */
  reset(): void {
    this.prevBuffer.fill(0);
    this.currBuffer.fill(0);
    this.outputBuffer.fill(0);
    this.prevTimestamp = 0;
    this.currTimestamp = 0;
    this.prevHandsVisible = [false, false];
    this.currHandsVisible = [false, false];
    this.prevFaceVisible = false;
    this.currFaceVisible = false;
    this.hasData = false;
  }
}
