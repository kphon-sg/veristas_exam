export interface MonitoringEvent {
  id: string;
  timestamp: number;
  type: 'face_missing' | 'multiple_faces' | 'looking_away' | 'tab_switch' | 'app_blur';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface AIStats {
  latency: number;
  cpuUsage: number;
  memoryUsage: number;
  fps: number;
}

export interface ExamState {
  title: string;
  duration: number; // in minutes
  remainingTime: number; // in seconds
  status: 'idle' | 'running' | 'paused' | 'finished';
  startTime?: string;
}
