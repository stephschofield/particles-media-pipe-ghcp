/**
 * DetectionStateManager - Handles smooth transitions when detection is lost/regained
 * 
 * States:
 * - detected: Actively tracking, full opacity
 * - occluded: Temporarily lost (<300ms), holding at 70% opacity
 * - fadingOut: Detection lost, transitioning to hidden over 200ms
 * - hidden: No detection, particles invisible
 * - fadingIn: Re-detected, transitioning back to visible over 100ms
 */

/**
 * Detection states for entities (hands, face)
 */
export const enum DetectionState {
  /** Actively tracking, full opacity */
  Detected = 0,
  /** Temporarily lost (<300ms), holding at 70% opacity */
  Occluded = 1,
  /** Detection lost, transitioning to hidden */
  FadingOut = 2,
  /** No detection, particles invisible */
  Hidden = 3,
  /** Re-detected, transitioning to visible */
  FadingIn = 4,
}

/**
 * Timing constants for transitions (milliseconds)
 */
export const DETECTION_TIMING = {
  /** Duration to fade out when detection is lost */
  FADEOUT_DURATION: 200,
  /** Threshold before transitioning from occluded to fading out */
  OCCLUSION_THRESHOLD: 300,
  /** Duration to fade in when detection returns */
  FADEIN_DURATION: 100,
  /** Duration of no detection before entering idle state */
  IDLE_THRESHOLD: 500,
  /** Opacity during occlusion state */
  OCCLUDED_OPACITY: 0.7,
} as const;

/**
 * State for a single detected entity (hand or face)
 */
interface EntityState {
  /** Current detection state */
  state: DetectionState;
  /** Timestamp when current state was entered */
  stateEnteredAt: number;
  /** Last timestamp when entity was detected */
  lastDetectedAt: number;
  /** Current alpha multiplier (0-1) */
  alphaMultiplier: number;
  /** Target alpha multiplier for transitions */
  targetAlphaMultiplier: number;
  /** Whether entity was ever detected (for first detection) */
  everDetected: boolean;
}

/**
 * Manages detection states for hands and face with smooth transitions
 */
export class DetectionStateManager {
  /** State for each hand (index 0 and 1) */
  private handStates: [EntityState, EntityState];
  
  /** State for face */
  private faceState: EntityState;
  
  /** Whether system is in global idle state (nothing detected for 500ms+) */
  private _isIdle = true;
  
  /** Last time anything was detected */
  private lastAnyDetectionAt = 0;

  constructor() {
    this.handStates = [
      this.createInitialState(),
      this.createInitialState(),
    ];
    this.faceState = this.createInitialState();
  }

  /**
   * Create initial state for an entity
   */
  private createInitialState(): EntityState {
    return {
      state: DetectionState.Hidden,
      stateEnteredAt: 0,
      lastDetectedAt: 0,
      alphaMultiplier: 0,
      targetAlphaMultiplier: 0,
      everDetected: false,
    };
  }

  /**
   * Update detection states based on current detection results
   * @param timestamp Current timestamp (performance.now())
   * @param handsVisible Which hands are currently visible
   * @param faceVisible Whether face is currently visible
   */
  update(
    timestamp: number,
    handsVisible: boolean[],
    faceVisible: boolean
  ): void {
    // Update hand states
    for (let i = 0; i < 2; i++) {
      this.updateEntityState(this.handStates[i], handsVisible[i], timestamp);
    }
    
    // Update face state
    this.updateEntityState(this.faceState, faceVisible, timestamp);
    
    // Update global idle state
    const anyDetected = handsVisible[0] || handsVisible[1] || faceVisible;
    if (anyDetected) {
      this.lastAnyDetectionAt = timestamp;
      this._isIdle = false;
    } else {
      const timeSinceDetection = timestamp - this.lastAnyDetectionAt;
      this._isIdle = this.lastAnyDetectionAt > 0 && 
                      timeSinceDetection >= DETECTION_TIMING.IDLE_THRESHOLD;
    }
  }

