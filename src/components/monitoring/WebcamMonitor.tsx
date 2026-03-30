import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, AlertCircle, BadgeCheck, Scan } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceDetection } from '../../hooks/useFaceDetection';

interface WebcamMonitorProps {
  onDetection: (type: string, snapshot?: string) => void;
  onFaceStatusChange?: (isDetected: boolean) => void;
  isCameraActive: boolean;
  isDetectionActive: boolean;
  showIdentityVerified?: boolean;
  isExamRunning?: boolean;
  stream?: MediaStream | null;
}

export const WebcamMonitor: React.FC<WebcamMonitorProps> = ({ 
  onDetection, 
  onFaceStatusChange, 
  isCameraActive, 
  isDetectionActive,
  showIdentityVerified = true,
  isExamRunning = false,
  stream = null
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(true);

  // Camera management
  useEffect(() => {
    if (!isCameraActive) {
      if (videoRef.current?.srcObject && !stream) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setHasPermission(null);
      return;
    }

    if (stream) {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Autoplay blocked:", e));
        };
        setHasPermission(true);
      }
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: 30 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Autoplay blocked:", e));
          };
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive]);

  const {
    isFaceDetected,
    isLookingAway,
    latency,
    fps,
    lastReportedType
  } = useFaceDetection({
    isCameraActive,
    isModelsLoaded,
    isDetectionActive,
    videoRef,
    onDetection,
    onFaceStatusChange
  });

  return (
    <div className={cn(
      "relative w-full aspect-video bg-portal-50 rounded-lg overflow-hidden border transition-all duration-300 shadow-inner",
      isExamRunning && isDetectionActive && !isFaceDetected ? "border-rose-500 ring-4 ring-rose-500/20" : 
      isExamRunning && isDetectionActive && isLookingAway ? "border-amber-500 ring-4 ring-amber-500/20" : 
      isExamRunning && isDetectionActive && lastReportedType === 'multiple_faces' ? "border-rose-600 ring-4 ring-rose-600/30" :
      "border-portal-200"
    )}>
      {isCameraActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 pointer-events-none">
            {/* Safe Zone Rectangle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                initial={false}
                animate={{
                  borderColor: isFaceDetected ? "#10b981" : "rgba(255, 255, 255, 0.2)",
                  opacity: isFaceDetected ? 1 : 0.6,
                }}
                transition={{ duration: 0.3 }}
                className="w-[80%] h-[90%] border-[3px] border-emerald-500 rounded-sm flex items-center justify-center relative"
              >
                {!isFaceDetected && (
                  <div className="flex flex-col items-center gap-2">
                    <Scan className="w-8 h-8 text-white/10" />
                    <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/20">Position Face Here</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Status Indicators */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {!isExamRunning && (
                <motion.div 
                  layout
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-portal-200 shadow-sm"
                >
                  <motion.div 
                    animate={{ 
                      backgroundColor: isFaceDetected ? "#10b981" : "#f43f5e",
                      scale: isFaceDetected ? [1, 1.2, 1] : 1
                    }}
                    transition={{ scale: { duration: 1, repeat: Infinity } }}
                    className="w-2 h-2 rounded-full" 
                  />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 font-black">
                    {isFaceDetected ? "Face Detected" : "Searching..."}
                  </span>
                </motion.div>
              )}
              
              <AnimatePresence mode="wait">
                {isExamRunning && isDetectionActive ? (
                  <motion.div
                    key={!isFaceDetected ? "missing" : lastReportedType === 'multiple_faces' ? "multiple" : isLookingAway ? "away" : "active"}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 backdrop-blur-md rounded-full border shadow-sm",
                      !isFaceDetected ? "bg-rose-500/90 border-rose-400" : 
                      lastReportedType === 'multiple_faces' ? "bg-rose-600/90 border-rose-500" :
                      isLookingAway ? "bg-amber-500/90 border-amber-400" : 
                      "bg-emerald-500/90 border-emerald-400"
                    )}
                  >
                    {!isFaceDetected ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white font-black">Face Missing</span>
                      </>
                    ) : lastReportedType === 'multiple_faces' ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white font-black">Multiple Faces</span>
                      </>
                    ) : isLookingAway ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white font-black">Looking Away</span>
                      </>
                    ) : (
                      <>
                        <BadgeCheck className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white font-black">Monitoring Active</span>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <AnimatePresence>
                      {isFaceDetected && isDetectionActive && lastReportedType !== 'multiple_faces' && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md rounded-full border border-emerald-400 shadow-sm"
                        >
                          <BadgeCheck className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-white font-black">
                            Monitoring Active
                          </span>
                        </motion.div>
                      )}
                      {isDetectionActive && lastReportedType === 'multiple_faces' && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-rose-600/90 backdrop-blur-md rounded-full border border-rose-400 shadow-sm"
                        >
                          <AlertCircle className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-white font-black">
                            Multiple Faces
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </AnimatePresence>

              {!isExamRunning && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-portal-200 shadow-sm">
                  <BadgeCheck className="w-3 h-3 text-portal-500" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 font-black">
                    {isDetectionActive ? "AI Active" : "Standby"}
                  </span>
                </div>
              )}

              <AnimatePresence>
                {isFaceDetected && showIdentityVerified && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md text-white rounded-full border border-emerald-400 shadow-sm"
                  >
                    <BadgeCheck className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Identity Verified</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Metrics Overlay */}
            <div className="absolute bottom-4 right-4 text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter font-bold">Latency: {latency}ms</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter font-bold">FPS: {fps}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400 bg-slate-50">
          <CameraOff className="w-12 h-12 opacity-20" />
          <p className="text-sm font-black tracking-wide uppercase opacity-50">Camera Inactive</p>
        </div>
      )}

      {hasPermission === false && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 text-center z-50">
          <div className="max-w-xs">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-slate-900 font-black mb-2 uppercase tracking-tight">Camera Access Denied</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">Please enable camera permissions in your browser to proceed with the examination.</p>
          </div>
        </div>
      )}

      {!isModelsLoaded && isCameraActive && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-veritas-indigo border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Initializing AI Models...</span>
          </div>
        </div>
      )}
    </div>
  );
};
