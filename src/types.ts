export interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: string;
  parentPhone: string;
  parentEmail: string;
  createdAt: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'tardy';

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  status: AttendanceStatus;
  date: string; // YYYY-MM-DD
  timestamp: number;
  markedBy: string;
}

export interface BehaviorLog {
  id?: string;
  studentId: string;
  teacherId: string;
  comment: string;
  timestamp: number;
  date: string;
}

export interface EmergencyClosure {
  id?: string;
  title: string;
  message: string;
  sentAt: number;
  senderId: string;
}
