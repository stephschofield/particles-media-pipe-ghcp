"use client";

import { useRef, useEffect } from "react";
import { useHandTracking } from "@/lib/HandTrackingProvider";
import { FACE_OVAL, LEFT_EYE, RIGHT_EYE, LIPS_OUTER, LIPS_INNER } from "@/lib/types";

interface FaceMeshProps {
  width?: number;
  height?: number;
}

// Colors for facial regions
const COLORS = {
  faceOval: {
    primary: "#06B6D4", // cyan-500
    glow: "rgba(6, 182, 212, 0.6)",
  },
  eyes: {
    primary: "#14B8A6", // teal-500
    glow: "rgba(20, 184, 166, 0.6)",
  },
  lips: {
    primary: "#EC4899", // pink-500
    glow: "rgba(236, 72, 153, 0.6)",
  },
};

export function FaceMesh({ width = 256, height = 144 }: FaceMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { result } = useHandTracking();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!result || !result.face) return;

    const landmarks = result.face.landmarks;

    // Helper to draw a closed path
    const drawPath = (indices: number[], color: string, glowColor: string, lineWidth = 1.5) => {
      if (indices.length === 0) return;

      ctx.strokeStyle = color;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      const first = landmarks[indices[0]];
      if (!first) return;
      
      ctx.moveTo(first.x * width, first.y * height);

      for (let i = 1; i < indices.length; i++) {
        const lm = landmarks[indices[i]];
        if (!lm) continue;
        ctx.lineTo(lm.x * width, lm.y * height);
      }

      // Close the path
      ctx.closePath();
      ctx.stroke();
    };

    // Draw face oval (cyan)
    drawPath(FACE_OVAL, COLORS.faceOval.primary, COLORS.faceOval.glow, 1.5);

    // Draw left eye (teal)
    drawPath(LEFT_EYE, COLORS.eyes.primary, COLORS.eyes.glow, 1.5);

    // Draw right eye (teal)
    drawPath(RIGHT_EYE, COLORS.eyes.primary, COLORS.eyes.glow, 1.5);

    // Draw lips outer (pink)
    drawPath(LIPS_OUTER, COLORS.lips.primary, COLORS.lips.glow, 2);

    // Draw lips inner (pink, thinner)
    drawPath(LIPS_INNER, COLORS.lips.primary, COLORS.lips.glow, 1);

    // Optional: Draw depth-enhanced points for nose, cheeks (subtle)
    const depthPoints = [
      1,    // Nose tip
      234,  // Left cheek
      454,  // Right cheek
    ];

    ctx.fillStyle = COLORS.faceOval.primary;
    ctx.shadowBlur = 8;
    
    for (const idx of depthPoints) {
      const lm = landmarks[idx];
      if (!lm) continue;

      // Use z-depth for sizing (closer = larger)
      const depthScale = 1 + (Math.abs(lm.z || 0) * 2);
      const size = 2 * Math.min(depthScale, 2);

      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, size, 0, Math.PI * 2);
      ctx.fill();
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
