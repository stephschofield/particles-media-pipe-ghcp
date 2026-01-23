"use client";

import { useEffect, useRef } from "react";

interface GridBackgroundProps {
  className?: string;
}

export function GridBackground({ className = "" }: GridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawGrid = () => {
      const { width, height } = canvas;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const horizonY = height * 0.35;

      // Grid parameters
      const gridLines = 40;
      const gridSpacing = 60;
      const perspectiveStrength = 0.8;

      // Animated glow pulse
      const glowPulse = 0.5 + 0.3 * Math.sin(time * 0.001);

      // Draw starfield background
      ctx.save();
      for (let i = 0; i < 200; i++) {
        const starX = ((i * 7919) % width);
        const starY = ((i * 6271) % (horizonY + 50));
        const starSize = ((i * 3571) % 3) * 0.5 + 0.5;
        const twinkle = 0.3 + 0.7 * Math.sin(time * 0.002 + i);
        
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
        ctx.fill();
      }
      ctx.restore();

      // Draw floor grid (bottom half)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizonY, width, height - horizonY);
      ctx.clip();

      // Horizontal lines (floor)
      for (let i = 0; i <= gridLines; i++) {
        const progress = i / gridLines;
        const y = horizonY + Math.pow(progress, perspectiveStrength) * (height - horizonY);
        const alpha = Math.min(1, progress * 2) * glowPulse;
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = `rgba(100, 180, 255, ${alpha * 0.4})`;
        ctx.lineWidth = 1 + (1 - progress) * 0.5;
        ctx.stroke();

        // Add glow
        ctx.strokeStyle = `rgba(140, 100, 255, ${alpha * 0.2})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Vertical lines (floor) - converging to horizon
      const floorLines = 30;
      for (let i = -floorLines; i <= floorLines; i++) {
        const endX = centerX + i * gridSpacing * 3;
        
        ctx.beginPath();
        ctx.moveTo(centerX, horizonY);
        ctx.lineTo(endX, height);
        
        const dist = Math.abs(i) / floorLines;
        const alpha = (1 - dist * 0.5) * glowPulse;
        
        ctx.strokeStyle = `rgba(100, 180, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = `rgba(140, 100, 255, ${alpha * 0.15})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // Draw ceiling grid (top half - mirrored)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, horizonY);
      ctx.clip();

      // Horizontal lines (ceiling)
      for (let i = 0; i <= gridLines; i++) {
        const progress = i / gridLines;
        const y = horizonY - Math.pow(progress, perspectiveStrength) * horizonY;
        const alpha = Math.min(1, progress * 2) * glowPulse;
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = `rgba(100, 180, 255, ${alpha * 0.25})`;
        ctx.lineWidth = 1 + (1 - progress) * 0.3;
        ctx.stroke();

        ctx.strokeStyle = `rgba(140, 100, 255, ${alpha * 0.12})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Vertical lines (ceiling)
      for (let i = -floorLines; i <= floorLines; i++) {
        const endX = centerX + i * gridSpacing * 2.5;
        
        ctx.beginPath();
        ctx.moveTo(centerX, horizonY);
        ctx.lineTo(endX, 0);
        
        const dist = Math.abs(i) / floorLines;
        const alpha = (1 - dist * 0.5) * glowPulse * 0.7;
        
        ctx.strokeStyle = `rgba(100, 180, 255, ${alpha * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Draw side walls
      // Left wall
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(centerX * 0.3, horizonY);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.clip();

      for (let i = 0; i <= 20; i++) {
        const progress = i / 20;
        const x = progress * centerX * 0.3;
        const topY = progress * horizonY;
        const bottomY = horizonY + progress * (height - horizonY);
        
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.strokeStyle = `rgba(180, 100, 255, ${(1 - progress) * 0.3 * glowPulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Right wall
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(width, 0);
      ctx.lineTo(width - centerX * 0.3, horizonY);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.clip();

      for (let i = 0; i <= 20; i++) {
        const progress = i / 20;
        const x = width - progress * centerX * 0.3;
        const topY = progress * horizonY;
        const bottomY = horizonY + progress * (height - horizonY);
        
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.strokeStyle = `rgba(180, 100, 255, ${(1 - progress) * 0.3 * glowPulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Draw central glow/portal effect at horizon
      const portalGradient = ctx.createRadialGradient(
        centerX, horizonY, 0,
        centerX, horizonY, width * 0.4
      );
      portalGradient.addColorStop(0, `rgba(100, 200, 255, ${0.15 * glowPulse})`);
      portalGradient.addColorStop(0.3, `rgba(140, 100, 255, ${0.08 * glowPulse})`);
      portalGradient.addColorStop(0.6, `rgba(80, 60, 180, ${0.03 * glowPulse})`);
      portalGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = portalGradient;
      ctx.fillRect(0, 0, width, height);

      // Add some floating particles/nodes at grid intersections
      const nodeTime = time * 0.0005;
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + nodeTime;
        const radius = 100 + Math.sin(nodeTime * 2 + i) * 50;
        const nodeX = centerX + Math.cos(angle) * radius * (width / 1000);
        const nodeY = horizonY + Math.sin(angle * 0.5) * 30;
        const nodeSize = 2 + Math.sin(nodeTime * 3 + i * 0.5) * 1;
        
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 200, 255, ${0.6 * glowPulse})`;
        ctx.fill();
        
        // Glow
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 150, 255, ${0.15 * glowPulse})`;
        ctx.fill();
      }
    };

    const animate = () => {
      time += 16;
      drawGrid();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
