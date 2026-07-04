export interface Visitor {
  id: string;
  fullName: string;

  dob: string;
  gender: string;
  photoPath: string;
  phoneNumber: string;
  email: string;
  company: string;
  isBlacklisted: boolean;
  createdAt: string;
}

export type VisitStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT';

export interface Visit {
  id: string;
  visitorId: string;
  visitor: Visitor;
  purpose: string;
  hostEmployee: string;
  status: VisitStatus;
  qrCodeUrl?: string;
  badgeUrl?: string;
  createdAt: string;
  updatedAt: string;
}


export interface AuditLog {
  id: string;
  user: string;
  action: string;
  visitId: string;
  ipAddress: string;
  timestamp: string;
}
