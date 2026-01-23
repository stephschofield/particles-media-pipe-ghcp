"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { HandLandmarks, HandTrackingResult, Landmark } from "@/lib/types";

interface HandTrackingContextValue {
  result: HandTrackingResult | null;
  isLoading: boolean;
  error: string | null;
  startTracking: (video: HTMLVideoElement) => void;
  stopTracking: () => void;
}

const HandTrackingContext = createContext<HandTrackingContextValue | null>(null);

interface HandTrackingProviderProps {
  children: ReactNode;
}

export function HandTrackingProvider({ children }: HandTrackingProviderProps) {
  const [result, setResult] = useState<HandTrackingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(-1);

  // Initialize MediaPipe HandLandmarker
  const initializeHandLandmarker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU", // Use GPU for better performance
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handLandmarkerRef.current = handLandmarker;
      setIsLoading(false);

      return handLandmarker;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize hand tracking";
      setError(message);
      setIsLoading(false);
      console.error("HandLandmarker initialization error:", err);
      return null;
    }
  }, []);

  // Convert MediaPipe result to our format
  const convertResult = useCallback(
    (mpResult: HandLandmarkerResult, timestamp: number): HandTrackingResult => {
      const hands: HandLandmarks[] = [];

      for (let i = 0; i < mpResult.landmarks.length; i++) {
        const landmarks: Landmark[] = mpResult.landmarks[i].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        const worldLandmarks: Landmark[] = mpResult.worldLandmarks[i].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        // Determine handedness - MediaPipe reports from camera's perspective
        // We mirror the video, so we need to flip the handedness
        const rawHandedness = mpResult.handednesses[i][0].categoryName;
        const handedness = rawHandedness === "Left" ? "Right" : "Left";

        hands.push({
          landmarks,
          worldLandmarks,
          handedness: handedness as "Left" | "Right",
        });
      }

      return { hands, timestamp };
    },
    []
  );

  // Detection loop using requestAnimationFrame for 60 FPS
  const detect = useCallback(() => {
    const video = videoRef.current;
    const handLandmarker = handLandmarkerRef.current;

    if (!video || !handLandmarker || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const timestamp = performance.now();

    // Only process if enough time has passed (avoid duplicate frames)
    if (timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;

      try {
        const mpResult = handLandmarker.detectForVideo(video, timestamp);
        const trackingResult = convertResult(mpResult, timestamp);
        setResult(trackingResult);
      } catch (err) {
        console.error("Hand detection error:", err);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detect);
  }, [convertResult]);

  // Start tracking
  const startTracking = useCallback(
    async (video: HTMLVideoElement) => {
      videoRef.current = video;

      // Initialize if not already done
      if (!handLandmarkerRef.current) {
        const landmarker = await initializeHandLandmarker();
        if (!landmarker) return;
      }

      // Start detection loop
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    },
    [initializeHandLandmarker, detect]
  );

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    videoRef.current = null;
    setResult(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  return (
    <HandTrackingContext.Provider
      value={{
        result,
        isLoading,
        error,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </HandTrackingContext.Provider>
  );
}

export function useHandTracking() {
  const context = useContext(HandTrackingContext);
  if (!context) {
    throw new Error("useHandTracking must be used within a HandTrackingProvider");
  }
  return context;
}
