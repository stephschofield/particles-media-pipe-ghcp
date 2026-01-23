"use client";

import { useRef, useEffect } from "react";
import { useHandTracking } from "@/lib/HandTrackingProvider";
import { HandSkeleton } from "./HandSkeleton";
import { FaceMesh } from "./FaceMesh";

interface CameraPreviewProps {
  stream: MediaStream;
  width?: number;
  height?: number;
}

export function CameraPreview({ 
  stream, 
  width = 256, 
  height = 144 
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { startTracking, stopTracking } = useHandTracking();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;

    video.srcObject = stream;
    video.play().catch((error) => {
      // Ignore AbortError - happens when component remounts in StrictMode
      if (error.name === "AbortError") return;
      console.error("Error playing video:", error);
    });

    // Start hand tracking when video is ready
    const handleLoadedData = () => {
      if (isMounted) {
        startTracking(video);
      }
    };

    video.addEventListener("loadeddata", handleLoadedData);

    // If already loaded, start immediately
    if (video.readyState >= 2) {
      startTracking(video);
    }

    return () => {
      isMounted = false;
      video.removeEventListener("loadeddata", handleLoadedData);
      stopTracking();
      video.srcObject = null;
    };
  }, [stream, startTracking, stopTracking]);

  return (
    <div
      className="absolute left-1/2 top-4 z-[200] -translate-x-1/2 overflow-hidden rounded-lg"
      style={{
        width,
        height,
        background: "rgba(0, 0, 0, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={{
          transform: "scaleX(-1)", // Mirror horizontally
        }}
      />
      {/* Hand skeleton overlay */}
      <HandSkeleton width={width} height={height} />
      {/* Face mesh overlay */}
      <FaceMesh width={width} height={height} />
    </div>
  );
}
