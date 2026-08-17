import type {
  AddReportUpdateInput,
  AgendaEvent,
  AgendaView,
  AnnouncementPriority,
  AuthState,
  CameraAccessLevel,
  CameraStatus,
  CashTransactionType,
  CashVisibility,
  CommunitySummary,
  CreateAgendaEventInput,
  CreateAnnouncementInput,
  CreateCameraInput,
  CreateCashTransactionInput,
  CreateCommunityInput,
  CreateDuesTypeInput,
  CreateFacilityBookingInput,
  CreateHouseInput,
  CreateIncidentInput,
  CreateLetterRequestInput,
  CreatePackageInput,
  CreatePaymentInput,
  CreateReportInput,
  CreateRtInput,
  CreateVehicleInput,
  CreateVisitorInput,
  CreateWalkInVisitorInput,
  CurrentContext,
  EmergencyKind,
  EmergencyStatus,
  FacilityBookingStatus,
  GenerateInvoicesInput,
  HouseholdRelationship,
  IncidentCategory,
  IncidentStatus,
  InvoiceStatus,
  LetterRequestStatus,
  NotificationPriority,
  OccupancyStatus,
  OnboardingCommunityOption,
  PackageStatus,
  PatrolSessionStatus,
  PaymentStatus,
  RegisterPushTokenInput,
  ReportCategory,
  ReportStatus,
  ResidentStatus,
  SecurityShiftStatus,
  UpdateAgendaEventInput,
  UpdateCameraInput,
  UpdateCommunityInput,
  UpdateHouseInput,
  UpdateIncidentInput,
  UpdateProfileInput,
  UpdateRtInput,
  UpdateVehicleInput,
  VehicleStatus,
  VehicleType,
  VisitorStatus,
} from "@komplekku/contracts";

export interface OtpRecord {
  id: string;
  phoneE164: string;
  codeDigest: string;
  attemptCount: number;
  maxAttempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  invalidatedAt: Date | null;
}

