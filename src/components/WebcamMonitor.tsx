import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface WebcamMonitorProps {
  onDetection: (type: string) => void;
  isCameraActive: boolean;
  isDetectionActive: boolean;
}

export const WebcamMonitor: React.FC<WebcamMonitorProps> = ({ onDetection, isCameraActive, isDetectionActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [isLookingAway, setIsLookingAway] = useState(false);

  useEffect(() => {
    if (!isCameraActive) {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setHasPermission(null);
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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

  useEffect(() => {
    if (!isDetectionActive || !isCameraActive) return;

    // Mock AI Detection Loop
    const interval = setInterval(() => {
      // Randomly simulate detections for prototype demonstration
      const rand = Math.random();
      if (rand < 0.02) {
        setIsFaceDetected(false);
        onDetection('face_missing');
        setTimeout(() => setIsFaceDetected(true), 2000);
      } else if (rand < 0.05) {
        setIsLookingAway(true);
        onDetection('looking_away');
        setTimeout(() => setIsLookingAway(false), 1500);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isDetectionActive, isCameraActive, onDetection]);

  return (
    <div className="relative w-full aspect-video bg-portal-50 rounded-lg overflow-hidden border border-portal-200 shadow-inner">
      {isCameraActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover grayscale brightness-90 contrast-110"
          />
          
          {/* AI Overlay Mock */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Face Bounding Box Mock */}
            {isFaceDetected && (
              <div className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 rounded-lg transition-colors duration-300",
                isLookingAway ? "border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-portal-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              )}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/80 backdrop-blur-md rounded text-[10px] font-mono uppercase tracking-wider text-slate-500 border border-portal-200 shadow-sm">
                  {isLookingAway ? "Gaze: Off-Screen" : "Gaze: Centered"}
                </div>
              </div>
            )}

            {/* Status Indicators */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-portal-200 shadow-sm">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", isFaceDetected ? "bg-emerald-500" : "bg-rose-500")} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 font-bold">
                  {isFaceDetected ? "Face Detected" : "No Face Found"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-portal-200 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-portal-500" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 font-bold">
                  {isDetectionActive ? "Edge AI Active" : "AI Standby"}
                </span>
              </div>
            </div>

            {/* Metrics Overlay */}
            <div className="absolute bottom-4 right-4 text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Latency: 12ms</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">FPS: 30.2</div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400 bg-slate-50">
          <CameraOff className="w-12 h-12 opacity-20" />
          <p className="text-sm font-bold tracking-wide uppercase opacity-50">Camera Inactive</p>
        </div>
      )}

      {hasPermission === false && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 text-center">
          <div className="max-w-xs">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-slate-900 font-bold mb-2">Camera Access Denied</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Please enable camera permissions in your browser to proceed with the examination.</p>
          </div>
        </div>
      )}
    </div>
  );
};
