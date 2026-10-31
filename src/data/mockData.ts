import { Contract, Obligation, ApprovalItem, ActivityEvent, NotificationItem, User, GuestRegistration } from '../types';

export const DEMO_NOTICE = "Demo data - Contract2Action AI Mock Layer";

export const MOCK_USERS: User[] = [
  {
    id: 'usr_admin_1',
    name: 'Ayush Sharma',
    email: 'ayushdps1010@gmail.com',
    role: 'Admin',
    avatarText: 'AS',
    department: 'Legal Operations',
    authLevel: 'Auth Lv 3',
    isOnline: true
  },
  {
    id: 'usr_admin_2',
    name: 'Ashwin Singh',
    email: 'aspging@gmail.com',
    role: 'Admin',
    avatarText: 'AS',
    department: 'Risk Governance',
    authLevel: 'Auth Lv 3',
    isOnline: true
  },
  {
    id: 'usr_admin_3',
    name: 'Gaurav Kumar',
    email: 'gameszoom325@gmail.com',
    role: 'Admin',
    avatarText: 'GK',
    department: 'Platform Admin',
    authLevel: 'Auth Lv 3',
    isOnline: true
  },
  {
    id: 'usr_member_1',
    name: 'Alex Chen',
    email: 'alex.chen@acmecorp.com',
    role: 'Member',
    avatarText: 'AC',
    department: 'Procurement',
    authLevel: 'Auth Lv 2',
    isOnline: false
  },
  {
    id: 'usr_member_2',
    name: 'Marcus Vance',
    email: 'marcus.vance@acmecorp.com',
    role: 'Member',
    avatarText: 'MV',
    department: 'Cloud Infrastructure',
    authLevel: 'Auth Lv 2',
    isOnline: false
  },
  {
    id: 'usr_member_3',
    name: 'Elena Rostova',
    email: 'elena.rostova@acmecorp.com',
    role: 'Member',
    avatarText: 'ER',
    department: 'Compliance & Privacy',
    authLevel: 'Auth Lv 2',
    isOnline: false
  }
];

export const MOCK_GUESTS: GuestRegistration[] = [
  {
    id: 'gst_901',
    fullName: 'Demo Reviewer',
    age: 28,
    phone: '9876543210',
    consent: true,
    registeredAt: '2026-10-14 09:30 UTC'
  },
  {
    id: 'gst_902',
    fullName: 'Hackathon Evaluator',
    age: 34,
    phone: '9123456780',
    consent: true,
    registeredAt: '2026-10-15 04:12 UTC'
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Urgent: Salesforce non-renewal notice draft expires in 4 days',
    time: '10m ago',
    unread: true,
    type: 'urgent'
  },
  {
    id: 'notif_2',
    title: 'SOC2 Type II Audit Report accepted by Stripe portal',
    time: '1h ago',
    unread: true,
    type: 'success'
  },
  {
    id: 'notif_3',
    title: 'Cloudflare MSA extraction complete: 4 new actionable tasks',
    time: '3h ago',
    unread: false,
    type: 'info'
  }
];

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'ctr_stripe_msa',
    name: 'Master Services Agreement v4.2',
    code: 'MSA-2024-098',
    counterparty: 'Stripe Inc.',
    type: 'Customer MSA',
    obligationsCount: 6,
    hasRisk: false,
    nextDeadline: '2025-10-28',
    nextDeadlineToDisplay: 'Oct 28',
    status: 'Active',
    fileSize: '3.4 MB',
    uploadedDate: '2024-09-12'
  },
  {
    id: 'ctr_aws_cloud',
    name: 'Enterprise Cloud Subscription Agreement',
    code: 'ECS-2023-012',
    counterparty: 'Amazon Web Services',
    type: 'Infrastructure & Cloud',
    obligationsCount: 12,
    hasRisk: true,
    riskCount: 1,
    nextDeadline: '2025-11-15',
    nextDeadlineToDisplay: 'Nov 15',
    status: 'Active',
    fileSize: '5.1 MB',
    uploadedDate: '2023-11-04'
  },
  {
    id: 'ctr_datadog_dpa',
    name: 'Non-Disclosure & Data Processing Addendum',
    code: 'DPA-2024-011',
    counterparty: 'Datadog HQ',
    type: 'Data Privacy & Security',
    obligationsCount: 4,
    hasRisk: false,
    nextDeadline: '2025-12-01',
    nextDeadlineToDisplay: 'Dec 01',
    status: 'Active',
    fileSize: '2.2 MB',
    uploadedDate: '2024-03-20'
  },
  {
    id: 'ctr_dhl_supply',
    name: 'Vendor Logistics & Fulfillment Contract',
    code: 'VLF-2022-109',
    counterparty: 'DHL Supply Chain',
    type: 'Operations & Logistics',
    obligationsCount: 9,
    hasRisk: true,
    riskCount: 2,
    nextDeadline: '2025-10-18',
    nextDeadlineToDisplay: 'Oct 18',
    status: 'Active',
    fileSize: '4.8 MB',
    uploadedDate: '2022-10-01'
  },
  {
    id: 'ctr_salesforce_sa',
    name: 'Salesforce Enterprise Service Agreement',
    code: 'SFA-2023-441',
    counterparty: 'Salesforce.com Inc.',
    type: 'SaaS Software',
    obligationsCount: 7,
    hasRisk: true,
    riskCount: 1,
    nextDeadline: '2025-10-28',
    nextDeadlineToDisplay: 'Oct 28',
    status: 'Pending Review',
    fileSize: '3.9 MB',
    uploadedDate: '2023-08-15'
  },
  {
    id: 'ctr_snowflake_so',
    name: 'Snowflake Enterprise Service Order',
    code: 'SNO-2024-002',
    counterparty: 'Snowflake Computing',
    type: 'Data Warehousing',
    obligationsCount: 5,
    hasRisk: false,
    nextDeadline: '2025-12-15',
    nextDeadlineToDisplay: 'Dec 15',
    status: 'Active',
    fileSize: '2.8 MB',
    uploadedDate: '2024-01-10'
  }
];

