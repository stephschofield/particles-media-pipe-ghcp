/**
 * Render Loop with Frame Time Monitoring
 * Manages requestAnimationFrame at 60fps target with performance tracking
 */

export interface RenderStats {
  fps: number;
  frameTime: number;
  avgFrameTime: number;
  droppedFrames: number;
}

export type RenderCallback = (timestamp: number, deltaTime: number) => void;

export class RenderLoop {
  private animationFrameId: number | null = null;
  private isRunning = false;
  private callback: RenderCallback | null = null;
  
  // Timing
  private lastTimestamp = 0;
  private deltaTime = 0;
  
  // Performance monitoring
  private frameCount = 0;
  private fpsTimestamp = 0;
  private currentFps = 60;
  private frameTimes: number[] = [];
  private readonly FRAME_TIME_SAMPLES = 60;
  private droppedFrames = 0;
  private readonly TARGET_FRAME_TIME = 16.67; // 60fps target

  /**
   * Start the render loop
   * @param callback Function called each frame with timestamp and delta time
   */
  start(callback: RenderCallback): void {
    if (this.isRunning) return;
    
    this.callback = callback;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.fpsTimestamp = this.lastTimestamp;
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.frameTimes = [];
    
    this.loop(this.lastTimestamp);
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
    this.callback = null;
  }

  /**
   * Check if loop is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get current render statistics
   */
  getStats(): RenderStats {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : this.TARGET_FRAME_TIME;

    return {
      fps: this.currentFps,
      frameTime: this.deltaTime,
      avgFrameTime,
      droppedFrames: this.droppedFrames,
    };
  }

  /**
   * Main render loop
   */
  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    // Calculate delta time
    this.deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Track frame time for monitoring
    this.frameTimes.push(this.deltaTime);
    if (this.frameTimes.length > this.FRAME_TIME_SAMPLES) {
      this.frameTimes.shift();
    }

    // Detect dropped frames (frame took more than 1.5x target)
    if (this.deltaTime > this.TARGET_FRAME_TIME * 1.5) {
      this.droppedFrames++;
    }

    // Calculate FPS every second
    this.frameCount++;
    if (timestamp - this.fpsTimestamp >= 1000) {
      this.currentFps = Math.round(this.frameCount * 1000 / (timestamp - this.fpsTimestamp));
      this.frameCount = 0;
      this.fpsTimestamp = timestamp;
    }

    // Call render callback
    if (this.callback) {
      this.callback(timestamp, this.deltaTime);
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
