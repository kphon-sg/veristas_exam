import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Video, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  User, 
  Settings2,
  Image as ImageIcon,
  MonitorOff,
  RefreshCw
} from 'lucide-react';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { cn } from '../../lib/utils';

interface PreExamSetupProps {
  quizTitle: string;
  onJoin: (stream: MediaStream) => void;
  onLeave: () => void;
  isModelsLoaded: boolean;
}

export const PreExamSetup: React.FC<PreExamSetupProps> = ({ 
  quizTitle, 
  onJoin, 
  onLeave,
  isModelsLoaded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const isJoiningRef = useRef(false);

  // Use the face detection hook
  const { isFaceDetected } = useFaceDetection({
    isCameraActive,
    isModelsLoaded,
    isDetectionActive: true,
    videoRef,
    onDetection: () => {}, // No need to report violations during setup
    onFaceStatusChange: () => {}
  });

  const getDevices = useCallback(async () => {
    try {
      console.log("[PreExamSetup] Enumerating devices...");
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      
      // If we have devices but no labels, we probably haven't granted permission yet
      const hasLabels = videoDevices.some(d => d.label);
      console.log(`[PreExamSetup] Found ${videoDevices.length} video devices. Has labels: ${hasLabels}`);
      
      setDevices(videoDevices);
      
      if (videoDevices.length > 0) {
        // Prefer a device that has a label if possible, or just the first one
        const initialDevice = videoDevices.find(d => d.deviceId) || videoDevices[0];
        if (initialDevice && !selectedCamera) {
          console.log(`[PreExamSetup] Setting initial camera: ${initialDevice.deviceId} (${initialDevice.label})`);
          setSelectedCamera(initialDevice.deviceId);
        }
      } else {
        setCameraError("No camera found on this device.");
      }
    } catch (err) {
      console.error("[PreExamSetup] Error enumerating devices:", err);
      setCameraError("Failed to access hardware information.");
    }
  }, [selectedCamera]);

  const requestPermission = useCallback(async () => {
    setIsInitializing(true);
    try {
      console.log("[PreExamSetup] Requesting initial permission...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      console.log("[PreExamSetup] Permission granted.");
      await getDevices();
    } catch (err: any) {
      console.error("[PreExamSetup] Permission request failed:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera access denied. Please enable it in browser settings.");
      } else {
        setCameraError("Could not access camera. Please check your connection.");
      }
    } finally {
      setIsInitializing(false);
    }
  }, [getDevices]);

  const isInitializingRef = useRef(false);

  const stopStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`[PreExamSetup] Stopped track: ${track.label} (${track.kind})`);
      });
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // If we don't have a selected camera but we have devices, try to pick one
    if (!selectedCamera && devices.length > 0) {
      setSelectedCamera(devices[0].deviceId);
      return;
    }

    if (!selectedCamera || isInitializingRef.current) return;
    
    isInitializingRef.current = true;
    setIsInitializing(true);
    setCameraError(null);
    setIsCameraActive(false);
    
    stopStream();

    try {
      console.log(`[PreExamSetup] Starting camera with ID: ${selectedCamera}`);
      
      // Use a more flexible constraint strategy
      const constraints: MediaStreamConstraints = {
        video: { 
          deviceId: selectedCamera ? { ideal: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!isInitializingRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Some browsers require a slight delay or explicit play call
        await new Promise(resolve => setTimeout(resolve, 100));
        await videoRef.current.play();
        
        setIsCameraActive(true);
        setCameraError(null);
        console.log("[PreExamSetup] Camera stream active.");
      }
    } catch (err: any) {
      console.error("[PreExamSetup] startCamera error:", err);
      
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("Camera is already in use by another application. Please close other apps and retry.");
      } else if (err.name === 'OverconstrainedError') {
        console.warn("[PreExamSetup] Overconstrained, retrying with minimal constraints...");
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            setIsCameraActive(true);
            return;
          }
        } catch (fallbackErr) {
          setCameraError("Hardware conflict. Please restart your browser.");
        }
      } else {
        setCameraError(`Camera error: ${err.message || err.name}`);
      }
      setIsCameraActive(false);
    } finally {
      setIsInitializing(false);
      isInitializingRef.current = false;
    }
  }, [selectedCamera, devices, stopStream]);

  useEffect(() => {
    requestPermission();
  }, []); // Run once on mount

  useEffect(() => {
    if (selectedCamera) {
      startCamera();
    }
  }, [selectedCamera, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isJoiningRef.current) {
        stopStream();
      }
    };
  }, [stopStream]);

  const handleJoin = () => {
    if (videoRef.current?.srcObject) {
      isJoiningRef.current = true;
      onJoin(videoRef.current.srcObject as MediaStream);
    }
  };

  const checklistItems = [
    "Please sit down while using",
    "Only one face, please"
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      >
        {/* Left Side: Camera Preview */}
        <div className="flex-1 bg-slate-100 relative flex flex-col">
          {/* Top Left Checklist */}
          <div className="absolute top-6 left-6 z-20 space-y-2 pointer-events-none">
            {checklistItems.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200"
              >
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700 tracking-tight">{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Camera Viewport */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
            {/* Always render video element to avoid null ref during initialization */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className={cn(
                "w-full h-full object-cover transition-all duration-700 absolute inset-0",
                (!isCameraActive || !!cameraError) && "opacity-0 pointer-events-none"
              )}
            />
            
            {isCameraActive && !cameraError && (
              <>
                {/* Silhouette Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 z-10">
                  <svg viewBox="0 0 400 500" className="w-2/3 h-2/3 text-white">
                    <path 
                      d="M200,100 C140,100 100,140 100,200 C100,260 140,300 200,300 C260,300 300,260 300,200 C300,140 260,100 200,100 Z M100,300 C40,300 0,360 0,440 L0,500 L400,500 L400,440 C400,360 360,300 300,300" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeDasharray="8 8"
                    />
                  </svg>
                </div>

                {/* Face Not Detected Overlay */}
                <AnimatePresence>
                  {!isFaceDetected && !isInitializing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20"
                    >
                      <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/50 animate-pulse">
                        <User className="w-10 h-10 text-rose-500" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight uppercase">Face not detected</h3>
                      <p className="text-slate-300 text-xs mt-2 font-medium">Position yourself within the guide</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {(!isCameraActive || !!cameraError) && (
              <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center z-30">
                {isInitializing ? (
                  <RefreshCw className="w-12 h-12 animate-spin mb-4 text-veritas-indigo" />
                ) : (
                  <MonitorOff className="w-12 h-12 mb-4 opacity-20" />
                )}
                <h3 className="text-lg font-bold text-slate-300">
                  {cameraError || (isInitializing ? "Initializing Camera..." : "Camera inactive")}
                </h3>
                {!isInitializing && (
                  <button 
                    onClick={() => {
                      setCameraError(null);
                      requestPermission();
                    }}
                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Bar (Optional info) */}
          <div className="bg-white p-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full", 
                cameraError ? "bg-rose-500" : (isCameraActive ? "bg-emerald-500" : "bg-amber-500 animate-pulse")
              )} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                Status: {cameraError ? "Error" : (isCameraActive ? (isFaceDetected ? "Face Detected" : "Camera Active") : "Searching...")}
              </span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
              AI Proctoring v2.5
            </div>
          </div>
        </div>

        {/* Right Side: Settings & Actions */}
        <div className="w-full md:w-[380px] p-8 flex flex-col">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{quizTitle}</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest font-mono">Pre-Exam Setup</p>
          </div>

          <div className="space-y-10 flex-1">
            {/* Camera Selection */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <Camera className="w-3.5 h-3.5" /> Select Camera
              </label>
              <div className="relative group">
                <select 
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-veritas-indigo/20 focus:border-veritas-indigo transition-all cursor-pointer shadow-sm"
                >
                  {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                  {devices.length === 0 && <option value="">No cameras found</option>}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-veritas-indigo transition-colors" />
              </div>
            </div>

            {/* System Requirements / Checklist */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Environment Check
              </label>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">Camera Permission</p>
                    <p className="text-[10px] text-slate-500 font-medium">Access granted and active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">Face Visibility</p>
                    <p className="text-[10px] text-slate-500 font-medium">Ensure clear lighting</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4 shadow-sm">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">Important</h4>
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                  Ensure your face is clearly visible and well-lit. The proctoring system will monitor your presence throughout the exam.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button 
              onClick={handleJoin}
              disabled={!isFaceDetected || !!cameraError || isInitializing}
              className={cn(
                "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg",
                (!isFaceDetected || !!cameraError || isInitializing)
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-veritas-deep to-veritas-indigo text-white hover:opacity-95 active:scale-[0.98]"
              )}
            >
              Join now
            </button>
            <button 
              onClick={onLeave}
              className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
            >
              Leave
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
