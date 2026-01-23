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
  FaceLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { HandLandmarks, TrackingResult, FaceLandmarks, Landmark } from "@/lib/types";

interface HandTrackingContextValue {
  result: TrackingResult | null;
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
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(-1);

  // Initialize MediaPipe HandLandmarker
  const initializeHandLandmarker = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handLandmarkerRef.current = handLandmarker;
      return handLandmarker;
    } catch (err) {
      console.error("HandLandmarker initialization error:", err);
      return null;
    }
  }, []);

  // Initialize MediaPipe FaceLandmarker
  const initializeFaceLandmarker = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      faceLandmarkerRef.current = faceLandmarker;
      return faceLandmarker;
    } catch (err) {
      console.error("FaceLandmarker initialization error:", err);
      return null;
    }
  }, []);

  // Initialize both trackers
  const initializeTrackers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [handLandmarker, faceLandmarker] = await Promise.all([
      initializeHandLandmarker(),
      initializeFaceLandmarker(),
    ]);

    if (!handLandmarker || !faceLandmarker) {
      setError("Failed to initialize tracking models");
    }

    setIsLoading(false);
  }, [initializeHandLandmarker, initializeFaceLandmarker]);

  // Convert MediaPipe results to our format
  const convertResults = useCallback(
    (
      handResult: HandLandmarkerResult,
      faceResult: FaceLandmarkerResult,
      timestamp: number
    ): TrackingResult => {
      // Convert hands
      const hands: HandLandmarks[] = [];
      for (let i = 0; i < handResult.landmarks.length; i++) {
        const landmarks: Landmark[] = handResult.landmarks[i].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        const worldLandmarks: Landmark[] = handResult.worldLandmarks[i].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        const rawHandedness = handResult.handednesses[i][0].categoryName;
        const handedness = rawHandedness === "Left" ? "Right" : "Left";

        hands.push({
          landmarks,
          worldLandmarks,
          handedness: handedness as "Left" | "Right",
        });
      }

      // Convert face
      let face: FaceLandmarks | null = null;
      if (faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
        const landmarks: Landmark[] = faceResult.faceLandmarks[0].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        face = { landmarks };
      }

      return { hands, face, timestamp };
    },
    []
  );

  // Detection loop using requestAnimationFrame for 60 FPS
  const detect = useCallback(() => {
    const video = videoRef.current;
    const handLandmarker = handLandmarkerRef.current;
    const faceLandmarker = faceLandmarkerRef.current;

    if (!video || !handLandmarker || !faceLandmarker || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const timestamp = performance.now();

    // Only process if enough time has passed
    if (timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;

      try {
        // Run both detections
        const handResult = handLandmarker.detectForVideo(video, timestamp);
        
        // Face detection might fail, so wrap it separately
        let faceResult: FaceLandmarkerResult;
        try {
          faceResult = faceLandmarker.detectForVideo(video, timestamp);
        } catch (faceError) {
          // Face detection failed, create empty result
          faceResult = {
            faceLandmarks: [],
            faceBlendshapes: [],
            facialTransformationMatrixes: [],
          };
        }
        
        const trackingResult = convertResults(handResult, faceResult, timestamp);
        setResult(trackingResult);
      } catch (err) {
        console.error("Detection error:", err);
      }
    }

    animationFrameRef.current = requestAnimationFrame(detect);
  }, [convertResults]);

  // Start tracking
  const startTracking = useCallback(
    async (video: HTMLVideoElement) => {
      videoRef.current = video;

      // Initialize if not already done
      if (!handLandmarkerRef.current || !faceLandmarkerRef.current) {
        await initializeTrackers();
        if (!handLandmarkerRef.current || !faceLandmarkerRef.current) return;
      }

      // Start detection loop
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    },
    [initializeTrackers, detect]
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
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
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
