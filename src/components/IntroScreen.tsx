"use client";

import { useState, useCallback } from "react";
import { GridBackground } from "./GridBackground";

type AppState = "intro" | "loading" | "canvas" | "error";

interface IntroScreenProps {
  onCameraEnabled: (stream: MediaStream) => void;
}

export function IntroScreen({ onCameraEnabled }: IntroScreenProps) {
  const [state, setState] = useState<AppState>("intro");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const requestCamera = useCallback(async () => {
    setState("loading");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });
      
      setState("canvas");
      onCameraEnabled(stream);
    } catch (error) {
      setState("error");
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setErrorMessage("Camera access was denied. Please allow camera access to continue.");
        } else if (error.name === "NotFoundError") {
          setErrorMessage("No camera found. Please connect a camera and try again.");
        } else {
          setErrorMessage(`Camera error: ${error.message}`);
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  }, [onCameraEnabled]);

  const handleRetry = useCallback(() => {
    setState("intro");
    setErrorMessage("");
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden">
      <GridBackground />
      
      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Particle
            </span>{" "}
            <span className="text-white/90">Vision</span>
          </h1>
          <p className="max-w-md text-lg text-white/50">
            Real-time hand and face tracking with mesmerizing particle effects
          </p>
        </div>

        {/* Button area */}
        <div className="flex flex-col items-center gap-4">
          {state === "intro" && (
            <button
              onClick={requestCamera}
              className="group relative overflow-hidden rounded-full px-8 py-4 text-lg font-medium text-white transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 0 30px rgba(20, 184, 166, 0.2), inset 0 0 20px rgba(20, 184, 166, 0.05)",
              }}
            >
              {/* Animated gradient border */}
              <span
                className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(90deg, rgba(20, 184, 166, 0.3), rgba(139, 92, 246, 0.3), rgba(20, 184, 166, 0.3))",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s linear infinite",
                }}
              />
              
              {/* Button content */}
              <span className="relative flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
                  Enable Camera
                </span>
              </span>
            </button>
          )}

          {state === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-12 w-12">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: "2px solid rgba(20, 184, 166, 0.2)",
                  }}
                />
                <div
                  className="absolute inset-0 animate-spin rounded-full"
                  style={{
                    border: "2px solid transparent",
                    borderTopColor: "#14B8A6",
                  }}
                />
              </div>
              <p className="text-white/60">Requesting camera access...</p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="rounded-xl px-6 py-4 text-center"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <p className="text-red-400">{errorMessage}</p>
              </div>
              <button
                onClick={handleRetry}
                className="rounded-full px-6 py-3 text-white/80 transition-all hover:text-white"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        {state === "intro" && (
          <p className="mt-8 text-sm text-white/30">
            Press{" "}
            <kbd
              className="rounded px-2 py-1 font-mono text-xs"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              Enter
            </kbd>{" "}
            to start
          </p>
        )}
      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
