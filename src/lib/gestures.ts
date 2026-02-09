/**
 * Gesture Detection for Hand Tracking
 * Pure functions for detecting hand gestures from landmark data
 */

import type { Landmark, HandLandmarks } from './types';
import { HAND_LANDMARKS } from './types';

/**
 * Configuration for fist detection
 */
export interface FistDetectionConfig {
  /** Threshold for finger curl detection (0-1, lower = more curled required) */
  curlThreshold: number;
  /** Minimum number of curled fingers to count as a fist (usually 4-5) */
  minCurledFingers: number;
}

const DEFAULT_FIST_CONFIG: FistDetectionConfig = {
  curlThreshold: 0.6, // Finger is curled when tip is < 60% distance from MCP to extended position
  minCurledFingers: 4, // At least 4 fingers must be curled
};

/**
 * Calculate distance between two landmarks
 */
function landmarkDistance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if a single finger is curled
 * Compares the distance from fingertip to wrist vs MCP to wrist
 * When finger is extended, tip is far from wrist
 * When finger is curled, tip is close to wrist
 */
function isFingerCurled(
  landmarks: Landmark[],
  tipIndex: number,
  mcpIndex: number,
  wristIndex: number,
  threshold: number
): boolean {
  const tip = landmarks[tipIndex];
  const mcp = landmarks[mcpIndex];
  const wrist = landmarks[wristIndex];

  // Distance from tip to wrist
  const tipToWrist = landmarkDistance(tip, wrist);
  
  // Distance from MCP to wrist (reference for extended finger)
  const mcpToWrist = landmarkDistance(mcp, wrist);
  
  // When curled, tip is close to or behind MCP relative to wrist
  // Ratio: tipToWrist / mcpToWrist < threshold means curled
  const ratio = tipToWrist / mcpToWrist;
  
  return ratio < threshold;
}

/**
 * Check if thumb is curled using its unique anatomy
 * Thumb curls across the palm, so we check if tip is close to index MCP
 */
function isThumbCurled(landmarks: Landmark[], threshold: number): boolean {
  const thumbTip = landmarks[HAND_LANDMARKS.THUMB_TIP];
  const thumbMcp = landmarks[HAND_LANDMARKS.THUMB_MCP];
  const indexMcp = landmarks[HAND_LANDMARKS.INDEX_FINGER_MCP];
  const wrist = landmarks[HAND_LANDMARKS.WRIST];
  
  // Check if thumb tip is close to palm/index area
  const tipToIndex = landmarkDistance(thumbTip, indexMcp);
  const mcpToWrist = landmarkDistance(thumbMcp, wrist);
  
  // Thumb is curled if tip is close to index MCP
  return tipToIndex < mcpToWrist * threshold;
}

/**
 * Detect if a hand is making a fist gesture
 * A fist is detected when all or most fingers are curled toward the palm
 */
export function detectFist(
  landmarks: Landmark[],
  config: FistDetectionConfig = DEFAULT_FIST_CONFIG
): boolean {
  if (landmarks.length < 21) return false;

  const { curlThreshold, minCurledFingers } = config;
  let curledCount = 0;

  // Check each finger (excluding thumb)
  const fingerChecks: [number, number][] = [
    [HAND_LANDMARKS.INDEX_FINGER_TIP, HAND_LANDMARKS.INDEX_FINGER_MCP],
    [HAND_LANDMARKS.MIDDLE_FINGER_TIP, HAND_LANDMARKS.MIDDLE_FINGER_MCP],
    [HAND_LANDMARKS.RING_FINGER_TIP, HAND_LANDMARKS.RING_FINGER_MCP],
    [HAND_LANDMARKS.PINKY_TIP, HAND_LANDMARKS.PINKY_MCP],
  ];

  for (const [tipIndex, mcpIndex] of fingerChecks) {
    if (isFingerCurled(landmarks, tipIndex, mcpIndex, HAND_LANDMARKS.WRIST, curlThreshold)) {
      curledCount++;
    }
  }

  // Check thumb separately
  if (isThumbCurled(landmarks, curlThreshold)) {
    curledCount++;
  }

  return curledCount >= minCurledFingers;
}

/**
 * Detect fist in any visible hand
 * Returns the hand index that made a fist, or -1 if no fist detected
 */
export function detectFistInHands(
  hands: HandLandmarks[],
  config?: FistDetectionConfig
): number {
  for (let i = 0; i < hands.length; i++) {
    if (detectFist(hands[i].landmarks, config)) {
      return i;
    }
  }
  return -1;
}

/**
 * Gesture state for tracking fist transitions
 */
export interface FistGestureState {
  /** Is a fist currently detected */
  isFist: boolean;
  /** Which hand is making the fist (-1 if none) */
  handIndex: number;
  /** Timestamp when fist was first detected */
  fistStartTime: number;
  /** Whether this fist has already triggered an action */
  hasTriggered: boolean;
}

/**
 * Initial gesture state
 */
export const INITIAL_FIST_STATE: FistGestureState = {
  isFist: false,
  handIndex: -1,
  fistStartTime: 0,
  hasTriggered: false,
};

/**
 * Process fist gesture state transition
 * Returns the new state and whether a "fist released" event occurred
 */
export function processFistGesture(
  hands: HandLandmarks[],
  prevState: FistGestureState,
  timestamp: number,
  config?: FistDetectionConfig
): { state: FistGestureState; released: boolean } {
  const fistHandIndex = detectFistInHands(hands, config);
  const isFist = fistHandIndex !== -1;

  // Fist just detected
  if (isFist && !prevState.isFist) {
    return {
      state: {
        isFist: true,
        handIndex: fistHandIndex,
        fistStartTime: timestamp,
        hasTriggered: false,
      },
      released: false,
    };
  }

  // Fist held (same fist continuing)
  if (isFist && prevState.isFist) {
    return {
      state: {
        ...prevState,
        handIndex: fistHandIndex, // Update in case it switched hands
      },
      released: false,
    };
  }

  // Fist just released - trigger action
  if (!isFist && prevState.isFist && !prevState.hasTriggered) {
    return {
      state: INITIAL_FIST_STATE,
      released: true,
    };
  }

  // No fist, no change
  return {
    state: INITIAL_FIST_STATE,
    released: false,
  };
}