export interface SessionCreationResult {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface AuthSessionRecord {
  sessionId: string;
  userId: string;
  currentCommunityId: string | null;
  currentHouseholdId: string | null;
  permissions: string[];
  /**
   * Non-null only when the actor's admin capability is limited to one RT
   * (an RT_ADMIN/Ketua RT with an assigned RT). `null` means unrestricted
   * within the community — SUPER_ADMIN and COMMUNITY_ADMIN (Ketua RW) alike.
   * See lib/rt-scope.ts for how this is computed.
   */
  rtScopeId: string | null;
}

export interface RequestAuditContext {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface MeRecord {
  id: string;
  displayName: string | null;
  phoneE164: string;
  allowResidentContact: boolean;
  authState: AuthState;
  residentStatus: ResidentStatus | null;
  currentContext: CurrentContext | null;
  permissions: string[];
}

export interface ProfileRecord {
  displayName: string | null;
  allowResidentContact: boolean;
}

export type UpdateProfileResult =
  { outcome: "OK"; profile: ProfileRecord } | { outcome: "NOT_FOUND" };

export interface DirectoryContactRecord {
  displayName: string;
  phoneE164: string;
}

export interface DirectoryMemberRecord {
  residentId: string;
  displayName: string;
  relationship: HouseholdRelationship;
  status: "ACTIVE";
  linkedAccount: boolean;
  contactPhoneE164: string | null;
}

export interface DirectoryRecord {
  householdId: string;
  houseCode: string;
  householdDisplayName: string;
  occupancyStatus: OccupancyStatus;
  contacts: DirectoryContactRecord[];
  members: DirectoryMemberRecord[];
}

export interface CurrentHouseholdMemberRecord {
  residentId: string;
  userId: string;
  displayName: string;
  relationship: HouseholdRelationship;
  linkedAccount: boolean;
  phoneE164: string | null;
  allowResidentContact: boolean;
}

export interface CurrentHouseholdRecord {
  id: string;
  displayName: string;
  occupancyStatus: OccupancyStatus;
  house: CurrentContext["household"]["house"];
  members: CurrentHouseholdMemberRecord[];
}

export type AddHouseholdMemberResult =
  | { outcome: "OK"; member: CurrentHouseholdMemberRecord }
  | { outcome: "NOT_FOUND" | "ALREADY_MEMBER" | "ALREADY_RESIDENT_ELSEWHERE" };

export type RemoveHouseholdMemberResult =
  { outcome: "REMOVED"; residentId: string } | { outcome: "NOT_FOUND" | "CANNOT_REMOVE_PRIMARY" };

export interface VehicleRecord {
  id: string;
  type: VehicleType;
  plate: string | null;
  brand: string;
  model: string | null;
  color: string;
  ownerLabel: string;
  ownerResidentId: string | null;
  status: VehicleStatus;
  houseCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleMutationResult =
  | { outcome: "OK"; vehicle: VehicleRecord }
  | {
      outcome: "NOT_FOUND" | "OWNER_NOT_FOUND" | "PLATE_CONFLICT" | "PLATE_REQUIRED";
    };

export type ArchiveVehicleResult =
  { outcome: "ARCHIVED"; vehicleId: string; archivedAt: Date } | { outcome: "NOT_FOUND" };

export interface VehicleSearchRecord {
  vehicleId: string;
  type: VehicleType;
  plate: string;
  brand: string;
  model: string | null;
  color: string;
  ownerLabel: string;
  houseCode: string;
  status: VehicleStatus;
}

export interface CurrentCommunityRecord {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  address: string | null;
  rwLabel: string | null;
  contactPhone: string | null;
  emergencyContactPhone: string | null;
}

export interface CommunityAdminRecord {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  rwLabel: string | null;
  timezone: string;
  registrationOpen: boolean;
}

export type UpdateCommunityResult =
  { outcome: "OK"; community: CommunityAdminRecord } | { outcome: "NOT_FOUND" };

export type CreateCommunityResult =
  | { outcome: "OK"; community: CommunityAdminRecord }
  | { outcome: "SLUG_CONFLICT" };

export interface RtRecord {
  id: string;
  code: string;
  name: string;
}

export type CreateRtResult =
  { outcome: "OK"; rt: RtRecord } | { outcome: "CODE_CONFLICT" };

export type UpdateRtResult =
  { outcome: "OK"; rt: RtRecord } | { outcome: "NOT_FOUND" | "CODE_CONFLICT" };

export interface HouseRecord {
  id: string;
  code: string;
  block: string;
  number: string;
  rtId: string | null;
  rtCode: string | null;
  occupancyStatus: OccupancyStatus;
  addressLabel: string;
  hasHousehold: boolean;
  createdAt: Date;
}

export type CreateHouseResult =
  | { outcome: "OK"; house: HouseRecord }
  | { outcome: "CODE_CONFLICT" | "RT_NOT_FOUND" };

export type UpdateHouseResult =
  | { outcome: "OK"; house: HouseRecord }
  | { outcome: "NOT_FOUND" | "RT_NOT_FOUND" };

export interface AnnouncementRecord {
  id: string;
  title: string;
  summary: string;
  body: string;
  priority: AnnouncementPriority;
  publishedAt: Date;
  isRead: boolean;
}

export interface HomeRecord {
  viewerName: string;
  community: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  household: CurrentContext["household"];
  latestAnnouncements: AnnouncementRecord[];
  unreadAnnouncementCount: number;
}

export type AgendaRecord = AgendaEvent;

export type CursorPageResult<T> =
  | {
      outcome: "OK";
      items: T[];
      total: number;
      nextCursor: string | null;
    }
  | { outcome: "INVALID_CURSOR" };

export type AgendaMutationResult =
  | { outcome: "OK"; event: AgendaRecord }
  | { outcome: "NOT_FOUND" | "ARCHIVED" | "INVALID_TIME_RANGE" };

export type ArchiveAgendaResult =
  { outcome: "ARCHIVED"; eventId: string; archivedAt: Date } | { outcome: "NOT_FOUND" };

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  entityType: string;
  entityId: string | null;
  priority: NotificationPriority;
}

export type NotificationReadResult =
  { outcome: "READ"; notificationId: string; readAt: Date } | { outcome: "NOT_FOUND" };

export interface ResidencyRequestRecord {
  id: string;
  userId: string;
  phoneE164: string;
  fullName: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  relationship: HouseholdRelationship;
  submittedAt: Date;
  community: CommunitySummary;
  house: CurrentContext["household"]["house"];
}

export type CreateResidencyRequestResult =
  | { outcome: "CREATED"; request: ResidencyRequestRecord }
  | {
      outcome:
        | "COMMUNITY_NOT_FOUND"
        | "HOUSE_NOT_FOUND"
        | "PENDING_EXISTS"
        | "ALREADY_ACTIVE"
        | "ACCOUNT_RESTRICTED";
    };

export type ReviewResidencyRequestResult =
  | {
      outcome: "APPROVED";
      requestId: string;
      householdId: string;
      reviewedAt: Date;
    }
  | {
      outcome: "REJECTED";
      requestId: string;
      reviewedAt: Date;
    }
  | { outcome: "NOT_FOUND" | "NOT_PENDING" | "CONFIGURATION_ERROR" };

export interface CameraRecord {
  id: string;
  name: string;
  location: string | null;
  accessLevel: CameraAccessLevel;
  status: CameraStatus;
  lastOnlineAt: Date | null;
}

export type CameraMutationResult =
  { outcome: "OK"; camera: CameraRecord } | { outcome: "NOT_FOUND" };

export type StreamTicketResult =
  | {
      outcome: "OK";
      cameraId: string;
      mode: "mock" | "rtsp";
      status: CameraStatus;
      ticket: string | null;
      expiresAt: Date | null;
      viewerName: string;
    }
  | { outcome: "NOT_FOUND" | "FORBIDDEN" };

export interface EmergencyRecord {
  id: string;
  kind: EmergencyKind;
  status: EmergencyStatus;
  houseLabel: string;
  senderName: string;
  note: string | null;
  sentAt: Date;
  acknowledgedAt: Date | null;
  respondingAt: Date | null;
  resolvedAt: Date | null;
}

export type EmergencyTransitionResult =
  { outcome: "OK"; emergency: EmergencyRecord } | { outcome: "NOT_FOUND" | "INVALID_TRANSITION" };

export interface VisitorRecord {
  id: string;
  guestName: string;
  guestPhone: string | null;
  visitDate: string;
  expectedTime: string | null;
  vehicleInfo: string | null;
  plate: string | null;
  purpose: string | null;
  notes: string | null;
  status: VisitorStatus;
  isWalkIn: boolean;
  houseCode: string;
  householdDisplayName: string;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  createdAt: Date;
  qrToken?: string;
}

export type CreateVisitorResult =
  | { outcome: "OK"; visitor: VisitorRecord }
  | { outcome: "HOUSEHOLD_NOT_FOUND" | "HOUSE_NOT_FOUND" };

export type VisitorCheckResult =
  { outcome: "OK"; visitor: VisitorRecord } | { outcome: "NOT_FOUND" | "INVALID_TRANSITION" };

export interface PackageRecord {
  id: string;
  recipientName: string;
  courier: string;
  trackingNumber: string | null;
  status: PackageStatus;
  houseCode: string;
  householdDisplayName: string;
  receivedAt: Date;
  collectedAt: Date | null;
  collectedByName: string | null;
}

export type CreatePackageResult =
  { outcome: "OK"; package: PackageRecord } | { outcome: "HOUSE_NOT_FOUND" };

export type CollectPackageResult =
  { outcome: "OK"; package: PackageRecord } | { outcome: "NOT_FOUND" | "ALREADY_COLLECTED" };

export interface SecurityShiftRecord {
  id: string;
  officerName: string;
  status: SecurityShiftStatus;
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
}

export interface PatrolCheckpointRecord {
  id: string;
  name: string;
  displayOrder: number;
}

export interface PatrolScanRecord {
  checkpointId: string;
  checkpointName: string;
  scannedAt: Date;
  note: string | null;
}

export interface PatrolSessionRecord {
  id: string;
  officerName: string;
  status: PatrolSessionStatus;
  startedAt: Date;
  endedAt: Date | null;
  totalCheckpoints: number;
  scans: PatrolScanRecord[];
}

export type ScanCheckpointResult =
  | { outcome: "OK"; session: PatrolSessionRecord }
  | { outcome: "NO_ACTIVE_SESSION" | "CHECKPOINT_NOT_FOUND" | "ALREADY_SCANNED" };

export interface IncidentRecord {
  id: string;
  category: IncidentCategory;
  title: string;
  description: string;
  location: string | null;
  occurredAt: Date;
  peopleInvolved: string | null;
  actionTaken: string | null;
  status: IncidentStatus;
  reporterName: string;
  createdAt: Date;
}

export type UpdateIncidentResult =
  { outcome: "OK"; incident: IncidentRecord } | { outcome: "NOT_FOUND" };

export interface SecurityDashboardRecord {
  activeShift: { id: string; startedAt: Date } | null;
  activeVisitorCount: number;
  pendingPackageCount: number;
  camerasOnline: number;
  camerasTotal: number;
  openEmergencyCount: number;
  activePatrolSession: {
    id: string;
    startedAt: Date;
    completedCheckpoints: number;
    totalCheckpoints: number;
  } | null;
}

export interface ReportUpdateRecord {
  id: string;
  status: ReportStatus;
  note: string | null;
  actorName: string | null;
  createdAt: Date;
}

export interface ReportRecord {
  id: string;
  category: ReportCategory;
  description: string;
  location: string | null;
  status: ReportStatus;
  photos: string[];
  reporterName: string;
  houseCode: string;
  householdDisplayName: string;
  createdAt: Date;
  updates: ReportUpdateRecord[];
}

export type CreateReportResult =
  { outcome: "OK"; report: ReportRecord } | { outcome: "HOUSEHOLD_CONTEXT_REQUIRED" };

export type AddReportUpdateResult =
  { outcome: "OK"; report: ReportRecord } | { outcome: "NOT_FOUND" };

export interface LetterTypeRecord {
  id: string;
  name: string;
  description: string | null;
}

export interface LetterRequestRecord {
  id: string;
  letterTypeId: string;
  letterTypeName: string;
  purpose: string;
  status: LetterRequestStatus;
  requesterName: string;
  houseCode: string;
  householdDisplayName: string;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  readyAt: Date | null;
  createdAt: Date;
}

export type CreateLetterRequestResult =
  | { outcome: "OK"; request: LetterRequestRecord }
  | { outcome: "LETTER_TYPE_NOT_FOUND" | "HOUSEHOLD_CONTEXT_REQUIRED" };

export type LetterRequestTransitionResult =
  { outcome: "OK"; request: LetterRequestRecord } | { outcome: "NOT_FOUND" | "INVALID_TRANSITION" };

export interface FacilityRecord {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  capacity: number | null;
  rules: string | null;
}

export interface FacilityBookingRecord {
  id: string;
  facilityId: string;
  facilityName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: FacilityBookingStatus;
  bookedByName: string;
  houseCode: string;
  householdDisplayName: string;
  createdAt: Date;
}

export type CreateFacilityBookingResult =
  | { outcome: "OK"; booking: FacilityBookingRecord }
  | { outcome: "FACILITY_NOT_FOUND" | "HOUSEHOLD_CONTEXT_REQUIRED" | "SLOT_UNAVAILABLE" };

export type CancelFacilityBookingResult =
  | { outcome: "OK"; booking: FacilityBookingRecord }
  | { outcome: "NOT_FOUND" | "ALREADY_CANCELLED" };

export interface DuesTypeRecord {
  id: string;
  name: string;
  description: string | null;
  defaultAmount: number;
  isActive: boolean;
}

export interface InvoiceRecord {
  id: string;
  duesTypeId: string;
  duesTypeName: string;
  period: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  houseCode: string;
  householdDisplayName: string;
  waivedReason: string | null;
  paidAt: Date | null;
  receiptNumber: string | null;
  createdAt: Date;
}

export type WaiveInvoiceResult =
  { outcome: "OK"; invoice: InvoiceRecord } | { outcome: "NOT_FOUND" | "INVALID_TRANSITION" };

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  duesTypeName: string;
  period: string;
  amount: number;
  paidAt: string;
  note: string;
  status: PaymentStatus;
  submittedByName: string;
  houseCode: string;
  householdDisplayName: string;
  verifiedByName: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  receiptNumber: string | null;
  createdAt: Date;
}

export type CreatePaymentResult =
  | { outcome: "OK"; payment: PaymentRecord }
  | { outcome: "INVOICE_NOT_FOUND" | "INVALID_INVOICE_STATE" };

export type PaymentTransitionResult =
  { outcome: "OK"; payment: PaymentRecord } | { outcome: "NOT_FOUND" | "INVALID_TRANSITION" };

export interface CashTransactionRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: CashTransactionType;
  visibility: CashVisibility;
  recordedByName: string;
  createdAt: Date;
}

