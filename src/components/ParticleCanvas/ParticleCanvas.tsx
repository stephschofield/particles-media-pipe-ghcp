"use client";

import { useRef, useEffect, useCallback } from "react";
import { WebGLRenderer, RenderLoop, type RenderStats } from "@/core/renderer";
import { ParticleSystem, PhysicsMode } from "@/core/particles";
import type { TrackingResult } from "@/lib/types";
import type { ThemeName, ColorTheme } from "@/core/themes";
import { themeManager, THEMES } from "@/core/themes";

export interface ParticleCanvasProps {
  /** Maximum number of particles to render */
  maxParticles?: number;
  /** Callback when renderer is ready */
  onReady?: (isWebGL: boolean) => void;
  /** Callback with render stats (called every second) */
  onStats?: (stats: RenderStats) => void;
  /** Enable demo mode with random particles */
  demoMode?: boolean;
  /** Tracking result from MediaPipe */
  trackingResult?: TrackingResult | null;
  /** Physics mode (attract/repel) */
  physicsMode?: 'attract' | 'repel';
  /** Callback when physics mode changes */
  onPhysicsModeChange?: (mode: 'attract' | 'repel') => void;
  /** Current color theme name */
  themeName?: ThemeName;
  /** Callback when theme changes */
  onThemeChange?: (theme: ColorTheme) => void;
  /** Enable particle trails (default: true) */
  trailsEnabled?: boolean;
  /** Trail fade amount per frame, 0.0-1.0 (default: 0.15 = ~6-7 frame trails) */
  trailFadeAmount?: number;
}

// Default color theme (Neon Cyan/Magenta)
const DEFAULT_COLORS = [
  { r: 0, g: 1, b: 0.9 },     // Cyan
  { r: 1, g: 0, b: 0.6 },     // Magenta
  { r: 0.4, g: 0.2, b: 1 },   // Purple
];

/**
 * ParticleCanvas component - Fullscreen WebGL canvas for particle rendering
 * Uses ParticleSystem for physics-based particle animation with landmark binding
 * Supports 15,000 particles at 60fps with single draw call
 */