  /**
   * Update state for a single entity
   */
  private updateEntityState(
    entity: EntityState,
    isDetected: boolean,
    timestamp: number
  ): void {
    const timeSinceStateEntered = timestamp - entity.stateEnteredAt;
    const timeSinceLastDetected = timestamp - entity.lastDetectedAt;
    
    if (isDetected) {
      // Entity is currently detected
      entity.lastDetectedAt = timestamp;
      
      switch (entity.state) {
        case DetectionState.Hidden:
          // Transition to fading in
          this.transitionTo(entity, DetectionState.FadingIn, timestamp);
          entity.everDetected = true;
          break;
          
        case DetectionState.FadingOut:
        case DetectionState.Occluded:
          // Detection returned - transition to fading in
          this.transitionTo(entity, DetectionState.FadingIn, timestamp);
          break;
          
        case DetectionState.FadingIn:
          // Continue fading in
          if (timeSinceStateEntered >= DETECTION_TIMING.FADEIN_DURATION) {
            this.transitionTo(entity, DetectionState.Detected, timestamp);
          }
          break;
          
        case DetectionState.Detected:
          // Stay detected
          break;
      }
    } else {
      // Entity is not currently detected
      switch (entity.state) {
        case DetectionState.Detected:
        case DetectionState.FadingIn:
          // Just lost detection - enter occluded state (debounce brief losses)
          if (entity.everDetected) {
            this.transitionTo(entity, DetectionState.Occluded, timestamp);
          }
          break;
          
        case DetectionState.Occluded:
          // Check if occlusion threshold exceeded
          if (timeSinceLastDetected >= DETECTION_TIMING.OCCLUSION_THRESHOLD) {
            this.transitionTo(entity, DetectionState.FadingOut, timestamp);
          }
          break;
          
        case DetectionState.FadingOut:
          // Check if fadeout complete
          if (timeSinceStateEntered >= DETECTION_TIMING.FADEOUT_DURATION) {
            this.transitionTo(entity, DetectionState.Hidden, timestamp);
          }
          break;
          
        case DetectionState.Hidden:
          // Stay hidden
          break;
      }
    }
    
    // Update alpha multiplier based on current state and timing
    this.updateAlphaMultiplier(entity, timestamp);
  }

  /**
   * Transition entity to a new state
   */
  private transitionTo(
    entity: EntityState,
    newState: DetectionState,
    timestamp: number
  ): void {
    entity.state = newState;
    entity.stateEnteredAt = timestamp;
    
    // Set target alpha based on new state
    switch (newState) {
      case DetectionState.Detected:
        entity.targetAlphaMultiplier = 1;
        break;
      case DetectionState.Occluded:
        entity.targetAlphaMultiplier = DETECTION_TIMING.OCCLUDED_OPACITY;
        break;
      case DetectionState.FadingOut:
        entity.targetAlphaMultiplier = 0;
        break;
      case DetectionState.Hidden:
        entity.targetAlphaMultiplier = 0;
        break;
      case DetectionState.FadingIn:
        entity.targetAlphaMultiplier = 1;
        break;
    }
  }

