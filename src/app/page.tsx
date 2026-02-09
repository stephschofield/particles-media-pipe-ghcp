"use client";

import { useState, useCallback, useEffect } from "react";
import { CameraPreview, IntroScreen, ParticleCanvas, ModeToggle, KeyboardShortcuts, StatusIndicator, type PhysicsModeType } from "@/components";
import { HandTrackingProvider, useHandTracking } from "@/lib/HandTrackingProvider";
import { useGestureDetection } from "@/lib/useGestureDetection";
import { useKeyboardControls } from "@/lib/useKeyboardControls";
import type { RenderStats } from "@/core/renderer";

type AppView = "intro" | "canvas";

function CanvasView({ stream }: { stream: MediaStream }) {
  const { result, isLoading, error } = useHandTracking();
  const [renderStats, setRenderStats] = useState<RenderStats | null>(null);
  const [isWebGL, setIsWebGL] = useState(true);
  const [physicsMode, setPhysicsMode] = useState<PhysicsModeType>('attract');

  const handleModeChange = useCallback((mode: PhysicsModeType) => {
    setPhysicsMode(mode);
  }, []);

  // Toggle physics mode (for keyboard shortcut)
  const togglePhysicsMode = useCallback(() => {
    setPhysicsMode((prev) => (prev === 'attract' ? 'repel' : 'attract'));
  }, []);

  // Keyboard controls: SPACE = toggle mode, V = cycle theme
  useKeyboardControls({
    physicsMode,
    onToggleMode: togglePhysicsMode,
  });

  // Gesture detection for fist -> theme cycling
  const { isFistDetected, showFeedback, currentTheme } = useGestureDetection(result, {
    cooldownMs: 500,
    feedbackDurationMs: 400,
  });

  const handleRendererReady = useCallback((webgl: boolean) => {
    setIsWebGL(webgl);
    console.log(`Particle renderer ready (${webgl ? "WebGL 2" : "Canvas 2D fallback"})`);
  }, []);

  const handleStats = useCallback((stats: RenderStats) => {
    setRenderStats(stats);
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      {/* Theme change flash overlay */}
      {showFeedback && (
        <div
          className="pointer-events-none absolute inset-0 z-[90]"
          style={{
            background: "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
            animation: "fadeOut 400ms ease-out forwards",
          }}
        />
      )}
      
      {/* Particle canvas - behind everything (z-0) */}
      <ParticleCanvas
        maxParticles={15000}
        demoMode={true}
        trackingResult={result}
        physicsMode={physicsMode}
        onReady={handleRendererReady}
        onStats={handleStats}
      />
      
      {/* Mode toggle buttons - top left (z-100) */}
      <ModeToggle mode={physicsMode} onModeChange={handleModeChange} />
      
      {/* Camera preview at top center (z-50) */}
      <CameraPreview stream={stream} />
      
      {/* Fist detection indicator - top left */}
      {isFistDetected && (
        <div
          className="absolute left-4 top-4 z-[100] px-4 py-2"
          style={{
            borderRadius: 20,
            background: "rgba(168, 85, 247, 0.2)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
          }}
        >
          <p className="font-mono text-sm text-purple-400">
            ✊ Fist detected
          </p>
        </div>
      )}
      
      {/* Theme change notification - center */}
      {showFeedback && currentTheme && (
        <div
          className="absolute left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2 px-6 py-3"
          style={{
            borderRadius: 16,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            animation: "scaleIn 400ms ease-out forwards",
          }}
        >
          <p className="text-center font-medium text-lg text-white">
            🎨 {currentTheme.displayName}
          </p>
        </div>
      )}
      
      {/* Status indicator - top right */}
      <StatusIndicator
        trackingResult={result}
        isLoading={isLoading}
        error={error}
      />
      
      {/* FPS indicator - bottom left (development only) */}
      {renderStats && (
        <div
          className="absolute bottom-4 left-4 z-[100] px-3 py-1.5"
          style={{
            borderRadius: 12,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <p className="font-mono text-xs text-white/60">
            {renderStats.fps} FPS • {renderStats.avgFrameTime.toFixed(1)}ms
            {!isWebGL && " • 2D"}
          </p>
        </div>
      )}
      
      {/* Keyboard shortcuts - bottom right */}
      <KeyboardShortcuts />
      
      {/* CSS animations for feedback */}
      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<AppView>("intro");
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleCameraEnabled = useCallback((mediaStream: MediaStream) => {
    setStream(mediaStream);
    setView("canvas");
  }, []);

  // Keyboard shortcut: Enter to trigger camera request
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && view === "intro") {
        // Find and click the camera button
        const button = document.querySelector("button");
        if (button) button.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  if (view === "intro") {
    return <IntroScreen onCameraEnabled={handleCameraEnabled} />;
  }

  // Canvas view with hand tracking provider
  return (
    <HandTrackingProvider>
      <CanvasView stream={stream!} />
    </HandTrackingProvider>
  );
}