export function ParticleCanvas({
  maxParticles = 15000,
  onReady,
  onStats,
  demoMode = false,
  trackingResult,
  physicsMode = 'attract',
  themeName,
  onThemeChange,
  trailsEnabled = true,
  trailFadeAmount = 0.15,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const renderLoopRef = useRef<RenderLoop | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const demoDataRef = useRef<Float32Array | null>(null);
  const statsIntervalRef = useRef<number | null>(null);
  const trackingResultRef = useRef<TrackingResult | null>(null);
  const isReadyCalledRef = useRef(false);

  // Keep tracking result in ref for render loop access
  useEffect(() => {
    trackingResultRef.current = trackingResult ?? null;
    
    // Push to particle system if available
    if (particleSystemRef.current && trackingResult) {
      particleSystemRef.current.pushTrackingResult(trackingResult);
    }
  }, [trackingResult]);

  // Handle physics mode changes
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setPhysicsMode(
        physicsMode === 'attract' ? PhysicsMode.Attract : PhysicsMode.Repel
      );
    }
  }, [physicsMode]);

  // Handle theme changes via prop
  useEffect(() => {
    if (themeName && particleSystemRef.current) {
      const theme = THEMES.find((t) => t.name === themeName);
      if (theme) {
        themeManager.setTheme(themeName);
        particleSystemRef.current.setColors(theme.colors);
      }
    }
  }, [themeName]);

  // Subscribe to theme manager for programmatic theme changes
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((theme) => {
      if (particleSystemRef.current) {
        particleSystemRef.current.setColors(theme.colors);
      }
      onThemeChange?.(theme);
    });
    return unsubscribe;
  }, [onThemeChange]);

  // Handle trail enabled changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTrailsEnabled(trailsEnabled);
    }
  }, [trailsEnabled]);

  // Handle trail fade amount changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTrailFadeAmount(trailFadeAmount);
    }
  }, [trailFadeAmount]);

  // Initialize demo particles for fallback mode
  const initDemoParticles = useCallback((width: number, height: number) => {
    if (!demoDataRef.current) {
      demoDataRef.current = new Float32Array(5000 * 7);
    }

    const data = demoDataRef.current;
    const particleCount = 5000;

    for (let i = 0; i < particleCount; i++) {
      const offset = i * 7;
      const colorIndex = i % DEFAULT_COLORS.length;
      const color = DEFAULT_COLORS[colorIndex];
      
      data[offset] = Math.random() * width;
      data[offset + 1] = Math.random() * height;
      data[offset + 2] = 2 + Math.random() * 4;
      data[offset + 3] = color.r;
      data[offset + 4] = color.g;
      data[offset + 5] = color.b;
      data[offset + 6] = 0.6 + Math.random() * 0.4;
    }

    return particleCount;
  }, []);

  // Update demo particles with simple animation
  const updateDemoParticles = useCallback((
    width: number,
    height: number,
    time: number,
    particleCount: number
  ) => {
    if (!demoDataRef.current) return;

    const data = demoDataRef.current;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < particleCount; i++) {
      const offset = i * 7;
      
      let x = data[offset];
      let y = data[offset + 1];
      
      const dx = centerX - x;
      const dy = centerY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        const speed = 0.5 + Math.random() * 0.5;
        x += (dx / dist) * speed;
        y += (dy / dist) * speed;
      }
      
      const angle = time * 0.001 + i * 0.01;
      x += Math.cos(angle) * 0.3;
      y += Math.sin(angle) * 0.3;
      
      if (x < 0) x = width;
      if (x > width) x = 0;
      if (y < 0) y = height;
      if (y > height) y = 0;
      
      data[offset] = x;
      data[offset + 1] = y;
      data[offset + 6] = 0.5 + 0.3 * Math.sin(time * 0.002 + i * 0.1);
    }
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    const particleSystem = particleSystemRef.current;
    if (!canvas || !renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    renderer.resize(width, height, pixelRatio);
    
    // Update particle system canvas size
    if (particleSystem) {
      particleSystem.setCanvasSize(width * pixelRatio, height * pixelRatio);
    }
  }, []);

  // Initialize WebGL renderer, particle system, and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create WebGL renderer with trail support
    const renderer = new WebGLRenderer({
      canvas,
      maxParticles,
      // Trail config is set via useEffect hooks to allow runtime updates
    });

    const success = renderer.initialize();
    if (!success) {
      console.error("Failed to initialize renderer");
      return;
    }

    rendererRef.current = renderer;

    // Initial resize
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    renderer.resize(width, height, pixelRatio);

    // Create particle system with physics
    const particleSystem = new ParticleSystem({
      maxParticles,
      attractionStrength: 0.15,
      damping: 0.92,
    });
    particleSystem.setCanvasSize(width * pixelRatio, height * pixelRatio);
    particleSystemRef.current = particleSystem;

    // Apply initial theme colors
    const initialTheme = themeManager.getCurrentTheme();
    particleSystem.setColors(initialTheme.colors);

    // Initialize demo particles if in demo mode
    let demoParticleCount = 0;
    if (demoMode) {
      demoParticleCount = initDemoParticles(width, height);
    }

    // Create render loop
    const renderLoop = new RenderLoop();
    renderLoopRef.current = renderLoop;

    // Start render loop with physics-based particles
    renderLoop.start((timestamp) => {
      const tracking = trackingResultRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Check if we have active tracking
      const hasTracking = tracking && (tracking.hands.length > 0 || tracking.face);
      
      if (hasTracking) {
        // Update particle system (handles interpolation and physics)
        particleSystem.update(timestamp);
        
        // Get GPU buffer and render
        const buffer = particleSystem.getGPUBuffer();
        renderer.setParticleData(buffer, particleSystem.getParticleCount());
      } else if (demoMode && demoDataRef.current) {
        // Fallback to demo mode when no tracking
        updateDemoParticles(w, h, timestamp, demoParticleCount);
        renderer.setParticleData(demoDataRef.current, demoParticleCount);
      } else {
        // No particles to render - just clear
        renderer.setParticleData(new Float32Array(0), 0);
      }
      
      renderer.render();
    });

    // Set up resize listener
    window.addEventListener("resize", handleResize);

    // Report stats periodically
    if (onStats) {
      statsIntervalRef.current = window.setInterval(() => {
        if (renderLoopRef.current) {
          onStats(renderLoopRef.current.getStats());
        }
      }, 1000);
    }

    // Notify ready (only once)
    if (!isReadyCalledRef.current) {
      isReadyCalledRef.current = true;
      // Use setTimeout to avoid calling setState within effect body
      setTimeout(() => {
        onReady?.(renderer.isUsingFallback() === false);
      }, 0);
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      renderLoop.stop();
      particleSystem.dispose();
      renderer.dispose();
      rendererRef.current = null;
      renderLoopRef.current = null;
      particleSystemRef.current = null;
    };
  }, [maxParticles, demoMode, onReady, onStats, handleResize, initDemoParticles, updateDemoParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000000",
      }}
      aria-label="Particle visualization canvas"
    />
  );
}