export const MOCK_OBLIGATIONS: Obligation[] = [
  {
    id: 'ob_1',
    title: 'Transmit Annual SOC2 Type II Audit Report',
    tag: 'SEC-04',
    clauseRef: 'Clause §9.4',
    description: 'Deliver updated independent audit verification to buyer security officer via secure escrow portal.',
    contractId: 'ctr_stripe_msa',
    contractName: 'Stripe Enterprise MSA',
    ownerName: 'Sarah J.',
    ownerAvatar: 'SJ',
    dueDate: '2025-10-25',
    dueDateFormatted: 'Tomorrow\nOct 25, 2025',
    status: 'In Progress',
    risk: 'Medium',
    category: 'Reporting',
    responsibleParty: 'Acme Corp (Us)',
    verificationStatus: 'Verified',
    section: 'Section 9.4 • Security Assurance',
    pageLine: 'Page 9, Line 14',
    noticeThreshold: 'Annual cadence',
    cadence: 'Annual'
  },
  {
    id: 'ob_2',
    title: 'Send 60-Day Notice of Non-Renewal',
    tag: 'CRITICAL CLAUSE',
    clauseRef: 'Section 14.2',
    description: 'Issue certified written non-renewal letter to prevent automatic 12-month contract lock-in.',
    contractId: 'ctr_salesforce_sa',
    contractName: 'Salesforce Service Agreement',
    ownerName: 'Alex Chen',
    ownerAvatar: 'AC',
    dueDate: '2025-10-22',
    dueDateFormatted: 'Oct 28, 2025',
    status: 'Overdue',
    isOverdue: true,
    overdueText: 'Overdue (2d ago)',
    risk: 'High',
    category: 'Compliance',
    responsibleParty: 'Acme Corp (Us)',
    verificationStatus: 'Verified',
    section: 'Section 14.2 • Term & Termination',
    pageLine: 'Page 14, Line 22',
    noticeThreshold: '60 Days Notice',
    cadence: 'Fixed'
  },
  {
    id: 'ob_3',
    title: 'Execute AWS Reserved Instance True-Up',
    clauseRef: 'Clause 4.1',
    description: 'Rebalance compute tier allocations against the quarterly minimum spend threshold commitment.',
    contractId: 'ctr_aws_cloud',
    contractName: 'AWS Cloud Addendum',
    ownerName: 'Marcus Vance',
    ownerAvatar: 'MV',
    dueDate: '2025-10-28',
    dueDateFormatted: 'Oct 28 (4d)\nOct 28, 2025',
    status: 'Pending',
    risk: 'Medium',
    category: 'Payment',
    responsibleParty: 'Acme Corp (Us)',
    verificationStatus: 'Verified',
    section: 'Clause 4.1 • Billing and True-Up',
    pageLine: 'Page 4, Line 8',
    noticeThreshold: 'Quarterly',
    cadence: 'Quarterly'
  },
  {
    id: 'ob_4',
    title: 'GDPR Data Processing Subprocessor Update',
    tag: 'DPA SECTION 9',
    clauseRef: 'DPA Section 9',
    description: 'Publish 30-day notice to customers before onboarding European database replica service providers.',
    contractId: 'ctr_datadog_dpa',
    contractName: 'HubSpot DPA',
    ownerName: 'Elena Rostova',
    ownerAvatar: 'ER',
    dueDate: '2025-11-02',
    dueDateFormatted: 'Nov 02\nNov 02, 2025',
    status: 'In Progress',
    risk: 'Low',
    category: 'Compliance',
    responsibleParty: 'Acme Corp (Us)',
    verificationStatus: 'Verified',
    section: 'Section 9 • Sub-processors',
    pageLine: 'Page 6, Line 19',
    noticeThreshold: '30 Days Notice',
    cadence: 'Ad-hoc'
  },
  {
    id: 'ob_5',
    title: 'Quarterly Penetration Test Delivery',
    clauseRef: 'Clause §11.3',
    description: 'Furnish redacted executive penetration test summary to enterprise audit committee.',
    contractId: 'ctr_datadog_dpa',
    contractName: 'Datadog Security Rider',
    ownerName: 'Sarah J.',
    ownerAvatar: 'SJ',
    dueDate: '2025-11-15',
    dueDateFormatted: 'Nov 15\nNov 15, 2025',
    status: 'Pending',
    risk: 'Low',
    category: 'Inspection',
    responsibleParty: 'Mutual',
    verificationStatus: 'Verified',
    section: 'Clause 11.3 • Security Verification',
    pageLine: 'Page 12, Line 5',
    noticeThreshold: 'Quarterly',
    cadence: 'Quarterly'
  },
  {
    id: 'ob_6',
    title: 'Certificate of Insurance (COI) Renewal',
    clauseRef: 'Clause 8.1',
    description: 'Confirm $5M general liability and cybersecurity policy extension with Marsh Brokerage.',
    contractId: 'ctr_cbre',
    contractName: 'CBRE Commercial Lease',
    ownerName: 'Alex Chen',
    ownerAvatar: 'AC',
    dueDate: '2025-10-18',
    dueDateFormatted: 'Completed\nOct 18, 2025',
    status: 'Completed',
    risk: 'Low',
    category: 'Compliance',
    responsibleParty: 'Acme Corp (Us)',
    verificationStatus: 'Verified',
    section: 'Clause 8.1 • Insurance Obligations',
    pageLine: 'Page 7, Line 30',
    noticeThreshold: 'Annual',
    cadence: 'Annual'
  },
  {
    id: 'ob_7',
    title: 'Review SLAs & Penalty Credits for Q3',
    clauseRef: 'Appendix B',
    description: 'Cross-examine incident reports against 99.95% uptime guarantees; calculate potential billing rebate.',
    contractId: 'ctr_snowflake_so',
    contractName: 'Snowflake Master Agreement',
    ownerName: 'Elena Rostova',
    ownerAvatar: 'ER',
    dueDate: '2025-10-14',
    dueDateFormatted: 'Completed\nOct 14, 2025',
    status: 'Completed',
    risk: 'Low',
    category: 'SLA',
    responsibleParty: 'Mutual',
    verificationStatus: 'Verified',
    section: 'Appendix B • Service Level Agreement',
    pageLine: 'Page 18, Line 12',
    noticeThreshold: 'End of Quarter',
    cadence: 'Quarterly'
  }
];

