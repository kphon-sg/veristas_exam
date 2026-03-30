import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface UseFaceDetectionProps {
  isCameraActive: boolean;
  isModelsLoaded: boolean;
  isDetectionActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onDetection: (type: string) => void;
  onFaceStatusChange?: (isDetected: boolean) => void;
}

export const useFaceDetection = ({
  isCameraActive,
  isModelsLoaded,
  isDetectionActive,
  videoRef,
  onDetection,
  onFaceStatusChange
}: UseFaceDetectionProps) => {
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [latency, setLatency] = useState(0);
  const [fps, setFps] = useState(0);
  const [faceConfidence, setFaceConfidence] = useState(0);
  
  const lastReportedTypeRef = useRef<string | null>(null);
  const awayStartTimeRef = useRef<number | null>(null);
  const missingStartTimeRef = useRef<number | null>(null);
  const awayGlitchCounterRef = useRef(0);
  const missingGlitchCounterRef = useRef(0);
  const isFaceDetectedRef = useRef(false);

  // Pose Memory Refs
  const lastFaceTimestampRef = useRef<number>(0);
  const yawHistoryRef = useRef<number[]>([]); // Last 10 frames of Yaw
  const lastPitchRef = useRef<number>(0);

  const onDetectionRef = useRef(onDetection);
  const onFaceStatusChangeRef = useRef(onFaceStatusChange);
  const isDetectionActiveRef = useRef(isDetectionActive);

  useEffect(() => {
    onDetectionRef.current = onDetection;
  }, [onDetection]);

  useEffect(() => {
    onFaceStatusChangeRef.current = onFaceStatusChange;
  }, [onFaceStatusChange]);

  useEffect(() => {
    isDetectionActiveRef.current = isDetectionActive;
  }, [isDetectionActive]);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 2,
          minFaceDetectionConfidence: 0.3, // Lowered to help detect side profiles
          minFacePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3
        });
        faceLandmarkerRef.current = landmarker;
        console.log("[useFaceDetection] MediaPipe Face Landmarker initialized");
      } catch (err) {
        console.error("[useFaceDetection] Error initializing MediaPipe:", err);
      }
    };

    if (isModelsLoaded && !faceLandmarkerRef.current) {
      initFaceLandmarker();
    }
  }, [isModelsLoaded]);

  useEffect(() => {
    if (!isCameraActive || !isModelsLoaded || !videoRef.current) {
      lastReportedTypeRef.current = null;
      return;
    }

    let requestRef: number;
    let lastTime = performance.now();
    let frameCount = 0;
    
    // Requirements from user
    const LOOKING_AWAY_DELAY = 2000; // 2-second rule for active detection
    const MISSING_DETECTION_DELAY = 2000; // Increased to 2 seconds as requested
    const SIDE_PROFILE_GRACE_PERIOD = 3000; // 3-second grace period for side profiles
    const DOWNWARD_GAZE_GRACE_PERIOD = 2500; // Grace period for downward gaze
    const GLITCH_THRESHOLD = 8;
    
    // Thresholds in degrees
    const YAW_THRESHOLD_DEG = 25;
    const PITCH_UP_THRESHOLD_DEG = 15;   // Lowered threshold for looking up (more sensitive)
    const PITCH_DOWN_THRESHOLD_DEG = 20; // Threshold for looking down (phone/paper)
    const SIDE_PROFILE_YAW_THRESHOLD = 30; // Threshold to trigger grace period

    const detect = async () => {
      if (!videoRef.current || !isCameraActive || !faceLandmarkerRef.current) {
        requestRef = requestAnimationFrame(detect);
        return;
      }

      if (videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
        requestRef = requestAnimationFrame(detect);
        return;
      }

      try {
        const startTime = performance.now();
        const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTime);
        const endTime = performance.now();
        
        setLatency(Math.round(endTime - startTime));
        
        frameCount++;
        if (endTime - lastTime >= 1000) {
          setFps(frameCount);
          frameCount = 0;
          lastTime = endTime;
        }

        const hasFace = results.faceLandmarks.length > 0;
        const isMultiple = results.faceLandmarks.length > 1;
        
        let currentYaw = 0;
        let currentPitch = 0;
        let frameViolation: 'valid' | 'looking_away' | 'face_missing' | 'multiple_faces' = 'valid';
        
        if (isMultiple) {
          frameViolation = 'multiple_faces';
        } else if (hasFace) {
          const landmarks = results.faceLandmarks[0];
          
          // Pose Estimation Logic (Mathematical Logic)
          // Yaw: Nose (1) relative to eyes (33, 263)
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const noseTip = landmarks[1];
          
          const eyeCenterX = (leftEye.x + rightEye.x) / 2;
          const eyeDist = rightEye.x - leftEye.x;
          const noseOffsetX = noseTip.x - eyeCenterX;
          
          // Yaw approximation in degrees
          const yawRad = Math.asin(Math.max(-1, Math.min(1, (noseOffsetX / eyeDist) * 2)));
          currentYaw = Math.abs(yawRad * (180 / Math.PI));

          // Pitch: Nose (1) relative to top (10) and chin (152)
          // These landmarks (10 and 152) are stable even when eyes are closed
          const topHead = landmarks[10];
          const chin = landmarks[152];
          const faceHeight = chin.y - topHead.y;
          
          const faceCenterY = (topHead.y + chin.y) / 2;
          const noseOffsetY = noseTip.y - faceCenterY;
          
          // Pitch approximation in degrees (Signed)
          // In image coordinates, smaller Y is UP. 
          // If noseTip.y < faceCenterY, noseOffsetY is negative -> looking UP.
          // We invert it so looking UP is positive.
          const pitchRad = Math.asin(Math.max(-1, Math.min(1, (noseOffsetY / faceHeight) * 3.0)));
          currentPitch = -(pitchRad * (180 / Math.PI));

          // Update Pose Memory (Last 10 frames)
          lastFaceTimestampRef.current = endTime;
          yawHistoryRef.current.push(currentYaw);
          if (yawHistoryRef.current.length > 10) yawHistoryRef.current.shift();
          lastPitchRef.current = currentPitch;

          const isLookingAwayYaw = currentYaw > YAW_THRESHOLD_DEG;
          const isLookingUp = currentPitch > PITCH_UP_THRESHOLD_DEG;
          const isLookingDown = currentPitch < -PITCH_DOWN_THRESHOLD_DEG;

          if (isLookingAwayYaw || isLookingUp || isLookingDown) {
            frameViolation = 'looking_away';
          } else {
            frameViolation = 'valid';
          }
        } else {
          // Pose Memory & Grace Period Logic (Enhanced for Side Profiles and Downward Gaze)
          const timeSinceLastFace = endTime - lastFaceTimestampRef.current;
          
          // Calculate average Yaw of last 10 frames
          const avgYaw = yawHistoryRef.current.length > 0 
            ? yawHistoryRef.current.reduce((a, b) => a + b, 0) / yawHistoryRef.current.length 
            : 0;
            
          const isSideProfile = avgYaw > SIDE_PROFILE_YAW_THRESHOLD;
          const isDownwardGaze = lastPitchRef.current < -PITCH_DOWN_THRESHOLD_DEG;
          const isUpwardGaze = lastPitchRef.current > PITCH_UP_THRESHOLD_DEG;
          const isExtremePose = isSideProfile || isDownwardGaze || isUpwardGaze;

          if (isExtremePose) {
            // If it was an extreme pose (side, up, or down), grant a grace period as "Looking Away"
            // This prevents false "Face Missing" when landmarks are lost during extreme angles
            let gracePeriod = MISSING_DETECTION_DELAY;
            if (isSideProfile) gracePeriod = SIDE_PROFILE_GRACE_PERIOD;
            if (isDownwardGaze) gracePeriod = DOWNWARD_GAZE_GRACE_PERIOD;
            
            if (timeSinceLastFace < gracePeriod) {
              frameViolation = 'looking_away';
            } else {
              frameViolation = 'face_missing';
            }
          } else {
            // If it was near-center, trigger "Face Missing" after the 2-second delay
            if (timeSinceLastFace < MISSING_DETECTION_DELAY) {
              frameViolation = lastReportedTypeRef.current === 'looking_away' ? 'looking_away' : 'valid';
            } else {
              frameViolation = 'face_missing';
            }
          }
        }

        // State Machine Logic with 2-Second Rule
        const now = endTime;
        let nextReportedType: 'valid' | 'looking_away' | 'face_missing' | 'multiple_faces' = (lastReportedTypeRef.current as any) || 'valid';

        if (frameViolation === 'multiple_faces') {
          nextReportedType = 'multiple_faces';
          missingStartTimeRef.current = null;
          awayStartTimeRef.current = null;
          missingGlitchCounterRef.current = 0;
          awayGlitchCounterRef.current = 0;
        } 
        else if (frameViolation === 'face_missing') {
          awayStartTimeRef.current = null;
          awayGlitchCounterRef.current = 0;
          missingGlitchCounterRef.current = 0;
          
          if (missingStartTimeRef.current === null) missingStartTimeRef.current = now;
          
          if (now - missingStartTimeRef.current >= MISSING_DETECTION_DELAY) {
            nextReportedType = 'face_missing';
            if (isFaceDetectedRef.current) {
              isFaceDetectedRef.current = false;
              setIsFaceDetected(false);
              onFaceStatusChangeRef.current?.(false);
            }
          }
        } 
        else if (frameViolation === 'looking_away') {
          missingStartTimeRef.current = null;
          missingGlitchCounterRef.current = 0;
          
          if (awayStartTimeRef.current === null) awayStartTimeRef.current = now;
          
          // 2-Second Rule Implementation (Timestamp-based validation)
          if (now - awayStartTimeRef.current >= LOOKING_AWAY_DELAY) {
            nextReportedType = 'looking_away';
          }
          
          if (!isFaceDetectedRef.current) {
            isFaceDetectedRef.current = true;
            setIsFaceDetected(true);
            onFaceStatusChangeRef.current?.(true);
          }
        } 
        else {
          // frameViolation === 'valid'
          missingStartTimeRef.current = null;
          awayStartTimeRef.current = null;
          
          if (lastReportedTypeRef.current === 'face_missing') {
            missingGlitchCounterRef.current++;
            if (missingGlitchCounterRef.current >= GLITCH_THRESHOLD) {
              nextReportedType = 'valid';
            }
          } else if (lastReportedTypeRef.current === 'looking_away') {
            awayGlitchCounterRef.current++;
            if (awayGlitchCounterRef.current >= GLITCH_THRESHOLD) {
              nextReportedType = 'valid';
            }
          } else {
            nextReportedType = 'valid';
          }

          if (!isFaceDetectedRef.current) {
            isFaceDetectedRef.current = true;
            setIsFaceDetected(true);
            onFaceStatusChangeRef.current?.(true);
          }
        }

        setIsLookingAway(nextReportedType === 'looking_away');
        setFaceConfidence(hasFace ? Math.min(faceConfidence + 5, 100) : Math.max(faceConfidence - 10, 0));

        if (nextReportedType !== lastReportedTypeRef.current) {
          console.log(`[useFaceDetection] State Transition: ${lastReportedTypeRef.current} -> ${nextReportedType} (isDetectionActiveRef=${isDetectionActiveRef.current})`);
          lastReportedTypeRef.current = nextReportedType;
          if (isDetectionActiveRef.current) {
            console.log(`[useFaceDetection] Reporting violation to App: ${nextReportedType}`);
            onDetectionRef.current(nextReportedType);
          }
        }

      } catch (err) {
        console.error("Detection error:", err);
      } finally {
        requestRef = requestAnimationFrame(detect);
      }
    };

    detect();
    return () => cancelAnimationFrame(requestRef);
  }, [isCameraActive, isModelsLoaded, videoRef]);

  useEffect(() => {
    if (isDetectionActive && lastReportedTypeRef.current && lastReportedTypeRef.current !== 'valid') {
      console.log(`[useFaceDetection] Reporting initial violation on activation: ${lastReportedTypeRef.current}`);
      onDetectionRef.current(lastReportedTypeRef.current);
    }
  }, [isDetectionActive]);

  return {
    isFaceDetected,
    isLookingAway,
    latency,
    fps,
    faceConfidence,
    lastReportedType: lastReportedTypeRef.current
  };
};
