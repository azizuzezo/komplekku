import { randomUUID } from "node:crypto";

import { roleDefinitions, rolePermissionKeys } from "../../prisma/rbac-seed-data";
import { computeRtScopeId } from "../lib/rt-scope";

import type {
  AddReportUpdateInput,
  AgendaView,
  CameraAccessLevel,
  CameraStatus,
  CashTransactionType,
  CashVisibility,
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
  EmergencyKind,
  EmergencyStatus,
  FacilityBookingStatus,
  GenerateInvoicesInput,
  HouseholdRelationship,
  IncidentCategory,
  IncidentStatus,
  InvoiceStatus,
  LetterRequestStatus,
  OnboardingCommunityOption,
  PackageStatus,
  PatrolSessionStatus,
  PaymentStatus,
  ReportCategory,
  ReportStatus,
  ResidentStatus,
  SecurityShiftStatus,
  UpdateAgendaEventInput,
  UpdateAnnouncementInput,
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

import type {
  AddHouseholdMemberResult,
  AddReportUpdateResult,
  AgendaMutationResult,
  AgendaRecord,
  ArchiveAgendaResult,
  ArchiveVehicleResult,
  AnnouncementFilter,
  AnnouncementMutationResult,
  AnnouncementRecord,
  ArchiveAnnouncementResult,
  AppRepository,
  AuditInput,
  AuthSessionRecord,
  CameraMutationResult,
  CameraRecord,
  CancelFacilityBookingResult,
  CashLedgerRecord,
  CashTransactionRecord,
  CollectPackageResult,
  CommunityAdminRecord,
  CommunityMemberRecord,
  CreateCommunityResult,
  CreateFacilityBookingResult,
  CreateForumChannelResult,
  CreateForumMessageResult,
  CreateHouseResult,
  CreateLetterRequestResult,
  CreatePackageResult,
  CreatePaymentResult,
  CreateReportResult,
  CreateResidencyRequestResult,
  CreateRtResult,
  CreateVisitorResult,
  CurrentCommunityRecord,
  CurrentHouseholdRecord,
  CursorPageResult,
  DeleteForumMessageResult,
  DirectoryRecord,
  DuesTypeRecord,
  EmergencyRecord,
  EmergencyTransitionResult,
  FacilityBookingRecord,
  FacilityRecord,
  FinanceDashboardRecord,
  ForumChannelKind,
  ForumChannelMemberRecord,
  ForumChannelRecord,
  ForumDeleteResult,
  ForumLikeResult,
  ForumPostCategory,
  ForumPostDetailRecord,
  ForumPostMutationResult,
  ForumPostReplyMutationResult,
  ForumPostReplyRecord,
  ForumPostSort,
  ForumPostSummaryRecord,
  ForumMemberCandidateRecord,
  ForumMemberStatus,
  ForumMessageRecord,
  InviteForumMembersResult,
  ListForumChannelMembersResult,
  RespondForumInvitationResult,
  UpdateForumMessageResult,
  HomeRecord,
  HouseRecord,
  IncidentRecord,
  InvoiceRecord,
  LetterRequestRecord,
  LetterRequestTransitionResult,
  LetterTypeRecord,
  MeRecord,
  OtpRecord,
  NotificationReadResult,
  NotificationRecord,
  PackageRecord,
  PatrolCheckpointRecord,
  PatrolSessionRecord,
  PaymentRecord,
  PaymentTransitionResult,
  RemoveHouseholdMemberResult,
  ReportRecord,
  RequestAuditContext,
  ResidencyRequestRecord,
  ReviewResidencyRequestResult,
  RoleSummary,
  RtRecord,
  ScanCheckpointResult,
  SecurityDashboardRecord,
  SecurityShiftRecord,
  SessionCreationResult,
  SetMemberRoleResult,
  StreamTicketResult,
  UpdateCommunityResult,
  UpdateHouseResult,
  UpdateIncidentResult,
  UpdateProfileResult,
  UpdateRtResult,
  VehicleMutationResult,
  VehicleRecord,
  VehicleSearchRecord,
  VisitorCheckResult,
  VisitorRecord,
  WaiveInvoiceResult,
} from "../domain/repository";
import { formatVehiclePlate, normalizeVehiclePlate } from "../lib/security";

export const demoIds = {
  community: "00000000-0000-4000-8000-000000000001",
  user: "00000000-0000-4000-8000-000000000101",
  resident: "00000000-0000-4000-8000-000000000201",
  house: "00000000-0000-4000-8000-000000000301",
  household: "00000000-0000-4000-8000-000000000401",
  announcementOne: "00000000-0000-4000-8000-000000000501",
  announcementTwo: "00000000-0000-4000-8000-000000000502",
  secondCommunity: "00000000-0000-4000-8000-000000000002",
  secondHouse: "00000000-0000-4000-8000-000000000302",
  requestedHouse: "00000000-0000-4000-8000-000000000303",
  agendaUpcoming: "00000000-0000-4000-8000-000000000601",
  agendaPast: "00000000-0000-4000-8000-000000000602",
  agendaSecondTenant: "00000000-0000-4000-8000-000000000603",
  notificationOne: "00000000-0000-4000-8000-000000000701",
  directoryUser: "00000000-0000-4000-8000-000000000102",
  directoryResident: "00000000-0000-4000-8000-000000000202",
  directoryHouse: "00000000-0000-4000-8000-000000000304",
  directoryHousehold: "00000000-0000-4000-8000-000000000402",
  secondTenantUser: "00000000-0000-4000-8000-000000000103",
  secondTenantResident: "00000000-0000-4000-8000-000000000203",
  secondTenantHousehold: "00000000-0000-4000-8000-000000000403",
  vehicleOne: "00000000-0000-4000-8000-000000000801",
  vehicleSecondTenant: "00000000-0000-4000-8000-000000000802",
  securityHouse: "00000000-0000-4000-8000-000000000305",
  securityHousehold: "00000000-0000-4000-8000-000000000404",
  securityUser: "00000000-0000-4000-8000-000000000104",
  securityResident: "00000000-0000-4000-8000-000000000204",
  cameraPublic: "00000000-0000-4000-8000-000000000901",
  cameraSecurity: "00000000-0000-4000-8000-000000000902",
  checkpointOne: "00000000-0000-4000-8000-000000000a01",
  checkpointTwo: "00000000-0000-4000-8000-000000000a02",
  letterTypeOne: "00000000-0000-4000-8000-000000000b01",
  letterTypeTwo: "00000000-0000-4000-8000-000000000b02",
  facilityOne: "00000000-0000-4000-8000-000000000c01",
  treasurerHouse: "00000000-0000-4000-8000-000000000306",
  treasurerHousehold: "00000000-0000-4000-8000-000000000405",
  treasurerUser: "00000000-0000-4000-8000-000000000105",
  treasurerResident: "00000000-0000-4000-8000-000000000205",
  duesTypeOne: "00000000-0000-4000-8000-000000000d01",
  invoiceOne: "00000000-0000-4000-8000-000000000e01",
  superAdminHouse: "00000000-0000-4000-8000-000000000307",
  superAdminHousehold: "00000000-0000-4000-8000-000000000406",
  superAdminUser: "00000000-0000-4000-8000-000000000106",
  superAdminResident: "00000000-0000-4000-8000-000000000206",
  rtOne: "00000000-0000-4000-8000-000000000f01",
  rtTwo: "00000000-0000-4000-8000-000000000f02",
  secondCommunityRt: "00000000-0000-4000-8000-000000000f03",
  forumChannelCommunity: "00000000-0000-4000-8000-000000000f11",
  forumChannelRtOne: "00000000-0000-4000-8000-000000000f12",
  forumChannelRtTwo: "00000000-0000-4000-8000-000000000f13",
  forumChannelSecondCommunity: "00000000-0000-4000-8000-000000000f14",
} as const;

interface MemoryUser {
  id: string;
  phoneE164: string;
  displayName: string | null;
  allowResidentContact: boolean;
  active: boolean;
}

interface MemorySession {
  id: string;
  userId: string;
  tokenDigest: string;
  currentCommunityId: string | null;
  currentHouseholdId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface MemoryResident {
  id: string;
  userId: string;
  communityId: string;
  fullName: string;
  status: ResidentStatus;
  requestedHouseId: string | null;
  relationship: HouseholdRelationship | null;
  requestedAt: Date;
  householdId: string | null;
}

interface MemoryCommunity {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  address?: string | null;
  rwLabel?: string | null;
  registrationOpen: boolean;
}

interface MemoryRt {
  id: string;
  communityId: string;
  code: string;
  name: string;
  deletedAt?: Date | null;
}

interface MemoryForumChannel {
  id: string;
  communityId: string;
  rtId: string | null;
  kind: ForumChannelKind;
  name: string;
  description: string | null;
  createdByUserId: string | null;
}

interface MemoryForumChannelMember {
  id: string;
  communityId: string;
  channelId: string;
  userId: string;
  status: ForumMemberStatus;
  isOwner: boolean;
  invitedByUserId: string | null;
  invitedAt: Date;
  respondedAt: Date | null;
}

interface MemoryForumPost {
  id: string;
  communityId: string;
  authorUserId: string;
  category: ForumPostCategory;
  title: string;
  body: string;
  imageUrls: string[];
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}

interface MemoryForumPostReply {
  id: string;
  communityId: string;
  postId: string;
  authorUserId: string;
  replyToReplyId: string | null;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}

interface MemoryForumLike {
  id: string;
  communityId: string;
  userId: string;
  createdAt: Date;
}

interface MemoryForumMessage {
  id: string;
  communityId: string;
  channelId: string;
  authorUserId: string;
  replyToMessageId: string | null;
  body: string;
  imageUrls: string[];
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}

interface MemoryHouse {
  id: string;
  communityId: string;
  rtId: string | null;
  code: string;
  block: string;
  number: string;
  occupancyStatus: "OWNER_OCCUPIED" | "RENTED" | "VACANT";
  createdAt?: Date;
  deletedAt?: Date | null;
}

interface MemoryHousehold {
  id: string;
  communityId: string;
  houseId: string;
  displayName: string;
}

interface MemoryAnnouncement extends AnnouncementRecord {
  communityId: string;
  authorId?: string | null;
  archivedAt: Date | null;
}

interface MemoryAgendaEvent extends AgendaRecord {
  communityId: string;
  archivedAt: Date | null;
}

interface MemoryNotification extends NotificationRecord {
  communityId: string;
  userId: string;
}

interface MemoryVehicle {
  id: string;
  communityId: string;
  householdId: string;
  ownerResidentId: string | null;
  type: VehicleType;
  plate: string | null;
  plateNormalized: string | null;
  brand: string;
  model: string | null;
  color: string;
  ownerLabel: string;
  status: VehicleStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryCamera {
  id: string;
  communityId: string;
  name: string;
  location: string | null;
  accessLevel: CameraAccessLevel;
  status: CameraStatus;
  lastOnlineAt: Date | null;
  displayOrder: number;
  archivedAt: Date | null;
}

interface MemoryEmergency {
  id: string;
  communityId: string;
  senderUserId: string;
  kind: EmergencyKind;
  status: EmergencyStatus;
  houseLabel: string;
  note: string | null;
  sentAt: Date;
  acknowledgedAt: Date | null;
  respondingAt: Date | null;
  resolvedAt: Date | null;
}

interface MemoryVisitor {
  id: string;
  communityId: string;
  householdId: string;
  guestName: string;
  guestPhone: string | null;
  visitDate: string;
  expectedTime: string | null;
  vehicleInfo: string | null;
  plate: string | null;
  purpose: string | null;
  notes: string | null;
  qrToken: string;
  status: VisitorStatus;
  isWalkIn: boolean;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  createdAt: Date;
}

interface MemoryPackage {
  id: string;
  communityId: string;
  householdId: string;
  recipientName: string;
  courier: string;
  trackingNumber: string | null;
  status: PackageStatus;
  receivedAt: Date;
  collectedAt: Date | null;
  collectedByName: string | null;
}

interface MemorySecurityShift {
  id: string;
  communityId: string;
  officerUserId: string;
  status: SecurityShiftStatus;
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
}

interface MemoryPatrolCheckpoint {
  id: string;
  communityId: string;
  name: string;
  qrToken: string;
  displayOrder: number;
  archivedAt: Date | null;
}

interface MemoryPatrolScan {
  patrolSessionId: string;
  checkpointId: string;
  scannedAt: Date;
  note: string | null;
}

interface MemoryPatrolSession {
  id: string;
  communityId: string;
  officerUserId: string;
  status: PatrolSessionStatus;
  startedAt: Date;
  endedAt: Date | null;
}

interface MemoryIncident {
  id: string;
  communityId: string;
  reporterUserId: string;
  category: IncidentCategory;
  title: string;
  description: string;
  location: string | null;
  occurredAt: Date;
  peopleInvolved: string | null;
  actionTaken: string | null;
  status: IncidentStatus;
  createdAt: Date;
}

interface MemoryReportUpdate {
  id: string;
  reportId: string;
  status: ReportStatus;
  note: string | null;
  actorUserId: string | null;
  createdAt: Date;
}

interface MemoryReport {
  id: string;
  communityId: string;
  householdId: string;
  reporterUserId: string;
  category: ReportCategory;
  description: string;
  location: string | null;
  photos: string[];
  status: ReportStatus;
  createdAt: Date;
}

interface MemoryLetterType {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface MemoryLetterRequest {
  id: string;
  communityId: string;
  householdId: string;
  requesterUserId: string;
  letterTypeId: string;
  purpose: string;
  status: LetterRequestStatus;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  readyAt: Date | null;
  createdAt: Date;
}

interface MemoryFacility {
  id: string;
  communityId: string;
  name: string;
  openTime: string;
  closeTime: string;
  capacity: number | null;
  rules: string | null;
  isActive: boolean;
}

interface MemoryFacilityBooking {
  id: string;
  communityId: string;
  facilityId: string;
  householdId: string;
  bookedByUserId: string;
  purpose: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: FacilityBookingStatus;
  createdAt: Date;
}

interface MemoryDuesType {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  defaultAmount: number;
  isActive: boolean;
}

interface MemoryInvoice {
  id: string;
  communityId: string;
  householdId: string;
  duesTypeId: string;
  period: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  waivedAt: Date | null;
  waivedByUserId: string | null;
  waivedReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

interface MemoryPayment {
  id: string;
  communityId: string;
  invoiceId: string;
  submittedByUserId: string;
  amount: number;
  paidAt: string;
  note: string;
  status: PaymentStatus;
  verifiedByUserId: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  receiptNumber: string | null;
  createdAt: Date;
}

interface MemoryCashTransaction {
  id: string;
  communityId: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: CashTransactionType;
  visibility: CashVisibility;
  recordedByUserId: string;
  createdAt: Date;
}

const roleIdByCode = new Map<string, string>(roleDefinitions.map(([code]) => [code, randomUUID()]));
const roleNameByCode = new Map<string, string>(roleDefinitions.map(([code, name]) => [code, name]));

const readPermissions = [
  "agenda.read",
  "announcement.read",
  "community.read",
  "home.read",
  "household.read",
  "household.manage",
  "notification.read",
  "directory.read",
  "vehicle.manage",
  "camera.public.read",
  "visitor.create",
  "visitor.read",
  "package.read",
  "emergency.create",
  "report.create",
  "report.read",
  "letter.create",
  "letter.read",
  "facility.read",
  "facility.book",
  "invoice.read",
  "payment.create",
  "cash.read",
  "forum.read",
  "forum.post",
];

const superAdminPermissions = [
  "home.read",
  "community.read",
  "household.read",
  "household.manage",
  "announcement.read",
  "announcement.manage",
  "agenda.read",
  "agenda.manage",
  "notification.read",
  "directory.read",
  "resident.read",
  "resident.manage",
  "vehicle.manage",
  "vehicle.search",
  "camera.public.read",
  "camera.security.read",
  "camera.manage",
  "visitor.create",
  "visitor.read",
  "visitor.checkin",
  "package.read",
  "package.manage",
  "incident.create",
  "incident.read",
  "incident.manage",
  "patrol.execute",
  "patrol.manage",
  "emergency.create",
  "emergency.read",
  "emergency.manage",
  "security.dashboard.read",
  "report.create",
  "report.read",
  "report.manage",
  "letter.create",
  "letter.read",
  "letter.manage",
  "facility.read",
  "facility.book",
  "facility.manage",
  "dues.manage",
  "invoice.read",
  "payment.create",
  "payment.verify",
  "cash.read",
  "cash.manage",
  "finance.dashboard.read",
  "admin.audit.read",
  "forum.read",
  "forum.post",
  "forum.manage",
];

const treasurerPermissions = [
  "community.read",
  "announcement.read",
  "announcement.manage",
  "notification.read",
  "dues.manage",
  "invoice.read",
  "payment.verify",
  "cash.read",
  "cash.manage",
  "finance.dashboard.read",
  "forum.read",
  "forum.post",
];

const securityPermissions = [
  "community.read",
  "notification.read",
  "camera.public.read",
  "camera.security.read",
  "camera.manage",
  "visitor.read",
  "visitor.checkin",
  "package.manage",
  "incident.create",
  "incident.read",
  "incident.manage",
  "patrol.execute",
  "patrol.manage",
  "emergency.create",
  "emergency.read",
  "emergency.manage",
  "security.dashboard.read",
];

function shiftedDate(days: number): string {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function localDateTime(now: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}

function publicAgendaEvent(event: MemoryAgendaEvent): AgendaRecord {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    description: event.description,
    organizer: event.organizer,
  };
}

function publicNotification(notification: MemoryNotification): NotificationRecord {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    entityType: notification.entityType,
    entityId: notification.entityId,
    priority: notification.priority,
  };
}

export class MemoryRepository implements AppRepository {
  readonly audits: AuditInput[] = [];
  private healthy = true;
  private readonly otps = new Map<string, OtpRecord>();
  private readonly sessions = new Map<string, MemorySession>();
  private readonly users = new Map<string, MemoryUser>();
  private readonly residents = new Map<string, MemoryResident>();
  private readonly communities = new Map<string, MemoryCommunity>();
  private readonly rts = new Map<string, MemoryRt>();
  private readonly forumChannels = new Map<string, MemoryForumChannel>();
  private readonly forumChannelMembers = new Map<string, MemoryForumChannelMember>();
  private readonly forumMessages = new Map<string, MemoryForumMessage>();
  private readonly forumPosts = new Map<string, MemoryForumPost>();
  private readonly forumPostReplies = new Map<string, MemoryForumPostReply>();
  private readonly forumPostLikes = new Map<string, MemoryForumLike & { postId: string }>();
  private readonly forumReplyLikes = new Map<string, MemoryForumLike & { replyId: string }>();
  private readonly houses = new Map<string, MemoryHouse>();
  private readonly households = new Map<string, MemoryHousehold>();
  private readonly permissions = new Map<string, string[]>();
  private readonly memberRoles = new Map<string, string>();
  private readonly memberRoleRt = new Map<string, string | null>();
  private readonly reads = new Map<string, Date>();
  private readonly announcements: MemoryAnnouncement[];
  private readonly agendaEvents: MemoryAgendaEvent[];
  private readonly notifications: MemoryNotification[];
  private readonly vehicles: MemoryVehicle[];
  private readonly cameras: MemoryCamera[];
  private readonly emergencies: MemoryEmergency[] = [];
  private readonly visitors: MemoryVisitor[] = [];
  private readonly packages: MemoryPackage[] = [];
  private readonly securityShifts: MemorySecurityShift[] = [];
  private readonly patrolCheckpoints: MemoryPatrolCheckpoint[];
  private readonly patrolSessions: MemoryPatrolSession[] = [];
  private readonly patrolScans: MemoryPatrolScan[] = [];
  private readonly incidents: MemoryIncident[] = [];
  private readonly reports: MemoryReport[] = [];
  private readonly reportUpdates: MemoryReportUpdate[] = [];
  private readonly letterTypes: MemoryLetterType[];
  private readonly letterRequests: MemoryLetterRequest[] = [];
  private readonly facilities: MemoryFacility[];
  private readonly facilityBookings: MemoryFacilityBooking[] = [];
  private readonly duesTypes: MemoryDuesType[];
  private readonly invoices: MemoryInvoice[];
  private readonly payments: MemoryPayment[] = [];
  private readonly cashTransactions: MemoryCashTransaction[] = [];
  private readonly pushTokens: Array<{
    id: string;
    userId: string;
    communityId: string;
    token: string;
    platform: string;
  }> = [];

  constructor() {
    this.communities.set(demoIds.community, {
      id: demoIds.community,
      name: "Billabong Blok F",
      slug: "billabong-blok-f",
      timezone: "Asia/Jakarta",
      rwLabel: "RW 13",
      registrationOpen: true,
    });
    this.communities.set(demoIds.secondCommunity, {
      id: demoIds.secondCommunity,
      name: "[Demo] Taman Cendana",
      slug: "demo-taman-cendana",
      timezone: "Asia/Jakarta",
      registrationOpen: true,
    });
    this.rts.set(demoIds.rtOne, {
      id: demoIds.rtOne,
      communityId: demoIds.community,
      code: "RT 01",
      name: "RT 01",
    });
    this.rts.set(demoIds.rtTwo, {
      id: demoIds.rtTwo,
      communityId: demoIds.community,
      code: "RT 02",
      name: "RT 02",
    });
    this.rts.set(demoIds.secondCommunityRt, {
      id: demoIds.secondCommunityRt,
      communityId: demoIds.secondCommunity,
      code: "RT 01",
      name: "RT 01",
    });
    this.forumChannels.set(demoIds.forumChannelCommunity, {
      id: demoIds.forumChannelCommunity,
      communityId: demoIds.community,
      rtId: null,
      kind: "SYSTEM",
      name: "Forum Warga",
      description: null,
      createdByUserId: null,
    });
    this.forumChannels.set(demoIds.forumChannelRtOne, {
      id: demoIds.forumChannelRtOne,
      communityId: demoIds.community,
      rtId: demoIds.rtOne,
      kind: "SYSTEM",
      name: "RT 01",
      description: null,
      createdByUserId: null,
    });
    this.forumChannels.set(demoIds.forumChannelRtTwo, {
      id: demoIds.forumChannelRtTwo,
      communityId: demoIds.community,
      rtId: demoIds.rtTwo,
      kind: "SYSTEM",
      name: "RT 02",
      description: null,
      createdByUserId: null,
    });
    this.forumChannels.set(demoIds.forumChannelSecondCommunity, {
      id: demoIds.forumChannelSecondCommunity,
      communityId: demoIds.secondCommunity,
      rtId: null,
      kind: "SYSTEM",
      name: "Forum Warga",
      description: null,
      createdByUserId: null,
    });
    this.houses.set(demoIds.house, {
      id: demoIds.house,
      communityId: demoIds.community,
      rtId: demoIds.rtOne,
      code: "F01",
      block: "F",
      number: "01",
      occupancyStatus: "OWNER_OCCUPIED",
    });
    this.houses.set(demoIds.requestedHouse, {
      id: demoIds.requestedHouse,
      communityId: demoIds.community,
      rtId: demoIds.rtOne,
      code: "F03",
      block: "F",
      number: "03",
      occupancyStatus: "OWNER_OCCUPIED",
    });
    this.houses.set(demoIds.secondHouse, {
      id: demoIds.secondHouse,
      communityId: demoIds.secondCommunity,
      rtId: demoIds.secondCommunityRt,
      code: "C01",
      block: "C",
      number: "01",
      occupancyStatus: "OWNER_OCCUPIED",
    });
    this.houses.set(demoIds.directoryHouse, {
      id: demoIds.directoryHouse,
      communityId: demoIds.community,
      rtId: demoIds.rtOne,
      code: "F02",
      block: "F",
      number: "02",
      occupancyStatus: "RENTED",
    });
    this.households.set(demoIds.household, {
      id: demoIds.household,
      communityId: demoIds.community,
      houseId: demoIds.house,
      displayName: "Keluarga Pratama",
    });
    this.households.set(demoIds.directoryHousehold, {
      id: demoIds.directoryHousehold,
      communityId: demoIds.community,
      houseId: demoIds.directoryHouse,
      displayName: "Keluarga Wulandari",
    });
    this.households.set(demoIds.secondTenantHousehold, {
      id: demoIds.secondTenantHousehold,
      communityId: demoIds.secondCommunity,
      houseId: demoIds.secondHouse,
      displayName: "Keluarga Cendana",
    });
    this.users.set(demoIds.user, {
      id: demoIds.user,
      phoneE164: "+6281200000001",
      displayName: "Aziz Pratama",
      allowResidentContact: true,
      active: true,
    });
    this.users.set(demoIds.directoryUser, {
      id: demoIds.directoryUser,
      phoneE164: "+6281200000002",
      displayName: "Rina Wulandari",
      allowResidentContact: false,
      active: true,
    });
    this.users.set(demoIds.secondTenantUser, {
      id: demoIds.secondTenantUser,
      phoneE164: "+6281200000101",
      displayName: "Dimas Cendana",
      allowResidentContact: true,
      active: true,
    });
    this.residents.set(`${demoIds.user}:${demoIds.community}`, {
      id: demoIds.resident,
      userId: demoIds.user,
      communityId: demoIds.community,
      fullName: "Aziz Pratama",
      status: "ACTIVE",
      requestedHouseId: demoIds.house,
      relationship: "HEAD",
      requestedAt: new Date(),
      householdId: demoIds.household,
    });
    this.residents.set(`${demoIds.directoryUser}:${demoIds.community}`, {
      id: demoIds.directoryResident,
      userId: demoIds.directoryUser,
      communityId: demoIds.community,
      fullName: "Rina Wulandari",
      status: "ACTIVE",
      requestedHouseId: demoIds.directoryHouse,
      relationship: "HEAD",
      requestedAt: new Date(),
      householdId: demoIds.directoryHousehold,
    });
    this.residents.set(`${demoIds.secondTenantUser}:${demoIds.secondCommunity}`, {
      id: demoIds.secondTenantResident,
      userId: demoIds.secondTenantUser,
      communityId: demoIds.secondCommunity,
      fullName: "Dimas Cendana",
      status: "ACTIVE",
      requestedHouseId: demoIds.secondHouse,
      relationship: "HEAD",
      requestedAt: new Date(),
      householdId: demoIds.secondTenantHousehold,
    });
    this.houses.set(demoIds.securityHouse, {
      id: demoIds.securityHouse,
      communityId: demoIds.community,
      rtId: demoIds.rtOne,
      code: "F03",
      block: "F",
      number: "03",
      occupancyStatus: "OWNER_OCCUPIED",
    });
    this.households.set(demoIds.securityHousehold, {
      id: demoIds.securityHousehold,
      communityId: demoIds.community,
      houseId: demoIds.securityHouse,
      displayName: "Keluarga Santoso",
    });
    this.users.set(demoIds.securityUser, {
      id: demoIds.securityUser,
      phoneE164: "+6281200000003",
      displayName: "Budi Santoso",
      allowResidentContact: false,
      active: true,
    });
    this.residents.set(`${demoIds.securityUser}:${demoIds.community}`, {
      id: demoIds.securityResident,
      userId: demoIds.securityUser,
      communityId: demoIds.community,
      fullName: "Budi Santoso",
      status: "ACTIVE",
      requestedHouseId: demoIds.securityHouse,
      relationship: "HEAD",
      requestedAt: new Date(),
      householdId: demoIds.securityHousehold,
    });
    this.houses.set(demoIds.treasurerHouse, {
      id: demoIds.treasurerHouse,
      communityId: demoIds.community,
      rtId: demoIds.rtTwo,
      code: "F04",
      block: "F",
      number: "04",
      occupancyStatus: "OWNER_OCCUPIED",
    });
    this.households.set(demoIds.treasurerHousehold, {
      id: demoIds.treasurerHousehold,
      communityId: demoIds.community,
      houseId: demoIds.treasurerHouse,
      displayName: "Keluarga Nugroho",
    });
    this.users.set(demoIds.treasurerUser, {
      id: demoIds.treasurerUser,
      phoneE164: "+6281200000004",
      displayName: "Sari Nugroho",
      allowResidentContact: false,
      active: true,
    });
    this.residents.set(`${demoIds.treasurerUser}:${demoIds.community}`, {
      id: demoIds.treasurerResident,
      userId: demoIds.treasurerUser,
      communityId: demoIds.community,
      fullName: "Sari Nugroho",
      status: "ACTIVE",
      requestedHouseId: demoIds.treasurerHouse,
      relationship: "HEAD",
      requestedAt: new Date(),
      householdId: demoIds.treasurerHousehold,
    });
    this.houses.set(demoIds.superAdminHouse, {
      id: demoIds.superAdminHouse,
      communityId: demoIds.community,
      rtId: demoIds.rtTwo,
      code: "F2D2-17",
      block: "F2D2",
      number: "17",
      occupancyStatus: "OWNER_OCCUPIED",
    });
    this.households.set(demoIds.superAdminHousehold, {
      id: demoIds.superAdminHousehold,
      communityId: demoIds.community,
      houseId: demoIds.superAdminHouse,
      displayName: "Admin Utama",
    });
    this.users.set(demoIds.superAdminUser, {
      id: demoIds.superAdminUser,
      phoneE164: "+6282145610774",
      displayName: "Super Admin",
      allowResidentContact: false,
      active: true,
    });
    this.residents.set(`${demoIds.superAdminUser}:${demoIds.community}`, {
      id: demoIds.superAdminResident,
      userId: demoIds.superAdminUser,
      communityId: demoIds.community,
      fullName: "Super Admin",
      status: "ACTIVE",
      requestedHouseId: demoIds.superAdminHouse,
      relationship: "HEAD",
      requestedAt: new Date(),
      householdId: demoIds.superAdminHousehold,
    });
    this.permissions.set(`${demoIds.user}:${demoIds.community}`, [...readPermissions]);
    this.memberRoles.set(`${demoIds.user}:${demoIds.community}`, "RESIDENT");
    this.permissions.set(`${demoIds.securityUser}:${demoIds.community}`, [...securityPermissions]);
    this.memberRoles.set(`${demoIds.securityUser}:${demoIds.community}`, "SECURITY");
    this.permissions.set(`${demoIds.treasurerUser}:${demoIds.community}`, [
      ...treasurerPermissions,
    ]);
    this.memberRoles.set(`${demoIds.treasurerUser}:${demoIds.community}`, "TREASURER");
    this.permissions.set(`${demoIds.superAdminUser}:${demoIds.community}`, [
      ...superAdminPermissions,
    ]);
    this.memberRoles.set(`${demoIds.superAdminUser}:${demoIds.community}`, "SUPER_ADMIN");
    this.cameras = [
      {
        id: demoIds.cameraPublic,
        communityId: demoIds.community,
        name: "Gerbang Utama",
        location: "Pintu masuk utama",
        accessLevel: "RESIDENT",
        status: "ONLINE",
        lastOnlineAt: new Date(),
        displayOrder: 1,
        archivedAt: null,
      },
      {
        id: demoIds.cameraSecurity,
        communityId: demoIds.community,
        name: "Pos Security",
        location: "Pos jaga",
        accessLevel: "SECURITY",
        status: "ONLINE",
        lastOnlineAt: new Date(),
        displayOrder: 2,
        archivedAt: null,
      },
    ];
    this.patrolCheckpoints = [
      {
        id: demoIds.checkpointOne,
        communityId: demoIds.community,
        name: "Pos Security",
        qrToken: `checkpoint-${demoIds.checkpointOne}`,
        displayOrder: 1,
        archivedAt: null,
      },
      {
        id: demoIds.checkpointTwo,
        communityId: demoIds.community,
        name: "Gerbang Utama",
        qrToken: `checkpoint-${demoIds.checkpointTwo}`,
        displayOrder: 2,
        archivedAt: null,
      },
    ];
    this.letterTypes = [
      {
        id: demoIds.letterTypeOne,
        communityId: demoIds.community,
        name: "Surat Pengantar",
        description: "Surat pengantar umum dari lingkungan.",
        isActive: true,
        displayOrder: 1,
      },
      {
        id: demoIds.letterTypeTwo,
        communityId: demoIds.community,
        name: "Surat Domisili Lingkungan",
        description:
          "Keterangan domisili yang diterbitkan lingkungan, bukan dokumen pemerintah resmi.",
        isActive: true,
        displayOrder: 2,
      },
    ];
    this.facilities = [
      {
        id: demoIds.facilityOne,
        communityId: demoIds.community,
        name: "Balai Warga",
        openTime: "08:00",
        closeTime: "21:00",
        capacity: 80,
        rules: "Wajib menjaga kebersihan dan mengembalikan kunci setelah acara selesai.",
        isActive: true,
      },
    ];
    this.duesTypes = [
      {
        id: demoIds.duesTypeOne,
        communityId: demoIds.community,
        name: "Iuran Lingkungan",
        description: "Iuran bulanan untuk operasional lingkungan.",
        defaultAmount: 150000,
        isActive: true,
      },
    ];
    this.invoices = [
      {
        id: demoIds.invoiceOne,
        communityId: demoIds.community,
        householdId: demoIds.household,
        duesTypeId: demoIds.duesTypeOne,
        period: "2026-08",
        amount: 150000,
        dueDate: "2026-08-31",
        status: "UNPAID",
        waivedAt: null,
        waivedByUserId: null,
        waivedReason: null,
        paidAt: null,
        createdAt: new Date(),
      },
    ];
    const now = Date.now();
    this.announcements = [
      {
        id: demoIds.announcementOne,
        title: "[Demo] Pemadaman listrik sementara",
        summary: "Simulasi informasi pemadaman untuk pengembangan lokal.",
        body: "Data contoh pemadaman untuk pengembangan lokal.",
        priority: "IMPORTANT",
        category: "INFO",
        coverImageUrl: null,
        publishedAt: new Date(now - 60 * 60 * 1000),
        isRead: false,
        communityId: demoIds.community,
        archivedAt: null,
      },
      {
        id: demoIds.announcementTwo,
        title: "[Demo] Kerja bakti Blok F",
        summary: "Simulasi agenda warga untuk pengembangan lokal.",
        body: "Data contoh kerja bakti untuk pengembangan lokal.",
        priority: "NORMAL",
        category: "EVENT",
        coverImageUrl: null,
        publishedAt: new Date(now - 2 * 60 * 60 * 1000),
        isRead: false,
        communityId: demoIds.community,
        archivedAt: null,
      },
    ];
    this.agendaEvents = [
      {
        id: demoIds.agendaUpcoming,
        communityId: demoIds.community,
        title: "[Demo] Kerja bakti lingkungan",
        date: shiftedDate(2),
        startTime: "07:00",
        endTime: "09:00",
        location: "Taman Blok F",
        description: "Agenda contoh untuk pengembangan lokal.",
        organizer: "Pengurus RT",
        archivedAt: null,
      },
      {
        id: demoIds.agendaPast,
        communityId: demoIds.community,
        title: "[Demo] Rapat warga sebelumnya",
        date: shiftedDate(-2),
        startTime: "19:00",
        endTime: "20:30",
        location: "Balai Warga",
        description: "Agenda lampau contoh untuk pengembangan lokal.",
        organizer: "Pengurus RT",
        archivedAt: null,
      },
      {
        id: demoIds.agendaSecondTenant,
        communityId: demoIds.secondCommunity,
        title: "[Demo Tenant B] Agenda Taman Cendana",
        date: shiftedDate(3),
        startTime: "08:00",
        endTime: "10:00",
        location: "Taman Cendana",
        description: "Agenda ini hanya untuk tenant kedua.",
        organizer: "Pengurus Taman Cendana",
        archivedAt: null,
      },
    ];
    this.notifications = [
      {
        id: demoIds.notificationOne,
        communityId: demoIds.community,
        userId: demoIds.user,
        title: "Agenda lingkungan mendatang",
        message: "Kerja bakti lingkungan dijadwalkan dua hari lagi.",
        readAt: null,
        createdAt: new Date(now - 30 * 60 * 1000),
        entityType: "EVENT",
        entityId: demoIds.agendaUpcoming,
        priority: "NORMAL",
      },
    ];
    this.vehicles = [
      {
        id: demoIds.vehicleOne,
        communityId: demoIds.community,
        householdId: demoIds.household,
        ownerResidentId: demoIds.resident,
        type: "CAR",
        plate: "B 1234 KKU",
        plateNormalized: "B1234KKU",
        brand: "Toyota",
        model: "Avanza",
        color: "Hijau tua",
        ownerLabel: "[Demo] Aziz Pratama",
        status: "ACTIVE",
        archivedAt: null,
        createdAt: new Date(now - 10 * 60 * 1000),
        updatedAt: new Date(now - 10 * 60 * 1000),
      },
      {
        id: demoIds.vehicleSecondTenant,
        communityId: demoIds.secondCommunity,
        householdId: demoIds.secondTenantHousehold,
        ownerResidentId: demoIds.secondTenantResident,
        type: "MOTORCYCLE",
        plate: "B 1234 KKU",
        plateNormalized: "B1234KKU",
        brand: "Honda",
        model: "Vario",
        color: "Hitam",
        ownerLabel: "[Demo Tenant B] Dimas Cendana",
        status: "ACTIVE",
        archivedAt: null,
        createdAt: new Date(now - 10 * 60 * 1000),
        updatedAt: new Date(now - 10 * 60 * 1000),
      },
    ];
  }

  setHealthy(healthy: boolean) {
    this.healthy = healthy;
  }

  setPermissions(userId: string, permissions: string[], communityId = demoIds.community) {
    this.permissions.set(`${userId}:${communityId}`, [...permissions]);
  }

  /// Simulates an account that signed up but never chose a display name — the
  /// case where a phone number used to leak out as the person's name.
  clearDisplayName(userId: string) {
    const user = this.users.get(userId);
    if (user) user.displayName = null;
  }

  setResidentStatus(userId: string, status: ResidentStatus) {
    const resident = [...this.residents.values()].find((candidate) => candidate.userId === userId);
    if (resident) resident.status = status;
  }

  latestOtpForPhone(phoneE164: string): OtpRecord | null {
    return [...this.otps.values()].filter((otp) => otp.phoneE164 === phoneE164).at(-1) ?? null;
  }

  async healthCheck(): Promise<void> {
    if (!this.healthy) throw new Error("database unavailable");
  }

  async close(): Promise<void> {}

  async replaceOtpChallenge(input: {
    id: string;
    phoneE164: string;
    codeDigest: string;
    maxAttempts: number;
    expiresAt: Date;
    now: Date;
  }): Promise<OtpRecord> {
    for (const otp of this.otps.values()) {
      if (otp.phoneE164 === input.phoneE164 && !otp.consumedAt && !otp.invalidatedAt) {
        otp.invalidatedAt = input.now;
      }
    }
    const otp: OtpRecord = {
      id: input.id,
      phoneE164: input.phoneE164,
      codeDigest: input.codeDigest,
      attemptCount: 0,
      maxAttempts: input.maxAttempts,
      expiresAt: input.expiresAt,
      consumedAt: null,
      invalidatedAt: null,
    };
    this.otps.set(otp.id, otp);
    return otp;
  }

  async findOtp(id: string): Promise<OtpRecord | null> {
    return this.otps.get(id) ?? null;
  }

  async incrementOtpFailure(id: string, now: Date): Promise<void> {
    const otp = this.otps.get(id);
    if (
      otp &&
      !otp.consumedAt &&
      !otp.invalidatedAt &&
      otp.expiresAt > now &&
      otp.attemptCount < otp.maxAttempts
    ) {
      otp.attemptCount += 1;
    }
  }

  async consumeOtpAndCreateSession(input: {
    otpId: string;
    phoneE164: string;
    tokenDigest: string;
    sessionExpiresAt: Date;
    now: Date;
  }): Promise<SessionCreationResult | null> {
    const otp = this.otps.get(input.otpId);
    if (
      !otp ||
      otp.phoneE164 !== input.phoneE164 ||
      otp.consumedAt ||
      otp.invalidatedAt ||
      otp.expiresAt <= input.now ||
      otp.attemptCount >= otp.maxAttempts
    ) {
      return null;
    }
    otp.consumedAt = input.now;

    let user = [...this.users.values()].find(
      (candidate) => candidate.phoneE164 === input.phoneE164,
    );
    if (!user) {
      user = {
        id: randomUUID(),
        phoneE164: input.phoneE164,
        displayName: null,
        allowResidentContact: false,
        active: true,
      };
      this.users.set(user.id, user);
    }

    const resident = this.residentForUser(user.id);
    const hasReadyContext = resident?.status === "ACTIVE";
    const session: MemorySession = {
      id: randomUUID(),
      userId: user.id,
      tokenDigest: input.tokenDigest,
      currentCommunityId: hasReadyContext ? resident.communityId : null,
      currentHouseholdId: hasReadyContext ? resident.householdId : null,
      expiresAt: input.sessionExpiresAt,
      revokedAt: null,
    };
    this.sessions.set(session.id, session);
    return { id: session.id, userId: user.id, expiresAt: session.expiresAt };
  }

  async findAuthSession(tokenDigest: string, now: Date): Promise<AuthSessionRecord | null> {
    const session = [...this.sessions.values()].find(
      (candidate) => candidate.tokenDigest === tokenDigest,
    );
    if (!session || session.revokedAt || session.expiresAt <= now) return null;
    const user = this.users.get(session.userId);
    if (!user?.active) return null;

    const roleCode = session.currentCommunityId
      ? this.memberRoles.get(`${user.id}:${session.currentCommunityId}`)
      : undefined;
    const rtId = session.currentCommunityId
      ? (this.memberRoleRt.get(`${user.id}:${session.currentCommunityId}`) ?? null)
      : null;

    return {
      sessionId: session.id,
      userId: session.userId,
      currentCommunityId: session.currentCommunityId,
      currentHouseholdId: session.currentHouseholdId,
      permissions: session.currentCommunityId
        ? [...(this.permissions.get(`${user.id}:${session.currentCommunityId}`) ?? [])]
        : [],
      rtScopeId: computeRtScopeId(roleCode ? [{ roleCode, rtId }] : []),
    };
  }

  async revokeSession(sessionId: string, now: Date): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) session.revokedAt = now;
  }

  async getMe(auth: AuthSessionRecord): Promise<MeRecord | null> {
    const user = this.users.get(auth.userId);
    if (!user) return null;
    const resident = this.residentForUser(auth.userId, auth.currentCommunityId);
    const ready =
      resident?.status === "ACTIVE" &&
      auth.currentCommunityId === resident.communityId &&
      auth.currentHouseholdId === resident.householdId &&
      resident.householdId !== null;

    let authState: MeRecord["authState"] = "NEEDS_RESIDENCY";
    if (ready) authState = "READY";
    else if (resident?.status === "PENDING") authState = "PENDING_APPROVAL";
    else if (resident?.status === "REJECTED") authState = "REJECTED";
    else if (resident?.status === "SUSPENDED") authState = "SUSPENDED";
    else if (resident?.status === "ACTIVE") authState = "CONTEXT_REQUIRED";
    else if (resident?.status === "MOVED_OUT") {
      authState = "ACCOUNT_CONFIGURATION_REQUIRED";
    }

    return {
      id: user.id,
      displayName: user.displayName ?? resident?.fullName ?? null,
      phoneE164: user.phoneE164,
      allowResidentContact: user.allowResidentContact,
      authState,
      residentStatus: resident?.status ?? null,
      currentContext: ready ? this.currentContextForResident(resident) : null,
      permissions: auth.permissions,
    };
  }

  async updateOwnProfile(input: {
    auth: AuthSessionRecord;
    changes: UpdateProfileInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<UpdateProfileResult> {
    const user = this.users.get(input.auth.userId);
    if (!user) return { outcome: "NOT_FOUND" };
    if (input.changes.displayName !== undefined) user.displayName = input.changes.displayName;
    if (input.changes.allowResidentContact !== undefined) {
      user.allowResidentContact = input.changes.allowResidentContact;
    }
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "profile.updated",
      entityType: "User",
      entityId: user.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { changedFields: Object.keys(input.changes).sort().join(",") },
    });
    return {
      outcome: "OK",
      profile: {
        displayName: user.displayName,
        allowResidentContact: user.allowResidentContact,
      },
    };
  }

  async listDirectory(input: {
    auth: AuthSessionRecord;
    search?: string;
    cursor?: string;
    limit: number;
    includeAdminDetails: boolean;
  }) {
    if (!input.auth.currentCommunityId) {
      return { outcome: "OK" as const, items: [], total: 0, nextCursor: null };
    }
    const search = input.search?.trim().toLocaleLowerCase("id-ID");
    const records: DirectoryRecord[] = [...this.households.values()]
      .filter((household) => household.communityId === input.auth.currentCommunityId)
      .flatMap((household) => {
        const house = this.houses.get(household.houseId);
        if (!house) return [];
        const residents = [...this.residents.values()].filter(
          (resident) =>
            resident.communityId === household.communityId &&
            resident.householdId === household.id &&
            resident.status === "ACTIVE",
        );
        if (residents.length === 0) return [];
        const searchable = [house.code, household.displayName];
        if (input.includeAdminDetails) {
          searchable.push(
            ...residents.map(
              (resident) => this.users.get(resident.userId)?.displayName ?? resident.fullName,
            ),
          );
        }
        if (
          search &&
          !searchable.some((value) => value.toLocaleLowerCase("id-ID").includes(search))
        ) {
          return [];
        }
        return [
          {
            householdId: household.id,
            houseCode: house.code,
            householdDisplayName: household.displayName,
            occupancyStatus: house.occupancyStatus,
            contacts: residents.flatMap((resident) => {
              const user = this.users.get(resident.userId);
              return user?.allowResidentContact
                ? [
                    {
                      displayName: user.displayName ?? resident.fullName,
                      phoneE164: user.phoneE164,
                    },
                  ]
                : [];
            }),
            members: input.includeAdminDetails
              ? residents.map((resident) => {
                  const user = this.users.get(resident.userId);
                  return {
                    residentId: resident.id,
                    displayName: user?.displayName ?? resident.fullName,
                    relationship: resident.relationship ?? "OTHER",
                    status: "ACTIVE" as const,
                    linkedAccount: Boolean(user),
                    contactPhoneE164: user?.allowResidentContact ? user.phoneE164 : null,
                  };
                })
              : [],
          },
        ];
      })
      .sort(
        (left, right) =>
          left.houseCode.localeCompare(right.houseCode) ||
          left.householdId.localeCompare(right.householdId),
      );
    const cursorIndex = input.cursor
      ? records.findIndex((record) => record.householdId === input.cursor)
      : -1;
    if (input.cursor && cursorIndex < 0) return { outcome: "INVALID_CURSOR" as const };
    const start = cursorIndex + 1;
    const page = records.slice(start, start + input.limit);
    return {
      outcome: "OK" as const,
      items: page,
      total: records.length,
      nextCursor: start + input.limit < records.length ? (page.at(-1)?.householdId ?? null) : null,
    };
  }

  async getCurrentHousehold(auth: AuthSessionRecord): Promise<CurrentHouseholdRecord | null> {
    if (!auth.currentCommunityId || !auth.currentHouseholdId) return null;
    const viewer = [...this.residents.values()].find(
      (resident) =>
        resident.userId === auth.userId &&
        resident.communityId === auth.currentCommunityId &&
        resident.householdId === auth.currentHouseholdId &&
        resident.status === "ACTIVE",
    );
    const household = this.households.get(auth.currentHouseholdId);
    const house = household ? this.houses.get(household.houseId) : undefined;
    if (!viewer || !household || !house || household.communityId !== auth.currentCommunityId) {
      return null;
    }
    const canReadResidents = auth.permissions.includes("resident.read");
    const members = [...this.residents.values()]
      .filter(
        (resident) =>
          resident.communityId === household.communityId &&
          resident.householdId === household.id &&
          resident.status === "ACTIVE",
      )
      .map((resident) => {
        const user = this.users.get(resident.userId);
        return {
          residentId: resident.id,
          userId: resident.userId,
          displayName: user?.displayName ?? resident.fullName,
          relationship: resident.relationship ?? "OTHER",
          linkedAccount: Boolean(user),
          phoneE164:
            user &&
            (resident.userId === auth.userId || user.allowResidentContact || canReadResidents)
              ? user.phoneE164
              : null,
          allowResidentContact: user?.allowResidentContact ?? false,
        };
      });
    return {
      id: household.id,
      displayName: household.displayName,
      occupancyStatus: house.occupancyStatus,
      house: {
        id: house.id,
        code: house.code,
        block: house.block,
        number: house.number,
        addressLabel: `Blok ${house.block} No. ${house.number}`,
      },
      members,
    };
  }

  async addHouseholdMember(input: {
    auth: AuthSessionRecord;
    fullName: string;
    phoneE164: string;
    relationship: HouseholdRelationship;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<AddHouseholdMemberResult> {
    const communityId = input.auth.currentCommunityId;
    const householdId = input.auth.currentHouseholdId;
    if (!communityId || !householdId) return { outcome: "NOT_FOUND" };
    const household = this.households.get(householdId);
    if (!household || household.communityId !== communityId) return { outcome: "NOT_FOUND" };

    let user = [...this.users.values()].find(
      (candidate) => candidate.phoneE164 === input.phoneE164,
    );
    if (user) {
      const existingResident = this.residents.get(`${user.id}:${communityId}`);
      if (existingResident?.status === "ACTIVE") {
        if (existingResident.householdId === householdId) return { outcome: "ALREADY_MEMBER" };
        return { outcome: "ALREADY_RESIDENT_ELSEWHERE" };
      }
    }

    if (!user) {
      user = {
        id: randomUUID(),
        phoneE164: input.phoneE164,
        displayName: input.fullName,
        allowResidentContact: false,
        active: true,
      };
      this.users.set(user.id, user);
    } else {
      user.displayName = input.fullName;
    }

    const resident: MemoryResident = {
      id: randomUUID(),
      userId: user.id,
      communityId,
      fullName: input.fullName,
      status: "ACTIVE",
      requestedHouseId: household.houseId,
      relationship: input.relationship,
      requestedAt: input.now,
      householdId,
    };
    this.residents.set(`${user.id}:${communityId}`, resident);

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "household.member.added",
      entityType: "HouseholdMember",
      entityId: resident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { relationship: input.relationship },
    });

    return {
      outcome: "OK",
      member: {
        residentId: resident.id,
        userId: user.id,
        displayName: user.displayName ?? resident.fullName,
        relationship: input.relationship,
        linkedAccount: true,
        phoneE164: user.phoneE164,
        allowResidentContact: user.allowResidentContact,
      },
    };
  }

  async removeHouseholdMember(input: {
    auth: AuthSessionRecord;
    residentId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<RemoveHouseholdMemberResult> {
    const communityId = input.auth.currentCommunityId;
    const householdId = input.auth.currentHouseholdId;
    if (!communityId || !householdId) return { outcome: "NOT_FOUND" };

    const resident = [...this.residents.values()].find(
      (candidate) =>
        candidate.id === input.residentId &&
        candidate.communityId === communityId &&
        candidate.householdId === householdId &&
        candidate.status === "ACTIVE",
    );
    if (!resident) return { outcome: "NOT_FOUND" };
    if (resident.userId === input.auth.userId) return { outcome: "CANNOT_REMOVE_PRIMARY" };

    resident.status = "MOVED_OUT";

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "household.member.removed",
      entityType: "HouseholdMember",
      entityId: resident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: {},
    });

    return { outcome: "REMOVED", residentId: resident.id };
  }

  async getCurrentCommunity(auth: AuthSessionRecord): Promise<CurrentCommunityRecord | null> {
    if (!auth.currentCommunityId) return null;
    const community = this.communities.get(auth.currentCommunityId);
    if (!community) return null;
    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      timezone: community.timezone,
      address:
        community.address ??
        (community.id === demoIds.community ? "Billabong, Bogor" : "Taman Cendana, Bogor"),
      rwLabel: community.rwLabel ?? null,
      contactPhone: null,
      emergencyContactPhone: null,
    };
  }

  async updateCommunity(input: {
    auth: AuthSessionRecord;
    changes: UpdateCommunityInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateCommunityResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };
    const community = this.communities.get(communityId);
    if (!community) return { outcome: "NOT_FOUND" };

    if (input.changes.name !== undefined) community.name = input.changes.name;
    if (input.changes.address !== undefined) community.address = input.changes.address;
    if (input.changes.rwLabel !== undefined) community.rwLabel = input.changes.rwLabel;
    if (input.changes.registrationOpen !== undefined) {
      community.registrationOpen = input.changes.registrationOpen;
    }

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "community.updated",
      entityType: "Community",
      entityId: communityId,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return {
      outcome: "OK",
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name,
        address: community.address ?? null,
        rwLabel: community.rwLabel ?? null,
        timezone: community.timezone,
        registrationOpen: community.registrationOpen,
      },
    };
  }

  async createCommunity(input: {
    auth: AuthSessionRecord;
    community: CreateCommunityInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateCommunityResult> {
    const conflict = [...this.communities.values()].some(
      (community) => community.slug === input.community.slug,
    );
    if (conflict) return { outcome: "SLUG_CONFLICT" };

    const community: MemoryCommunity = {
      id: randomUUID(),
      slug: input.community.slug,
      name: input.community.name,
      address: input.community.address ?? null,
      rwLabel: input.community.rwLabel ?? null,
      timezone: input.community.timezone,
      registrationOpen: true,
    };
    this.communities.set(community.id, community);
    const forumChannelId = randomUUID();
    this.forumChannels.set(forumChannelId, {
      id: forumChannelId,
      communityId: community.id,
      rtId: null,
      kind: "SYSTEM",
      name: "Forum Warga",
      description: null,
      createdByUserId: null,
    });

    this.audits.push({
      communityId: community.id,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "community.created",
      entityType: "Community",
      entityId: community.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return {
      outcome: "OK",
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name,
        address: community.address ?? null,
        rwLabel: community.rwLabel ?? null,
        timezone: community.timezone,
        registrationOpen: community.registrationOpen,
      },
    };
  }

  async listCommunitiesForPlatformAdmin(): Promise<CommunityAdminRecord[]> {
    return [...this.communities.values()]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((community) => ({
        id: community.id,
        slug: community.slug,
        name: community.name,
        address: community.address ?? null,
        rwLabel: community.rwLabel ?? null,
        timezone: community.timezone,
        registrationOpen: community.registrationOpen,
      }));
  }

  async listRts(auth: AuthSessionRecord): Promise<RtRecord[]> {
    if (!auth.currentCommunityId) return [];
    return [...this.rts.values()]
      .filter((rt) => rt.communityId === auth.currentCommunityId && !rt.deletedAt)
      .sort((left, right) => left.code.localeCompare(right.code))
      .map((rt) => ({ id: rt.id, code: rt.code, name: rt.name }));
  }

  async createRt(input: {
    auth: AuthSessionRecord;
    rt: CreateRtInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateRtResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "CODE_CONFLICT" };
    const conflict = [...this.rts.values()].some(
      (rt) => rt.communityId === communityId && rt.code === input.rt.code && !rt.deletedAt,
    );
    if (conflict) return { outcome: "CODE_CONFLICT" };

    const rt: MemoryRt = {
      id: randomUUID(),
      communityId,
      code: input.rt.code,
      name: input.rt.name,
    };
    this.rts.set(rt.id, rt);
    const forumChannelId = randomUUID();
    this.forumChannels.set(forumChannelId, {
      id: forumChannelId,
      communityId,
      rtId: rt.id,
      kind: "SYSTEM",
      name: rt.name,
      description: null,
      createdByUserId: null,
    });

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "rt.created",
      entityType: "Rt",
      entityId: rt.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return { outcome: "OK", rt: { id: rt.id, code: rt.code, name: rt.name } };
  }

  async updateRt(input: {
    auth: AuthSessionRecord;
    rtId: string;
    changes: UpdateRtInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateRtResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };
    const rt = this.rts.get(input.rtId);
    if (!rt || rt.communityId !== communityId || rt.deletedAt) {
      return { outcome: "NOT_FOUND" };
    }
    if (input.changes.code) {
      const conflict = [...this.rts.values()].some(
        (candidate) =>
          candidate.id !== rt.id &&
          candidate.communityId === communityId &&
          candidate.code === input.changes.code &&
          !candidate.deletedAt,
      );
      if (conflict) return { outcome: "CODE_CONFLICT" };
      rt.code = input.changes.code;
    }
    if (input.changes.name) {
      rt.name = input.changes.name;
      for (const channel of this.forumChannels.values()) {
        if (channel.communityId === communityId && channel.rtId === rt.id) {
          channel.name = rt.name;
        }
      }
    }

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "rt.updated",
      entityType: "Rt",
      entityId: rt.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return { outcome: "OK", rt: { id: rt.id, code: rt.code, name: rt.name } };
  }

  async listRegistrationCommunities(): Promise<OnboardingCommunityOption[]> {
    return [...this.communities.values()]
      .filter((community) => community.registrationOpen)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(({ id, name, slug, timezone }) => ({
        id,
        name,
        slug,
        timezone,
        rts: [...this.rts.values()]
          .filter((rt) => rt.communityId === id && !rt.deletedAt)
          .sort((left, right) => left.code.localeCompare(right.code))
          .map((rt) => ({ id: rt.id, code: rt.code, name: rt.name })),
      }));
  }

  async listRoles(): Promise<RoleSummary[]> {
    return roleDefinitions.map(([code, name]) => ({
      id: roleIdByCode.get(code) ?? code,
      code,
      name,
    }));
  }

  private houseRtId(house: MemoryHouse | undefined): string | null {
    return house?.rtId ?? null;
  }

  async listCommunityMembers(auth: AuthSessionRecord): Promise<CommunityMemberRecord[]> {
    const communityId = auth.currentCommunityId;
    if (!communityId) return [];
    return [...this.residents.values()]
      .filter((resident) => resident.communityId === communityId && resident.status === "ACTIVE")
      .map((resident) => {
        const user = this.users.get(resident.userId);
        const household = resident.householdId
          ? this.households.get(resident.householdId)
          : undefined;
        const house = household ? this.houses.get(household.houseId) : undefined;
        const roleCode = this.memberRoles.get(`${resident.userId}:${communityId}`);
        const roleName = roleCode ? roleNameByCode.get(roleCode) : undefined;
        return {
          residentId: resident.id,
          userId: resident.userId,
          displayName: user?.displayName ?? resident.fullName,
          phoneE164: user?.phoneE164 ?? "",
          houseCode: house?.code ?? null,
          rtCode: house?.rtId ? (this.rts.get(house.rtId)?.code ?? null) : null,
          roles:
            roleCode && roleName
              ? [{ id: roleIdByCode.get(roleCode) ?? roleCode, code: roleCode, name: roleName }]
              : [],
          houseRtId: this.houseRtId(house),
        };
      })
      .filter((member) => !auth.rtScopeId || member.houseRtId === auth.rtScopeId)
      .map(({ houseRtId: _houseRtId, ...member }) => member);
  }

  async setMemberRole(input: {
    auth: AuthSessionRecord;
    residentId: string;
    roleCode: string;
    rtId?: string | null;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<SetMemberRoleResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    if (input.auth.rtScopeId) {
      if (input.roleCode === "SUPER_ADMIN" || input.roleCode === "COMMUNITY_ADMIN") {
        return { outcome: "FORBIDDEN" };
      }
    }
    const effectiveRtId =
      input.roleCode === "RT_ADMIN" ? (input.auth.rtScopeId ?? input.rtId ?? null) : null;
    if (input.roleCode === "RT_ADMIN" && !effectiveRtId) {
      return { outcome: "RT_REQUIRED" };
    }
    if (effectiveRtId) {
      const rt = this.rts.get(effectiveRtId);
      if (!rt || rt.communityId !== communityId || rt.deletedAt) {
        return { outcome: "RT_NOT_FOUND" };
      }
    }

    const resident = [...this.residents.values()].find(
      (candidate) =>
        candidate.id === input.residentId &&
        candidate.communityId === communityId &&
        candidate.status === "ACTIVE",
    );
    if (!resident) return { outcome: "NOT_FOUND" };
    if (resident.userId === input.auth.userId) return { outcome: "CANNOT_CHANGE_SELF" };

    if (input.auth.rtScopeId) {
      const household = resident.householdId
        ? this.households.get(resident.householdId)
        : undefined;
      const house = household ? this.houses.get(household.houseId) : undefined;
      if (this.houseRtId(house) !== input.auth.rtScopeId) {
        return { outcome: "NOT_FOUND" };
      }
    }

    const roleName = roleNameByCode.get(input.roleCode);
    if (!roleName) return { outcome: "ROLE_NOT_FOUND" };

    this.memberRoles.set(`${resident.userId}:${communityId}`, input.roleCode);
    this.memberRoleRt.set(`${resident.userId}:${communityId}`, effectiveRtId);
    this.permissions.set(`${resident.userId}:${communityId}`, [
      ...(rolePermissionKeys[input.roleCode] ?? []),
    ]);

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "member.role.changed",
      entityType: "UserRole",
      entityId: resident.userId,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { roleCode: input.roleCode },
    });

    const roleId = roleIdByCode.get(input.roleCode) ?? input.roleCode;
    return {
      outcome: "OK",
      residentId: resident.id,
      roles: [{ id: roleId, code: input.roleCode, name: roleName }],
    };
  }

  async createResidencyRequest(input: {
    auth: AuthSessionRecord;
    communityId: string;
    rtId: string;
    houseCode: string;
    fullName: string;
    relationship: HouseholdRelationship;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateResidencyRequestResult> {
    const community = this.communities.get(input.communityId);
    if (!community?.registrationOpen) return { outcome: "COMMUNITY_NOT_FOUND" };

    const key = `${input.auth.userId}:${community.id}`;
    const existing = this.residents.get(key);
    if (existing?.status === "PENDING") return { outcome: "PENDING_EXISTS" };
    if (existing?.status === "ACTIVE") return { outcome: "ALREADY_ACTIVE" };
    if (existing && existing.status !== "REJECTED") {
      return { outcome: "ACCOUNT_RESTRICTED" };
    }

    const normalizedHouseCode = input.houseCode.trim().toUpperCase();
    const house = [...this.houses.values()].find(
      (candidate) =>
        candidate.communityId === community.id &&
        candidate.code.toUpperCase() === normalizedHouseCode,
    );
    // A mismatched RT is reported identically to a missing house, mirroring
    // prisma-repository.ts's privacy-preserving behavior.
    if (!house || house.rtId !== input.rtId) return { outcome: "HOUSE_NOT_FOUND" };

    const user = this.users.get(input.auth.userId);
    if (!user) return { outcome: "ACCOUNT_RESTRICTED" };
    user.displayName = input.fullName;

    const resident: MemoryResident = {
      id: existing?.id ?? randomUUID(),
      userId: user.id,
      communityId: community.id,
      fullName: input.fullName,
      status: "PENDING",
      requestedHouseId: house.id,
      relationship: input.relationship,
      requestedAt: input.now,
      householdId: null,
    };
    this.residents.set(key, resident);
    this.audits.push({
      communityId: community.id,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "resident.requested",
      entityType: "Resident",
      entityId: resident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: {
        houseCode: house.code,
        relationship: input.relationship,
      },
    });
    return { outcome: "CREATED", request: this.residencyRequestRecord(resident) };
  }

  private requestInRtScope(resident: MemoryResident, rtScopeId: string | null): boolean {
    if (!rtScopeId) return true;
    const house = resident.requestedHouseId ? this.houses.get(resident.requestedHouseId) : null;
    return this.houseRtId(house ?? undefined) === rtScopeId;
  }

  async listPendingResidencyRequests(auth: AuthSessionRecord, limit: number) {
    if (!auth.currentCommunityId) return { items: [], total: 0 };
    const items = [...this.residents.values()]
      .filter(
        (resident) =>
          resident.communityId === auth.currentCommunityId &&
          resident.status === "PENDING" &&
          this.requestInRtScope(resident, auth.rtScopeId),
      )
      .sort((left, right) => left.requestedAt.getTime() - right.requestedAt.getTime())
      .map((resident) => this.residencyRequestRecord(resident));
    return { items: items.slice(0, limit), total: items.length };
  }

  async approveResidencyRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ReviewResidencyRequestResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const resident = [...this.residents.values()].find(
      (candidate) =>
        candidate.id === input.requestId &&
        candidate.communityId === input.auth.currentCommunityId &&
        this.requestInRtScope(candidate, input.auth.rtScopeId),
    );
    if (!resident) return { outcome: "NOT_FOUND" };
    if (resident.status !== "PENDING") return { outcome: "NOT_PENDING" };
    if (!resident.requestedHouseId || !resident.relationship) {
      return { outcome: "CONFIGURATION_ERROR" };
    }

    const house = this.houses.get(resident.requestedHouseId);
    if (!house || house.communityId !== resident.communityId) {
      return { outcome: "CONFIGURATION_ERROR" };
    }
    let household = [...this.households.values()].find(
      (candidate) =>
        candidate.communityId === resident.communityId && candidate.houseId === house.id,
    );
    if (!household) {
      household = {
        id: randomUUID(),
        communityId: resident.communityId,
        houseId: house.id,
        displayName: `Rumah ${house.code}`,
      };
      this.households.set(household.id, household);
    }

    resident.status = "ACTIVE";
    resident.householdId = household.id;
    this.permissions.set(`${resident.userId}:${resident.communityId}`, [...readPermissions]);
    for (const session of this.sessions.values()) {
      if (session.userId === resident.userId && !session.revokedAt) {
        session.currentCommunityId = resident.communityId;
        session.currentHouseholdId = household.id;
      }
    }
    this.audits.push({
      communityId: resident.communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "resident.approved",
      entityType: "Resident",
      entityId: resident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return {
      outcome: "APPROVED",
      requestId: resident.id,
      householdId: household.id,
      reviewedAt: input.now,
    };
  }

  async rejectResidencyRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    reason: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ReviewResidencyRequestResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const resident = [...this.residents.values()].find(
      (candidate) =>
        candidate.id === input.requestId &&
        candidate.communityId === input.auth.currentCommunityId &&
        this.requestInRtScope(candidate, input.auth.rtScopeId),
    );
    if (!resident) return { outcome: "NOT_FOUND" };
    if (resident.status !== "PENDING") return { outcome: "NOT_PENDING" };
    resident.status = "REJECTED";
    this.audits.push({
      communityId: resident.communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "resident.rejected",
      entityType: "Resident",
      entityId: resident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return {
      outcome: "REJECTED",
      requestId: resident.id,
      reviewedAt: input.now,
    };
  }

  async getHome(auth: AuthSessionRecord, now: Date): Promise<HomeRecord | null> {
    const me = await this.getMe(auth);
    if (!me || me.authState !== "READY" || !me.currentContext) return null;
    const visible = this.visibleAnnouncements(auth, now);
    return {
      viewerName: me.displayName ?? "Warga",
      community: me.currentContext.community,
      household: me.currentContext.household,
      latestAnnouncements: visible.slice(0, 3),
      unreadAnnouncementCount: visible.filter((item) => !item.isRead).length,
    };
  }

  async listAnnouncements(
    auth: AuthSessionRecord,
    now: Date,
    limit: number,
    filter: AnnouncementFilter = "all",
  ): Promise<{ items: AnnouncementRecord[]; total: number }> {
    // Same rule as `announcementBadge`: "Penting" is about priority, the other
    // two chips are about the stored category.
    const items = this.visibleAnnouncements(auth, now).filter((item) => {
      switch (filter) {
        case "important":
          return item.priority !== "NORMAL";
        case "event":
          return item.category === "EVENT";
        case "info":
          return item.category === "INFO";
        case "all":
          return true;
      }
    });
    return { items: items.slice(0, limit), total: items.length };
  }

  async getAnnouncement(
    auth: AuthSessionRecord,
    id: string,
    now: Date,
  ): Promise<AnnouncementRecord | null> {
    return this.visibleAnnouncements(auth, now).find((item) => item.id === id) ?? null;
  }

  async markAnnouncementRead(auth: AuthSessionRecord, id: string, now: Date): Promise<Date | null> {
    const announcement = await this.getAnnouncement(auth, id, now);
    if (!announcement) return null;
    const key = `${auth.userId}:${id}`;
    const existing = this.reads.get(key);
    if (existing) return existing;
    this.reads.set(key, now);
    return now;
  }

  async createAnnouncement(input: {
    auth: AuthSessionRecord;
    announcement: CreateAnnouncementInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<AnnouncementRecord> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) throw new Error("No community selected.");

    const id = randomUUID();
    const item: MemoryAnnouncement = {
      id,
      communityId,
      authorId: input.auth.userId,
      title: input.announcement.title,
      summary: input.announcement.summary,
      body: input.announcement.body,
      priority: input.announcement.priority,
      category: input.announcement.category,
      coverImageUrl: input.announcement.coverImageUrl ?? null,
      publishedAt: input.now,
      isRead: false,
      archivedAt: null,
    };
    this.announcements.push(item);

    const activeResidents = [...this.residents.values()].filter(
      (r) => r.communityId === communityId && r.status === "ACTIVE",
    );
    const uniqueUserIds = [...new Set(activeResidents.map((r) => r.userId))];
    for (const userId of uniqueUserIds) {
      this.notifications.push({
        id: randomUUID(),
        communityId,
        userId,
        title: `Pengumuman: ${item.title}`,
        message: item.summary,
        entityType: "ANNOUNCEMENT",
        entityId: item.id,
        priority:
          item.priority === "URGENT"
            ? "URGENT"
            : item.priority === "IMPORTANT"
              ? "IMPORTANT"
              : "NORMAL",
        readAt: null,
        createdAt: input.now,
      });
    }

    return {
      id: item.id,
      title: item.title,
      summary: item.summary,
      body: item.body,
      priority: item.priority,
      category: item.category,
      coverImageUrl: item.coverImageUrl,
      publishedAt: item.publishedAt,
      isRead: false,
    };
  }

  async updateAnnouncement(input: {
    auth: AuthSessionRecord;
    announcementId: string;
    changes: UpdateAnnouncementInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<AnnouncementMutationResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const announcement = this.announcements.find(
      (item) => item.id === input.announcementId && !item.archivedAt,
    );
    if (!announcement) return { outcome: "NOT_FOUND" };

    if (input.changes.title !== undefined) announcement.title = input.changes.title;
    if (input.changes.summary !== undefined) announcement.summary = input.changes.summary;
    if (input.changes.body !== undefined) announcement.body = input.changes.body;
    if (input.changes.priority !== undefined) announcement.priority = input.changes.priority;
    if (input.changes.category !== undefined) announcement.category = input.changes.category;
    // `null` clears the cover; `undefined` leaves it untouched.
    if (input.changes.coverImageUrl !== undefined) {
      announcement.coverImageUrl = input.changes.coverImageUrl;
    }

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "announcement.updated",
      entityType: "Announcement",
      entityId: announcement.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return { outcome: "OK", announcement };
  }

  async archiveAnnouncement(input: {
    auth: AuthSessionRecord;
    announcementId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ArchiveAnnouncementResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const announcement = this.announcements.find(
      (item) => item.id === input.announcementId && !item.archivedAt,
    );
    if (!announcement) return { outcome: "NOT_FOUND" };

    announcement.archivedAt = input.now;

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "announcement.archived",
      entityType: "Announcement",
      entityId: announcement.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return { outcome: "OK", announcementId: announcement.id, archivedAt: input.now };
  }

  async listAgenda(input: {
    auth: AuthSessionRecord;
    now: Date;
    view: AgendaView;
    cursor?: string;
    limit: number;
  }) {
    const items = this.visibleAgenda(input.auth, input.now, input.view);
    const cursorIndex = input.cursor ? items.findIndex((event) => event.id === input.cursor) : -1;
    if (input.cursor && cursorIndex < 0) return { outcome: "INVALID_CURSOR" as const };
    const start = cursorIndex + 1;
    const page = items.slice(start, start + input.limit);
    const hasMore = start + input.limit < items.length;
    return {
      outcome: "OK" as const,
      items: page.map(publicAgendaEvent),
      total: items.length,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getAgendaEvent(auth: AuthSessionRecord, id: string): Promise<AgendaRecord | null> {
    const event = this.agendaEvents.find(
      (candidate) =>
        candidate.id === id &&
        candidate.communityId === auth.currentCommunityId &&
        candidate.archivedAt === null,
    );
    if (!event) return null;
    return publicAgendaEvent(event);
  }

  async createAgendaEvent(input: {
    auth: AuthSessionRecord;
    event: CreateAgendaEventInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<AgendaMutationResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    if (input.event.endTime <= input.event.startTime) return { outcome: "INVALID_TIME_RANGE" };
    const event: MemoryAgendaEvent = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      ...input.event,
      archivedAt: null,
    };
    this.agendaEvents.push(event);
    const recipientIds = [
      ...new Set(
        [...this.residents.values()]
          .filter(
            (resident) =>
              resident.communityId === event.communityId && resident.status === "ACTIVE",
          )
          .map((resident) => resident.userId),
      ),
    ];
    for (const userId of recipientIds) {
      this.notifications.push({
        id: randomUUID(),
        communityId: event.communityId,
        userId,
        title: `Agenda baru: ${event.title}`,
        message: `${event.date}, ${event.startTime} di ${event.location}.`,
        readAt: null,
        createdAt: input.now,
        entityType: "EVENT",
        entityId: event.id,
        priority: "NORMAL",
      });
    }
    this.audits.push({
      communityId: event.communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "agenda.created",
      entityType: "Event",
      entityId: event.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: {
        date: event.date,
        startTime: event.startTime,
        notifiedUsers: recipientIds.length,
      },
    });
    return { outcome: "OK", event: publicAgendaEvent(event) };
  }

  async updateAgendaEvent(input: {
    auth: AuthSessionRecord;
    eventId: string;
    changes: UpdateAgendaEventInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<AgendaMutationResult> {
    const event = this.agendaEvents.find(
      (candidate) =>
        candidate.id === input.eventId && candidate.communityId === input.auth.currentCommunityId,
    );
    if (!event) return { outcome: "NOT_FOUND" };
    if (event.archivedAt) return { outcome: "ARCHIVED" };
    const startTime = input.changes.startTime ?? event.startTime;
    const endTime = input.changes.endTime ?? event.endTime;
    if (endTime <= startTime) return { outcome: "INVALID_TIME_RANGE" };
    Object.assign(event, input.changes);
    this.audits.push({
      communityId: event.communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "agenda.updated",
      entityType: "Event",
      entityId: event.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { changedFieldCount: Object.keys(input.changes).length },
    });
    return { outcome: "OK", event: publicAgendaEvent(event) };
  }

  async archiveAgendaEvent(input: {
    auth: AuthSessionRecord;
    eventId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ArchiveAgendaResult> {
    const event = this.agendaEvents.find(
      (candidate) =>
        candidate.id === input.eventId && candidate.communityId === input.auth.currentCommunityId,
    );
    if (!event) return { outcome: "NOT_FOUND" };
    if (!event.archivedAt) {
      event.archivedAt = input.now;
      this.audits.push({
        communityId: event.communityId,
        actorUserId: input.auth.userId,
        sessionId: input.auth.sessionId,
        action: "agenda.archived",
        entityType: "Event",
        entityId: event.id,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }
    return { outcome: "ARCHIVED", eventId: event.id, archivedAt: event.archivedAt };
  }

  async listNotifications(input: { auth: AuthSessionRecord; cursor?: string; limit: number }) {
    const items = this.notifications
      .filter(
        (notification) =>
          notification.communityId === input.auth.currentCommunityId &&
          notification.userId === input.auth.userId,
      )
      .sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id),
      );
    const cursorIndex = input.cursor
      ? items.findIndex((notification) => notification.id === input.cursor)
      : -1;
    if (input.cursor && cursorIndex < 0) return { outcome: "INVALID_CURSOR" as const };
    const start = cursorIndex + 1;
    const page = items.slice(start, start + input.limit);
    const hasMore = start + input.limit < items.length;
    return {
      outcome: "OK" as const,
      items: page.map(publicNotification),
      total: items.length,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getUnreadNotificationCount(auth: AuthSessionRecord): Promise<number> {
    return this.notifications.filter(
      (notification) =>
        notification.communityId === auth.currentCommunityId &&
        notification.userId === auth.userId &&
        notification.readAt === null,
    ).length;
  }

  async markNotificationRead(input: {
    auth: AuthSessionRecord;
    notificationId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<NotificationReadResult> {
    const notification = this.notifications.find(
      (candidate) =>
        candidate.id === input.notificationId &&
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.userId === input.auth.userId,
    );
    if (!notification) return { outcome: "NOT_FOUND" };
    if (!notification.readAt) {
      notification.readAt = input.now;
      this.audits.push({
        communityId: notification.communityId,
        actorUserId: input.auth.userId,
        sessionId: input.auth.sessionId,
        action: "notification.read",
        entityType: "Notification",
        entityId: notification.id,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }
    return { outcome: "READ", notificationId: notification.id, readAt: notification.readAt };
  }

  async markAllNotificationsRead(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<{ readAt: Date; updatedCount: number }> {
    const unread = this.notifications.filter(
      (notification) =>
        notification.communityId === input.auth.currentCommunityId &&
        notification.userId === input.auth.userId &&
        notification.readAt === null,
    );
    for (const notification of unread) notification.readAt = input.now;
    if (unread.length > 0) {
      this.audits.push({
        communityId: input.auth.currentCommunityId,
        actorUserId: input.auth.userId,
        sessionId: input.auth.sessionId,
        action: "notification.read_all",
        entityType: "Notification",
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
        metadata: { updatedCount: unread.length },
      });
    }
    return { readAt: input.now, updatedCount: unread.length };
  }

  async registerPushToken(input: {
    auth: AuthSessionRecord;
    token: string;
    platform: string;
    now: Date;
  }): Promise<{ id: string; token: string }> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) throw new Error("No community selected.");

    const existing = this.pushTokens.find((t) => t.token === input.token);
    if (existing) {
      existing.userId = input.auth.userId;
      existing.communityId = communityId;
      existing.platform = input.platform;
      return { id: existing.id, token: existing.token };
    }

    const created = {
      id: randomUUID(),
      userId: input.auth.userId,
      communityId,
      token: input.token,
      platform: input.platform,
    };
    this.pushTokens.push(created);
    return { id: created.id, token: created.token };
  }

  async listCurrentHouseholdVehicles(auth: AuthSessionRecord): Promise<VehicleRecord[]> {
    if (!this.hasCurrentHouseholdAccess(auth)) return [];
    return this.vehicles
      .filter(
        (vehicle) =>
          vehicle.communityId === auth.currentCommunityId &&
          vehicle.householdId === auth.currentHouseholdId &&
          vehicle.archivedAt === null,
      )
      .sort(
        (left, right) =>
          left.status.localeCompare(right.status) ||
          (left.plateNormalized ?? "").localeCompare(right.plateNormalized ?? "") ||
          left.createdAt.getTime() - right.createdAt.getTime(),
      )
      .map((vehicle) => this.vehicleRecord(vehicle));
  }

  async createVehicle(input: {
    auth: AuthSessionRecord;
    vehicle: CreateVehicleInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<VehicleMutationResult> {
    if (!this.hasCurrentHouseholdAccess(input.auth)) return { outcome: "NOT_FOUND" };
    const communityId = input.auth.currentCommunityId;
    const householdId = input.auth.currentHouseholdId;
    if (!communityId || !householdId) return { outcome: "NOT_FOUND" };
    const plate = input.vehicle.plate ? formatVehiclePlate(input.vehicle.plate) : null;
    const plateNormalized = plate ? normalizeVehiclePlate(plate) : null;
    if ((input.vehicle.type === "CAR" || input.vehicle.type === "MOTORCYCLE") && !plateNormalized) {
      return { outcome: "PLATE_REQUIRED" };
    }
    if (
      input.vehicle.ownerResidentId &&
      !this.isActiveHouseholdResident(input.vehicle.ownerResidentId, communityId, householdId)
    ) {
      return { outcome: "OWNER_NOT_FOUND" };
    }
    if (
      plateNormalized &&
      this.vehicles.some(
        (vehicle) =>
          vehicle.communityId === communityId &&
          vehicle.plateNormalized === plateNormalized &&
          vehicle.archivedAt === null,
      )
    ) {
      return { outcome: "PLATE_CONFLICT" };
    }
    const vehicle: MemoryVehicle = {
      id: randomUUID(),
      communityId,
      householdId,
      ownerResidentId: input.vehicle.ownerResidentId,
      type: input.vehicle.type,
      plate,
      plateNormalized,
      brand: input.vehicle.brand,
      model: input.vehicle.model,
      color: input.vehicle.color,
      ownerLabel: input.vehicle.ownerLabel,
      status: input.vehicle.status,
      archivedAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    };
    this.vehicles.push(vehicle);
    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "vehicle.created",
      entityType: "Vehicle",
      entityId: vehicle.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { type: vehicle.type, hasPlate: vehicle.plateNormalized !== null },
    });
    return { outcome: "OK", vehicle: this.vehicleRecord(vehicle) };
  }

  async updateVehicle(input: {
    auth: AuthSessionRecord;
    vehicleId: string;
    changes: UpdateVehicleInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<VehicleMutationResult> {
    if (!this.hasCurrentHouseholdAccess(input.auth)) return { outcome: "NOT_FOUND" };
    const communityId = input.auth.currentCommunityId;
    const householdId = input.auth.currentHouseholdId;
    if (!communityId || !householdId) return { outcome: "NOT_FOUND" };
    const vehicle = this.vehicles.find(
      (candidate) =>
        candidate.id === input.vehicleId &&
        candidate.communityId === communityId &&
        candidate.householdId === householdId &&
        candidate.archivedAt === null,
    );
    if (!vehicle) return { outcome: "NOT_FOUND" };
    const type = input.changes.type ?? vehicle.type;
    const plate =
      input.changes.plate === undefined
        ? vehicle.plate
        : input.changes.plate
          ? formatVehiclePlate(input.changes.plate)
          : null;
    const plateNormalized = plate ? normalizeVehiclePlate(plate) : null;
    if ((type === "CAR" || type === "MOTORCYCLE") && !plateNormalized) {
      return { outcome: "PLATE_REQUIRED" };
    }
    if (
      input.changes.ownerResidentId &&
      !this.isActiveHouseholdResident(input.changes.ownerResidentId, communityId, householdId)
    ) {
      return { outcome: "OWNER_NOT_FOUND" };
    }
    if (
      plateNormalized &&
      this.vehicles.some(
        (candidate) =>
          candidate.id !== vehicle.id &&
          candidate.communityId === communityId &&
          candidate.plateNormalized === plateNormalized &&
          candidate.archivedAt === null,
      )
    ) {
      return { outcome: "PLATE_CONFLICT" };
    }
    Object.assign(vehicle, input.changes, {
      plate,
      plateNormalized,
      updatedAt: input.now,
    });
    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "vehicle.updated",
      entityType: "Vehicle",
      entityId: vehicle.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { changedFields: Object.keys(input.changes).sort().join(",") },
    });
    return { outcome: "OK", vehicle: this.vehicleRecord(vehicle) };
  }

  async archiveVehicle(input: {
    auth: AuthSessionRecord;
    vehicleId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ArchiveVehicleResult> {
    if (!this.hasCurrentHouseholdAccess(input.auth)) return { outcome: "NOT_FOUND" };
    const vehicle = this.vehicles.find(
      (candidate) =>
        candidate.id === input.vehicleId &&
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.householdId === input.auth.currentHouseholdId &&
        candidate.archivedAt === null,
    );
    if (!vehicle) return { outcome: "NOT_FOUND" };
    vehicle.status = "INACTIVE";
    vehicle.archivedAt = input.now;
    vehicle.updatedAt = input.now;
    this.audits.push({
      communityId: vehicle.communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "vehicle.archived",
      entityType: "Vehicle",
      entityId: vehicle.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "ARCHIVED", vehicleId: vehicle.id, archivedAt: input.now };
  }

  async searchVehicleByPlate(
    auth: AuthSessionRecord,
    query: string,
  ): Promise<VehicleSearchRecord | null> {
    if (!auth.currentCommunityId) return null;
    const vehicle = this.vehicles.find(
      (candidate) =>
        candidate.communityId === auth.currentCommunityId &&
        candidate.plateNormalized === normalizeVehiclePlate(query) &&
        candidate.archivedAt === null,
    );
    if (!vehicle?.plate) return null;
    const house = this.houseForVehicle(vehicle);
    if (!house) return null;
    return {
      vehicleId: vehicle.id,
      type: vehicle.type,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      ownerLabel: vehicle.ownerLabel,
      houseCode: house.code,
      status: vehicle.status,
    };
  }

  private visibleCameraAccessLevels(permissions: string[]): CameraAccessLevel[] {
    if (permissions.includes("camera.manage")) return ["RESIDENT", "SECURITY", "ADMIN_ONLY"];
    const levels: CameraAccessLevel[] = [];
    if (permissions.includes("camera.public.read")) levels.push("RESIDENT");
    if (permissions.includes("camera.security.read")) levels.push("SECURITY");
    return levels;
  }

  private cameraCanSee(accessLevel: CameraAccessLevel, permissions: string[]): boolean {
    if (permissions.includes("camera.manage")) return true;
    if (accessLevel === "RESIDENT") return permissions.includes("camera.public.read");
    if (accessLevel === "SECURITY") return permissions.includes("camera.security.read");
    return false;
  }

  private cameraRecord(camera: MemoryCamera): CameraRecord {
    return {
      id: camera.id,
      name: camera.name,
      location: camera.location,
      accessLevel: camera.accessLevel,
      status: camera.status,
      lastOnlineAt: camera.lastOnlineAt,
    };
  }

  async listCameras(auth: AuthSessionRecord): Promise<CameraRecord[]> {
    if (!auth.currentCommunityId) return [];
    const levels = this.visibleCameraAccessLevels(auth.permissions);
    if (levels.length === 0) return [];
    return this.cameras
      .filter(
        (camera) =>
          camera.communityId === auth.currentCommunityId &&
          camera.archivedAt === null &&
          levels.includes(camera.accessLevel),
      )
      .sort(
        (left, right) =>
          left.displayOrder - right.displayOrder || left.name.localeCompare(right.name),
      )
      .map((camera) => this.cameraRecord(camera));
  }

  async createCamera(input: {
    auth: AuthSessionRecord;
    camera: CreateCameraInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CameraRecord> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to create a camera.");
    }
    const camera: MemoryCamera = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      name: input.camera.name,
      location: input.camera.location ?? null,
      accessLevel: input.camera.accessLevel,
      status: "ONLINE",
      lastOnlineAt: input.now,
      displayOrder: this.cameras.length + 1,
      archivedAt: null,
    };
    this.cameras.push(camera);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "camera.created",
      entityType: "Camera",
      entityId: camera.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.cameraRecord(camera);
  }

  async updateCamera(input: {
    auth: AuthSessionRecord;
    cameraId: string;
    changes: UpdateCameraInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CameraMutationResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const camera = this.cameras.find(
      (candidate) =>
        candidate.id === input.cameraId &&
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.archivedAt === null,
    );
    if (!camera) return { outcome: "NOT_FOUND" };
    if (input.changes.name !== undefined) camera.name = input.changes.name;
    if (input.changes.location !== undefined) camera.location = input.changes.location;
    if (input.changes.accessLevel !== undefined) camera.accessLevel = input.changes.accessLevel;
    if (input.changes.status !== undefined) {
      camera.status = input.changes.status;
      if (input.changes.status === "ONLINE") camera.lastOnlineAt = input.now;
    }
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "camera.updated",
      entityType: "Camera",
      entityId: camera.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", camera: this.cameraRecord(camera) };
  }

  async issueStreamTicket(input: {
    auth: AuthSessionRecord;
    cameraId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<StreamTicketResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const camera = this.cameras.find(
      (candidate) =>
        candidate.id === input.cameraId &&
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.archivedAt === null,
    );
    if (!camera) return { outcome: "NOT_FOUND" };
    if (!this.cameraCanSee(camera.accessLevel, input.auth.permissions)) {
      return { outcome: "FORBIDDEN" };
    }
    const viewerName = this.users.get(input.auth.userId)?.displayName ?? "Warga";
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "camera.stream_ticket.issued",
      entityType: "Camera",
      entityId: camera.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    if (camera.status === "OFFLINE") {
      return {
        outcome: "OK",
        cameraId: camera.id,
        mode: "mock",
        status: "OFFLINE",
        ticket: null,
        expiresAt: null,
        viewerName,
      };
    }
    return {
      outcome: "OK",
      cameraId: camera.id,
      mode: "mock",
      status: "ONLINE",
      ticket: `mock-${randomUUID()}`,
      expiresAt: new Date(input.now.getTime() + 60_000),
      viewerName,
    };
  }

  private resolveHouseLabel(auth: AuthSessionRecord): string {
    if (!auth.currentHouseholdId) return "Rumah tidak diketahui";
    const household = this.households.get(auth.currentHouseholdId);
    if (!household) return "Rumah tidak diketahui";
    const house = this.houses.get(household.houseId);
    if (!house) return "Rumah tidak diketahui";
    return `Blok ${house.block} No. ${house.number}`;
  }

  private emergencyRecord(emergency: MemoryEmergency): EmergencyRecord {
    return {
      id: emergency.id,
      kind: emergency.kind,
      status: emergency.status,
      houseLabel: emergency.houseLabel,
      senderName: this.users.get(emergency.senderUserId)?.displayName ?? "Pengguna Komplekku",
      note: emergency.note,
      sentAt: emergency.sentAt,
      acknowledgedAt: emergency.acknowledgedAt,
      respondingAt: emergency.respondingAt,
      resolvedAt: emergency.resolvedAt,
    };
  }

  async createEmergency(input: {
    auth: AuthSessionRecord;
    kind: EmergencyKind;
    note?: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<EmergencyRecord> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to send an emergency alert.");
    }
    const emergency: MemoryEmergency = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      senderUserId: input.auth.userId,
      kind: input.kind,
      status: "SENT",
      houseLabel: this.resolveHouseLabel(input.auth),
      note: input.note ?? null,
      sentAt: input.now,
      acknowledgedAt: null,
      respondingAt: null,
      resolvedAt: null,
    };
    this.emergencies.push(emergency);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "emergency.sent",
      entityType: "Emergency",
      entityId: emergency.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { kind: input.kind },
    });
    return this.emergencyRecord(emergency);
  }

  async listEmergencies(auth: AuthSessionRecord, limit: number): Promise<EmergencyRecord[]> {
    if (!auth.currentCommunityId) return [];
    return this.emergencies
      .filter((emergency) => emergency.communityId === auth.currentCommunityId)
      .sort((left, right) => right.sentAt.getTime() - left.sentAt.getTime())
      .slice(0, limit)
      .map((emergency) => this.emergencyRecord(emergency));
  }

  private transitionEmergency(
    auth: AuthSessionRecord,
    emergencyId: string,
    allowedFrom: EmergencyStatus[],
    apply: (emergency: MemoryEmergency) => void,
  ): EmergencyTransitionResult {
    if (!auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const emergency = this.emergencies.find(
      (candidate) =>
        candidate.id === emergencyId && candidate.communityId === auth.currentCommunityId,
    );
    if (!emergency) return { outcome: "NOT_FOUND" };
    if (!allowedFrom.includes(emergency.status)) return { outcome: "INVALID_TRANSITION" };
    apply(emergency);
    return { outcome: "OK", emergency: this.emergencyRecord(emergency) };
  }

  async acknowledgeEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<EmergencyTransitionResult> {
    const result = this.transitionEmergency(
      input.auth,
      input.emergencyId,
      ["SENT"],
      (emergency) => {
        emergency.status = "ACKNOWLEDGED";
        emergency.acknowledgedAt = input.now;
      },
    );
    if (result.outcome === "OK") {
      this.audits.push({
        communityId: input.auth.currentCommunityId,
        actorUserId: input.auth.userId,
        action: "emergency.acknowledged",
        entityType: "Emergency",
        entityId: input.emergencyId,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }
    return result;
  }

  async respondToEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<EmergencyTransitionResult> {
    const result = this.transitionEmergency(
      input.auth,
      input.emergencyId,
      ["SENT", "ACKNOWLEDGED"],
      (emergency) => {
        emergency.status = "RESPONDING";
        emergency.respondingAt = input.now;
      },
    );
    if (result.outcome === "OK") {
      this.audits.push({
        communityId: input.auth.currentCommunityId,
        actorUserId: input.auth.userId,
        action: "emergency.responding",
        entityType: "Emergency",
        entityId: input.emergencyId,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }
    return result;
  }

  async resolveEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<EmergencyTransitionResult> {
    const result = this.transitionEmergency(
      input.auth,
      input.emergencyId,
      ["SENT", "ACKNOWLEDGED", "RESPONDING"],
      (emergency) => {
        emergency.status = "RESOLVED";
        emergency.resolvedAt = input.now;
      },
    );
    if (result.outcome === "OK") {
      this.audits.push({
        communityId: input.auth.currentCommunityId,
        actorUserId: input.auth.userId,
        action: "emergency.resolved",
        entityType: "Emergency",
        entityId: input.emergencyId,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }
    return result;
  }

  private visitorRecord(visitor: MemoryVisitor): VisitorRecord {
    const household = this.households.get(visitor.householdId);
    const house = household ? this.houses.get(household.houseId) : undefined;
    return {
      id: visitor.id,
      guestName: visitor.guestName,
      guestPhone: visitor.guestPhone,
      visitDate: visitor.visitDate,
      expectedTime: visitor.expectedTime,
      vehicleInfo: visitor.vehicleInfo,
      plate: visitor.plate,
      purpose: visitor.purpose,
      notes: visitor.notes,
      status: visitor.status,
      isWalkIn: visitor.isWalkIn,
      houseCode: house?.code ?? "",
      householdDisplayName: household?.displayName ?? "",
      checkedInAt: visitor.checkedInAt,
      checkedOutAt: visitor.checkedOutAt,
      createdAt: visitor.createdAt,
      qrToken: visitor.qrToken,
    };
  }

  async createVisitor(input: {
    auth: AuthSessionRecord;
    visitor: CreateVisitorInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateVisitorResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "HOUSEHOLD_NOT_FOUND" };
    }
    const visitor: MemoryVisitor = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      householdId: input.auth.currentHouseholdId,
      guestName: input.visitor.guestName,
      guestPhone: input.visitor.guestPhone ?? null,
      visitDate: input.visitor.visitDate,
      expectedTime: input.visitor.expectedTime ?? null,
      vehicleInfo: input.visitor.vehicleInfo ?? null,
      plate: input.visitor.plate ?? null,
      purpose: input.visitor.purpose ?? null,
      notes: input.visitor.notes ?? null,
      qrToken: randomUUID(),
      status: "PENDING",
      isWalkIn: false,
      checkedInAt: null,
      checkedOutAt: null,
      createdAt: input.now,
    };
    this.visitors.push(visitor);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "visitor.created",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", visitor: this.visitorRecord(visitor) };
  }

  async createWalkInVisitor(input: {
    auth: AuthSessionRecord;
    visitor: CreateWalkInVisitorInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateVisitorResult> {
    if (!input.auth.currentCommunityId) return { outcome: "HOUSE_NOT_FOUND" };
    const house = [...this.houses.values()].find(
      (candidate) =>
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.code === input.visitor.houseCode,
    );
    if (!house) return { outcome: "HOUSE_NOT_FOUND" };
    const household = [...this.households.values()].find(
      (candidate) => candidate.houseId === house.id,
    );
    if (!household) return { outcome: "HOUSEHOLD_NOT_FOUND" };

    const visitor: MemoryVisitor = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      householdId: household.id,
      guestName: input.visitor.guestName,
      guestPhone: input.visitor.guestPhone ?? null,
      visitDate: input.now.toISOString().slice(0, 10),
      expectedTime: null,
      vehicleInfo: input.visitor.vehicleInfo ?? null,
      plate: input.visitor.plate ?? null,
      purpose: input.visitor.purpose ?? null,
      notes: null,
      qrToken: randomUUID(),
      status: "CHECKED_IN",
      isWalkIn: true,
      checkedInAt: input.now,
      checkedOutAt: null,
      createdAt: input.now,
    };
    this.visitors.push(visitor);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "visitor.walk_in.checked_in",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", visitor: this.visitorRecord(visitor) };
  }

  async listVisitors(input: { auth: AuthSessionRecord; limit: number }): Promise<VisitorRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("visitor.checkin");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    return this.visitors
      .filter(
        (visitor) =>
          visitor.communityId === input.auth.currentCommunityId &&
          (canSeeAll || visitor.householdId === input.auth.currentHouseholdId),
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, input.limit)
      .map((visitor) => this.visitorRecord(visitor));
  }

  async findVisitorByQrToken(
    auth: AuthSessionRecord,
    qrToken: string,
  ): Promise<VisitorRecord | null> {
    if (!auth.currentCommunityId) return null;
    const visitor = this.visitors.find(
      (candidate) =>
        candidate.qrToken === qrToken && candidate.communityId === auth.currentCommunityId,
    );
    return visitor ? this.visitorRecord(visitor) : null;
  }

  async checkInVisitor(input: {
    auth: AuthSessionRecord;
    qrToken: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<VisitorCheckResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const visitor = this.visitors.find(
      (candidate) =>
        candidate.qrToken === input.qrToken &&
        candidate.communityId === input.auth.currentCommunityId,
    );
    if (!visitor) return { outcome: "NOT_FOUND" };
    if (visitor.status !== "PENDING") return { outcome: "INVALID_TRANSITION" };
    visitor.status = "CHECKED_IN";
    visitor.checkedInAt = input.now;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "visitor.checked_in",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", visitor: this.visitorRecord(visitor) };
  }

  async checkOutVisitor(input: {
    auth: AuthSessionRecord;
    visitorId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<VisitorCheckResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const visitor = this.visitors.find(
      (candidate) =>
        candidate.id === input.visitorId && candidate.communityId === input.auth.currentCommunityId,
    );
    if (!visitor) return { outcome: "NOT_FOUND" };
    if (visitor.status !== "CHECKED_IN") return { outcome: "INVALID_TRANSITION" };
    visitor.status = "CHECKED_OUT";
    visitor.checkedOutAt = input.now;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "visitor.checked_out",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", visitor: this.visitorRecord(visitor) };
  }

  private packageRecord(pkg: MemoryPackage): PackageRecord {
    const household = this.households.get(pkg.householdId);
    const house = household ? this.houses.get(household.houseId) : undefined;
    return {
      id: pkg.id,
      recipientName: pkg.recipientName,
      courier: pkg.courier,
      trackingNumber: pkg.trackingNumber,
      status: pkg.status,
      houseCode: house?.code ?? "",
      householdDisplayName: household?.displayName ?? "",
      receivedAt: pkg.receivedAt,
      collectedAt: pkg.collectedAt,
      collectedByName: pkg.collectedByName,
    };
  }

  async createPackage(input: {
    auth: AuthSessionRecord;
    package: CreatePackageInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreatePackageResult> {
    if (!input.auth.currentCommunityId) return { outcome: "HOUSE_NOT_FOUND" };
    const house = [...this.houses.values()].find(
      (candidate) =>
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.code === input.package.houseCode,
    );
    if (!house) return { outcome: "HOUSE_NOT_FOUND" };
    const household = [...this.households.values()].find(
      (candidate) => candidate.houseId === house.id,
    );
    if (!household) return { outcome: "HOUSE_NOT_FOUND" };

    const pkg: MemoryPackage = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      householdId: household.id,
      recipientName: input.package.recipientName,
      courier: input.package.courier,
      trackingNumber: input.package.trackingNumber ?? null,
      status: "NOTIFIED",
      receivedAt: input.now,
      collectedAt: null,
      collectedByName: null,
    };
    this.packages.push(pkg);

    const members = [...this.residents.values()].filter(
      (resident) => resident.householdId === household.id && resident.status === "ACTIVE",
    );
    for (const member of members) {
      this.notifications.push({
        id: randomUUID(),
        communityId: input.auth.currentCommunityId,
        userId: member.userId,
        title: "Paket baru",
        message: "Paketmu sudah tiba di pos security.",
        entityType: "PACKAGE",
        entityId: pkg.id,
        priority: "NORMAL",
        readAt: null,
        createdAt: input.now,
      });
    }

    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "package.received",
      entityType: "Package",
      entityId: pkg.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", package: this.packageRecord(pkg) };
  }

  async listPackages(input: { auth: AuthSessionRecord; limit: number }): Promise<PackageRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("package.manage");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    return this.packages
      .filter(
        (pkg) =>
          pkg.communityId === input.auth.currentCommunityId &&
          (canSeeAll || pkg.householdId === input.auth.currentHouseholdId),
      )
      .sort((left, right) => right.receivedAt.getTime() - left.receivedAt.getTime())
      .slice(0, input.limit)
      .map((pkg) => this.packageRecord(pkg));
  }

  async collectPackage(input: {
    auth: AuthSessionRecord;
    packageId: string;
    collectedByName: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CollectPackageResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const pkg = this.packages.find(
      (candidate) =>
        candidate.id === input.packageId && candidate.communityId === input.auth.currentCommunityId,
    );
    if (!pkg) return { outcome: "NOT_FOUND" };
    if (pkg.status === "COLLECTED") return { outcome: "ALREADY_COLLECTED" };
    pkg.status = "COLLECTED";
    pkg.collectedAt = input.now;
    pkg.collectedByName = input.collectedByName;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "package.collected",
      entityType: "Package",
      entityId: pkg.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", package: this.packageRecord(pkg) };
  }

  private securityShiftRecord(shift: MemorySecurityShift): SecurityShiftRecord {
    return {
      id: shift.id,
      officerName: this.users.get(shift.officerUserId)?.displayName ?? "Pengguna Komplekku",
      status: shift.status,
      startedAt: shift.startedAt,
      endedAt: shift.endedAt,
      notes: shift.notes,
    };
  }

  async getActiveSecurityShift(auth: AuthSessionRecord): Promise<SecurityShiftRecord | null> {
    if (!auth.currentCommunityId) return null;
    const shift = this.securityShifts.find(
      (candidate) =>
        candidate.communityId === auth.currentCommunityId &&
        candidate.officerUserId === auth.userId &&
        candidate.status === "ACTIVE",
    );
    return shift ? this.securityShiftRecord(shift) : null;
  }

  async startSecurityShift(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<SecurityShiftRecord> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to start a shift.");
    }
    const existing = await this.getActiveSecurityShift(input.auth);
    if (existing) return existing;
    const shift: MemorySecurityShift = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      officerUserId: input.auth.userId,
      status: "ACTIVE",
      startedAt: input.now,
      endedAt: null,
      notes: null,
    };
    this.securityShifts.push(shift);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "security_shift.started",
      entityType: "SecurityShift",
      entityId: shift.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.securityShiftRecord(shift);
  }

  async endSecurityShift(input: {
    auth: AuthSessionRecord;
    notes?: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<SecurityShiftRecord | null> {
    if (!input.auth.currentCommunityId) return null;
    const shift = this.securityShifts.find(
      (candidate) =>
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.officerUserId === input.auth.userId &&
        candidate.status === "ACTIVE",
    );
    if (!shift) return null;
    shift.status = "COMPLETED";
    shift.endedAt = input.now;
    if (input.notes !== undefined) shift.notes = input.notes;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "security_shift.ended",
      entityType: "SecurityShift",
      entityId: shift.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.securityShiftRecord(shift);
  }

  async listPatrolCheckpoints(auth: AuthSessionRecord): Promise<PatrolCheckpointRecord[]> {
    if (!auth.currentCommunityId) return [];
    return this.patrolCheckpoints
      .filter(
        (checkpoint) =>
          checkpoint.communityId === auth.currentCommunityId && checkpoint.archivedAt === null,
      )
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((checkpoint) => ({
        id: checkpoint.id,
        name: checkpoint.name,
        displayOrder: checkpoint.displayOrder,
      }));
  }

  private patrolSessionRecord(session: MemoryPatrolSession): PatrolSessionRecord {
    const totalCheckpoints = this.patrolCheckpoints.filter(
      (checkpoint) =>
        checkpoint.communityId === session.communityId && checkpoint.archivedAt === null,
    ).length;
    const scans = this.patrolScans
      .filter((scan) => scan.patrolSessionId === session.id)
      .sort((left, right) => left.scannedAt.getTime() - right.scannedAt.getTime())
      .map((scan) => {
        const checkpoint = this.patrolCheckpoints.find(
          (candidate) => candidate.id === scan.checkpointId,
        );
        return {
          checkpointId: scan.checkpointId,
          checkpointName: checkpoint?.name ?? "",
          scannedAt: scan.scannedAt,
          note: scan.note,
        };
      });
    return {
      id: session.id,
      officerName: this.users.get(session.officerUserId)?.displayName ?? "Pengguna Komplekku",
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      totalCheckpoints,
      scans,
    };
  }

  async getActivePatrolSession(auth: AuthSessionRecord): Promise<PatrolSessionRecord | null> {
    if (!auth.currentCommunityId) return null;
    const session = this.patrolSessions.find(
      (candidate) =>
        candidate.communityId === auth.currentCommunityId &&
        candidate.officerUserId === auth.userId &&
        candidate.status === "IN_PROGRESS",
    );
    return session ? this.patrolSessionRecord(session) : null;
  }

  async startPatrolSession(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<PatrolSessionRecord> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to start a patrol.");
    }
    const existing = await this.getActivePatrolSession(input.auth);
    if (existing) return existing;
    const session: MemoryPatrolSession = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      officerUserId: input.auth.userId,
      status: "IN_PROGRESS",
      startedAt: input.now,
      endedAt: null,
    };
    this.patrolSessions.push(session);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "patrol.started",
      entityType: "PatrolSession",
      entityId: session.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.patrolSessionRecord(session);
  }

  async scanPatrolCheckpoint(input: {
    auth: AuthSessionRecord;
    qrToken: string;
    note?: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ScanCheckpointResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NO_ACTIVE_SESSION" };
    const session = this.patrolSessions.find(
      (candidate) =>
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.officerUserId === input.auth.userId &&
        candidate.status === "IN_PROGRESS",
    );
    if (!session) return { outcome: "NO_ACTIVE_SESSION" };
    const checkpoint = this.patrolCheckpoints.find(
      (candidate) =>
        candidate.qrToken === input.qrToken &&
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.archivedAt === null,
    );
    if (!checkpoint) return { outcome: "CHECKPOINT_NOT_FOUND" };
    const alreadyScanned = this.patrolScans.some(
      (scan) => scan.patrolSessionId === session.id && scan.checkpointId === checkpoint.id,
    );
    if (alreadyScanned) return { outcome: "ALREADY_SCANNED" };
    this.patrolScans.push({
      patrolSessionId: session.id,
      checkpointId: checkpoint.id,
      scannedAt: input.now,
      note: input.note ?? null,
    });
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "patrol.checkpoint_scanned",
      entityType: "PatrolCheckpoint",
      entityId: checkpoint.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", session: this.patrolSessionRecord(session) };
  }

  async endPatrolSession(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<PatrolSessionRecord | null> {
    if (!input.auth.currentCommunityId) return null;
    const session = this.patrolSessions.find(
      (candidate) =>
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.officerUserId === input.auth.userId &&
        candidate.status === "IN_PROGRESS",
    );
    if (!session) return null;
    session.status = "COMPLETED";
    session.endedAt = input.now;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "patrol.completed",
      entityType: "PatrolSession",
      entityId: session.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.patrolSessionRecord(session);
  }

  async listPatrolHistory(auth: AuthSessionRecord, limit: number): Promise<PatrolSessionRecord[]> {
    if (!auth.currentCommunityId) return [];
    return this.patrolSessions
      .filter((session) => session.communityId === auth.currentCommunityId)
      .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())
      .slice(0, limit)
      .map((session) => this.patrolSessionRecord(session));
  }

  private incidentRecord(incident: MemoryIncident): IncidentRecord {
    return {
      id: incident.id,
      category: incident.category,
      title: incident.title,
      description: incident.description,
      location: incident.location,
      occurredAt: incident.occurredAt,
      peopleInvolved: incident.peopleInvolved,
      actionTaken: incident.actionTaken,
      status: incident.status,
      reporterName: this.users.get(incident.reporterUserId)?.displayName ?? "Pengguna Komplekku",
      createdAt: incident.createdAt,
    };
  }

  async createIncident(input: {
    auth: AuthSessionRecord;
    incident: CreateIncidentInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<IncidentRecord> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to create an incident report.");
    }
    const incident: MemoryIncident = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      reporterUserId: input.auth.userId,
      category: input.incident.category,
      title: input.incident.title,
      description: input.incident.description,
      location: input.incident.location ?? null,
      occurredAt: new Date(input.incident.occurredAt),
      peopleInvolved: input.incident.peopleInvolved ?? null,
      actionTaken: null,
      status: "OPEN",
      createdAt: input.now,
    };
    this.incidents.push(incident);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "incident.created",
      entityType: "Incident",
      entityId: incident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { category: input.incident.category },
    });
    return this.incidentRecord(incident);
  }

  async listIncidents(input: {
    auth: AuthSessionRecord;
    status?: IncidentStatus;
    limit: number;
  }): Promise<IncidentRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    return this.incidents
      .filter(
        (incident) =>
          incident.communityId === input.auth.currentCommunityId &&
          (!input.status || incident.status === input.status),
      )
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
      .slice(0, input.limit)
      .map((incident) => this.incidentRecord(incident));
  }

  async getIncident(auth: AuthSessionRecord, id: string): Promise<IncidentRecord | null> {
    if (!auth.currentCommunityId) return null;
    const incident = this.incidents.find(
      (candidate) => candidate.id === id && candidate.communityId === auth.currentCommunityId,
    );
    return incident ? this.incidentRecord(incident) : null;
  }

  async updateIncident(input: {
    auth: AuthSessionRecord;
    incidentId: string;
    changes: UpdateIncidentInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<UpdateIncidentResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const incident = this.incidents.find(
      (candidate) =>
        candidate.id === input.incidentId &&
        candidate.communityId === input.auth.currentCommunityId,
    );
    if (!incident) return { outcome: "NOT_FOUND" };
    if (input.changes.status !== undefined) incident.status = input.changes.status;
    if (input.changes.actionTaken !== undefined) incident.actionTaken = input.changes.actionTaken;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "incident.updated",
      entityType: "Incident",
      entityId: incident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { changedFields: Object.keys(input.changes).sort().join(",") },
    });
    return { outcome: "OK", incident: this.incidentRecord(incident) };
  }

  async getSecurityDashboard(auth: AuthSessionRecord, now: Date): Promise<SecurityDashboardRecord> {
    void now;
    if (!auth.currentCommunityId) {
      return {
        activeShift: null,
        activeVisitorCount: 0,
        pendingPackageCount: 0,
        camerasOnline: 0,
        camerasTotal: 0,
        openEmergencyCount: 0,
        activePatrolSession: null,
      };
    }
    const communityId = auth.currentCommunityId;
    const shift = await this.getActiveSecurityShift(auth);
    const patrol = await this.getActivePatrolSession(auth);
    return {
      activeShift: shift ? { id: shift.id, startedAt: shift.startedAt } : null,
      activeVisitorCount: this.visitors.filter(
        (visitor) => visitor.communityId === communityId && visitor.status === "CHECKED_IN",
      ).length,
      pendingPackageCount: this.packages.filter(
        (pkg) => pkg.communityId === communityId && pkg.status !== "COLLECTED",
      ).length,
      camerasOnline: this.cameras.filter(
        (camera) =>
          camera.communityId === communityId &&
          camera.archivedAt === null &&
          camera.status === "ONLINE",
      ).length,
      camerasTotal: this.cameras.filter(
        (camera) => camera.communityId === communityId && camera.archivedAt === null,
      ).length,
      openEmergencyCount: this.emergencies.filter(
        (emergency) => emergency.communityId === communityId && emergency.status !== "RESOLVED",
      ).length,
      activePatrolSession: patrol
        ? {
            id: patrol.id,
            startedAt: patrol.startedAt,
            completedCheckpoints: patrol.scans.length,
            totalCheckpoints: patrol.totalCheckpoints,
          }
        : null,
    };
  }

  private reportRecord(report: MemoryReport): ReportRecord {
    const household = this.households.get(report.householdId);
    const house = household ? this.houses.get(household.houseId) : undefined;
    const updates = this.reportUpdates
      .filter((update) => update.reportId === report.id)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((update) => ({
        id: update.id,
        status: update.status,
        note: update.note,
        actorName: update.actorUserId
          ? (this.users.get(update.actorUserId)?.displayName ?? "Pengguna Komplekku")
          : null,
        createdAt: update.createdAt,
      }));
    return {
      id: report.id,
      category: report.category,
      description: report.description,
      location: report.location,
      status: report.status,
      photos: report.photos,
      reporterName: this.users.get(report.reporterUserId)?.displayName ?? "Pengguna Komplekku",
      houseCode: house?.code ?? "",
      householdDisplayName: household?.displayName ?? "",
      createdAt: report.createdAt,
      updates,
    };
  }

  async createReport(input: {
    auth: AuthSessionRecord;
    report: CreateReportInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateReportResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "HOUSEHOLD_CONTEXT_REQUIRED" };
    }
    const report: MemoryReport = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      householdId: input.auth.currentHouseholdId,
      reporterUserId: input.auth.userId,
      category: input.report.category,
      description: input.report.description,
      location: input.report.location ?? null,
      photos: input.report.photoUrls ?? [],
      status: "SUBMITTED",
      createdAt: input.now,
    };
    this.reports.push(report);
    this.reportUpdates.push({
      id: randomUUID(),
      reportId: report.id,
      status: "SUBMITTED",
      note: null,
      actorUserId: input.auth.userId,
      createdAt: input.now,
    });
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "report.created",
      entityType: "Report",
      entityId: report.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { category: input.report.category },
    });
    return { outcome: "OK", report: this.reportRecord(report) };
  }

  async listReports(input: {
    auth: AuthSessionRecord;
    status?: ReportStatus;
    limit: number;
  }): Promise<ReportRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("report.manage");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    return this.reports
      .filter(
        (report) =>
          report.communityId === input.auth.currentCommunityId &&
          (canSeeAll || report.householdId === input.auth.currentHouseholdId) &&
          (!input.status || report.status === input.status),
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, input.limit)
      .map((report) => this.reportRecord(report));
  }

  async getReport(auth: AuthSessionRecord, id: string): Promise<ReportRecord | null> {
    if (!auth.currentCommunityId) return null;
    const canSeeAll = auth.permissions.includes("report.manage");
    const report = this.reports.find(
      (candidate) =>
        candidate.id === id &&
        candidate.communityId === auth.currentCommunityId &&
        (canSeeAll || candidate.householdId === auth.currentHouseholdId),
    );
    return report ? this.reportRecord(report) : null;
  }

  async addReportUpdate(input: {
    auth: AuthSessionRecord;
    reportId: string;
    update: AddReportUpdateInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<AddReportUpdateResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const report = this.reports.find(
      (candidate) =>
        candidate.id === input.reportId && candidate.communityId === input.auth.currentCommunityId,
    );
    if (!report) return { outcome: "NOT_FOUND" };
    report.status = input.update.status;
    this.reportUpdates.push({
      id: randomUUID(),
      reportId: report.id,
      status: input.update.status,
      note: input.update.note ?? null,
      actorUserId: input.auth.userId,
      createdAt: input.now,
    });
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "report.updated",
      entityType: "Report",
      entityId: report.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { status: input.update.status },
    });
    return { outcome: "OK", report: this.reportRecord(report) };
  }

  private letterTypeRecord(type: MemoryLetterType): LetterTypeRecord {
    return { id: type.id, name: type.name, description: type.description };
  }

  private letterRequestRecord(request: MemoryLetterRequest): LetterRequestRecord {
    const household = this.households.get(request.householdId);
    const house = household ? this.houses.get(household.houseId) : undefined;
    const letterType = this.letterTypes.find((candidate) => candidate.id === request.letterTypeId);
    return {
      id: request.id,
      letterTypeId: request.letterTypeId,
      letterTypeName: letterType?.name ?? "",
      purpose: request.purpose,
      status: request.status,
      requesterName: this.users.get(request.requesterUserId)?.displayName ?? "Pengguna Komplekku",
      houseCode: house?.code ?? "",
      householdDisplayName: household?.displayName ?? "",
      reviewedByName: request.reviewedByUserId
        ? (this.users.get(request.reviewedByUserId)?.displayName ?? "Pengguna Komplekku")
        : null,
      reviewedAt: request.reviewedAt,
      rejectionReason: request.rejectionReason,
      readyAt: request.readyAt,
      createdAt: request.createdAt,
    };
  }

  async listLetterTypes(auth: AuthSessionRecord): Promise<LetterTypeRecord[]> {
    if (!auth.currentCommunityId) return [];
    return this.letterTypes
      .filter((type) => type.communityId === auth.currentCommunityId && type.isActive)
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((type) => this.letterTypeRecord(type));
  }

  async createLetterRequest(input: {
    auth: AuthSessionRecord;
    request: CreateLetterRequestInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateLetterRequestResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "HOUSEHOLD_CONTEXT_REQUIRED" };
    }
    const letterType = this.letterTypes.find(
      (candidate) =>
        candidate.id === input.request.letterTypeId &&
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.isActive,
    );
    if (!letterType) return { outcome: "LETTER_TYPE_NOT_FOUND" };
    const request: MemoryLetterRequest = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      householdId: input.auth.currentHouseholdId,
      requesterUserId: input.auth.userId,
      letterTypeId: letterType.id,
      purpose: input.request.purpose,
      status: "SUBMITTED",
      reviewedByUserId: null,
      reviewedAt: null,
      rejectionReason: null,
      readyAt: null,
      createdAt: input.now,
    };
    this.letterRequests.push(request);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "letter_request.created",
      entityType: "LetterRequest",
      entityId: request.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { letterTypeId: letterType.id },
    });
    return { outcome: "OK", request: this.letterRequestRecord(request) };
  }

  async listLetterRequests(input: {
    auth: AuthSessionRecord;
    status?: LetterRequestStatus;
    limit: number;
  }): Promise<LetterRequestRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("letter.manage");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    return this.letterRequests
      .filter(
        (request) =>
          request.communityId === input.auth.currentCommunityId &&
          (canSeeAll || request.householdId === input.auth.currentHouseholdId) &&
          (!input.status || request.status === input.status),
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, input.limit)
      .map((request) => this.letterRequestRecord(request));
  }

  private findLetterRequest(
    requestId: string,
    communityId: string,
  ): MemoryLetterRequest | undefined {
    return this.letterRequests.find(
      (candidate) => candidate.id === requestId && candidate.communityId === communityId,
    );
  }

  async approveLetterRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<LetterRequestTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const request = this.findLetterRequest(input.requestId, input.auth.currentCommunityId);
    if (!request) return { outcome: "NOT_FOUND" };
    if (request.status !== "SUBMITTED") return { outcome: "INVALID_TRANSITION" };
    request.status = "APPROVED";
    request.reviewedByUserId = input.auth.userId;
    request.reviewedAt = input.now;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "letter_request.approved",
      entityType: "LetterRequest",
      entityId: request.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", request: this.letterRequestRecord(request) };
  }

  async rejectLetterRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    reason: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<LetterRequestTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const request = this.findLetterRequest(input.requestId, input.auth.currentCommunityId);
    if (!request) return { outcome: "NOT_FOUND" };
    if (request.status !== "SUBMITTED") return { outcome: "INVALID_TRANSITION" };
    request.status = "REJECTED";
    request.reviewedByUserId = input.auth.userId;
    request.reviewedAt = input.now;
    request.rejectionReason = input.reason;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "letter_request.rejected",
      entityType: "LetterRequest",
      entityId: request.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", request: this.letterRequestRecord(request) };
  }

  async markLetterRequestReady(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<LetterRequestTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const request = this.findLetterRequest(input.requestId, input.auth.currentCommunityId);
    if (!request) return { outcome: "NOT_FOUND" };
    if (request.status !== "APPROVED") return { outcome: "INVALID_TRANSITION" };
    request.status = "READY";
    request.readyAt = input.now;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "letter_request.ready",
      entityType: "LetterRequest",
      entityId: request.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", request: this.letterRequestRecord(request) };
  }

  private facilityRecord(facility: MemoryFacility): FacilityRecord {
    return {
      id: facility.id,
      name: facility.name,
      openTime: facility.openTime,
      closeTime: facility.closeTime,
      capacity: facility.capacity,
      rules: facility.rules,
    };
  }

  private facilityBookingRecord(booking: MemoryFacilityBooking): FacilityBookingRecord {
    const household = this.households.get(booking.householdId);
    const house = household ? this.houses.get(household.houseId) : undefined;
    const facility = this.facilities.find((candidate) => candidate.id === booking.facilityId);
    return {
      id: booking.id,
      facilityId: booking.facilityId,
      facilityName: facility?.name ?? "",
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
      status: booking.status,
      bookedByName: this.users.get(booking.bookedByUserId)?.displayName ?? "Pengguna Komplekku",
      houseCode: house?.code ?? "",
      householdDisplayName: household?.displayName ?? "",
      createdAt: booking.createdAt,
    };
  }

  async listFacilities(auth: AuthSessionRecord): Promise<FacilityRecord[]> {
    if (!auth.currentCommunityId) return [];
    return this.facilities
      .filter((facility) => facility.communityId === auth.currentCommunityId && facility.isActive)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((facility) => this.facilityRecord(facility));
  }

  async listFacilityBookings(input: {
    auth: AuthSessionRecord;
    facilityId?: string;
    date?: string;
    limit: number;
  }): Promise<FacilityBookingRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    return this.facilityBookings
      .filter(
        (booking) =>
          booking.communityId === input.auth.currentCommunityId &&
          booking.status === "CONFIRMED" &&
          (!input.facilityId || booking.facilityId === input.facilityId) &&
          (!input.date || booking.bookingDate === input.date),
      )
      .sort(
        (left, right) =>
          left.bookingDate.localeCompare(right.bookingDate) ||
          left.startTime.localeCompare(right.startTime),
      )
      .slice(0, input.limit)
      .map((booking) => this.facilityBookingRecord(booking));
  }

  async createFacilityBooking(input: {
    auth: AuthSessionRecord;
    booking: CreateFacilityBookingInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateFacilityBookingResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "HOUSEHOLD_CONTEXT_REQUIRED" };
    }
    const facility = this.facilities.find(
      (candidate) =>
        candidate.id === input.booking.facilityId &&
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.isActive,
    );
    if (!facility) return { outcome: "FACILITY_NOT_FOUND" };
    const overlaps = this.facilityBookings.some(
      (booking) =>
        booking.communityId === input.auth.currentCommunityId &&
        booking.facilityId === facility.id &&
        booking.bookingDate === input.booking.bookingDate &&
        booking.status === "CONFIRMED" &&
        input.booking.startTime < booking.endTime &&
        input.booking.endTime > booking.startTime,
    );
    if (overlaps) return { outcome: "SLOT_UNAVAILABLE" };
    const booking: MemoryFacilityBooking = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      facilityId: facility.id,
      householdId: input.auth.currentHouseholdId,
      bookedByUserId: input.auth.userId,
      purpose: input.booking.purpose ?? null,
      bookingDate: input.booking.bookingDate,
      startTime: input.booking.startTime,
      endTime: input.booking.endTime,
      status: "CONFIRMED",
      createdAt: input.now,
    };
    this.facilityBookings.push(booking);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "facility_booking.created",
      entityType: "FacilityBooking",
      entityId: booking.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", booking: this.facilityBookingRecord(booking) };
  }

  async cancelFacilityBooking(input: {
    auth: AuthSessionRecord;
    bookingId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CancelFacilityBookingResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const canManage = input.auth.permissions.includes("facility.manage");
    const booking = this.facilityBookings.find(
      (candidate) =>
        candidate.id === input.bookingId &&
        candidate.communityId === input.auth.currentCommunityId &&
        (canManage || candidate.householdId === input.auth.currentHouseholdId),
    );
    if (!booking) return { outcome: "NOT_FOUND" };
    if (booking.status === "CANCELLED") return { outcome: "ALREADY_CANCELLED" };
    booking.status = "CANCELLED";
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "facility_booking.cancelled",
      entityType: "FacilityBooking",
      entityId: booking.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", booking: this.facilityBookingRecord(booking) };
  }

  private duesTypeRecord(duesType: MemoryDuesType): DuesTypeRecord {
    return {
      id: duesType.id,
      name: duesType.name,
      description: duesType.description,
      defaultAmount: duesType.defaultAmount,
      isActive: duesType.isActive,
    };
  }

  private invoiceRecord(invoice: MemoryInvoice, now: Date): InvoiceRecord {
    const household = this.households.get(invoice.householdId);
    const house = household ? this.houses.get(household.houseId) : undefined;
    const duesType = this.duesTypes.find((candidate) => candidate.id === invoice.duesTypeId);
    const isOverdue =
      invoice.status === "UNPAID" && new Date(invoice.dueDate).getTime() < now.getTime();
    const verifiedPayment = this.payments.find(
      (payment) => payment.invoiceId === invoice.id && payment.status === "VERIFIED",
    );
    return {
      id: invoice.id,
      duesTypeId: invoice.duesTypeId,
      duesTypeName: duesType?.name ?? "",
      period: invoice.period,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      status: isOverdue ? "OVERDUE" : invoice.status,
      houseCode: house?.code ?? "",
      householdDisplayName: household?.displayName ?? "",
      waivedReason: invoice.waivedReason,
      paidAt: invoice.paidAt,
      receiptNumber: verifiedPayment?.receiptNumber ?? null,
      createdAt: invoice.createdAt,
    };
  }

  async listDuesTypes(auth: AuthSessionRecord): Promise<DuesTypeRecord[]> {
    if (!auth.currentCommunityId) return [];
    return this.duesTypes
      .filter((duesType) => duesType.communityId === auth.currentCommunityId && duesType.isActive)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((duesType) => this.duesTypeRecord(duesType));
  }

  async createDuesType(input: {
    auth: AuthSessionRecord;
    duesType: CreateDuesTypeInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<DuesTypeRecord> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to create a dues type.");
    }
    const duesType: MemoryDuesType = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      name: input.duesType.name,
      description: input.duesType.description ?? null,
      defaultAmount: input.duesType.defaultAmount,
      isActive: true,
    };
    this.duesTypes.push(duesType);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "dues_type.created",
      entityType: "DuesType",
      entityId: duesType.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.duesTypeRecord(duesType);
  }

  async generateInvoices(input: {
    auth: AuthSessionRecord;
    generate: GenerateInvoicesInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<number> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to generate invoices.");
    }
    const communityId = input.auth.currentCommunityId;
    const households = [...this.households.values()].filter(
      (household) => household.communityId === communityId,
    );
    let createdCount = 0;
    for (const household of households) {
      const exists = this.invoices.some(
        (invoice) =>
          invoice.householdId === household.id &&
          invoice.duesTypeId === input.generate.duesTypeId &&
          invoice.period === input.generate.period,
      );
      if (exists) continue;
      this.invoices.push({
        id: randomUUID(),
        communityId,
        householdId: household.id,
        duesTypeId: input.generate.duesTypeId,
        period: input.generate.period,
        amount: input.generate.amount,
        dueDate: input.generate.dueDate,
        status: "UNPAID",
        waivedAt: null,
        waivedByUserId: null,
        waivedReason: null,
        paidAt: null,
        createdAt: input.now,
      });
      createdCount += 1;
    }
    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      action: "invoice.generated",
      entityType: "Invoice",
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: {
        duesTypeId: input.generate.duesTypeId,
        period: input.generate.period,
        createdCount,
      },
    });
    return createdCount;
  }

  async listInvoices(input: {
    auth: AuthSessionRecord;
    status?: InvoiceStatus;
    limit: number;
  }): Promise<InvoiceRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("dues.manage");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    const now = new Date();
    return this.invoices
      .filter(
        (invoice) =>
          invoice.communityId === input.auth.currentCommunityId &&
          (canSeeAll || invoice.householdId === input.auth.currentHouseholdId) &&
          (!input.status || this.invoiceRecord(invoice, now).status === input.status),
      )
      .sort((left, right) => right.dueDate.localeCompare(left.dueDate))
      .slice(0, input.limit)
      .map((invoice) => this.invoiceRecord(invoice, now));
  }

  async getInvoice(auth: AuthSessionRecord, id: string): Promise<InvoiceRecord | null> {
    if (!auth.currentCommunityId) return null;
    const canSeeAll = auth.permissions.includes("dues.manage");
    const invoice = this.invoices.find(
      (candidate) =>
        candidate.id === id &&
        candidate.communityId === auth.currentCommunityId &&
        (canSeeAll || candidate.householdId === auth.currentHouseholdId),
    );
    return invoice ? this.invoiceRecord(invoice, new Date()) : null;
  }

  async waiveInvoice(input: {
    auth: AuthSessionRecord;
    invoiceId: string;
    reason: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<WaiveInvoiceResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const invoice = this.invoices.find(
      (candidate) =>
        candidate.id === input.invoiceId && candidate.communityId === input.auth.currentCommunityId,
    );
    if (!invoice) return { outcome: "NOT_FOUND" };
    if (invoice.status === "PAID" || invoice.status === "WAIVED") {
      return { outcome: "INVALID_TRANSITION" };
    }
    invoice.status = "WAIVED";
    invoice.waivedAt = input.now;
    invoice.waivedByUserId = input.auth.userId;
    invoice.waivedReason = input.reason;
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "invoice.waived",
      entityType: "Invoice",
      entityId: invoice.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", invoice: this.invoiceRecord(invoice, input.now) };
  }

  private paymentRecord(payment: MemoryPayment): PaymentRecord {
    const invoice = this.invoices.find((candidate) => candidate.id === payment.invoiceId);
    const household = invoice ? this.households.get(invoice.householdId) : undefined;
    const house = household ? this.houses.get(household.houseId) : undefined;
    const duesType = invoice
      ? this.duesTypes.find((candidate) => candidate.id === invoice.duesTypeId)
      : undefined;
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      duesTypeName: duesType?.name ?? "",
      period: invoice?.period ?? "",
      amount: payment.amount,
      paidAt: payment.paidAt,
      note: payment.note,
      status: payment.status,
      submittedByName:
        this.users.get(payment.submittedByUserId)?.displayName ?? "Pengguna Komplekku",
      houseCode: house?.code ?? "",
      householdDisplayName: household?.displayName ?? "",
      verifiedByName: payment.verifiedByUserId
        ? (this.users.get(payment.verifiedByUserId)?.displayName ?? "Pengguna Komplekku")
        : null,
      verifiedAt: payment.verifiedAt,
      rejectionReason: payment.rejectionReason,
      receiptNumber: payment.receiptNumber,
      createdAt: payment.createdAt,
    };
  }

  async createPayment(input: {
    auth: AuthSessionRecord;
    payment: CreatePaymentInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreatePaymentResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "INVOICE_NOT_FOUND" };
    }
    const invoice = this.invoices.find(
      (candidate) =>
        candidate.id === input.payment.invoiceId &&
        candidate.communityId === input.auth.currentCommunityId &&
        candidate.householdId === input.auth.currentHouseholdId,
    );
    if (!invoice) return { outcome: "INVOICE_NOT_FOUND" };
    if (invoice.status !== "UNPAID" && invoice.status !== "OVERDUE") {
      return { outcome: "INVALID_INVOICE_STATE" };
    }
    const payment: MemoryPayment = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      invoiceId: invoice.id,
      submittedByUserId: input.auth.userId,
      amount: input.payment.amount,
      paidAt: input.payment.paidAt,
      note: input.payment.note,
      status: "PENDING",
      verifiedByUserId: null,
      verifiedAt: null,
      rejectionReason: null,
      receiptNumber: null,
      createdAt: input.now,
    };
    this.payments.push(payment);
    invoice.status = "PENDING_VERIFICATION";
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "payment.submitted",
      entityType: "Payment",
      entityId: payment.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", payment: this.paymentRecord(payment) };
  }

  async listPayments(input: {
    auth: AuthSessionRecord;
    status?: PaymentStatus;
    limit: number;
  }): Promise<PaymentRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    return this.payments
      .filter(
        (payment) =>
          payment.communityId === input.auth.currentCommunityId &&
          (!input.status || payment.status === input.status),
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, input.limit)
      .map((payment) => this.paymentRecord(payment));
  }

  async verifyPayment(input: {
    auth: AuthSessionRecord;
    paymentId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<PaymentTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const payment = this.payments.find(
      (candidate) =>
        candidate.id === input.paymentId && candidate.communityId === input.auth.currentCommunityId,
    );
    if (!payment) return { outcome: "NOT_FOUND" };
    if (payment.status !== "PENDING") return { outcome: "INVALID_TRANSITION" };
    const dateCompact = input.now.toISOString().slice(0, 10).replace(/-/g, "");
    payment.status = "VERIFIED";
    payment.verifiedByUserId = input.auth.userId;
    payment.verifiedAt = input.now;
    payment.receiptNumber = `KK${dateCompact}-${payment.id.slice(0, 8).toUpperCase()}`;
    const invoice = this.invoices.find((candidate) => candidate.id === payment.invoiceId);
    if (invoice) {
      invoice.status = "PAID";
      invoice.paidAt = input.now;
    }
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "payment.verified",
      entityType: "Payment",
      entityId: payment.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", payment: this.paymentRecord(payment) };
  }

  async rejectPayment(input: {
    auth: AuthSessionRecord;
    paymentId: string;
    reason: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<PaymentTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const payment = this.payments.find(
      (candidate) =>
        candidate.id === input.paymentId && candidate.communityId === input.auth.currentCommunityId,
    );
    if (!payment) return { outcome: "NOT_FOUND" };
    if (payment.status !== "PENDING") return { outcome: "INVALID_TRANSITION" };
    payment.status = "REJECTED";
    payment.verifiedByUserId = input.auth.userId;
    payment.verifiedAt = input.now;
    payment.rejectionReason = input.reason;
    const invoice = this.invoices.find((candidate) => candidate.id === payment.invoiceId);
    if (invoice) invoice.status = "UNPAID";
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "payment.rejected",
      entityType: "Payment",
      entityId: payment.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", payment: this.paymentRecord(payment) };
  }

  private cashTransactionRecord(transaction: MemoryCashTransaction): CashTransactionRecord {
    return {
      id: transaction.id,
      date: transaction.date,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      visibility: transaction.visibility,
      recordedByName:
        this.users.get(transaction.recordedByUserId)?.displayName ?? "Pengguna Komplekku",
      createdAt: transaction.createdAt,
    };
  }

  async listCashTransactions(input: {
    auth: AuthSessionRecord;
    period?: string;
    limit: number;
  }): Promise<CashLedgerRecord> {
    if (!input.auth.currentCommunityId) {
      return { items: [], openingBalance: 0, totalIncome: 0, totalExpense: 0, closingBalance: 0 };
    }
    const canSeeAll = input.auth.permissions.includes("cash.manage");
    const visible = this.cashTransactions.filter(
      (transaction) =>
        transaction.communityId === input.auth.currentCommunityId &&
        (canSeeAll || transaction.visibility === "PUBLIC_TO_RESIDENTS"),
    );
    const periodStart = input.period ? `${input.period}-01` : null;
    const prior = periodStart
      ? visible.filter((transaction) => transaction.date < periodStart)
      : [];
    const withinPeriod = periodStart
      ? visible.filter((transaction) => transaction.date >= periodStart)
      : visible;
    const sumByType = (rows: MemoryCashTransaction[], type: string) =>
      rows.filter((row) => row.type === type).reduce((total, row) => total + row.amount, 0);
    const openingBalance = periodStart
      ? sumByType(prior, "INCOME") - sumByType(prior, "EXPENSE")
      : 0;
    const totalIncome = sumByType(withinPeriod, "INCOME");
    const totalExpense = sumByType(withinPeriod, "EXPENSE");
    const items = [...visible]
      .filter((transaction) => !periodStart || transaction.date >= periodStart)
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, input.limit)
      .map((transaction) => this.cashTransactionRecord(transaction));
    return {
      items,
      openingBalance,
      totalIncome,
      totalExpense,
      closingBalance: openingBalance + totalIncome - totalExpense,
    };
  }

  async createCashTransaction(input: {
    auth: AuthSessionRecord;
    transaction: CreateCashTransactionInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CashTransactionRecord> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to record a cash transaction.");
    }
    const transaction: MemoryCashTransaction = {
      id: randomUUID(),
      communityId: input.auth.currentCommunityId,
      date: input.transaction.date,
      category: input.transaction.category,
      description: input.transaction.description,
      amount: input.transaction.amount,
      type: input.transaction.type,
      visibility: input.transaction.visibility,
      recordedByUserId: input.auth.userId,
      createdAt: input.now,
    };
    this.cashTransactions.push(transaction);
    this.audits.push({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "cash_transaction.recorded",
      entityType: "CashTransaction",
      entityId: transaction.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { type: input.transaction.type, amount: input.transaction.amount },
    });
    return this.cashTransactionRecord(transaction);
  }

  async getFinanceDashboard(auth: AuthSessionRecord, now: Date): Promise<FinanceDashboardRecord> {
    if (!auth.currentCommunityId) {
      return {
        outstandingInvoiceCount: 0,
        outstandingInvoiceAmount: 0,
        pendingVerificationCount: 0,
        collectedThisMonth: 0,
        cashBalance: 0,
      };
    }
    const communityId = auth.currentCommunityId;
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const outstandingInvoices = this.invoices.filter(
      (invoice) =>
        invoice.communityId === communityId &&
        ["UNPAID", "OVERDUE", "PENDING_VERIFICATION"].includes(
          this.invoiceRecord(invoice, now).status,
        ),
    );
    const pendingVerificationCount = this.payments.filter(
      (payment) => payment.communityId === communityId && payment.status === "PENDING",
    ).length;
    const collectedThisMonth = this.invoices
      .filter(
        (invoice) =>
          invoice.communityId === communityId &&
          invoice.status === "PAID" &&
          invoice.paidAt &&
          invoice.paidAt.toISOString().slice(0, 7) === monthPrefix,
      )
      .reduce((total, invoice) => total + invoice.amount, 0);
    const communityCash = this.cashTransactions.filter(
      (transaction) => transaction.communityId === communityId,
    );
    const income = communityCash
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expense = communityCash
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((total, transaction) => total + transaction.amount, 0);
    return {
      outstandingInvoiceCount: outstandingInvoices.length,
      outstandingInvoiceAmount: outstandingInvoices.reduce(
        (total, invoice) => total + invoice.amount,
        0,
      ),
      pendingVerificationCount,
      collectedThisMonth,
      cashBalance: income - expense,
    };
  }

  private houseRecord(house: MemoryHouse): HouseRecord {
    const hasHousehold = [...this.households.values()].some(
      (household) => household.houseId === house.id,
    );
    return {
      id: house.id,
      code: house.code,
      block: house.block,
      number: house.number,
      rtId: house.rtId,
      rtCode: house.rtId ? (this.rts.get(house.rtId)?.code ?? null) : null,
      occupancyStatus: house.occupancyStatus,
      addressLabel: `Blok ${house.block} No. ${house.number}`,
      hasHousehold,
      createdAt: house.createdAt ?? new Date(),
    };
  }

  async listHouses(auth: AuthSessionRecord): Promise<HouseRecord[]> {
    if (!auth.currentCommunityId) return [];
    return [...this.houses.values()]
      .filter(
        (house) =>
          house.communityId === auth.currentCommunityId &&
          !house.deletedAt &&
          (!auth.rtScopeId || house.rtId === auth.rtScopeId),
      )
      .sort((left, right) => left.code.localeCompare(right.code))
      .map((house) => this.houseRecord(house));
  }

  async createHouse(input: {
    auth: AuthSessionRecord;
    house: CreateHouseInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateHouseResult> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to create a house.");
    }
    const communityId = input.auth.currentCommunityId;
    const rtId = input.auth.rtScopeId ?? input.house.rtId;
    const rt = this.rts.get(rtId);
    if (!rt || rt.communityId !== communityId || rt.deletedAt) {
      return { outcome: "RT_NOT_FOUND" };
    }
    const exists = [...this.houses.values()].some(
      (house) => house.communityId === communityId && house.code === input.house.code,
    );
    if (exists) return { outcome: "CODE_CONFLICT" };
    const house: MemoryHouse = {
      id: randomUUID(),
      communityId,
      rtId,
      code: input.house.code,
      block: input.house.block,
      number: input.house.number,
      occupancyStatus: input.house.occupancyStatus,
      createdAt: input.now,
      deletedAt: null,
    };
    this.houses.set(house.id, house);
    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      action: "house.created",
      entityType: "House",
      entityId: house.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { code: house.code },
    });
    return { outcome: "OK", house: this.houseRecord(house) };
  }

  async updateHouse(input: {
    auth: AuthSessionRecord;
    houseId: string;
    changes: UpdateHouseInput;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateHouseResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };
    const house = this.houses.get(input.houseId);
    if (
      !house ||
      house.communityId !== communityId ||
      house.deletedAt ||
      (input.auth.rtScopeId && house.rtId !== input.auth.rtScopeId)
    ) {
      return { outcome: "NOT_FOUND" };
    }

    const nextRtId = input.auth.rtScopeId ?? input.changes.rtId;
    if (nextRtId) {
      const rt = this.rts.get(nextRtId);
      if (!rt || rt.communityId !== communityId || rt.deletedAt) {
        return { outcome: "RT_NOT_FOUND" };
      }
      house.rtId = nextRtId;
    }
    if (input.changes.block !== undefined) house.block = input.changes.block;
    if (input.changes.number !== undefined) house.number = input.changes.number;
    if (input.changes.occupancyStatus !== undefined) {
      house.occupancyStatus = input.changes.occupancyStatus;
    }

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "house.updated",
      entityType: "House",
      entityId: house.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return { outcome: "OK", house: this.houseRecord(house) };
  }

  private viewerHouseRtId(auth: AuthSessionRecord): string | null {
    if (!auth.currentHouseholdId) return null;
    const household = this.households.get(auth.currentHouseholdId);
    if (!household) return null;
    return this.houses.get(household.houseId)?.rtId ?? null;
  }

  private forumMembership(channelId: string, userId: string): MemoryForumChannelMember | null {
    return (
      [...this.forumChannelMembers.values()].find(
        (member) => member.channelId === channelId && member.userId === userId,
      ) ?? null
    );
  }

  private forumAcceptedMemberCount(channelId: string): number {
    return [...this.forumChannelMembers.values()].filter(
      (member) => member.channelId === channelId && member.status === "ACCEPTED",
    ).length;
  }

  private canAccessForumChannel(auth: AuthSessionRecord, channel: MemoryForumChannel): boolean {
    if (channel.kind === "PRIVATE") {
      return this.forumMembership(channel.id, auth.userId)?.status === "ACCEPTED";
    }
    if (channel.rtId === null) return true;
    if (auth.permissions.includes("community.manage")) return true;
    if (auth.rtScopeId === channel.rtId) return true;
    return this.viewerHouseRtId(auth) === channel.rtId;
  }

  private mapForumChannel(
    channel: MemoryForumChannel,
    auth: AuthSessionRecord,
  ): ForumChannelRecord {
    const membership = this.forumMembership(channel.id, auth.userId);
    return {
      id: channel.id,
      rtId: channel.rtId,
      kind: channel.kind,
      name: channel.name,
      description: channel.description,
      createdByUserId: channel.createdByUserId,
      membershipStatus: membership?.status ?? null,
      isOwner: membership?.isOwner ?? false,
      memberCount: channel.kind === "PRIVATE" ? this.forumAcceptedMemberCount(channel.id) : 0,
    };
  }

  private forumChannelRank(channel: MemoryForumChannel): number {
    if (channel.kind === "PRIVATE") return 2;
    return channel.rtId === null ? 0 : 1;
  }

  private mapForumMessage(message: MemoryForumMessage): ForumMessageRecord {
    const parent = message.replyToMessageId
      ? this.forumMessages.get(message.replyToMessageId)
      : null;
    // A reply whose parent was deleted keeps its own text but loses the quote,
    // so the thread never resurrects removed content.
    const visibleParent = parent && !parent.deletedAt ? parent : null;
    return {
      id: message.id,
      channelId: message.channelId,
      authorUserId: message.authorUserId,
      authorName: this.forumNameForUser(message.authorUserId, message.communityId),
      body: message.body,
      imageUrls: message.imageUrls,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      replyToMessageId: message.replyToMessageId,
      replyToAuthorName: visibleParent
        ? this.forumNameForUser(visibleParent.authorUserId, visibleParent.communityId)
        : null,
      replyToBody: visibleParent ? visibleParent.body : null,
    };
  }

  private houseLabelForUser(communityId: string, userId: string): string | null {
    const resident = [...this.residents.values()].find(
      (candidate) => candidate.communityId === communityId && candidate.userId === userId,
    );
    const household = resident?.householdId ? this.households.get(resident.householdId) : null;
    const house = household ? this.houses.get(household.houseId) : null;
    return house ? `Blok ${house.block} No. ${house.number}` : null;
  }

  /// A person's name for a screen every warga can see: the account's display
  /// name, then the `fullName` on their resident record — never the phone
  /// number, which only pengurus may see. Mirrors prisma-repository's
  /// `residentNameOf`.
  private forumNameForUser(userId: string, communityId?: string | null): string {
    const user = this.users.get(userId);
    if (user?.displayName) return user.displayName;
    const resident = [...this.residents.values()].find(
      (candidate) =>
        candidate.userId === userId &&
        (communityId == null || candidate.communityId === communityId),
    );
    return resident?.fullName ?? "Warga Komplekku";
  }

  async listForumChannels(auth: AuthSessionRecord): Promise<ForumChannelRecord[]> {
    const communityId = auth.currentCommunityId;
    if (!communityId) return [];
    return [...this.forumChannels.values()]
      .filter((channel) => {
        if (channel.communityId !== communityId) return false;
        if (channel.kind === "PRIVATE") {
          // Invitation-only for everyone, admins included; a declined
          // invitation drops the forum out of the list entirely.
          const status = this.forumMembership(channel.id, auth.userId)?.status;
          return status === "PENDING" || status === "ACCEPTED";
        }
        return this.canAccessForumChannel(auth, channel);
      })
      .sort((left, right) => {
        const rankDelta = this.forumChannelRank(left) - this.forumChannelRank(right);
        return rankDelta !== 0 ? rankDelta : left.name.localeCompare(right.name);
      })
      .map((channel) => this.mapForumChannel(channel, auth));
  }

  /** Filters requested invitees down to real, active residents of the viewer's
   * community so an invitation can never leak a forum outside it. */
  private resolveInvitableUserIds(
    communityId: string,
    userIds: string[],
    excludeUserId: string,
  ): string[] {
    const wanted = new Set(userIds.filter((userId) => userId !== excludeUserId));
    const resolved = new Set<string>();
    for (const resident of this.residents.values()) {
      if (resident.communityId !== communityId) continue;
      if (resident.status !== "ACTIVE") continue;
      if (!wanted.has(resident.userId)) continue;
      resolved.add(resident.userId);
    }
    return [...resolved];
  }

  async listForumMemberCandidates(auth: AuthSessionRecord): Promise<ForumMemberCandidateRecord[]> {
    const communityId = auth.currentCommunityId;
    if (!communityId) return [];

    const byUserId = new Map<string, ForumMemberCandidateRecord>();
    for (const resident of this.residents.values()) {
      if (resident.communityId !== communityId) continue;
      if (resident.status !== "ACTIVE") continue;
      if (resident.userId === auth.userId) continue;
      if (byUserId.has(resident.userId)) continue;
      byUserId.set(resident.userId, {
        userId: resident.userId,
        // Name + house only: the invite picker is visible to every warga, so
        // it must never fall back to showing someone's phone number.
        displayName: this.forumNameForUser(resident.userId, communityId),
        houseLabel: this.houseLabelForUser(communityId, resident.userId),
      });
    }

    return [...byUserId.values()].sort((left, right) =>
      left.displayName.localeCompare(right.displayName),
    );
  }

  async createForumChannel(input: {
    auth: AuthSessionRecord;
    name: string;
    description?: string;
    invitedUserIds: string[];
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateForumChannelResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NO_COMMUNITY" };

    const channel: MemoryForumChannel = {
      id: randomUUID(),
      communityId,
      rtId: null,
      kind: "PRIVATE",
      name: input.name,
      description: input.description ?? null,
      createdByUserId: input.auth.userId,
    };
    this.forumChannels.set(channel.id, channel);

    const ownerMember: MemoryForumChannelMember = {
      id: randomUUID(),
      communityId,
      channelId: channel.id,
      userId: input.auth.userId,
      status: "ACCEPTED",
      isOwner: true,
      invitedByUserId: null,
      invitedAt: input.now,
      respondedAt: input.now,
    };
    this.forumChannelMembers.set(ownerMember.id, ownerMember);

    const invitedUserIds = this.resolveInvitableUserIds(
      communityId,
      input.invitedUserIds,
      input.auth.userId,
    );
    for (const userId of invitedUserIds) {
      const member: MemoryForumChannelMember = {
        id: randomUUID(),
        communityId,
        channelId: channel.id,
        userId,
        status: "PENDING",
        isOwner: false,
        invitedByUserId: input.auth.userId,
        invitedAt: input.now,
        respondedAt: null,
      };
      this.forumChannelMembers.set(member.id, member);
    }

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.channel.created",
      entityType: "ForumChannel",
      entityId: channel.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return {
      outcome: "OK",
      channel: this.mapForumChannel(channel, input.auth),
      invitedUserIds,
    };
  }

  async listForumChannelMembers(input: {
    auth: AuthSessionRecord;
    channelId: string;
  }): Promise<ListForumChannelMembersResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "CHANNEL_NOT_FOUND" };

    const channel = this.forumChannels.get(input.channelId);
    if (!channel || channel.communityId !== communityId) {
      return { outcome: "CHANNEL_NOT_FOUND" };
    }

    if (channel.kind === "PRIVATE") {
      // A pending invitee may look at the roster before deciding, but nobody
      // outside the invitation list can.
      const viewer = this.forumMembership(channel.id, input.auth.userId);
      if (!viewer || viewer.status === "DECLINED") return { outcome: "CHANNEL_NOT_FOUND" };
    } else if (!this.canAccessForumChannel(input.auth, channel)) {
      return { outcome: "CHANNEL_NOT_FOUND" };
    }

    const items: ForumChannelMemberRecord[] = [...this.forumChannelMembers.values()]
      .filter((member) => member.channelId === channel.id && member.status !== "DECLINED")
      .map((member) => ({
        userId: member.userId,
        displayName: this.forumNameForUser(member.userId, communityId),
        houseLabel: this.houseLabelForUser(communityId, member.userId),
        status: member.status,
        isOwner: member.isOwner,
      }))
      .sort((left, right) => {
        if (left.isOwner !== right.isOwner) return left.isOwner ? -1 : 1;
        return left.displayName.localeCompare(right.displayName);
      });

    return { outcome: "OK", items };
  }

  async inviteForumMembers(input: {
    auth: AuthSessionRecord;
    channelId: string;
    userIds: string[];
    now: Date;
    audit: RequestAuditContext;
  }): Promise<InviteForumMembersResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "CHANNEL_NOT_FOUND" };

    const channel = this.forumChannels.get(input.channelId);
    if (!channel || channel.communityId !== communityId || channel.kind !== "PRIVATE") {
      return { outcome: "CHANNEL_NOT_FOUND" };
    }

    const viewer = this.forumMembership(channel.id, input.auth.userId);
    if (!viewer) return { outcome: "CHANNEL_NOT_FOUND" };
    // A pending invitee exists but may not grow the room before accepting.
    if (viewer.status !== "ACCEPTED") return { outcome: "FORBIDDEN" };

    const candidates = this.resolveInvitableUserIds(communityId, input.userIds, input.auth.userId);
    const invitedUserIds: string[] = [];
    for (const userId of candidates) {
      const existing = this.forumMembership(channel.id, userId);
      // Re-inviting someone who already accepted or is still deciding is a
      // no-op; a previously declined invitation is reopened as PENDING.
      if (existing && existing.status !== "DECLINED") continue;
      if (existing) {
        existing.status = "PENDING";
        existing.invitedByUserId = input.auth.userId;
        existing.invitedAt = input.now;
        existing.respondedAt = null;
      } else {
        const member: MemoryForumChannelMember = {
          id: randomUUID(),
          communityId,
          channelId: channel.id,
          userId,
          status: "PENDING",
          isOwner: false,
          invitedByUserId: input.auth.userId,
          invitedAt: input.now,
          respondedAt: null,
        };
        this.forumChannelMembers.set(member.id, member);
      }
      invitedUserIds.push(userId);
    }

    if (invitedUserIds.length > 0) {
      this.audits.push({
        communityId,
        actorUserId: input.auth.userId,
        sessionId: input.auth.sessionId,
        action: "forum.channel.invited",
        entityType: "ForumChannel",
        entityId: channel.id,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }

    return {
      outcome: "OK",
      channel: this.mapForumChannel(channel, input.auth),
      invitedUserIds,
    };
  }

  async respondToForumInvitation(input: {
    auth: AuthSessionRecord;
    channelId: string;
    accept: boolean;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<RespondForumInvitationResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "INVITATION_NOT_FOUND" };

    const channel = this.forumChannels.get(input.channelId);
    if (!channel || channel.communityId !== communityId || channel.kind !== "PRIVATE") {
      return { outcome: "INVITATION_NOT_FOUND" };
    }

    const membership = this.forumMembership(channel.id, input.auth.userId);
    if (!membership || membership.status !== "PENDING") {
      return { outcome: "INVITATION_NOT_FOUND" };
    }

    membership.status = input.accept ? "ACCEPTED" : "DECLINED";
    membership.respondedAt = input.now;

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: input.accept ? "forum.invitation.accepted" : "forum.invitation.declined",
      entityType: "ForumChannel",
      entityId: channel.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return {
      outcome: "OK",
      status: membership.status,
      channel: this.mapForumChannel(channel, input.auth),
    };
  }

  async listForumMessages(input: {
    auth: AuthSessionRecord;
    channelId: string;
    cursor?: string;
    limit: number;
  }): Promise<CursorPageResult<ForumMessageRecord>> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "OK", items: [], total: 0, nextCursor: null };

    const channel = this.forumChannels.get(input.channelId);
    if (
      !channel ||
      channel.communityId !== communityId ||
      !this.canAccessForumChannel(input.auth, channel)
    ) {
      return { outcome: "OK", items: [], total: 0, nextCursor: null };
    }

    // Two messages posted in the same millisecond must still have a stable
    // order — prisma-repository tiebreaks with `{ id: "desc" }`, and here the
    // Map's insertion order is the equivalent "which arrived last".
    const all = [...this.forumMessages.values()]
      .filter(
        (message) =>
          message.communityId === communityId &&
          message.channelId === input.channelId &&
          !message.deletedAt,
      )
      .map((message, arrivalIndex) => ({ message, arrivalIndex }))
      .sort((left, right) => {
        const byRecency = right.message.createdAt.getTime() - left.message.createdAt.getTime();
        return byRecency !== 0 ? byRecency : right.arrivalIndex - left.arrivalIndex;
      })
      .map((entry) => entry.message);

    let startIndex = 0;
    if (input.cursor) {
      const cursorIndex = all.findIndex((message) => message.id === input.cursor);
      if (cursorIndex === -1) return { outcome: "INVALID_CURSOR" };
      startIndex = cursorIndex + 1;
    }
    const page = all.slice(startIndex, startIndex + input.limit);
    const hasMore = startIndex + input.limit < all.length;

    return {
      outcome: "OK",
      items: page.map((message) => this.mapForumMessage(message)),
      total: all.length,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async createForumMessage(input: {
    auth: AuthSessionRecord;
    channelId: string;
    body: string;
    imageUrls: string[];
    replyToMessageId?: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<CreateForumMessageResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "CHANNEL_NOT_FOUND" };

    const channel = this.forumChannels.get(input.channelId);
    if (
      !channel ||
      channel.communityId !== communityId ||
      !this.canAccessForumChannel(input.auth, channel)
    ) {
      return { outcome: "CHANNEL_NOT_FOUND" };
    }

    if (input.replyToMessageId) {
      // A reply must point at a live message in the same channel, otherwise a
      // crafted id could quote a message from a forum the author cannot read.
      const parent = this.forumMessages.get(input.replyToMessageId);
      if (
        !parent ||
        parent.communityId !== communityId ||
        parent.channelId !== channel.id ||
        parent.deletedAt
      ) {
        return { outcome: "REPLY_NOT_FOUND" };
      }
    }

    const message: MemoryForumMessage = {
      id: randomUUID(),
      communityId,
      channelId: channel.id,
      authorUserId: input.auth.userId,
      replyToMessageId: input.replyToMessageId ?? null,
      body: input.body,
      imageUrls: input.imageUrls,
      createdAt: input.now,
      editedAt: null,
      deletedAt: null,
    };
    this.forumMessages.set(message.id, message);

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.message.created",
      entityType: "ForumMessage",
      entityId: message.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    // Recipients: everyone who can read the channel minus the author — the
    // accepted members of a private forum, otherwise the active residents in
    // the channel's RT (or the whole community for the shared channel).
    const recipientUserIds =
      channel.kind === "PRIVATE"
        ? [...this.forumChannelMembers.values()]
            .filter(
              (member) =>
                member.channelId === channel.id &&
                member.status === "ACCEPTED" &&
                member.userId !== input.auth.userId,
            )
            .map((member) => member.userId)
        : [...this.residents.values()]
            .filter((resident) => {
              if (resident.communityId !== communityId || resident.status !== "ACTIVE") {
                return false;
              }
              if (resident.userId === input.auth.userId) return false;
              if (!channel.rtId) return true;
              const household = resident.householdId
                ? this.households.get(resident.householdId)
                : null;
              const house = household ? this.houses.get(household.houseId) : null;
              return house?.rtId === channel.rtId;
            })
            .map((resident) => resident.userId);

    return {
      outcome: "OK",
      message: this.mapForumMessage(message),
      recipientUserIds,
    };
  }

  async updateForumMessage(input: {
    auth: AuthSessionRecord;
    messageId: string;
    body: string;
    imageUrls?: string[];
    now: Date;
    audit: RequestAuditContext;
  }): Promise<UpdateForumMessageResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const message = this.forumMessages.get(input.messageId);
    if (!message || message.communityId !== communityId || message.deletedAt) {
      return { outcome: "NOT_FOUND" };
    }
    // Editing is author-only on purpose: `forum.manage` lets a moderator take a
    // message down, never rewrite someone else's words under their name.
    if (message.authorUserId !== input.auth.userId) return { outcome: "NOT_FOUND" };

    const channel = this.forumChannels.get(message.channelId);
    if (!channel || !this.canAccessForumChannel(input.auth, channel)) {
      return { outcome: "NOT_FOUND" };
    }

    message.body = input.body;
    if (input.imageUrls) message.imageUrls = input.imageUrls;
    message.editedAt = input.now;

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.message.edited",
      entityType: "ForumMessage",
      entityId: message.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return {
      outcome: "OK",
      message: this.mapForumMessage(message),
      channelId: message.channelId,
    };
  }

  async deleteForumMessage(input: {
    auth: AuthSessionRecord;
    messageId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<DeleteForumMessageResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const message = this.forumMessages.get(input.messageId);
    if (!message || message.communityId !== communityId || message.deletedAt) {
      return { outcome: "NOT_FOUND" };
    }
    const channel = this.forumChannels.get(message.channelId);
    const isOwnMessage = message.authorUserId === input.auth.userId;
    if (!isOwnMessage) {
      if (channel?.kind === "PRIVATE") {
        // Private forums are moderated by the warga who opened them, not by
        // community staff who cannot even read the room.
        const viewer = this.forumMembership(channel.id, input.auth.userId);
        if (!viewer?.isOwner || viewer.status !== "ACCEPTED") return { outcome: "NOT_FOUND" };
      } else {
        const canModerate = input.auth.permissions.includes("forum.manage");
        if (!canModerate) return { outcome: "NOT_FOUND" };
        if (input.auth.rtScopeId && channel?.rtId !== input.auth.rtScopeId) {
          return { outcome: "NOT_FOUND" };
        }
      }
    }

    message.deletedAt = input.now;

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.message.deleted",
      entityType: "ForumMessage",
      entityId: message.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return { outcome: "DELETED", messageId: message.id, channelId: message.channelId };
  }

  /* ── Forum Warga discussion board ───────────────────────────────────── */

  /** Enough of the body to fill a card on the board. Mirrors
   * prisma-repository's `forumPostExcerpt`. */
  private forumPostExcerpt(body: string): string {
    const collapsed = body.replace(/\s+/g, " ").trim();
    return collapsed.length > 180 ? `${collapsed.slice(0, 179)}…` : collapsed;
  }

  private forumPostLikeCount(postId: string): number {
    return [...this.forumPostLikes.values()].filter((like) => like.postId === postId).length;
  }

  private forumReplyLikeCount(replyId: string): number {
    return [...this.forumReplyLikes.values()].filter((like) => like.replyId === replyId).length;
  }

  private visibleRepliesFor(postId: string): MemoryForumPostReply[] {
    return [...this.forumPostReplies.values()]
      .filter((reply) => reply.postId === postId && !reply.deletedAt)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  private mapForumPostSummary(post: MemoryForumPost, viewerUserId: string): ForumPostSummaryRecord {
    return {
      id: post.id,
      category: post.category,
      title: post.title,
      excerpt: this.forumPostExcerpt(post.body),
      imageUrls: post.imageUrls,
      replyCount: this.visibleRepliesFor(post.id).length,
      authorUserId: post.authorUserId,
      authorName: this.forumNameForUser(post.authorUserId, post.communityId),
      createdAt: post.createdAt,
      editedAt: post.editedAt,
      likeCount: this.forumPostLikeCount(post.id),
      likedByMe: [...this.forumPostLikes.values()].some(
        (like) => like.postId === post.id && like.userId === viewerUserId,
      ),
    };
  }

  private mapForumPostReply(
    reply: MemoryForumPostReply,
    viewerUserId: string,
  ): ForumPostReplyRecord {
    const parent = reply.replyToReplyId ? this.forumPostReplies.get(reply.replyToReplyId) : null;
    const visibleParent = parent && !parent.deletedAt ? parent : null;
    return {
      id: reply.id,
      postId: reply.postId,
      body: reply.body,
      replyToReplyId: reply.replyToReplyId,
      replyToAuthorName: visibleParent
        ? this.forumNameForUser(visibleParent.authorUserId, visibleParent.communityId)
        : null,
      replyToBody: visibleParent ? visibleParent.body : null,
      authorUserId: reply.authorUserId,
      authorName: this.forumNameForUser(reply.authorUserId, reply.communityId),
      createdAt: reply.createdAt,
      editedAt: reply.editedAt,
      likeCount: this.forumReplyLikeCount(reply.id),
      likedByMe: [...this.forumReplyLikes.values()].some(
        (like) => like.replyId === reply.id && like.userId === viewerUserId,
      ),
    };
  }

  async listForumPosts(input: {
    auth: AuthSessionRecord;
    sort: ForumPostSort;
    category?: ForumPostCategory;
    limit: number;
  }): Promise<ForumPostSummaryRecord[]> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return [];

    const posts = [...this.forumPosts.values()]
      .filter((post) => post.communityId === communityId && !post.deletedAt)
      .filter((post) => !input.category || post.category === input.category)
      // "Terjawab" hides the questions nobody has picked up yet.
      .filter((post) => input.sort !== "answered" || this.visibleRepliesFor(post.id).length > 0)
      .map((post) => this.mapForumPostSummary(post, input.auth.userId));

    posts.sort((left, right) => {
      if (input.sort === "popular" && left.likeCount !== right.likeCount) {
        return right.likeCount - left.likeCount;
      }
      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    return posts.slice(0, input.limit);
  }

  async getForumPost(
    auth: AuthSessionRecord,
    postId: string,
  ): Promise<ForumPostDetailRecord | null> {
    const communityId = auth.currentCommunityId;
    if (!communityId) return null;

    const post = this.forumPosts.get(postId);
    if (!post || post.communityId !== communityId || post.deletedAt) return null;

    return {
      ...this.mapForumPostSummary(post, auth.userId),
      body: post.body,
      replies: this.visibleRepliesFor(post.id).map((reply) =>
        this.mapForumPostReply(reply, auth.userId),
      ),
    };
  }

  private forumBoardRecipients(communityId: string, excludeUserId: string): string[] {
    return [
      ...new Set(
        [...this.residents.values()]
          .filter(
            (resident) =>
              resident.communityId === communityId &&
              resident.status === "ACTIVE" &&
              resident.userId !== excludeUserId,
          )
          .map((resident) => resident.userId),
      ),
    ];
  }

  async createForumPost(input: {
    auth: AuthSessionRecord;
    category: ForumPostCategory;
    title: string;
    body: string;
    imageUrls: string[];
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ForumPostMutationResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const post: MemoryForumPost = {
      id: randomUUID(),
      communityId,
      authorUserId: input.auth.userId,
      category: input.category,
      title: input.title,
      body: input.body,
      imageUrls: input.imageUrls,
      createdAt: input.now,
      editedAt: null,
      deletedAt: null,
    };
    this.forumPosts.set(post.id, post);

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.post.created",
      entityType: "ForumPost",
      entityId: post.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return {
      outcome: "OK",
      post: this.mapForumPostSummary(post, input.auth.userId),
      recipientUserIds: this.forumBoardRecipients(communityId, input.auth.userId),
    };
  }

  async updateForumPost(input: {
    auth: AuthSessionRecord;
    postId: string;
    changes: {
      category?: ForumPostCategory;
      title?: string;
      body?: string;
      imageUrls?: string[];
    };
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ForumPostMutationResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const post = this.forumPosts.get(input.postId);
    if (!post || post.communityId !== communityId || post.deletedAt) {
      return { outcome: "NOT_FOUND" };
    }
    // Author-only: `forum.manage` takes a post down, never rewrites it.
    if (post.authorUserId !== input.auth.userId) return { outcome: "NOT_FOUND" };

    if (input.changes.category) post.category = input.changes.category;
    if (input.changes.title) post.title = input.changes.title;
    if (input.changes.body) post.body = input.changes.body;
    if (input.changes.imageUrls) post.imageUrls = input.changes.imageUrls;
    post.editedAt = input.now;

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.post.edited",
      entityType: "ForumPost",
      entityId: post.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return {
      outcome: "OK",
      post: this.mapForumPostSummary(post, input.auth.userId),
      recipientUserIds: [],
    };
  }

  async deleteForumPost(input: {
    auth: AuthSessionRecord;
    postId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ForumDeleteResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const post = this.forumPosts.get(input.postId);
    if (!post || post.communityId !== communityId || post.deletedAt) {
      return { outcome: "NOT_FOUND" };
    }
    const canModerate = input.auth.permissions.includes("forum.manage");
    if (post.authorUserId !== input.auth.userId && !canModerate) {
      return { outcome: "NOT_FOUND" };
    }

    post.deletedAt = input.now;
    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.post.deleted",
      entityType: "ForumPost",
      entityId: post.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "DELETED" };
  }

  async toggleForumPostLike(input: {
    auth: AuthSessionRecord;
    postId: string;
    now: Date;
  }): Promise<ForumLikeResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const post = this.forumPosts.get(input.postId);
    if (!post || post.communityId !== communityId || post.deletedAt) {
      return { outcome: "NOT_FOUND" };
    }

    const existing = [...this.forumPostLikes.values()].find(
      (like) => like.postId === post.id && like.userId === input.auth.userId,
    );
    if (existing) {
      this.forumPostLikes.delete(existing.id);
    } else {
      const id = randomUUID();
      this.forumPostLikes.set(id, {
        id,
        communityId,
        postId: post.id,
        userId: input.auth.userId,
        createdAt: input.now,
      });
    }

    return {
      outcome: "OK",
      likeCount: this.forumPostLikeCount(post.id),
      likedByMe: !existing,
    };
  }

  async createForumPostReply(input: {
    auth: AuthSessionRecord;
    postId: string;
    body: string;
    replyToReplyId?: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ForumPostReplyMutationResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "POST_NOT_FOUND" };

    const post = this.forumPosts.get(input.postId);
    if (!post || post.communityId !== communityId || post.deletedAt) {
      return { outcome: "POST_NOT_FOUND" };
    }

    if (input.replyToReplyId) {
      // The quoted reply must live on this very post, otherwise a crafted id
      // could pull text out of a discussion the author is not reading.
      const parent = this.forumPostReplies.get(input.replyToReplyId);
      if (
        !parent ||
        parent.communityId !== communityId ||
        parent.postId !== post.id ||
        parent.deletedAt
      ) {
        return { outcome: "REPLY_NOT_FOUND" };
      }
    }

    const reply: MemoryForumPostReply = {
      id: randomUUID(),
      communityId,
      postId: post.id,
      authorUserId: input.auth.userId,
      replyToReplyId: input.replyToReplyId ?? null,
      body: input.body,
      createdAt: input.now,
      editedAt: null,
      deletedAt: null,
    };
    this.forumPostReplies.set(reply.id, reply);

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.reply.created",
      entityType: "ForumPostReply",
      entityId: reply.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    // Only the people in the conversation, not the whole community.
    const recipientUserIds = [
      ...new Set([
        post.authorUserId,
        ...this.visibleRepliesFor(post.id).map((item) => item.authorUserId),
      ]),
    ].filter((userId) => userId !== input.auth.userId);

    return {
      outcome: "OK",
      reply: this.mapForumPostReply(reply, input.auth.userId),
      recipientUserIds,
    };
  }

  async updateForumPostReply(input: {
    auth: AuthSessionRecord;
    replyId: string;
    body: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ForumPostReplyMutationResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "REPLY_NOT_FOUND" };

    const reply = this.forumPostReplies.get(input.replyId);
    if (!reply || reply.communityId !== communityId || reply.deletedAt) {
      return { outcome: "REPLY_NOT_FOUND" };
    }
    if (reply.authorUserId !== input.auth.userId) return { outcome: "REPLY_NOT_FOUND" };

    reply.body = input.body;
    reply.editedAt = input.now;

    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.reply.edited",
      entityType: "ForumPostReply",
      entityId: reply.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    return {
      outcome: "OK",
      reply: this.mapForumPostReply(reply, input.auth.userId),
      recipientUserIds: [],
    };
  }

  async deleteForumPostReply(input: {
    auth: AuthSessionRecord;
    replyId: string;
    now: Date;
    audit: RequestAuditContext;
  }): Promise<ForumDeleteResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const reply = this.forumPostReplies.get(input.replyId);
    if (!reply || reply.communityId !== communityId || reply.deletedAt) {
      return { outcome: "NOT_FOUND" };
    }
    const canModerate = input.auth.permissions.includes("forum.manage");
    if (reply.authorUserId !== input.auth.userId && !canModerate) {
      return { outcome: "NOT_FOUND" };
    }

    reply.deletedAt = input.now;
    this.audits.push({
      communityId,
      actorUserId: input.auth.userId,
      sessionId: input.auth.sessionId,
      action: "forum.reply.deleted",
      entityType: "ForumPostReply",
      entityId: reply.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "DELETED" };
  }

  async toggleForumReplyLike(input: {
    auth: AuthSessionRecord;
    replyId: string;
    now: Date;
  }): Promise<ForumLikeResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    const reply = this.forumPostReplies.get(input.replyId);
    if (!reply || reply.communityId !== communityId || reply.deletedAt) {
      return { outcome: "NOT_FOUND" };
    }

    const existing = [...this.forumReplyLikes.values()].find(
      (like) => like.replyId === reply.id && like.userId === input.auth.userId,
    );
    if (existing) {
      this.forumReplyLikes.delete(existing.id);
    } else {
      const id = randomUUID();
      this.forumReplyLikes.set(id, {
        id,
        communityId,
        replyId: reply.id,
        userId: input.auth.userId,
        createdAt: input.now,
      });
    }

    return {
      outcome: "OK",
      likeCount: this.forumReplyLikeCount(reply.id),
      likedByMe: !existing,
    };
  }

  async recordAudit(input: AuditInput): Promise<void> {
    this.audits.push({ ...input });
  }

  private hasCurrentHouseholdAccess(auth: AuthSessionRecord): boolean {
    if (!auth.currentCommunityId || !auth.currentHouseholdId) return false;
    const household = this.households.get(auth.currentHouseholdId);
    if (!household || household.communityId !== auth.currentCommunityId) return false;
    return [...this.residents.values()].some(
      (resident) =>
        resident.userId === auth.userId &&
        resident.communityId === auth.currentCommunityId &&
        resident.householdId === auth.currentHouseholdId &&
        resident.status === "ACTIVE",
    );
  }

  private isActiveHouseholdResident(
    residentId: string,
    communityId: string,
    householdId: string,
  ): boolean {
    return [...this.residents.values()].some(
      (resident) =>
        resident.id === residentId &&
        resident.communityId === communityId &&
        resident.householdId === householdId &&
        resident.status === "ACTIVE",
    );
  }

  private houseForVehicle(vehicle: MemoryVehicle): MemoryHouse | undefined {
    const household = this.households.get(vehicle.householdId);
    return household ? this.houses.get(household.houseId) : undefined;
  }

  private vehicleRecord(vehicle: MemoryVehicle): VehicleRecord {
    const house = this.houseForVehicle(vehicle);
    return {
      id: vehicle.id,
      type: vehicle.type,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      ownerLabel: vehicle.ownerLabel,
      ownerResidentId: vehicle.ownerResidentId,
      status: vehicle.status,
      houseCode: house?.code ?? "",
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }

  private residentForUser(
    userId: string,
    preferredCommunityId: string | null = null,
  ): MemoryResident | undefined {
    const candidates = [...this.residents.values()].filter(
      (resident) => resident.userId === userId,
    );
    return (
      candidates.find((resident) => resident.communityId === preferredCommunityId) ??
      candidates.sort((left, right) => right.requestedAt.getTime() - left.requestedAt.getTime())[0]
    );
  }

  private currentContextForResident(resident: MemoryResident): MeRecord["currentContext"] {
    if (!resident.householdId) return null;
    const community = this.communities.get(resident.communityId);
    const household = this.households.get(resident.householdId);
    const house = household ? this.houses.get(household.houseId) : undefined;
    if (!community || !household || !house) return null;
    return {
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        timezone: community.timezone,
      },
      household: {
        id: household.id,
        displayName: household.displayName,
        house: {
          id: house.id,
          code: house.code,
          block: house.block,
          number: house.number,
          addressLabel: `Blok ${house.block} No. ${house.number}`,
        },
      },
    };
  }

  private residencyRequestRecord(resident: MemoryResident): ResidencyRequestRecord {
    const user = this.users.get(resident.userId);
    const community = this.communities.get(resident.communityId);
    const house = resident.requestedHouseId
      ? this.houses.get(resident.requestedHouseId)
      : undefined;
    if (!user || !community || !house || !resident.relationship) {
      throw new Error("Fixture permohonan warga tidak lengkap.");
    }
    return {
      id: resident.id,
      userId: user.id,
      phoneE164: user.phoneE164,
      fullName: resident.fullName,
      status:
        resident.status === "ACTIVE" || resident.status === "REJECTED"
          ? resident.status
          : "PENDING",
      relationship: resident.relationship,
      submittedAt: resident.requestedAt,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        timezone: community.timezone,
      },
      house: {
        id: house.id,
        code: house.code,
        block: house.block,
        number: house.number,
        addressLabel: `Blok ${house.block} No. ${house.number}`,
      },
    };
  }

  private visibleAnnouncements(auth: AuthSessionRecord, now: Date): AnnouncementRecord[] {
    if (auth.currentCommunityId !== demoIds.community) return [];
    return (
      this.announcements
        // Mirrors prisma-repository's `archivedAt: null` guard — an archived
        // notice drops off the board but keeps its row.
        .filter((announcement) => announcement.publishedAt <= now && !announcement.archivedAt)
        .sort((left, right) => right.publishedAt.getTime() - left.publishedAt.getTime())
        .map((announcement) => ({
          ...announcement,
          isRead: this.reads.has(`${auth.userId}:${announcement.id}`),
        }))
    );
  }

  private visibleAgenda(auth: AuthSessionRecord, now: Date, view: AgendaView): MemoryAgendaEvent[] {
    const localNow = localDateTime(now);
    const isUpcoming = (event: MemoryAgendaEvent) =>
      event.date > localNow.date ||
      (event.date === localNow.date && event.endTime >= localNow.time);
    const direction = view === "upcoming" ? 1 : -1;
    return this.agendaEvents
      .filter(
        (event) =>
          event.communityId === auth.currentCommunityId &&
          event.archivedAt === null &&
          (view === "upcoming" ? isUpcoming(event) : !isUpcoming(event)),
      )
      .sort(
        (left, right) =>
          direction *
          `${left.date}T${left.startTime}:${left.id}`.localeCompare(
            `${right.date}T${right.startTime}:${right.id}`,
          ),
      );
  }

  async updateProfile(input: {
    auth: AuthSessionRecord;
    profile: UpdateProfileInput;
  }): Promise<{ displayName: string | null; allowResidentContact: boolean }> {
    const user = this.users.get(input.auth.userId);
    if (!user) throw new Error("User not found");
    if (input.profile.displayName !== undefined) {
      user.displayName = input.profile.displayName;
    }
    if (input.profile.allowResidentContact !== undefined) {
      user.allowResidentContact = input.profile.allowResidentContact;
    }
    return {
      displayName: user.displayName,
      allowResidentContact: user.allowResidentContact,
    };
  }
}