  /**
   * Update alpha multiplier with smooth interpolation
   */
  private updateAlphaMultiplier(entity: EntityState, timestamp: number): void {
    const timeSinceStateEntered = timestamp - entity.stateEnteredAt;
    
    switch (entity.state) {
      case DetectionState.Detected:
        entity.alphaMultiplier = 1;
        break;
        
      case DetectionState.Occluded:
        // Quickly lerp to occluded opacity
        entity.alphaMultiplier = this.lerp(
          entity.alphaMultiplier,
          DETECTION_TIMING.OCCLUDED_OPACITY,
          0.2
        );
        break;
        
      case DetectionState.FadingOut:
        // Lerp from occluded opacity to 0 over fadeout duration
        const fadeoutProgress = Math.min(
          1,
          timeSinceStateEntered / DETECTION_TIMING.FADEOUT_DURATION
        );
        // Use starting alpha (usually 0.7 from occluded)
        const startAlpha = DETECTION_TIMING.OCCLUDED_OPACITY;
        entity.alphaMultiplier = startAlpha * (1 - this.easeInCubic(fadeoutProgress));
        break;
        
      case DetectionState.Hidden:
        entity.alphaMultiplier = 0;
        break;
        
      case DetectionState.FadingIn:
        // Lerp from 0 to 1 over fadein duration
        const fadeinProgress = Math.min(
          1,
          timeSinceStateEntered / DETECTION_TIMING.FADEIN_DURATION
        );
        entity.alphaMultiplier = this.easeOutCubic(fadeinProgress);
        break;
    }
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Ease-in cubic for smooth fadeout (slow start, fast end)
   */
  private easeInCubic(t: number): number {
    return t * t * t;
  }

  /**
   * Ease-out cubic for smooth fadein (fast start, slow end)
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Get current state for a hand
   */
  getHandState(index: number): DetectionState {
    return this.handStates[index]?.state ?? DetectionState.Hidden;
  }

  /**
   * Get current state for face
   */
  getFaceState(): DetectionState {
    return this.faceState.state;
  }

  /**
   * Get alpha multiplier for a hand (0-1)
   */
  getHandAlphaMultiplier(index: number): number {
    return this.handStates[index]?.alphaMultiplier ?? 0;
  }

  /**
   * Get alpha multiplier for face (0-1)
   */
  getFaceAlphaMultiplier(): number {
    return this.faceState.alphaMultiplier;
  }

  /**
   * Check if hand is in a fading state (for drift behavior)
   */
  isHandFading(index: number): boolean {
    const state = this.handStates[index]?.state;
    return state === DetectionState.FadingOut || state === DetectionState.Occluded;
  }

  /**
   * Check if face is in a fading state (for drift behavior)
   */
  isFaceFading(): boolean {
    return this.faceState.state === DetectionState.FadingOut || 
           this.faceState.state === DetectionState.Occluded;
  }

  /**
   * Check if hand is transitioning in (for position lerping)
   */
  isHandFadingIn(index: number): boolean {
    return this.handStates[index]?.state === DetectionState.FadingIn;
  }

  /**
   * Check if face is transitioning in (for position lerping)
   */
  isFaceFadingIn(): boolean {
    return this.faceState.state === DetectionState.FadingIn;
  }

  /**
   * Get fade-in progress for a hand (0-1, for position lerping)
   */
  getHandFadeInProgress(index: number): number {
    const entity = this.handStates[index];
    if (!entity || entity.state !== DetectionState.FadingIn) {
      return 1;
    }
    return Math.min(
      1,
      (performance.now() - entity.stateEnteredAt) / DETECTION_TIMING.FADEIN_DURATION
    );
  }

  /**
   * Get fade-in progress for face (0-1, for position lerping)
   */
  getFaceFadeInProgress(): number {
    if (this.faceState.state !== DetectionState.FadingIn) {
      return 1;
    }
    return Math.min(
      1,
      (performance.now() - this.faceState.stateEnteredAt) / DETECTION_TIMING.FADEIN_DURATION
    );
  }

  /**
   * Check if system is in global idle state
   */
  isIdle(): boolean {
    return this._isIdle;
  }

  /**
   * Check if hand should update targets (when detected or fading in)
   */
  shouldUpdateHandTargets(index: number): boolean {
    const state = this.handStates[index]?.state;
    return state === DetectionState.Detected || state === DetectionState.FadingIn;
  }

  /**
   * Check if face should update targets (when detected or fading in)
   */
  shouldUpdateFaceTargets(): boolean {
    return this.faceState.state === DetectionState.Detected || 
           this.faceState.state === DetectionState.FadingIn;
  }

  /**
   * Check if hand is visible (not hidden)
   */
  isHandVisible(index: number): boolean {
    return this.handStates[index]?.state !== DetectionState.Hidden;
  }

  /**
   * Check if face is visible (not hidden)
   */
  isFaceVisible(): boolean {
    return this.faceState.state !== DetectionState.Hidden;
  }

  /**
   * Reset state
   */
  reset(): void {
    this.handStates = [
      this.createInitialState(),
      this.createInitialState(),
    ];
    this.faceState = this.createInitialState();
    this._isIdle = true;
    this.lastAnyDetectionAt = 0;
  }
}