export const MOCK_ANALYSIS_OBLIGATIONS: Obligation[] = [
  {
    id: 'ana_1',
    title: 'Deliver Annual SOC2 Type II Audit Report',
    clauseRef: 'Clause 9.4',
    description: 'Must provide independent third-party audit report within 30 days of release.',
    contractId: 'ctr_stripe_msa',
    contractName: 'Stripe Enterprise Master Services Agreement (2025)',
    ownerName: 'Legal Operations',
    dueDate: '2025-12-15',
    dueDateFormatted: 'Annual (Dec 15, 2025)',
    status: 'Pending',
    risk: 'Medium',
    category: 'Reporting',
    responsibleParty: 'Acme Corp (Us)',
    verificationStatus: 'Verified',
    section: 'Section 9.4 • Security Assurance',
    pageLine: 'Page 9, Line 18',
    noticeThreshold: '30 Days Post-Release',
    cadence: 'Annual'
  },
  {
    id: 'ana_2',
    title: 'Written Notice of Material Service Interruption',
    clauseRef: 'Clause 7.2',
    description: 'Notify account rep within 4 hours of Sev 1 downtime event with root cause estimation.',
    contractId: 'ctr_stripe_msa',
    contractName: 'Stripe Enterprise Master Services Agreement (2025)',
    ownerName: 'Platform Ops',
    dueDate: '2025-10-25',
    dueDateFormatted: 'Within 4h of incident',
    status: 'In Progress',
    risk: 'High',
    category: 'SLA',
    responsibleParty: 'Acme Corp (Us)',
    verificationStatus: 'Verified',
    section: 'Section 7.2 • Incident Reporting',
    pageLine: 'Page 8, Line 4',
    noticeThreshold: '4 Hours',
    cadence: 'Trigger-based'
  },
  {
    id: 'ana_3',
    title: 'Automatic Renewal Termination Notice',
    clauseRef: 'Section 14.5',
    description: 'Send written non-renewal notice at least 60 days prior to expiry to terminate contract.',
    contractId: 'ctr_stripe_msa',
    contractName: 'Stripe Enterprise Master Services Agreement (2025)',
    ownerName: 'Legal Operations (Sarah J.)',
    dueDate: '2025-10-28',
    dueDateFormatted: 'Oct 28, 2025 (Fixed)',
    status: 'Pending',
    risk: 'High',
    category: 'Compliance',
    responsibleParty: 'Mutual',
    verificationStatus: 'Verified',
    section: 'Section 14.5 • Term & Termination',
    pageLine: 'Page 14, Line 22',
    noticeThreshold: '60 Days',
    cadence: 'Recurring'
  },
  {
    id: 'ana_4',
    title: 'Quarterly Data Purge & Compliance Attestation',
    clauseRef: 'Clause 12.1',
    description: 'Permanently delete inactive customer telemetry older than 90 days and submit certification.',
    contractId: 'ctr_stripe_msa',
    contractName: 'Stripe Enterprise Master Services Agreement (2025)',
    ownerName: 'Data Security',
    dueDate: '2025-11-30',
    dueDateFormatted: 'Quarterly (Nov 30, 2025)',
    status: 'Pending',
    risk: 'Medium',
    category: 'Compliance',
    responsibleParty: 'Acme Corp (Us)',
    verificationStatus: 'Verified',
    section: 'Clause 12.1 • Data Retention',
    pageLine: 'Page 13, Line 9',
    noticeThreshold: 'Quarterly',
    cadence: 'Quarterly'
  },
  {
    id: 'ana_5',
    title: 'Mutual Indemnification Claim Notification',
    tag: 'REVIEW',
    clauseRef: 'Clause 16.3',
    description: 'Conditional: Notice within 15 days upon receipt of any third-party patent or copyright assertion.',
    contractId: 'ctr_stripe_msa',
    contractName: 'Stripe Enterprise Master Services Agreement (2025)',
    ownerName: 'General Counsel',
    dueDate: '2025-11-10',
    dueDateFormatted: '15 days post-claim',
    status: 'Pending',
    risk: 'High',
    category: 'Compliance',
    responsibleParty: 'Counterparty (Stripe)',
    verificationStatus: 'Ambiguous',
    section: 'Clause 16.3 • Indemnity Procedure',
    pageLine: 'Page 17, Line 3',
    noticeThreshold: '15 Days',
    cadence: 'Conditional'
  }
];

