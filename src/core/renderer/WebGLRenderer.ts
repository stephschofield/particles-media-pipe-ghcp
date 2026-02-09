/**
 * WebGL Renderer for Particle System
 * Handles WebGL 2 context, shader compilation, and buffer management
 * Single draw call architecture for 15K particles
 * Supports particle trails via frame buffer fading
 */

import { VERTEX_SHADER, FRAGMENT_SHADER, FADE_QUAD_VERTEX_SHADER, FADE_QUAD_FRAGMENT_SHADER } from "./shaders";

export interface WebGLRendererConfig {
  maxParticles: number;
  canvas: HTMLCanvasElement;
  /** Enable particle trails (default: true) */
  trailsEnabled?: boolean;
  /** Trail fade amount per frame, 0.0-1.0 (default: 0.15 = ~6-7 frame trails) */
  trailFadeAmount?: number;
}

export interface ParticleData {
  x: number;
  y: number;
  size: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
}

export class WebGLRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private particleBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  
  // Fade quad for trail effect
  private fadeProgram: WebGLProgram | null = null;
  private fadeVao: WebGLVertexArrayObject | null = null;
  private fadeUniformLocation: WebGLUniformLocation | null = null;
  
  // Trail configuration
  private trailsEnabled: boolean;
  private trailFadeAmount: number;
  private firstFrame = true; // Track first frame to do full clear
  
  // Pre-allocated particle data buffer (7 floats per particle)
  private particleData: Float32Array;
  private readonly FLOATS_PER_PARTICLE = 7; // x, y, size, r, g, b, alpha
  
  // Uniform locations
  private uniformLocations: {
    resolution: WebGLUniformLocation | null;
    pixelRatio: WebGLUniformLocation | null;
  } = { resolution: null, pixelRatio: null };
  
  // Canvas and state
  private canvas: HTMLCanvasElement;
  private readonly maxParticles: number;
  private activeParticleCount = 0;
  private isInitialized = false;
  private useFallback = false;
  
  // Canvas 2D fallback context
  private ctx2d: CanvasRenderingContext2D | null = null;

  constructor(config: WebGLRendererConfig) {
    this.canvas = config.canvas;
    this.maxParticles = config.maxParticles;
    this.particleData = new Float32Array(config.maxParticles * this.FLOATS_PER_PARTICLE);
    this.trailsEnabled = config.trailsEnabled ?? true;
    this.trailFadeAmount = config.trailFadeAmount ?? 0.15; // ~6-7 frame trails
  }

  /**
   * Initialize WebGL 2 context with fallback to Canvas 2D
   */
  initialize(): boolean {
    // Try WebGL 2 first
    this.gl = this.canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null;

    if (!this.gl) {
      console.warn("WebGL 2 not available, falling back to Canvas 2D");
      this.useFallback = true;
      this.ctx2d = this.canvas.getContext("2d");
      this.isInitialized = this.ctx2d !== null;
      return this.isInitialized;
    }

    // Initialize WebGL
    try {
      this.setupShaders();
      this.setupFadeQuad();
      this.setupBuffers();
      this.setupUniforms();
      this.setupBlending();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("WebGL initialization failed:", error);
      this.useFallback = true;
      this.ctx2d = this.canvas.getContext("2d");
      this.isInitialized = this.ctx2d !== null;
      return this.isInitialized;
    }
  }

  /**
   * Check if using WebGL or Canvas 2D fallback
   */
  isUsingFallback(): boolean {
    return this.useFallback;
  }

  /**
   * Compile and link shaders
   */
  private setupShaders(): void {
    if (!this.gl) return;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      throw new Error("Shader compilation failed");
    }

    this.program = this.gl.createProgram();
    if (!this.program) throw new Error("Failed to create program");

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(this.program);
      throw new Error(`Program linking failed: ${error}`);
    }

    // Clean up shaders (they're now part of the program)
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
  }

  /**
   * Set up fade quad shader program for trail effect
   */
  private setupFadeQuad(): void {
    if (!this.gl) return;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, FADE_QUAD_VERTEX_SHADER);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, FADE_QUAD_FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      throw new Error("Fade quad shader compilation failed");
    }

    this.fadeProgram = this.gl.createProgram();
    if (!this.fadeProgram) throw new Error("Failed to create fade program");

    this.gl.attachShader(this.fadeProgram, vertexShader);
    this.gl.attachShader(this.fadeProgram, fragmentShader);
    this.gl.linkProgram(this.fadeProgram);

    if (!this.gl.getProgramParameter(this.fadeProgram, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(this.fadeProgram);
      throw new Error(`Fade program linking failed: ${error}`);
    }

    // Clean up shaders
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    // Cache uniform location
    this.fadeUniformLocation = this.gl.getUniformLocation(this.fadeProgram, "u_fadeAmount");

    // Create VAO for fade quad (empty, uses gl_VertexID)
    this.fadeVao = this.gl.createVertexArray();
  }

  /**
   * Compile a single shader
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      console.error(`Shader compilation error: ${error}`);
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Set up vertex buffers and VAO
   */
  private setupBuffers(): void {
    if (!this.gl || !this.program) return;

    // Create VAO
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    // Create particle buffer
    this.particleBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleBuffer);
    
    // Allocate buffer memory (420KB for 15K particles)
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.particleData.byteLength,
      this.gl.DYNAMIC_DRAW
    );

    // Set up attribute pointers for interleaved data
    const stride = this.FLOATS_PER_PARTICLE * 4; // 7 floats × 4 bytes

    // a_position (vec2): offset 0
    const positionLoc = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.enableVertexAttribArray(positionLoc);
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, stride, 0);

    // a_size (float): offset 8
    const sizeLoc = this.gl.getAttribLocation(this.program, "a_size");
    this.gl.enableVertexAttribArray(sizeLoc);
    this.gl.vertexAttribPointer(sizeLoc, 1, this.gl.FLOAT, false, stride, 8);

    // a_color (vec3): offset 12
    const colorLoc = this.gl.getAttribLocation(this.program, "a_color");
    this.gl.enableVertexAttribArray(colorLoc);
    this.gl.vertexAttribPointer(colorLoc, 3, this.gl.FLOAT, false, stride, 12);

    // a_alpha (float): offset 24
    const alphaLoc = this.gl.getAttribLocation(this.program, "a_alpha");
    this.gl.enableVertexAttribArray(alphaLoc);
    this.gl.vertexAttribPointer(alphaLoc, 1, this.gl.FLOAT, false, stride, 24);

    this.gl.bindVertexArray(null);
  }

  /**
   * Cache uniform locations
   */
  private setupUniforms(): void {
    if (!this.gl || !this.program) return;

    this.uniformLocations.resolution = this.gl.getUniformLocation(this.program, "u_resolution");
    this.uniformLocations.pixelRatio = this.gl.getUniformLocation(this.program, "u_pixelRatio");
  }

  /**
   * Set up blending for additive particle rendering
   */
  private setupBlending(): void {
    if (!this.gl) return;

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Update particle data buffer
   * @param particles Array of particle data to render
   */
  updateParticles(particles: ParticleData[]): void {
    this.activeParticleCount = Math.min(particles.length, this.maxParticles);

    // Copy particle data to typed array
    for (let i = 0; i < this.activeParticleCount; i++) {
      const p = particles[i];
      const offset = i * this.FLOATS_PER_PARTICLE;
      this.particleData[offset] = p.x;
      this.particleData[offset + 1] = p.y;
      this.particleData[offset + 2] = p.size;
      this.particleData[offset + 3] = p.r;
      this.particleData[offset + 4] = p.g;
      this.particleData[offset + 5] = p.b;
      this.particleData[offset + 6] = p.alpha;
    }
  }

  /**
   * Set particles directly from a Float32Array (more efficient)
   */
  setParticleData(data: Float32Array, count: number): void {
    this.activeParticleCount = Math.min(count, this.maxParticles);
    this.particleData.set(data.subarray(0, this.activeParticleCount * this.FLOATS_PER_PARTICLE));
  }

  /**
   * Resize canvas to match viewport
   */
  resize(width: number, height: number, pixelRatio: number = 1): void {
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Render all particles in a single draw call
   */
  render(): void {
    if (!this.isInitialized) return;

    if (this.useFallback) {
      this.renderFallback();
      return;
    }

    this.renderWebGL();
  }

  /**
   * WebGL render path
   */
  private renderWebGL(): void {
    if (!this.gl || !this.program || !this.vao || !this.particleBuffer) return;

    // Handle canvas clearing / trail fading
    if (this.trailsEnabled && !this.firstFrame) {
      // Draw fade quad to create trail effect
      this.renderFadeQuad();
    } else {
      // Full clear on first frame or when trails disabled
      this.gl.clearColor(0, 0, 0, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.firstFrame = false;
    }

    if (this.activeParticleCount === 0) return;

    // Use program
    this.gl.useProgram(this.program);

    // Set uniforms
    this.gl.uniform2f(
      this.uniformLocations.resolution,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform1f(
      this.uniformLocations.pixelRatio,
      window.devicePixelRatio || 1
    );

    // Bind VAO and update buffer data
    this.gl.bindVertexArray(this.vao);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleBuffer);
    
    // Upload only active particle data (partial buffer update)
    this.gl.bufferSubData(
      this.gl.ARRAY_BUFFER,
      0,
      this.particleData.subarray(0, this.activeParticleCount * this.FLOATS_PER_PARTICLE)
    );

    // Single draw call for ALL particles
    this.gl.drawArrays(this.gl.POINTS, 0, this.activeParticleCount);

    this.gl.bindVertexArray(null);
  }

  /**
   * Render fade quad for trail effect
   * Draws a semi-transparent black overlay to fade the previous frame
   */
  private renderFadeQuad(): void {
    if (!this.gl || !this.fadeProgram || !this.fadeVao) return;

    this.gl.useProgram(this.fadeProgram);
    this.gl.uniform1f(this.fadeUniformLocation, this.trailFadeAmount);

    this.gl.bindVertexArray(this.fadeVao);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    this.gl.bindVertexArray(null);
  }

  /**
   * Canvas 2D fallback render path (reduced particle count recommended)
   */
  private renderFallback(): void {
    if (!this.ctx2d) return;

    // Handle canvas clearing / trail fading
    if (this.trailsEnabled && !this.firstFrame) {
      // Draw semi-transparent black overlay for trail effect
      this.ctx2d.fillStyle = `rgba(0, 0, 0, ${this.trailFadeAmount})`;
      this.ctx2d.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Full clear on first frame or when trails disabled
      this.ctx2d.fillStyle = "#000000";
      this.ctx2d.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.firstFrame = false;
    }

    if (this.activeParticleCount === 0) return;

    // Render each particle
    for (let i = 0; i < this.activeParticleCount; i++) {
      const offset = i * this.FLOATS_PER_PARTICLE;
      const x = this.particleData[offset];
      const y = this.particleData[offset + 1];
      const size = this.particleData[offset + 2];
      const r = Math.floor(this.particleData[offset + 3] * 255);
      const g = Math.floor(this.particleData[offset + 4] * 255);
      const b = Math.floor(this.particleData[offset + 5] * 255);
      const alpha = this.particleData[offset + 6];

      if (alpha < 0.01) continue;

      this.ctx2d.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      this.ctx2d.beginPath();
      this.ctx2d.arc(x, y, size / 2, 0, Math.PI * 2);
      this.ctx2d.fill();
    }
  }

  /**
   * Get current active particle count
   */
  getActiveParticleCount(): number {
    return this.activeParticleCount;
  }

  /**
   * Get max particle capacity
   */
  getMaxParticles(): number {
    return this.maxParticles;
  }

  /**
   * Enable or disable particle trails
   */
  setTrailsEnabled(enabled: boolean): void {
    this.trailsEnabled = enabled;
    if (!enabled) {
      // Reset first frame flag to do a full clear when trails are disabled
      this.firstFrame = true;
    }
  }

  /**
   * Check if trails are enabled
   */
  areTrailsEnabled(): boolean {
    return this.trailsEnabled;
  }

  /**
   * Set trail fade amount (0.0 - 1.0)
   * Lower values = longer trails, higher values = shorter trails
   * Recommended: 0.1 - 0.2 for ~5-10 frame trails
   */
  setTrailFadeAmount(amount: number): void {
    this.trailFadeAmount = Math.max(0.01, Math.min(1.0, amount));
  }

  /**
   * Get current trail fade amount
   */
  getTrailFadeAmount(): number {
    return this.trailFadeAmount;
  }

  /**
   * Clean up WebGL resources
   */
  dispose(): void {
    if (this.gl) {
      if (this.particleBuffer) {
        this.gl.deleteBuffer(this.particleBuffer);
      }
      if (this.vao) {
        this.gl.deleteVertexArray(this.vao);
      }
      if (this.program) {
        this.gl.deleteProgram(this.program);
      }
      if (this.fadeProgram) {
        this.gl.deleteProgram(this.fadeProgram);
      }
      if (this.fadeVao) {
        this.gl.deleteVertexArray(this.fadeVao);
      }
    }
    this.isInitialized = false;
  }
}
