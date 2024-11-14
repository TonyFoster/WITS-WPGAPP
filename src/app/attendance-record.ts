export interface AttendanceRecord {
  name: string;
  office: string;
  type: string;
  createdAt: Date;
  leaveStart?: string;
  leaveEnd?: string;
  leaveReason?: string;
}