export const MOCK_APPROVALS: ApprovalItem[] = [
  {
    id: 'app_1',
    title: 'Contract Termination Notice',
    riskLevel: 'HIGH RISK',
    riskDotColor: 'red',
    dueDateTag: 'Oct 28, 2025 (4 days left)',
    contractRef: 'Salesforce Service Agreement',
    clauseRef: 'Section 14.2 (Non-Renewal)',
    description: 'Send formal electronic written non-renewal notice to Salesforce legal department (legal@salesforce.com) to prevent automatic 12-month contract renewal totaling $48,000.',
    contractualBasisQuote: '“Failure to provide written notice sixty (60) calendar days prior to renewal shall result in automatic extension at standard list rates.”',
    basisMatchPercent: '99.4% Match',
    actions: [
      'Generates pre-filled notice letter from legal template (ID: TPL-NOT-09)',
      'Logs certified dispatch record in Activity Log with SHA-256 transmission hash'
    ],
    primaryButtonLabel: 'Approve & Dispatch Notice',
    secondaryButtonLabel: 'Edit Draft',
    thirdButtonLabel: 'Reject',
    status: 'Pending'
  },
  {
    id: 'app_2',
    title: 'Annual SOC2 Audit Disclosure',
    riskLevel: 'MEDIUM RISK',
    riskDotColor: 'amber',
    dueDateTag: 'Dec 15, 2025',
    contractRef: 'Stripe Enterprise MSA',
    clauseRef: 'Clause 9.4 (Security Assurance)',
    description: 'Transmit latest 2025 SOC2 Type II executive audit summary to Stripe Compliance Portal via secure enterprise upload connector.',
    contractualBasisQuote: '“Vendor shall furnish customer upon annual written request an updated SOC 2 Type II report.”',
    basisMatchPercent: '98.1% Match',
    actions: [
      'Encrypted transit via certified compliance API',
      'Requires team lead signoff'
    ],
    primaryButtonLabel: 'Approve & Transmit',
    secondaryButtonLabel: 'Assign to Security Team',
    thirdButtonLabel: 'Reject',
    status: 'Pending'
  },
  {
    id: 'app_3',
    title: 'Calendar Sync & Reminder Automation',
    riskLevel: 'LOW RISK',
    riskDotColor: 'blue',
    dueDateTag: 'Quarterly Cadence',
    contractRef: 'Snowflake Service Order',
    clauseRef: 'Appendix B (Capacity True-Up)',
    description: 'Schedule recurring calendar milestone for finance team to audit compute credits 10 days before quarterly billing reset.',
    contractualBasisQuote: '“Reconciliation shall occur within ten (10) business days following the calendar quarter end.”',
    basisMatchPercent: '96.8% Match',
    actions: [
      'Schedules recurring reminder for Finance team lead'
    ],
    primaryButtonLabel: 'Approve Action',
    secondaryButtonLabel: 'Dismiss',
    status: 'Pending'
  }
];

