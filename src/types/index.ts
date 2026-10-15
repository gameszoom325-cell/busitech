export type UserRole = 'Admin' | 'Member' | 'Guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarText?: string;
  picture?: string;
  department?: string;
  authLevel?: string;
  isOnline?: boolean;
}

export interface GuestRegistration {
  id: string;
  fullName: string;
  age: number;
  phone: string;
  consent: boolean;
  registeredAt: string;
}

export type ObligationStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
export type RiskLevel = 'High' | 'Medium' | 'Low';
export type ObligationCategory = 'Payment' | 'Delivery' | 'Inspection' | 'Compliance' | 'Reporting' | 'SLA';

export interface Obligation {
  id: string;
  title: string;
  tag?: string;
  clauseRef: string;
  description: string;
  contractId: string;
  contractName: string;
  ownerName: string;
  ownerAvatar?: string;
  dueDate: string;
  dueDateFormatted: string;
  status: ObligationStatus;
  risk: RiskLevel;
  category: ObligationCategory;
  isOverdue?: boolean;
  overdueText?: string;
  responsibleParty: 'Acme Corp (Us)' | 'Mutual' | 'Counterparty (Stripe)' | string;
  verificationStatus?: 'Verified' | 'Ambiguous';
  section?: string;
  pageLine?: string;
  noticeThreshold?: string;
  cadence?: string;
}

export interface Contract {
  id: string;
  name: string;
  code: string;
  counterparty: string;
  type: string;
  obligationsCount: number;
  hasRisk?: boolean;
  riskCount?: number;
  nextDeadline: string;
  nextDeadlineToDisplay: string;
  status: 'Active' | 'Pending Review' | 'Archived';
  fileSize?: string;
  uploadedDate: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  riskLevel: 'HIGH RISK' | 'MEDIUM RISK' | 'LOW RISK';
  riskScore?: string;
  riskDotColor: 'red' | 'amber' | 'blue' | 'green';
  dueDateTag: string;
  contractRef: string;
  clauseRef: string;
  description: string;
  contractualBasisQuote: string;
  basisMatchPercent?: string;
  actions: string[];
  primaryButtonLabel: string;
  secondaryButtonLabel?: string;
  thirdButtonLabel?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  hash: string;
  category: 'Approval' | 'Extraction' | 'System' | 'Auth' | 'Upload';
}

export interface StatMetric {
  label: string;
  value: string | number;
  badge: string;
  badgeType: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  subtext: string;
  indicatorColor?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: 'urgent' | 'info' | 'success';
}
