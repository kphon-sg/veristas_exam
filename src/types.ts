export interface MonitoringEvent {
  id: string;
  timestamp: number;
  endTime?: number;
  type: 'face_missing' | 'multiple_faces' | 'looking_away' | 'tab_switch' | 'app_blur' | 'valid';
  severity: 'low' | 'medium' | 'high' | 'none';
  message: string;
  snapshot?: string;
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
  endTime?: number; // timestamp in ms
}

export interface StudentStats {
  totalAssigned: number;
  completedCount: number;
  pendingCount: number;
  averageScore: number;
}
