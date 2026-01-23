"use client";

import { useState, useCallback, useEffect } from "react";
import { CameraPreview, IntroScreen } from "@/components";

type AppView = "intro" | "canvas";

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

  // Canvas view with camera preview
  return (
    <div className="fixed inset-0 bg-black">
      {/* Camera preview at top center */}
      {stream && <CameraPreview stream={stream} />}
      
      {/* Placeholder for particle canvas - will be implemented in later tasks */}
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-white/60">Particle canvas coming soon...</p>
      </div>
    </div>
  );
}
