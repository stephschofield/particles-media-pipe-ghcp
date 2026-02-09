/**
 * Performance Monitoring Utilities
 * Simple FPS counter and performance metrics for development and testing
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  droppedFrames: number;
}

/**
 * FPS Counter - Lightweight performance monitor
 * Use for real-time FPS display and performance testing
 */
export class FPSCounter {
  private frameCount = 0;
  private lastTimestamp = 0;
  private fpsTimestamp = 0;
  private currentFps = 60;
  
  // Frame time tracking
  private frameTimes: number[] = [];
  private readonly sampleSize: number;
  private droppedFrames = 0;
  private readonly targetFrameTime: number;
  
  // Min/max tracking (reset each second)
  private minFrameTime = Infinity;
  private maxFrameTime = 0;

  /**
   * Create an FPS counter
   * @param targetFps Target FPS for dropped frame detection (default: 60)
   * @param sampleSize Number of frame samples to track (default: 60)
   */
  constructor(targetFps = 60, sampleSize = 60) {
    this.targetFrameTime = 1000 / targetFps;
    this.sampleSize = sampleSize;
  }

  /**
   * Call this once per frame with the current timestamp
   * @param timestamp Current timestamp from performance.now() or requestAnimationFrame
   */
  tick(timestamp: number): void {
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      this.fpsTimestamp = timestamp;
      return;
    }

    const frameTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Track frame time for averaging
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.sampleSize) {
      this.frameTimes.shift();
    }

    // Track min/max
    if (frameTime < this.minFrameTime) this.minFrameTime = frameTime;
    if (frameTime > this.maxFrameTime) this.maxFrameTime = frameTime;

    // Detect dropped frames (frame took more than 1.5x target)
    if (frameTime > this.targetFrameTime * 1.5) {
      this.droppedFrames++;
    }

    // Calculate FPS every second
    this.frameCount++;
    const elapsed = timestamp - this.fpsTimestamp;
    if (elapsed >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.fpsTimestamp = timestamp;
      
      // Reset min/max each second
      this.minFrameTime = Infinity;
      this.maxFrameTime = 0;
    }
  }

  /**
   * Get current FPS
   */
  getFps(): number {
    return this.currentFps;
  }

  /**
   * Get average frame time in milliseconds
   */
  getAvgFrameTime(): number {
    if (this.frameTimes.length === 0) return this.targetFrameTime;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  /**
   * Get complete performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const avgFrameTime = this.getAvgFrameTime();
    return {
      fps: this.currentFps,
      frameTime: this.frameTimes[this.frameTimes.length - 1] ?? this.targetFrameTime,
      avgFrameTime,
      minFrameTime: this.minFrameTime === Infinity ? avgFrameTime : this.minFrameTime,
      maxFrameTime: this.maxFrameTime || avgFrameTime,
      droppedFrames: this.droppedFrames,
    };
  }

  /**
   * Get total dropped frames since creation
   */
  getDroppedFrames(): number {
    return this.droppedFrames;
  }

  /**
   * Check if performance is stable (FPS within 10% of target)
   */
  isStable(targetFps = 60): boolean {
    return this.currentFps >= targetFps * 0.9;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.lastTimestamp = 0;
    this.fpsTimestamp = 0;
    this.currentFps = 60;
    this.frameTimes = [];
    this.droppedFrames = 0;
    this.minFrameTime = Infinity;
    this.maxFrameTime = 0;
  }
}

/**
 * Simple function to measure execution time
 * @param fn Function to measure
 * @param label Optional label for console output
 * @returns Function result
 */
export function measureTime<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`[perf] ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Async version of measureTime
 */
export async function measureTimeAsync<T>(fn: () => Promise<T>, label?: string): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`[perf] ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * LOD (Level of Detail) manager for adaptive quality
 * Reduces particle count when frame time exceeds threshold
 */
export class LODManager {
  private readonly thresholdMs: number;
  private currentLevel = 0; // 0 = full quality, higher = reduced
  private readonly maxLevel = 3;
  private frameTimeHistory: number[] = [];
  private readonly historySize = 10;
  
  /**
   * Create LOD manager
   * @param thresholdMs Frame time threshold to trigger LOD reduction (default: 14ms for 60fps buffer)
   */
  constructor(thresholdMs = 14) {
    this.thresholdMs = thresholdMs;
  }

  /**
   * Update LOD based on current frame time
   * @param frameTime Current frame time in ms
   * @returns Recommended particle multiplier (1.0 = full, 0.25 = minimum)
   */
  update(frameTime: number): number {
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.historySize) {
      this.frameTimeHistory.shift();
    }

    // Calculate average frame time
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;

    // Adjust LOD level based on performance
    if (avgFrameTime > this.thresholdMs && this.currentLevel < this.maxLevel) {
      this.currentLevel++;
    } else if (avgFrameTime < this.thresholdMs * 0.7 && this.currentLevel > 0) {
      // Only increase quality if significantly under threshold
      this.currentLevel--;
    }

    return this.getMultiplier();
  }

  /**
   * Get current particle multiplier
   */
  getMultiplier(): number {
    // Each level reduces particles by 25%
    return 1.0 - (this.currentLevel * 0.25);
  }

  /**
   * Get current LOD level
   */
  getLevel(): number {
    return this.currentLevel;
  }

  /**
   * Force a specific LOD level
   */
  setLevel(level: number): void {
    this.currentLevel = Math.max(0, Math.min(this.maxLevel, level));
  }

  /**
   * Reset to full quality
   */
  reset(): void {
    this.currentLevel = 0;
    this.frameTimeHistory = [];
  }
}

/**
 * Exponential smoothing filter for reducing jitter
 * Uses α=0.3 as recommended in AC #13
 */
export class ExponentialSmoother {
  private value: number | null = null;
  private readonly alpha: number;

  /**
   * Create smoother
   * @param alpha Smoothing factor (0-1), lower = more smoothing (default: 0.3)
   */
  constructor(alpha = 0.3) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * Apply smoothing to a new value
   * @param newValue New raw value
   * @returns Smoothed value
   */
  smooth(newValue: number): number {
    if (this.value === null) {
      this.value = newValue;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  /**
   * Get current smoothed value
   */
  getValue(): number | null {
    return this.value;
  }

  /**
   * Reset smoother
   */
  reset(): void {
    this.value = null;
  }
}

/**
 * 2D point smoother using exponential smoothing
 */
export class Point2DSmoother {
  private readonly xSmoother: ExponentialSmoother;
  private readonly ySmoother: ExponentialSmoother;
  
  // Pre-allocated result object
  private readonly result: { x: number; y: number } = { x: 0, y: 0 };

  constructor(alpha = 0.3) {
    this.xSmoother = new ExponentialSmoother(alpha);
    this.ySmoother = new ExponentialSmoother(alpha);
  }

  /**
   * Smooth a 2D point
   * @returns Pre-allocated result object (reused, do not store reference)
   */
  smooth(x: number, y: number): { x: number; y: number } {
    this.result.x = this.xSmoother.smooth(x);
    this.result.y = this.ySmoother.smooth(y);
    return this.result;
  }

  reset(): void {
    this.xSmoother.reset();
    this.ySmoother.reset();
  }
}