export interface CashLedgerRecord {
  items: CashTransactionRecord[];
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
}

export interface FinanceDashboardRecord {
  outstandingInvoiceCount: number;
  outstandingInvoiceAmount: number;
  pendingVerificationCount: number;
  collectedThisMonth: number;
  cashBalance: number;
}

export interface AuditInput {
  communityId?: string | null;
  actorUserId?: string | null;
  sessionId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface RequestAuditContext {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface RoleSummary {
  id: string;
  code: string;
  name: string;
}

export interface CommunityMemberRecord {
  residentId: string;
  userId: string;
  displayName: string;
  phoneE164: string;
  houseCode: string | null;
  rtCode: string | null;
  roles: RoleSummary[];
}

export type SetMemberRoleResult =
  | { outcome: "OK"; residentId: string; roles: RoleSummary[] }
  | {
      outcome:
        | "NOT_FOUND"
        | "ROLE_NOT_FOUND"
        | "CANNOT_CHANGE_SELF"
        | "RT_NOT_FOUND"
        | "RT_REQUIRED"
        | "FORBIDDEN";
    };

export interface ForumChannelRecord {
  id: string;
  rtId: string | null;
  name: string;
}

export interface ForumMessageRecord {
  id: string;
  channelId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  imageUrls: string[];
  createdAt: Date;
}

export type CreateForumMessageResult =
  | { outcome: "OK"; message: ForumMessageRecord; recipientUserIds: string[] }
  | { outcome: "CHANNEL_NOT_FOUND" };

export type DeleteForumMessageResult =
  | { outcome: "DELETED"; messageId: string; channelId: string }
  | { outcome: "NOT_FOUND" };

export interface AppRepository {
  healthCheck(): Promise<void>;
  close(): Promise<void>;
  replaceOtpChallenge(input: {
    id: string;
    phoneE164: string;
    codeDigest: string;
    maxAttempts: number;
    expiresAt: Date;
    now: Date;
  }): Promise<OtpRecord>;
  findOtp(id: string): Promise<OtpRecord | null>;
  incrementOtpFailure(id: string, now: Date): Promise<void>;
  consumeOtpAndCreateSession(input: {
    otpId: string;
    phoneE164: string;
    tokenDigest: string;
    sessionExpiresAt: Date;
    now: Date;
  }): Promise<SessionCreationResult | null>;
  findAuthSession(tokenDigest: string, now: Date): Promise<AuthSessionRecord | null>;
  revokeSession(sessionId: string, now: Date): Promise<void>;
  getMe(auth: AuthSessionRecord): Promise<MeRecord | null>;
  updateOwnProfile(input: {
    auth: AuthSessionRecord;
    changes: UpdateProfileInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateProfileResult>;
  getCurrentCommunity(auth: AuthSessionRecord): Promise<CurrentCommunityRecord | null>;
  updateCommunity(input: {
    auth: AuthSessionRecord;
    changes: UpdateCommunityInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateCommunityResult>;
  createCommunity(input: {
    auth: AuthSessionRecord;
    community: CreateCommunityInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateCommunityResult>;
  listCommunitiesForPlatformAdmin(auth: AuthSessionRecord): Promise<CommunityAdminRecord[]>;
  listRts(auth: AuthSessionRecord): Promise<RtRecord[]>;
  createRt(input: {
    auth: AuthSessionRecord;
    rt: CreateRtInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateRtResult>;
  updateRt(input: {
    auth: AuthSessionRecord;
    rtId: string;
    changes: UpdateRtInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateRtResult>;
  listDirectory(input: {
    auth: AuthSessionRecord;
    search?: string;
    cursor?: string;
    limit: number;
    includeAdminDetails: boolean;
  }): Promise<CursorPageResult<DirectoryRecord>>;
  getCurrentHousehold(auth: AuthSessionRecord): Promise<CurrentHouseholdRecord | null>;
  addHouseholdMember(input: {
    auth: AuthSessionRecord;
    fullName: string;
    phoneE164: string;
    relationship: HouseholdRelationship;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<AddHouseholdMemberResult>;
  removeHouseholdMember(input: {
    auth: AuthSessionRecord;
    residentId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<RemoveHouseholdMemberResult>;
  listRegistrationCommunities(): Promise<OnboardingCommunityOption[]>;
  listRoles(): Promise<RoleSummary[]>;
  listCommunityMembers(auth: AuthSessionRecord): Promise<CommunityMemberRecord[]>;
  setMemberRole(input: {
    auth: AuthSessionRecord;
    residentId: string;
    roleCode: string;
    rtId?: string | null;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<SetMemberRoleResult>;
  createResidencyRequest(input: {
    auth: AuthSessionRecord;
    communityId: string;
    rtId: string;
    houseCode: string;
    fullName: string;
    relationship: HouseholdRelationship;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateResidencyRequestResult>;
  listPendingResidencyRequests(
    auth: AuthSessionRecord,
    limit: number,
  ): Promise<{ items: ResidencyRequestRecord[]; total: number }>;
  approveResidencyRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ReviewResidencyRequestResult>;
  rejectResidencyRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    reason: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ReviewResidencyRequestResult>;
  getHome(auth: AuthSessionRecord, now: Date): Promise<HomeRecord | null>;
  listAnnouncements(
    auth: AuthSessionRecord,
    now: Date,
    limit: number,
  ): Promise<{ items: AnnouncementRecord[]; total: number }>;
  getAnnouncement(
    auth: AuthSessionRecord,
    id: string,
    now: Date,
  ): Promise<AnnouncementRecord | null>;
  markAnnouncementRead(auth: AuthSessionRecord, id: string, now: Date): Promise<Date | null>;
  createAnnouncement(input: {
    auth: AuthSessionRecord;
    announcement: CreateAnnouncementInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<AnnouncementRecord>;
  listAgenda(input: {
    auth: AuthSessionRecord;
    now: Date;
    view: AgendaView;
    cursor?: string;
    limit: number;
  }): Promise<CursorPageResult<AgendaRecord>>;
  getAgendaEvent(auth: AuthSessionRecord, id: string): Promise<AgendaRecord | null>;
  createAgendaEvent(input: {
    auth: AuthSessionRecord;
    event: CreateAgendaEventInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<AgendaMutationResult>;
  updateAgendaEvent(input: {
    auth: AuthSessionRecord;
    eventId: string;
    changes: UpdateAgendaEventInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<AgendaMutationResult>;
  archiveAgendaEvent(input: {
    auth: AuthSessionRecord;
    eventId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ArchiveAgendaResult>;
  listNotifications(input: {
    auth: AuthSessionRecord;
    cursor?: string;
    limit: number;
  }): Promise<CursorPageResult<NotificationRecord>>;
  getUnreadNotificationCount(auth: AuthSessionRecord): Promise<number>;
  markNotificationRead(input: {
    auth: AuthSessionRecord;
    notificationId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<NotificationReadResult>;
  markAllNotificationsRead(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<{ readAt: Date; updatedCount: number }>;
  registerPushToken(input: {
    auth: AuthSessionRecord;
    token: string;
    platform: string;
    now: Date;
  }): Promise<{ id: string; token: string }>;
  listCurrentHouseholdVehicles(auth: AuthSessionRecord): Promise<VehicleRecord[]>;
  createVehicle(input: {
    auth: AuthSessionRecord;
    vehicle: CreateVehicleInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<VehicleMutationResult>;
  updateVehicle(input: {
    auth: AuthSessionRecord;
    vehicleId: string;
    changes: UpdateVehicleInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<VehicleMutationResult>;
  archiveVehicle(input: {
    auth: AuthSessionRecord;
    vehicleId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ArchiveVehicleResult>;
  searchVehicleByPlate(auth: AuthSessionRecord, query: string): Promise<VehicleSearchRecord | null>;

  listCameras(auth: AuthSessionRecord): Promise<CameraRecord[]>;
  createCamera(input: {
    auth: AuthSessionRecord;
    camera: CreateCameraInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CameraRecord>;
  updateCamera(input: {
    auth: AuthSessionRecord;
    cameraId: string;
    changes: UpdateCameraInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CameraMutationResult>;
  issueStreamTicket(input: {
    auth: AuthSessionRecord;
    cameraId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<StreamTicketResult>;

  createEmergency(input: {
    auth: AuthSessionRecord;
    kind: EmergencyKind;
    note?: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<EmergencyRecord>;
  listEmergencies(auth: AuthSessionRecord, limit: number): Promise<EmergencyRecord[]>;
  acknowledgeEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<EmergencyTransitionResult>;
  respondToEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<EmergencyTransitionResult>;
  resolveEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<EmergencyTransitionResult>;

  createVisitor(input: {
    auth: AuthSessionRecord;
    visitor: CreateVisitorInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateVisitorResult>;
  createWalkInVisitor(input: {
    auth: AuthSessionRecord;
    visitor: CreateWalkInVisitorInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateVisitorResult>;
  listVisitors(input: { auth: AuthSessionRecord; limit: number }): Promise<VisitorRecord[]>;
  findVisitorByQrToken(auth: AuthSessionRecord, qrToken: string): Promise<VisitorRecord | null>;
  checkInVisitor(input: {
    auth: AuthSessionRecord;
    qrToken: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<VisitorCheckResult>;
  checkOutVisitor(input: {
    auth: AuthSessionRecord;
    visitorId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<VisitorCheckResult>;

  createPackage(input: {
    auth: AuthSessionRecord;
    package: CreatePackageInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreatePackageResult>;
  listPackages(input: { auth: AuthSessionRecord; limit: number }): Promise<PackageRecord[]>;
  collectPackage(input: {
    auth: AuthSessionRecord;
    packageId: string;
    collectedByName: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CollectPackageResult>;

  getActiveSecurityShift(auth: AuthSessionRecord): Promise<SecurityShiftRecord | null>;
  startSecurityShift(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<SecurityShiftRecord>;
  endSecurityShift(input: {
    auth: AuthSessionRecord;
    notes?: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<SecurityShiftRecord | null>;

  listPatrolCheckpoints(auth: AuthSessionRecord): Promise<PatrolCheckpointRecord[]>;
  getActivePatrolSession(auth: AuthSessionRecord): Promise<PatrolSessionRecord | null>;
  startPatrolSession(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<PatrolSessionRecord>;
  scanPatrolCheckpoint(input: {
    auth: AuthSessionRecord;
    qrToken: string;
    note?: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ScanCheckpointResult>;
  endPatrolSession(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<PatrolSessionRecord | null>;
  listPatrolHistory(auth: AuthSessionRecord, limit: number): Promise<PatrolSessionRecord[]>;

  createIncident(input: {
    auth: AuthSessionRecord;
    incident: CreateIncidentInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<IncidentRecord>;
  listIncidents(input: {
    auth: AuthSessionRecord;
    status?: IncidentStatus;
    limit: number;
  }): Promise<IncidentRecord[]>;
  getIncident(auth: AuthSessionRecord, id: string): Promise<IncidentRecord | null>;
  updateIncident(input: {
    auth: AuthSessionRecord;
    incidentId: string;
    changes: UpdateIncidentInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateIncidentResult>;

  getSecurityDashboard(auth: AuthSessionRecord, now: Date): Promise<SecurityDashboardRecord>;

  createReport(input: {
    auth: AuthSessionRecord;
    report: CreateReportInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateReportResult>;
  listReports(input: {
    auth: AuthSessionRecord;
    status?: ReportStatus;
    limit: number;
  }): Promise<ReportRecord[]>;
  getReport(auth: AuthSessionRecord, id: string): Promise<ReportRecord | null>;
  addReportUpdate(input: {
    auth: AuthSessionRecord;
    reportId: string;
    update: AddReportUpdateInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<AddReportUpdateResult>;

  listLetterTypes(auth: AuthSessionRecord): Promise<LetterTypeRecord[]>;
  createLetterRequest(input: {
    auth: AuthSessionRecord;
    request: CreateLetterRequestInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateLetterRequestResult>;
  listLetterRequests(input: {
    auth: AuthSessionRecord;
    status?: LetterRequestStatus;
    limit: number;
  }): Promise<LetterRequestRecord[]>;
  approveLetterRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<LetterRequestTransitionResult>;
  rejectLetterRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    reason: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<LetterRequestTransitionResult>;
  markLetterRequestReady(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<LetterRequestTransitionResult>;

  listFacilities(auth: AuthSessionRecord): Promise<FacilityRecord[]>;
  listFacilityBookings(input: {
    auth: AuthSessionRecord;
    facilityId?: string;
    date?: string;
    limit: number;
  }): Promise<FacilityBookingRecord[]>;
  createFacilityBooking(input: {
    auth: AuthSessionRecord;
    booking: CreateFacilityBookingInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateFacilityBookingResult>;
  cancelFacilityBooking(input: {
    auth: AuthSessionRecord;
    bookingId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CancelFacilityBookingResult>;

  listDuesTypes(auth: AuthSessionRecord): Promise<DuesTypeRecord[]>;
  createDuesType(input: {
    auth: AuthSessionRecord;
    duesType: CreateDuesTypeInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<DuesTypeRecord>;

  generateInvoices(input: {
    auth: AuthSessionRecord;
    generate: GenerateInvoicesInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<number>;
  listInvoices(input: {
    auth: AuthSessionRecord;
    status?: InvoiceStatus;
    limit: number;
  }): Promise<InvoiceRecord[]>;
  getInvoice(auth: AuthSessionRecord, id: string): Promise<InvoiceRecord | null>;
  waiveInvoice(input: {
    auth: AuthSessionRecord;
    invoiceId: string;
    reason: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<WaiveInvoiceResult>;

  createPayment(input: {
    auth: AuthSessionRecord;
    payment: CreatePaymentInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreatePaymentResult>;
  listPayments(input: {
    auth: AuthSessionRecord;
    status?: PaymentStatus;
    limit: number;
  }): Promise<PaymentRecord[]>;
  verifyPayment(input: {
    auth: AuthSessionRecord;
    paymentId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<PaymentTransitionResult>;
  rejectPayment(input: {
    auth: AuthSessionRecord;
    paymentId: string;
    reason: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<PaymentTransitionResult>;

  listCashTransactions(input: {
    auth: AuthSessionRecord;
    period?: string;
    limit: number;
  }): Promise<CashLedgerRecord>;
  createCashTransaction(input: {
    auth: AuthSessionRecord;
    transaction: CreateCashTransactionInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CashTransactionRecord>;

  getFinanceDashboard(auth: AuthSessionRecord, now: Date): Promise<FinanceDashboardRecord>;

  listHouses(auth: AuthSessionRecord): Promise<HouseRecord[]>;
  createHouse(input: {
    auth: AuthSessionRecord;
    house: CreateHouseInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateHouseResult>;
  updateHouse(input: {
    auth: AuthSessionRecord;
    houseId: string;
    changes: UpdateHouseInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateHouseResult>;

  updateProfile(input: {
    auth: AuthSessionRecord;
    profile: UpdateProfileInput;
  }): Promise<{ displayName: string | null; allowResidentContact: boolean }>;

  listForumChannels(auth: AuthSessionRecord): Promise<ForumChannelRecord[]>;
  listForumMessages(input: {
    auth: AuthSessionRecord;
    channelId: string;
    cursor?: string;
    limit: number;
  }): Promise<CursorPageResult<ForumMessageRecord>>;
  createForumMessage(input: {
    auth: AuthSessionRecord;
    channelId: string;
    body: string;
    imageUrls: string[];
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateForumMessageResult>;
  deleteForumMessage(input: {
    auth: AuthSessionRecord;
    messageId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<DeleteForumMessageResult>;

  recordAudit(input: AuditInput): Promise<void>;
}
