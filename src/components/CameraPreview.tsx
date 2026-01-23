"use client";

import { useRef, useEffect } from "react";

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.play().catch((error) => {
      console.error("Error playing video:", error);
    });

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

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
    </div>
  );
}
