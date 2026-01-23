"use client";

import { useRef, useEffect } from "react";
import { useHandTracking } from "@/lib/HandTrackingProvider";
import { HAND_CONNECTIONS, type Landmark } from "@/lib/types";

interface HandSkeletonProps {
  width?: number;
  height?: number;
}

// Fingertip and wrist landmark indices for larger dots
const FINGERTIP_INDICES = [4, 8, 12, 16, 20];
const WRIST_INDEX = 0;

// Colors for each hand
const HAND_COLORS = {
  Left: {
    primary: "#06B6D4", // cyan-500
    glow: "rgba(6, 182, 212, 0.6)",
  },
  Right: {
    primary: "#EC4899", // pink-500
    glow: "rgba(236, 72, 153, 0.6)",
  },
};

export function HandSkeleton({ width = 256, height = 144 }: HandSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { result } = useHandTracking();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!result || result.hands.length === 0) return;

    // Draw each hand
    for (const hand of result.hands) {
      const colors = HAND_COLORS[hand.handedness];
      const landmarks = hand.landmarks;

      // Set up glow effect
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = colors.primary;
      ctx.fillStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      // Draw bone connections
      for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        if (!start || !end) continue;

        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }

      // Draw all joint dots (small)
      ctx.shadowBlur = 4;
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        const isFingertip = FINGERTIP_INDICES.includes(i);
        const isWrist = i === WRIST_INDEX;

        // Skip fingertips and wrist - draw them larger below
        if (isFingertip || isWrist) continue;

        ctx.beginPath();
        ctx.arc(lm.x * width, lm.y * height, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw fingertips (larger dots)
      ctx.shadowBlur = 10;
      for (const idx of FINGERTIP_INDICES) {
        const lm = landmarks[idx];
        if (!lm) continue;

        ctx.beginPath();
        ctx.arc(lm.x * width, lm.y * height, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw wrist (larger dot)
      const wrist = landmarks[WRIST_INDEX];
      if (wrist) {
        ctx.beginPath();
        ctx.arc(wrist.x * width, wrist.y * height, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [result, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0"
      style={{ transform: "scaleX(-1)" }} // Mirror to match video
    />
  );
}
