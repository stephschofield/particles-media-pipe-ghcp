"use client";

import { useState, useCallback, useEffect } from "react";
import { CameraPreview, IntroScreen } from "@/components";
import { HandTrackingProvider, useHandTracking } from "@/lib/HandTrackingProvider";

type AppView = "intro" | "canvas";

function CanvasView({ stream }: { stream: MediaStream }) {
  const { result, isLoading, error } = useHandTracking();

  // Format status text
  const getStatusText = () => {
    if (isLoading) return "Loading AI models...";
    if (error) return `Error: ${error}`;
    if (!result || result.hands.length === 0) return "Show your hands 👋";
    
    const handCount = result.hands.length;
    const handText = handCount === 1 ? "1 hand" : "2 hands";
    return `${handText} detected`;
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Camera preview at top center */}
      <CameraPreview stream={stream} />
      
      {/* Status indicator - top right */}
      <div
        className="absolute right-4 top-4 z-[100] px-4 py-2"
        style={{
          borderRadius: 20,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <p
          className="font-mono text-sm"
          style={{
            color: result && result.hands.length > 0 ? "#22C55E" : "#71717A",
          }}
        >
          {result && result.hands.length > 0 && (
            <span className="mr-2">●</span>
          )}
          {getStatusText()}
        </p>
      </div>
      
      {/* Placeholder for particle canvas - will be implemented in later tasks */}
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-white/60">Particle canvas coming soon...</p>
      </div>
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