export const MOCK_ACTIVITY_LOGS: ActivityEvent[] = [
  {
    id: 'act_101',
    timestamp: 'Today at 04:18 PM',
    userName: 'Ayush Sharma',
    userRole: 'Admin',
    action: 'Approved SLA credit claim',
    target: 'AWS Cloud Addendum §4.1',
    hash: 'a7f3e8...c901',
    category: 'Approval'
  },
  {
    id: 'act_102',
    timestamp: 'Oct 21, 2025 11:32 AM',
    userName: 'Alex Chen',
    userRole: 'Member',
    action: 'Signed & Archived Addendum',
    target: 'Datadog DPA Addendum',
    hash: '3d91b4...e28f',
    category: 'System'
  },
  {
    id: 'act_103',
    timestamp: 'Oct 20, 2025 03:15 PM',
    userName: 'System Parser',
    userRole: 'Service',
    action: 'Contract Extraction Complete (6 obligations)',
    target: 'Stripe Enterprise MSA (2025)',
    hash: '8f0a21...bb76',
    category: 'Extraction'
  },
  {
    id: 'act_104',
    timestamp: 'Oct 19, 2025 09:00 AM',
    userName: 'Marcus Vance',
    userRole: 'Member',
    action: 'Assigned True-Up review task',
    target: 'AWS Reserved Instance True-Up',
    hash: '12e98a...44cd',
    category: 'Approval'
  },
  {
    id: 'act_105',
    timestamp: 'Oct 18, 2025 05:45 PM',
    userName: 'Elena Rostova',
    userRole: 'Member',
    action: 'Completed COI renewal verification',
    target: 'CBRE Commercial Lease §8.1',
    hash: '66bc33...aa19',
    category: 'Approval'
  }
];

export const CATEGORY_CHART_DATA = [
  { category: 'Payment', all: 5, approved: 4, pending: 1 },
  { category: 'Delivery', all: 3, approved: 3, pending: 0 },
  { category: 'Inspection', all: 4, approved: 2, pending: 2 },
  { category: 'Compliance', all: 8, approved: 5, pending: 3 },
  { category: 'Reporting', all: 5, approved: 3, pending: 2 },
  { category: 'SLA', all: 3, approved: 1, pending: 2 }
];

export const RISK_DISTRIBUTION_DATA = [
  { level: 'High', count: 3, percent: 11, color: 'var(--color-danger)' },
  { level: 'Medium', count: 9, percent: 32, color: 'var(--color-warning)' },
  { level: 'Low', count: 16, percent: 57, color: 'var(--color-success)' }
];
