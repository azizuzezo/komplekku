import { randomUUID } from "node:crypto";

import { PrismaClient, type Prisma } from "@prisma/client";
import type {
  AddReportUpdateInput,
  AgendaView,
  CreateAgendaEventInput,
  CreateCameraInput,
  CreateCashTransactionInput,
  CreateDuesTypeInput,
  CreateFacilityBookingInput,
  CreateHouseInput,
  CreateIncidentInput,
  CreateLetterRequestInput,
  CreatePackageInput,
  CreatePaymentInput,
  CreateReportInput,
  CreateVehicleInput,
  CreateVisitorInput,
  CreateWalkInVisitorInput,
  GenerateInvoicesInput,
  HouseholdRelationship,
  IncidentStatus,
  InvoiceStatus,
  LetterRequestStatus,
  PaymentStatus,
  ReportStatus,
  UpdateAgendaEventInput,
  UpdateCameraInput,
  UpdateIncidentInput,
  UpdateProfileInput,
  UpdateVehicleInput,
} from "@komplekku/contracts";

import type {
  AddHouseholdMemberResult,
  AddReportUpdateResult,
  AgendaMutationResult,
  AgendaRecord,
  ArchiveAgendaResult,
  ArchiveVehicleResult,
  AnnouncementRecord,
  AppRepository,
  AuditInput,
  AuthSessionRecord,
  CameraMutationResult,
  CameraRecord,
  CancelFacilityBookingResult,
  CashLedgerRecord,
  CashTransactionRecord,
  CollectPackageResult,
  CommunityMemberRecord,
  CreateFacilityBookingResult,
  CreateHouseResult,
  CreateLetterRequestResult,
  CreatePackageResult,
  CreatePaymentResult,
  CreateReportResult,
  CreateResidencyRequestResult,
  CreateVisitorResult,
  CurrentCommunityRecord,
  CurrentHouseholdRecord,
  DirectoryRecord,
  DuesTypeRecord,
  EmergencyRecord,
  EmergencyTransitionResult,
  FacilityBookingRecord,
  FacilityRecord,
  FinanceDashboardRecord,
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
  ResidencyRequestRecord,
  ReviewResidencyRequestResult,
  RoleSummary,
  ScanCheckpointResult,
  SecurityDashboardRecord,
  SecurityShiftRecord,
  SessionCreationResult,
  SetMemberRoleResult,
  StreamTicketResult,
  UpdateIncidentResult,
  UpdateProfileResult,
  VehicleMutationResult,
  VehicleRecord,
  VehicleSearchRecord,
  VisitorCheckResult,
  VisitorRecord,
  WaiveInvoiceResult,
} from "../domain/repository";
import { formatVehiclePlate, normalizeVehiclePlate } from "../lib/security";

function mapOtp(record: {
  id: string;
  phoneE164: string;
  codeDigest: string;
  attemptCount: number;
  maxAttempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  invalidatedAt: Date | null;
}): OtpRecord {
  return record;
}

function addressLabel(block: string, number: string): string {
  return `Blok ${block} No. ${number}`;
}

function displayNameOf(user: { displayName: string | null; phoneE164?: string }): string {
  return user.displayName ?? user.phoneE164 ?? "Pengguna Komplekku";
}

function cameraCanSee(accessLevel: "RESIDENT" | "SECURITY" | "ADMIN_ONLY", permissions: string[]) {
  if (permissions.includes("camera.manage")) return true;
  if (accessLevel === "RESIDENT") return permissions.includes("camera.public.read");
  if (accessLevel === "SECURITY") return permissions.includes("camera.security.read");
  return false;
}

function visibleCameraAccessLevels(
  permissions: string[],
): ("RESIDENT" | "SECURITY" | "ADMIN_ONLY")[] {
  if (permissions.includes("camera.manage")) return ["RESIDENT", "SECURITY", "ADMIN_ONLY"];
  const levels: ("RESIDENT" | "SECURITY" | "ADMIN_ONLY")[] = [];
  if (permissions.includes("camera.public.read")) levels.push("RESIDENT");
  if (permissions.includes("camera.security.read")) levels.push("SECURITY");
  return levels;
}

function parseAgendaDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseAgendaTime(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function formatAgendaDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatAgendaTime(value: Date): string {
  return value.toISOString().slice(11, 16);
}

function mapAgendaEvent(event: {
  id: string;
  title: string;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
  organizer: string;
}): AgendaRecord {
  return {
    id: event.id,
    title: event.title,
    date: formatAgendaDate(event.eventDate),
    startTime: formatAgendaTime(event.startTime),
    endTime: formatAgendaTime(event.endTime),
    location: event.location,
    description: event.description,
    organizer: event.organizer,
  };
}

function dateAndTimeInZone(now: Date, timezone: string): { date: Date; time: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const date = `${value("year")}-${value("month")}-${value("day")}`;
  const time = `${value("hour")}:${value("minute")}`;
  return { date: parseAgendaDate(date), time: parseAgendaTime(time) };
}

function mapNotification(notification: {
  id: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  entityType: string;
  entityId: string | null;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
}): NotificationRecord {
  return notification;
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && Reflect.get(error, "code") === "P2002";
}

function mapVehicle(vehicle: {
  id: string;
  type: "CAR" | "MOTORCYCLE" | "BICYCLE" | "OTHER";
  plate: string | null;
  brand: string;
  model: string | null;
  color: string;
  ownerLabel: string;
  ownerResidentId: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
  household: { house: { code: string } };
}): VehicleRecord {
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
    houseCode: vehicle.household.house.code,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

export class PrismaRepository implements AppRepository {
  constructor(private readonly prisma = new PrismaClient()) {}

  async healthCheck(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async replaceOtpChallenge(input: {
    id: string;
    phoneE164: string;
    codeDigest: string;
    maxAttempts: number;
    expiresAt: Date;
    now: Date;
  }): Promise<OtpRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.otpRequest.updateMany({
        where: {
          phoneE164: input.phoneE164,
          consumedAt: null,
          invalidatedAt: null,
        },
        data: { invalidatedAt: input.now },
      });

      const challenge = await transaction.otpRequest.create({
        data: {
          id: input.id,
          phoneE164: input.phoneE164,
          codeDigest: input.codeDigest,
          maxAttempts: input.maxAttempts,
          expiresAt: input.expiresAt,
        },
      });
      return mapOtp(challenge);
    });
  }

  async findOtp(id: string): Promise<OtpRecord | null> {
    const challenge = await this.prisma.otpRequest.findUnique({ where: { id } });
    return challenge ? mapOtp(challenge) : null;
  }

  async incrementOtpFailure(id: string, now: Date): Promise<void> {
    await this.prisma.otpRequest.updateMany({
      where: {
        id,
        consumedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
        attemptCount: { lt: this.prisma.otpRequest.fields.maxAttempts },
      },
      data: { attemptCount: { increment: 1 } },
    });
  }

  async consumeOtpAndCreateSession(input: {
    otpId: string;
    phoneE164: string;
    tokenDigest: string;
    sessionExpiresAt: Date;
    now: Date;
  }): Promise<SessionCreationResult | null> {
    return this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.otpRequest.updateMany({
        where: {
          id: input.otpId,
          phoneE164: input.phoneE164,
          consumedAt: null,
          invalidatedAt: null,
          expiresAt: { gt: input.now },
          attemptCount: { lt: this.prisma.otpRequest.fields.maxAttempts },
        },
        data: { consumedAt: input.now },
      });

      if (consumed.count !== 1) return null;

      const user = await transaction.user.upsert({
        where: { phoneE164: input.phoneE164 },
        update: { phoneVerifiedAt: input.now },
        create: {
          phoneE164: input.phoneE164,
          phoneVerifiedAt: input.now,
        },
      });

      const memberships = await transaction.householdMember.findMany({
        where: {
          endedAt: null,
          resident: { userId: user.id, status: "ACTIVE" },
          household: { deletedAt: null },
        },
        select: { communityId: true, householdId: true },
        take: 2,
      });

      const defaultContext = memberships.length === 1 ? memberships[0] : null;
      const session = await transaction.session.create({
        data: {
          userId: user.id,
          tokenDigest: input.tokenDigest,
          currentCommunityId: defaultContext?.communityId,
          currentHouseholdId: defaultContext?.householdId,
          expiresAt: input.sessionExpiresAt,
          lastSeenAt: input.now,
        },
      });

      return {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
      };
    });
  }

  async findAuthSession(tokenDigest: string, now: Date): Promise<AuthSessionRecord | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenDigest },
      include: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.user.status !== "ACTIVE"
    ) {
      return null;
    }

    const userRoles = session.currentCommunityId
      ? await this.prisma.userRole.findMany({
          where: {
            userId: session.userId,
            communityId: session.currentCommunityId,
          },
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        })
      : [];

    const permissions = [
      ...new Set(
        userRoles.flatMap((userRole) =>
          userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.key),
        ),
      ),
    ].sort();

    return {
      sessionId: session.id,
      userId: session.userId,
      currentCommunityId: session.currentCommunityId,
      currentHouseholdId: session.currentHouseholdId,
      permissions,
    };
  }

  async revokeSession(sessionId: string, now: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async getMe(auth: AuthSessionRecord): Promise<MeRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return null;

    const resident = auth.currentCommunityId
      ? await this.prisma.resident.findUnique({
          where: {
            userId_communityId: {
              userId: auth.userId,
              communityId: auth.currentCommunityId,
            },
          },
        })
      : await this.prisma.resident.findFirst({
          where: { userId: auth.userId },
          orderBy: { createdAt: "asc" },
        });

    const membership =
      auth.currentCommunityId && auth.currentHouseholdId
        ? await this.prisma.householdMember.findFirst({
            where: {
              communityId: auth.currentCommunityId,
              householdId: auth.currentHouseholdId,
              endedAt: null,
              resident: { userId: auth.userId, status: "ACTIVE" },
            },
            include: {
              household: {
                include: { house: true, community: true },
              },
            },
          })
        : null;

    const currentContext = membership
      ? {
          community: {
            id: membership.household.community.id,
            name: membership.household.community.name,
            slug: membership.household.community.slug,
            timezone: membership.household.community.timezone,
          },
          household: {
            id: membership.household.id,
            displayName: membership.household.displayName,
            house: {
              id: membership.household.house.id,
              code: membership.household.house.code,
              block: membership.household.house.block,
              number: membership.household.house.number,
              addressLabel: addressLabel(
                membership.household.house.block,
                membership.household.house.number,
              ),
            },
          },
        }
      : null;

    let authState: MeRecord["authState"] = "NEEDS_RESIDENCY";
    if (currentContext) authState = "READY";
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
      currentContext,
      permissions: auth.permissions,
    };
  }

  async updateOwnProfile(input: {
    auth: AuthSessionRecord;
    changes: UpdateProfileInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<UpdateProfileResult> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.user.findUnique({
        where: { id: input.auth.userId },
        select: { id: true },
      });
      if (!existing) return { outcome: "NOT_FOUND" as const };

      const profile = await transaction.user.update({
        where: { id: existing.id },
        data: {
          ...(input.changes.displayName === undefined
            ? {}
            : { displayName: input.changes.displayName }),
          ...(input.changes.allowResidentContact === undefined
            ? {}
            : { allowResidentContact: input.changes.allowResidentContact }),
          updatedAt: input.now,
        },
        select: { displayName: true, allowResidentContact: true },
      });
      await transaction.auditLog.create({
        data: {
          communityId: input.auth.currentCommunityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "profile.updated",
          entityType: "User",
          entityId: existing.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
          metadata: {
            changedFields: Object.keys(input.changes).sort().join(","),
          },
          createdAt: input.now,
        },
      });
      return { outcome: "OK" as const, profile };
    });
  }

  async getCurrentCommunity(auth: AuthSessionRecord): Promise<CurrentCommunityRecord | null> {
    if (!auth.currentCommunityId) return null;
    return this.prisma.community.findFirst({
      where: { id: auth.currentCommunityId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        timezone: true,
        address: true,
        contactPhone: true,
        emergencyContactPhone: true,
      },
    });
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
    const search = input.search?.trim();
    const activeMemberWhere: Prisma.HouseholdMemberWhereInput = {
      endedAt: null,
      resident: { status: "ACTIVE" },
    };
    const where: Prisma.HouseholdWhereInput = {
      communityId: input.auth.currentCommunityId,
      deletedAt: null,
      house: { deletedAt: null },
      members: { some: activeMemberWhere },
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: "insensitive" as const } },
              { house: { code: { contains: search, mode: "insensitive" as const } } },
              ...(input.includeAdminDetails
                ? [
                    {
                      members: {
                        some: {
                          ...activeMemberWhere,
                          resident: {
                            status: "ACTIVE" as const,
                            OR: [
                              { fullName: { contains: search, mode: "insensitive" as const } },
                              {
                                user: {
                                  displayName: {
                                    contains: search,
                                    mode: "insensitive" as const,
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ]
                : []),
            ],
          }
        : {}),
    };
    if (input.cursor) {
      const cursor = await this.prisma.household.findFirst({
        where: { ...where, id: input.cursor },
        select: { id: true },
      });
      if (!cursor) return { outcome: "INVALID_CURSOR" as const };
    }
    const [households, total] = await this.prisma.$transaction([
      this.prisma.household.findMany({
        where,
        include: {
          house: true,
          members: {
            where: activeMemberWhere,
            include: { resident: { include: { user: true } } },
            orderBy: [{ isPrimary: "desc" }, { joinedAt: "asc" }, { id: "asc" }],
          },
        },
        orderBy: [{ house: { code: "asc" } }, { id: "asc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      }),
      this.prisma.household.count({ where }),
    ]);
    const hasMore = households.length > input.limit;
    const page = hasMore ? households.slice(0, input.limit) : households;
    const items: DirectoryRecord[] = page.map((household) => ({
      householdId: household.id,
      houseCode: household.house.code,
      householdDisplayName: household.displayName,
      occupancyStatus: household.house.occupancyStatus,
      contacts: household.members.flatMap((member) =>
        member.resident.user.allowResidentContact
          ? [
              {
                displayName: member.resident.user.displayName ?? member.resident.fullName,
                phoneE164: member.resident.user.phoneE164,
              },
            ]
          : [],
      ),
      members: input.includeAdminDetails
        ? household.members.map((member) => ({
            residentId: member.resident.id,
            displayName: member.resident.user.displayName ?? member.resident.fullName,
            relationship: member.relationship,
            status: "ACTIVE" as const,
            linkedAccount: true,
            contactPhoneE164: member.resident.user.allowResidentContact
              ? member.resident.user.phoneE164
              : null,
          }))
        : [],
    }));
    return {
      outcome: "OK" as const,
      items,
      total,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getCurrentHousehold(auth: AuthSessionRecord): Promise<CurrentHouseholdRecord | null> {
    if (!auth.currentCommunityId || !auth.currentHouseholdId) return null;
    const household = await this.prisma.household.findFirst({
      where: {
        id: auth.currentHouseholdId,
        communityId: auth.currentCommunityId,
        deletedAt: null,
        members: {
          some: {
            endedAt: null,
            resident: { userId: auth.userId, status: "ACTIVE" },
          },
        },
      },
      include: {
        house: true,
        members: {
          where: { endedAt: null, resident: { status: "ACTIVE" } },
          include: { resident: { include: { user: true } } },
          orderBy: [{ isPrimary: "desc" }, { joinedAt: "asc" }, { id: "asc" }],
        },
      },
    });
    if (!household || household.house.deletedAt) return null;
    const canReadResidents = auth.permissions.includes("resident.read");
    return {
      id: household.id,
      displayName: household.displayName,
      occupancyStatus: household.house.occupancyStatus,
      house: {
        id: household.house.id,
        code: household.house.code,
        block: household.house.block,
        number: household.house.number,
        addressLabel: addressLabel(household.house.block, household.house.number),
      },
      members: household.members.map((member) => ({
        residentId: member.resident.id,
        userId: member.resident.userId,
        displayName: member.resident.user.displayName ?? member.resident.fullName,
        relationship: member.relationship,
        linkedAccount: true,
        phoneE164:
          member.resident.userId === auth.userId ||
          member.resident.user.allowResidentContact ||
          canReadResidents
            ? member.resident.user.phoneE164
            : null,
        allowResidentContact: member.resident.user.allowResidentContact,
      })),
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

    return this.prisma.$transaction(async (transaction) => {
      const household = await transaction.household.findFirst({
        where: { id: householdId, communityId, deletedAt: null },
      });
      if (!household) return { outcome: "NOT_FOUND" as const };

      const existingResident = await transaction.resident.findFirst({
        where: { communityId, user: { phoneE164: input.phoneE164 } },
        include: { householdMemberships: { where: { endedAt: null } } },
      });

      if (existingResident) {
        const alreadyInThisHousehold = existingResident.householdMemberships.some(
          (membership) => membership.householdId === householdId,
        );
        if (alreadyInThisHousehold) return { outcome: "ALREADY_MEMBER" as const };
        if (existingResident.status === "ACTIVE") {
          return { outcome: "ALREADY_RESIDENT_ELSEWHERE" as const };
        }
      }

      const user = await transaction.user.upsert({
        where: { phoneE164: input.phoneE164 },
        update: {},
        create: { phoneE164: input.phoneE164 },
      });

      const resident = existingResident
        ? await transaction.resident.update({
            where: { id: existingResident.id },
            data: {
              fullName: input.fullName,
              status: "ACTIVE",
              requestedRelationship: input.relationship,
              approvedAt: input.now,
              approvedByUserId: input.auth.userId,
              rejectedAt: null,
              rejectedByUserId: null,
              rejectionReason: null,
            },
          })
        : await transaction.resident.create({
            data: {
              communityId,
              userId: user.id,
              fullName: input.fullName,
              status: "ACTIVE",
              requestedRelationship: input.relationship,
              approvedAt: input.now,
              approvedByUserId: input.auth.userId,
            },
          });

      const member = await transaction.householdMember.create({
        data: {
          communityId,
          householdId,
          residentId: resident.id,
          relationship: input.relationship,
          isPrimary: false,
        },
      });

      const householdMemberRole = await transaction.role.findUnique({
        where: { code: "HOUSEHOLD_MEMBER" },
      });
      if (householdMemberRole) {
        await transaction.userRole.upsert({
          where: {
            userId_communityId_roleId: {
              userId: user.id,
              communityId,
              roleId: householdMemberRole.id,
            },
          },
          update: {},
          create: { userId: user.id, communityId, roleId: householdMemberRole.id },
        });
      }

      await transaction.auditLog.create({
        data: {
          communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "household.member.added",
          entityType: "HouseholdMember",
          entityId: member.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
          createdAt: input.now,
        },
      });

      return {
        outcome: "OK" as const,
        member: {
          residentId: resident.id,
          userId: user.id,
          displayName: user.displayName ?? resident.fullName,
          relationship: member.relationship,
          linkedAccount: true,
          phoneE164: user.phoneE164,
          allowResidentContact: user.allowResidentContact,
        },
      };
    });
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

    return this.prisma.$transaction(async (transaction) => {
      const member = await transaction.householdMember.findFirst({
        where: { communityId, householdId, residentId: input.residentId, endedAt: null },
      });
      if (!member) return { outcome: "NOT_FOUND" as const };
      if (member.isPrimary) return { outcome: "CANNOT_REMOVE_PRIMARY" as const };

      await transaction.householdMember.update({
        where: { id: member.id },
        data: { endedAt: input.now },
      });

      await transaction.auditLog.create({
        data: {
          communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "household.member.removed",
          entityType: "HouseholdMember",
          entityId: member.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
          createdAt: input.now,
        },
      });

      return { outcome: "REMOVED" as const, residentId: input.residentId };
    });
  }

  async listRegistrationCommunities() {
    return this.prisma.community.findMany({
      where: { registrationOpen: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, timezone: true },
    });
  }

  async listRoles(): Promise<RoleSummary[]> {
    const roles = await this.prisma.role.findMany({ orderBy: { name: "asc" } });
    return roles.map((role) => ({ id: role.id, code: role.code, name: role.name }));
  }

  async listCommunityMembers(auth: AuthSessionRecord): Promise<CommunityMemberRecord[]> {
    const communityId = auth.currentCommunityId;
    if (!communityId) return [];

    const residents = await this.prisma.resident.findMany({
      where: { communityId, status: "ACTIVE" },
      include: {
        user: true,
        householdMemberships: {
          where: { endedAt: null },
          include: { household: { include: { house: true } } },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
    });

    const userRoles = await this.prisma.userRole.findMany({
      where: { communityId, userId: { in: residents.map((resident) => resident.userId) } },
      include: { role: true },
    });
    const rolesByUser = new Map<string, RoleSummary[]>();
    for (const userRole of userRoles) {
      const existing = rolesByUser.get(userRole.userId) ?? [];
      existing.push({ id: userRole.role.id, code: userRole.role.code, name: userRole.role.name });
      rolesByUser.set(userRole.userId, existing);
    }

    return residents.map((resident) => ({
      residentId: resident.id,
      userId: resident.userId,
      displayName: resident.user.displayName ?? resident.fullName,
      phoneE164: resident.user.phoneE164,
      houseCode: resident.householdMemberships[0]?.household.house.code ?? null,
      roles: rolesByUser.get(resident.userId) ?? [],
    }));
  }

  async setMemberRole(input: {
    auth: AuthSessionRecord;
    residentId: string;
    roleCode: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<SetMemberRoleResult> {
    const communityId = input.auth.currentCommunityId;
    if (!communityId) return { outcome: "NOT_FOUND" };

    return this.prisma.$transaction(async (transaction) => {
      const resident = await transaction.resident.findFirst({
        where: { id: input.residentId, communityId, status: "ACTIVE" },
      });
      if (!resident) return { outcome: "NOT_FOUND" as const };
      if (resident.userId === input.auth.userId) {
        return { outcome: "CANNOT_CHANGE_SELF" as const };
      }

      const role = await transaction.role.findUnique({ where: { code: input.roleCode } });
      if (!role) return { outcome: "ROLE_NOT_FOUND" as const };

      await transaction.userRole.deleteMany({ where: { userId: resident.userId, communityId } });
      await transaction.userRole.create({
        data: { userId: resident.userId, communityId, roleId: role.id },
      });

      await transaction.auditLog.create({
        data: {
          communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "member.role.changed",
          entityType: "UserRole",
          entityId: resident.userId,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
          metadata: { roleCode: input.roleCode },
          createdAt: input.now,
        },
      });

      return {
        outcome: "OK" as const,
        residentId: resident.id,
        roles: [{ id: role.id, code: role.code, name: role.name }],
      };
    });
  }

  async createResidencyRequest(input: {
    auth: AuthSessionRecord;
    communityId: string;
    houseCode: string;
    fullName: string;
    relationship: HouseholdRelationship;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateResidencyRequestResult> {
    return this.prisma.$transaction(async (transaction) => {
      const community = await transaction.community.findFirst({
        where: {
          id: input.communityId,
          registrationOpen: true,
          deletedAt: null,
        },
        select: { id: true, name: true, slug: true, timezone: true },
      });
      if (!community) return { outcome: "COMMUNITY_NOT_FOUND" };

      const existing = await transaction.resident.findUnique({
        where: {
          userId_communityId: {
            userId: input.auth.userId,
            communityId: community.id,
          },
        },
      });
      if (existing?.status === "PENDING") return { outcome: "PENDING_EXISTS" };
      if (existing?.status === "ACTIVE") return { outcome: "ALREADY_ACTIVE" };
      if (existing && existing.status !== "REJECTED") {
        return { outcome: "ACCOUNT_RESTRICTED" };
      }

      const house = await transaction.house.findFirst({
        where: {
          communityId: community.id,
          code: input.houseCode.trim().toUpperCase(),
          deletedAt: null,
        },
      });
      if (!house) return { outcome: "HOUSE_NOT_FOUND" };

      const user = await transaction.user.update({
        where: { id: input.auth.userId },
        data: { displayName: input.fullName },
      });
      const request = existing
        ? await transaction.resident.update({
            where: { id: existing.id },
            data: {
              fullName: input.fullName,
              status: "PENDING",
              requestedHouseId: house.id,
              requestedRelationship: input.relationship,
              requestedAt: input.now,
              approvedAt: null,
              approvedByUserId: null,
              rejectedAt: null,
              rejectedByUserId: null,
              rejectionReason: null,
            },
          })
        : await transaction.resident.create({
            data: {
              communityId: community.id,
              userId: input.auth.userId,
              fullName: input.fullName,
              status: "PENDING",
              requestedHouseId: house.id,
              requestedRelationship: input.relationship,
              requestedAt: input.now,
            },
          });

      await transaction.auditLog.create({
        data: {
          communityId: community.id,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "resident.requested",
          entityType: "Resident",
          entityId: request.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
          metadata: {
            houseCode: house.code,
            relationship: input.relationship,
          },
        },
      });

      return {
        outcome: "CREATED",
        request: {
          id: request.id,
          userId: input.auth.userId,
          phoneE164: user.phoneE164,
          fullName: request.fullName,
          status: "PENDING",
          relationship: input.relationship,
          submittedAt: request.requestedAt,
          community,
          house: {
            id: house.id,
            code: house.code,
            block: house.block,
            number: house.number,
            addressLabel: addressLabel(house.block, house.number),
          },
        },
      };
    });
  }

  async listPendingResidencyRequests(
    auth: AuthSessionRecord,
    limit: number,
  ): Promise<{ items: ResidencyRequestRecord[]; total: number }> {
    if (!auth.currentCommunityId) return { items: [], total: 0 };
    const where: Prisma.ResidentWhereInput = {
      communityId: auth.currentCommunityId,
      status: "PENDING",
      requestedHouseId: { not: null },
    };
    const [requests, total] = await this.prisma.$transaction([
      this.prisma.resident.findMany({
        where,
        include: { community: true, requestedHouse: true, user: true },
        orderBy: { requestedAt: "asc" },
        take: limit,
      }),
      this.prisma.resident.count({ where }),
    ]);
    return {
      items: requests.flatMap((request) =>
        request.requestedHouse && request.requestedRelationship
          ? [
              {
                id: request.id,
                userId: request.userId,
                phoneE164: request.user.phoneE164,
                fullName: request.fullName,
                status: "PENDING" as const,
                relationship: request.requestedRelationship,
                submittedAt: request.requestedAt,
                community: {
                  id: request.community.id,
                  name: request.community.name,
                  slug: request.community.slug,
                  timezone: request.community.timezone,
                },
                house: {
                  id: request.requestedHouse.id,
                  code: request.requestedHouse.code,
                  block: request.requestedHouse.block,
                  number: request.requestedHouse.number,
                  addressLabel: addressLabel(
                    request.requestedHouse.block,
                    request.requestedHouse.number,
                  ),
                },
              },
            ]
          : [],
      ),
      total,
    };
  }

  async approveResidencyRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ReviewResidencyRequestResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    return this.prisma.$transaction(async (transaction) => {
      const request = await transaction.resident.findFirst({
        where: {
          id: input.requestId,
          communityId: input.auth.currentCommunityId ?? undefined,
        },
        include: { requestedHouse: true },
      });
      if (!request) return { outcome: "NOT_FOUND" };
      if (request.status !== "PENDING") return { outcome: "NOT_PENDING" };
      if (
        !request.requestedHouse ||
        request.requestedHouse.communityId !== request.communityId ||
        request.requestedHouse.deletedAt !== null ||
        !request.requestedRelationship
      ) {
        return { outcome: "CONFIGURATION_ERROR" };
      }

      const roleCode =
        request.requestedRelationship === "HEAD" || request.requestedRelationship === "TENANT"
          ? "RESIDENT"
          : "HOUSEHOLD_MEMBER";
      const role = await transaction.role.findUnique({ where: { code: roleCode } });
      if (!role) return { outcome: "CONFIGURATION_ERROR" };

      let household = await transaction.household.findUnique({
        where: { houseId: request.requestedHouse.id },
      });
      if (
        household &&
        (household.communityId !== request.communityId || household.deletedAt !== null)
      ) {
        return { outcome: "CONFIGURATION_ERROR" };
      }
      const shouldSetOccupancy =
        !household &&
        (request.requestedRelationship === "HEAD" || request.requestedRelationship === "TENANT");

      const claimed = await transaction.resident.updateMany({
        where: { id: request.id, status: "PENDING" },
        data: {
          status: "ACTIVE",
          approvedAt: input.now,
          approvedByUserId: input.auth.userId,
          rejectedAt: null,
          rejectedByUserId: null,
          rejectionReason: null,
        },
      });
      if (claimed.count !== 1) return { outcome: "NOT_PENDING" };

      if (!household) {
        const familyName = request.fullName.trim().split(/\s+/)[0] ?? "Warga";
        household = await transaction.household.create({
          data: {
            communityId: request.communityId,
            houseId: request.requestedHouse.id,
            displayName: `Keluarga ${familyName}`,
          },
        });
      }
      const activeMemberCount = await transaction.householdMember.count({
        where: { householdId: household.id, endedAt: null },
      });
      await transaction.householdMember.upsert({
        where: {
          residentId_householdId: {
            residentId: request.id,
            householdId: household.id,
          },
        },
        update: {
          relationship: request.requestedRelationship,
          isPrimary: activeMemberCount === 0,
          endedAt: null,
        },
        create: {
          communityId: request.communityId,
          householdId: household.id,
          residentId: request.id,
          relationship: request.requestedRelationship,
          isPrimary: activeMemberCount === 0,
          joinedAt: input.now,
        },
      });
      await transaction.userRole.upsert({
        where: {
          userId_communityId_roleId: {
            userId: request.userId,
            communityId: request.communityId,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: request.userId,
          communityId: request.communityId,
          roleId: role.id,
        },
      });
      if (shouldSetOccupancy) {
        const updatedHouse = await transaction.house.updateMany({
          where: {
            id: request.requestedHouse.id,
            communityId: request.communityId,
            deletedAt: null,
          },
          data: {
            occupancyStatus:
              request.requestedRelationship === "TENANT" ? "RENTED" : "OWNER_OCCUPIED",
          },
        });
        if (updatedHouse.count !== 1) {
          throw new Error("Rumah permohonan berubah selama proses persetujuan.");
        }
      }
      await transaction.session.updateMany({
        where: {
          userId: request.userId,
          revokedAt: null,
          expiresAt: { gt: input.now },
          OR: [{ currentCommunityId: null }, { currentCommunityId: request.communityId }],
        },
        data: {
          currentCommunityId: request.communityId,
          currentHouseholdId: household.id,
        },
      });
      await transaction.auditLog.create({
        data: {
          communityId: request.communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "resident.approved",
          entityType: "Resident",
          entityId: request.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
        },
      });
      return {
        outcome: "APPROVED",
        requestId: request.id,
        householdId: household.id,
        reviewedAt: input.now,
      };
    });
  }

  async rejectResidencyRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    reason: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ReviewResidencyRequestResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    return this.prisma.$transaction(async (transaction) => {
      const request = await transaction.resident.findFirst({
        where: {
          id: input.requestId,
          communityId: input.auth.currentCommunityId ?? undefined,
        },
      });
      if (!request) return { outcome: "NOT_FOUND" };
      if (request.status !== "PENDING") return { outcome: "NOT_PENDING" };
      const rejected = await transaction.resident.updateMany({
        where: { id: request.id, status: "PENDING" },
        data: {
          status: "REJECTED",
          rejectedAt: input.now,
          rejectedByUserId: input.auth.userId,
          rejectionReason: input.reason,
        },
      });
      if (rejected.count !== 1) return { outcome: "NOT_PENDING" };
      await transaction.auditLog.create({
        data: {
          communityId: request.communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "resident.rejected",
          entityType: "Resident",
          entityId: request.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
        },
      });
      return {
        outcome: "REJECTED",
        requestId: request.id,
        reviewedAt: input.now,
      };
    });
  }

  async getHome(auth: AuthSessionRecord, now: Date): Promise<HomeRecord | null> {
    if (!auth.currentCommunityId || !auth.currentHouseholdId) return null;

    const membership = await this.prisma.householdMember.findFirst({
      where: {
        communityId: auth.currentCommunityId,
        householdId: auth.currentHouseholdId,
        endedAt: null,
        resident: { userId: auth.userId, status: "ACTIVE" },
      },
      include: {
        resident: true,
        household: { include: { house: true, community: true } },
      },
    });
    if (!membership) return null;

    const announcementWhere: Prisma.AnnouncementWhereInput = {
      communityId: auth.currentCommunityId,
      publishedAt: { lte: now },
      archivedAt: null,
      deletedAt: null,
    };
    const [announcements, unreadAnnouncementCount] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where: announcementWhere,
        include: { reads: { where: { userId: auth.userId }, take: 1 } },
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
      this.prisma.announcement.count({
        where: {
          ...announcementWhere,
          reads: { none: { userId: auth.userId } },
        },
      }),
    ]);

    return {
      viewerName: membership.resident.fullName,
      community: {
        id: membership.household.community.id,
        name: membership.household.community.name,
        slug: membership.household.community.slug,
        timezone: membership.household.community.timezone,
      },
      household: {
        id: membership.household.id,
        displayName: membership.household.displayName,
        house: {
          id: membership.household.house.id,
          code: membership.household.house.code,
          block: membership.household.house.block,
          number: membership.household.house.number,
          addressLabel: addressLabel(
            membership.household.house.block,
            membership.household.house.number,
          ),
        },
      },
      latestAnnouncements: announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        summary: announcement.summary,
        body: announcement.body,
        priority: announcement.priority,
        publishedAt: announcement.publishedAt,
        isRead: announcement.reads.length > 0,
      })),
      unreadAnnouncementCount,
    };
  }

  async listAnnouncements(
    auth: AuthSessionRecord,
    now: Date,
    limit: number,
  ): Promise<{ items: AnnouncementRecord[]; total: number }> {
    if (!auth.currentCommunityId) return { items: [], total: 0 };
    const where: Prisma.AnnouncementWhereInput = {
      communityId: auth.currentCommunityId,
      publishedAt: { lte: now },
      archivedAt: null,
      deletedAt: null,
    };
    const [announcements, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        include: { reads: { where: { userId: auth.userId }, take: 1 } },
        orderBy: { publishedAt: "desc" },
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      items: announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        summary: announcement.summary,
        body: announcement.body,
        priority: announcement.priority,
        publishedAt: announcement.publishedAt,
        isRead: announcement.reads.length > 0,
      })),
      total,
    };
  }

  async getAnnouncement(
    auth: AuthSessionRecord,
    id: string,
    now: Date,
  ): Promise<AnnouncementRecord | null> {
    if (!auth.currentCommunityId) return null;
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        communityId: auth.currentCommunityId,
        publishedAt: { lte: now },
        archivedAt: null,
        deletedAt: null,
      },
      include: { reads: { where: { userId: auth.userId }, take: 1 } },
    });
    return announcement
      ? {
          id: announcement.id,
          title: announcement.title,
          summary: announcement.summary,
          body: announcement.body,
          priority: announcement.priority,
          publishedAt: announcement.publishedAt,
          isRead: announcement.reads.length > 0,
        }
      : null;
  }

  async markAnnouncementRead(auth: AuthSessionRecord, id: string, now: Date): Promise<Date | null> {
    if (!auth.currentCommunityId) return null;
    const announcement = await this.getAnnouncement(auth, id, now);
    if (!announcement) return null;

    const read = await this.prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: auth.userId,
        },
      },
      update: {},
      create: {
        communityId: auth.currentCommunityId,
        announcementId: id,
        userId: auth.userId,
        readAt: now,
      },
    });
    return read.readAt;
  }

  async listAgenda(input: {
    auth: AuthSessionRecord;
    now: Date;
    view: AgendaView;
    cursor?: string;
    limit: number;
  }) {
    if (!input.auth.currentCommunityId) {
      return { outcome: "OK" as const, items: [], total: 0, nextCursor: null };
    }
    const community = await this.prisma.community.findFirst({
      where: { id: input.auth.currentCommunityId, deletedAt: null },
      select: { timezone: true },
    });
    if (!community) {
      return { outcome: "OK" as const, items: [], total: 0, nextCursor: null };
    }
    const localNow = dateAndTimeInZone(input.now, community.timezone);
    const timingWhere: Prisma.EventWhereInput =
      input.view === "upcoming"
        ? {
            OR: [
              { eventDate: { gt: localNow.date } },
              { eventDate: localNow.date, endTime: { gte: localNow.time } },
            ],
          }
        : {
            OR: [
              { eventDate: { lt: localNow.date } },
              { eventDate: localNow.date, endTime: { lt: localNow.time } },
            ],
          };
    const where: Prisma.EventWhereInput = {
      communityId: input.auth.currentCommunityId,
      archivedAt: null,
      deletedAt: null,
      ...timingWhere,
    };
    if (input.cursor) {
      const visibleCursor = await this.prisma.event.findFirst({
        where: { ...where, id: input.cursor },
        select: { id: true },
      });
      if (!visibleCursor) return { outcome: "INVALID_CURSOR" as const };
    }
    const direction = input.view === "upcoming" ? ("asc" as const) : ("desc" as const);
    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: [{ eventDate: direction }, { startTime: direction }, { id: direction }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      }),
      this.prisma.event.count({ where }),
    ]);
    const hasMore = events.length > input.limit;
    const page = hasMore ? events.slice(0, input.limit) : events;
    return {
      outcome: "OK" as const,
      items: page.map(mapAgendaEvent),
      total,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getAgendaEvent(auth: AuthSessionRecord, id: string): Promise<AgendaRecord | null> {
    if (!auth.currentCommunityId) return null;
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        communityId: auth.currentCommunityId,
        archivedAt: null,
        deletedAt: null,
      },
    });
    return event ? mapAgendaEvent(event) : null;
  }

  async createAgendaEvent(input: {
    auth: AuthSessionRecord;
    event: CreateAgendaEventInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<AgendaMutationResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    if (input.event.endTime <= input.event.startTime) return { outcome: "INVALID_TIME_RANGE" };
    return this.prisma.$transaction(async (transaction) => {
      const communityId = input.auth.currentCommunityId;
      if (!communityId) return { outcome: "NOT_FOUND" as const };
      const community = await transaction.community.findFirst({
        where: { id: communityId, deletedAt: null },
        select: { id: true },
      });
      if (!community) return { outcome: "NOT_FOUND" as const };
      const event = await transaction.event.create({
        data: {
          communityId,
          createdByUserId: input.auth.userId,
          title: input.event.title,
          eventDate: parseAgendaDate(input.event.date),
          startTime: parseAgendaTime(input.event.startTime),
          endTime: parseAgendaTime(input.event.endTime),
          location: input.event.location,
          description: input.event.description,
          organizer: input.event.organizer,
          createdAt: input.now,
        },
      });
      const recipients = await transaction.resident.findMany({
        where: {
          communityId,
          status: "ACTIVE",
          householdMemberships: { some: { endedAt: null } },
        },
        select: { userId: true },
        distinct: ["userId"],
      });
      if (recipients.length > 0) {
        await transaction.notification.createMany({
          data: recipients.map((recipient) => ({
            communityId,
            userId: recipient.userId,
            title: `Agenda baru: ${event.title}`,
            message: `${input.event.date}, ${input.event.startTime} di ${event.location}.`,
            entityType: "EVENT",
            entityId: event.id,
            priority: "NORMAL" as const,
            createdAt: input.now,
          })),
        });
      }
      await transaction.auditLog.create({
        data: {
          communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "agenda.created",
          entityType: "Event",
          entityId: event.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
          metadata: {
            date: input.event.date,
            startTime: input.event.startTime,
            notifiedUsers: recipients.length,
          },
        },
      });
      return { outcome: "OK" as const, event: mapAgendaEvent(event) };
    });
  }

  async updateAgendaEvent(input: {
    auth: AuthSessionRecord;
    eventId: string;
    changes: UpdateAgendaEventInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<AgendaMutationResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    return this.prisma.$transaction(async (transaction) => {
      const communityId = input.auth.currentCommunityId;
      if (!communityId) return { outcome: "NOT_FOUND" as const };
      const existing = await transaction.event.findFirst({
        where: { id: input.eventId, communityId, deletedAt: null },
      });
      if (!existing) return { outcome: "NOT_FOUND" as const };
      if (existing.archivedAt) return { outcome: "ARCHIVED" as const };
      const startTime = input.changes.startTime ?? formatAgendaTime(existing.startTime);
      const endTime = input.changes.endTime ?? formatAgendaTime(existing.endTime);
      if (endTime <= startTime) return { outcome: "INVALID_TIME_RANGE" as const };

      const updated = await transaction.event.update({
        where: { id: existing.id },
        data: {
          ...(input.changes.title === undefined ? {} : { title: input.changes.title }),
          ...(input.changes.date === undefined
            ? {}
            : { eventDate: parseAgendaDate(input.changes.date) }),
          ...(input.changes.startTime === undefined
            ? {}
            : { startTime: parseAgendaTime(input.changes.startTime) }),
          ...(input.changes.endTime === undefined
            ? {}
            : { endTime: parseAgendaTime(input.changes.endTime) }),
          ...(input.changes.location === undefined ? {} : { location: input.changes.location }),
          ...(input.changes.description === undefined
            ? {}
            : { description: input.changes.description }),
          ...(input.changes.organizer === undefined ? {} : { organizer: input.changes.organizer }),
        },
      });
      await transaction.auditLog.create({
        data: {
          communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "agenda.updated",
          entityType: "Event",
          entityId: updated.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
          metadata: { changedFieldCount: Object.keys(input.changes).length },
        },
      });
      return { outcome: "OK" as const, event: mapAgendaEvent(updated) };
    });
  }

  async archiveAgendaEvent(input: {
    auth: AuthSessionRecord;
    eventId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ArchiveAgendaResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    return this.prisma.$transaction(async (transaction) => {
      const communityId = input.auth.currentCommunityId;
      if (!communityId) return { outcome: "NOT_FOUND" as const };
      const event = await transaction.event.findFirst({
        where: { id: input.eventId, communityId, deletedAt: null },
        select: { id: true, archivedAt: true },
      });
      if (!event) return { outcome: "NOT_FOUND" as const };
      if (event.archivedAt) {
        return { outcome: "ARCHIVED" as const, eventId: event.id, archivedAt: event.archivedAt };
      }
      await transaction.event.update({
        where: { id: event.id },
        data: { archivedAt: input.now, archivedByUserId: input.auth.userId },
      });
      await transaction.auditLog.create({
        data: {
          communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "agenda.archived",
          entityType: "Event",
          entityId: event.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
        },
      });
      return { outcome: "ARCHIVED" as const, eventId: event.id, archivedAt: input.now };
    });
  }

  async listNotifications(input: { auth: AuthSessionRecord; cursor?: string; limit: number }) {
    if (!input.auth.currentCommunityId) {
      return { outcome: "OK" as const, items: [], total: 0, nextCursor: null };
    }
    const where: Prisma.NotificationWhereInput = {
      communityId: input.auth.currentCommunityId,
      userId: input.auth.userId,
    };
    if (input.cursor) {
      const visibleCursor = await this.prisma.notification.findFirst({
        where: { ...where, id: input.cursor },
        select: { id: true },
      });
      if (!visibleCursor) return { outcome: "INVALID_CURSOR" as const };
    }
    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      }),
      this.prisma.notification.count({ where }),
    ]);
    const hasMore = notifications.length > input.limit;
    const page = hasMore ? notifications.slice(0, input.limit) : notifications;
    return {
      outcome: "OK" as const,
      items: page.map(mapNotification),
      total,
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getUnreadNotificationCount(auth: AuthSessionRecord): Promise<number> {
    if (!auth.currentCommunityId) return 0;
    return this.prisma.notification.count({
      where: {
        communityId: auth.currentCommunityId,
        userId: auth.userId,
        readAt: null,
      },
    });
  }

  async markNotificationRead(input: {
    auth: AuthSessionRecord;
    notificationId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<NotificationReadResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    return this.prisma.$transaction(async (transaction) => {
      const communityId = input.auth.currentCommunityId;
      if (!communityId) return { outcome: "NOT_FOUND" as const };
      const notification = await transaction.notification.findFirst({
        where: {
          id: input.notificationId,
          communityId,
          userId: input.auth.userId,
        },
        select: { id: true, readAt: true },
      });
      if (!notification) return { outcome: "NOT_FOUND" as const };
      if (notification.readAt) {
        return {
          outcome: "READ" as const,
          notificationId: notification.id,
          readAt: notification.readAt,
        };
      }
      await transaction.notification.update({
        where: { id: notification.id },
        data: { readAt: input.now },
      });
      await transaction.auditLog.create({
        data: {
          communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "notification.read",
          entityType: "Notification",
          entityId: notification.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
        },
      });
      return {
        outcome: "READ" as const,
        notificationId: notification.id,
        readAt: input.now,
      };
    });
  }

  async markAllNotificationsRead(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<{ readAt: Date; updatedCount: number }> {
    if (!input.auth.currentCommunityId) return { readAt: input.now, updatedCount: 0 };
    return this.prisma.$transaction(async (transaction) => {
      const communityId = input.auth.currentCommunityId;
      if (!communityId) return { readAt: input.now, updatedCount: 0 };
      const updated = await transaction.notification.updateMany({
        where: { communityId, userId: input.auth.userId, readAt: null },
        data: { readAt: input.now },
      });
      if (updated.count > 0) {
        await transaction.auditLog.create({
          data: {
            communityId,
            actorUserId: input.auth.userId,
            sessionId: input.auth.sessionId,
            action: "notification.read_all",
            entityType: "Notification",
            ipAddress: input.audit.ipAddress,
            userAgent: input.audit.userAgent,
            metadata: { updatedCount: updated.count },
          },
        });
      }
      return { readAt: input.now, updatedCount: updated.count };
    });
  }

  async listCurrentHouseholdVehicles(auth: AuthSessionRecord): Promise<VehicleRecord[]> {
    if (!auth.currentCommunityId || !auth.currentHouseholdId) return [];
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        communityId: auth.currentCommunityId,
        householdId: auth.currentHouseholdId,
        archivedAt: null,
        household: {
          deletedAt: null,
          members: {
            some: {
              endedAt: null,
              resident: { userId: auth.userId, status: "ACTIVE" },
            },
          },
        },
      },
      include: { household: { include: { house: true } } },
      orderBy: [{ status: "asc" }, { plateNormalized: "asc" }, { createdAt: "asc" }],
    });
    return vehicles.map(mapVehicle);
  }

  async createVehicle(input: {
    auth: AuthSessionRecord;
    vehicle: CreateVehicleInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<VehicleMutationResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "NOT_FOUND" };
    }
    const plate = input.vehicle.plate ? formatVehiclePlate(input.vehicle.plate) : null;
    const plateNormalized = plate ? normalizeVehiclePlate(plate) : null;
    if ((input.vehicle.type === "CAR" || input.vehicle.type === "MOTORCYCLE") && !plateNormalized) {
      return { outcome: "PLATE_REQUIRED" };
    }
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const communityId = input.auth.currentCommunityId;
        const householdId = input.auth.currentHouseholdId;
        if (!communityId || !householdId) return { outcome: "NOT_FOUND" as const };
        const household = await transaction.household.findFirst({
          where: {
            id: householdId,
            communityId,
            deletedAt: null,
            house: { deletedAt: null },
            members: {
              some: {
                endedAt: null,
                resident: { userId: input.auth.userId, status: "ACTIVE" },
              },
            },
          },
          include: { house: true },
        });
        if (!household) return { outcome: "NOT_FOUND" as const };
        if (input.vehicle.ownerResidentId) {
          const owner = await transaction.householdMember.findFirst({
            where: {
              communityId,
              householdId,
              residentId: input.vehicle.ownerResidentId,
              endedAt: null,
              resident: { status: "ACTIVE" },
            },
            select: { id: true },
          });
          if (!owner) return { outcome: "OWNER_NOT_FOUND" as const };
        }
        if (plateNormalized) {
          const duplicate = await transaction.vehicle.findFirst({
            where: { communityId, plateNormalized, archivedAt: null },
            select: { id: true },
          });
          if (duplicate) return { outcome: "PLATE_CONFLICT" as const };
        }
        const vehicle = await transaction.vehicle.create({
          data: {
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
            createdAt: input.now,
            updatedAt: input.now,
          },
          include: { household: { include: { house: true } } },
        });
        await transaction.auditLog.create({
          data: {
            communityId,
            actorUserId: input.auth.userId,
            sessionId: input.auth.sessionId,
            action: "vehicle.created",
            entityType: "Vehicle",
            entityId: vehicle.id,
            ipAddress: input.audit.ipAddress,
            userAgent: input.audit.userAgent,
            metadata: { type: vehicle.type, hasPlate: vehicle.plateNormalized !== null },
            createdAt: input.now,
          },
        });
        return { outcome: "OK" as const, vehicle: mapVehicle(vehicle) };
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) return { outcome: "PLATE_CONFLICT" };
      throw error;
    }
  }

  async updateVehicle(input: {
    auth: AuthSessionRecord;
    vehicleId: string;
    changes: UpdateVehicleInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<VehicleMutationResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "NOT_FOUND" };
    }
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const communityId = input.auth.currentCommunityId;
        const householdId = input.auth.currentHouseholdId;
        if (!communityId || !householdId) return { outcome: "NOT_FOUND" as const };
        const existing = await transaction.vehicle.findFirst({
          where: {
            id: input.vehicleId,
            communityId,
            householdId,
            archivedAt: null,
            household: {
              deletedAt: null,
              members: {
                some: {
                  endedAt: null,
                  resident: { userId: input.auth.userId, status: "ACTIVE" },
                },
              },
            },
          },
          include: { household: { include: { house: true } } },
        });
        if (!existing) return { outcome: "NOT_FOUND" as const };
        const type = input.changes.type ?? existing.type;
        const plate =
          input.changes.plate === undefined
            ? existing.plate
            : input.changes.plate
              ? formatVehiclePlate(input.changes.plate)
              : null;
        const plateNormalized = plate ? normalizeVehiclePlate(plate) : null;
        if ((type === "CAR" || type === "MOTORCYCLE") && !plateNormalized) {
          return { outcome: "PLATE_REQUIRED" as const };
        }
        if (input.changes.ownerResidentId) {
          const owner = await transaction.householdMember.findFirst({
            where: {
              communityId,
              householdId,
              residentId: input.changes.ownerResidentId,
              endedAt: null,
              resident: { status: "ACTIVE" },
            },
            select: { id: true },
          });
          if (!owner) return { outcome: "OWNER_NOT_FOUND" as const };
        }
        if (plateNormalized) {
          const duplicate = await transaction.vehicle.findFirst({
            where: {
              communityId,
              plateNormalized,
              archivedAt: null,
              id: { not: existing.id },
            },
            select: { id: true },
          });
          if (duplicate) return { outcome: "PLATE_CONFLICT" as const };
        }
        const vehicle = await transaction.vehicle.update({
          where: { id: existing.id },
          data: {
            ...(input.changes.type === undefined ? {} : { type: input.changes.type }),
            ...(input.changes.plate === undefined ? {} : { plate, plateNormalized }),
            ...(input.changes.brand === undefined ? {} : { brand: input.changes.brand }),
            ...(input.changes.model === undefined ? {} : { model: input.changes.model }),
            ...(input.changes.color === undefined ? {} : { color: input.changes.color }),
            ...(input.changes.ownerLabel === undefined
              ? {}
              : { ownerLabel: input.changes.ownerLabel }),
            ...(input.changes.ownerResidentId === undefined
              ? {}
              : { ownerResidentId: input.changes.ownerResidentId }),
            ...(input.changes.status === undefined ? {} : { status: input.changes.status }),
            updatedAt: input.now,
          },
          include: { household: { include: { house: true } } },
        });
        await transaction.auditLog.create({
          data: {
            communityId,
            actorUserId: input.auth.userId,
            sessionId: input.auth.sessionId,
            action: "vehicle.updated",
            entityType: "Vehicle",
            entityId: vehicle.id,
            ipAddress: input.audit.ipAddress,
            userAgent: input.audit.userAgent,
            metadata: { changedFields: Object.keys(input.changes).sort().join(",") },
            createdAt: input.now,
          },
        });
        return { outcome: "OK" as const, vehicle: mapVehicle(vehicle) };
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) return { outcome: "PLATE_CONFLICT" };
      throw error;
    }
  }

  async archiveVehicle(input: {
    auth: AuthSessionRecord;
    vehicleId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ArchiveVehicleResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "NOT_FOUND" };
    }
    return this.prisma.$transaction(async (transaction) => {
      const communityId = input.auth.currentCommunityId;
      const householdId = input.auth.currentHouseholdId;
      if (!communityId || !householdId) return { outcome: "NOT_FOUND" as const };
      const existing = await transaction.vehicle.findFirst({
        where: {
          id: input.vehicleId,
          communityId,
          householdId,
          archivedAt: null,
          household: {
            deletedAt: null,
            members: {
              some: {
                endedAt: null,
                resident: { userId: input.auth.userId, status: "ACTIVE" },
              },
            },
          },
        },
        select: { id: true },
      });
      if (!existing) return { outcome: "NOT_FOUND" as const };
      await transaction.vehicle.update({
        where: { id: existing.id },
        data: { status: "INACTIVE", archivedAt: input.now, updatedAt: input.now },
      });
      await transaction.auditLog.create({
        data: {
          communityId,
          actorUserId: input.auth.userId,
          sessionId: input.auth.sessionId,
          action: "vehicle.archived",
          entityType: "Vehicle",
          entityId: existing.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
          createdAt: input.now,
        },
      });
      return { outcome: "ARCHIVED" as const, vehicleId: existing.id, archivedAt: input.now };
    });
  }

  async searchVehicleByPlate(
    auth: AuthSessionRecord,
    query: string,
  ): Promise<VehicleSearchRecord | null> {
    if (!auth.currentCommunityId) return null;
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        communityId: auth.currentCommunityId,
        plateNormalized: normalizeVehiclePlate(query),
        archivedAt: null,
        household: { deletedAt: null, house: { deletedAt: null } },
      },
      include: { household: { include: { house: true } } },
    });
    if (!vehicle?.plate) return null;
    return {
      vehicleId: vehicle.id,
      type: vehicle.type,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      ownerLabel: vehicle.ownerLabel,
      houseCode: vehicle.household.house.code,
      status: vehicle.status,
    };
  }

  async listCameras(auth: AuthSessionRecord): Promise<CameraRecord[]> {
    if (!auth.currentCommunityId) return [];
    const levels = visibleCameraAccessLevels(auth.permissions);
    if (levels.length === 0) return [];
    const cameras = await this.prisma.camera.findMany({
      where: {
        communityId: auth.currentCommunityId,
        archivedAt: null,
        accessLevel: { in: levels },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return cameras.map((camera) => ({
      id: camera.id,
      name: camera.name,
      location: camera.location,
      accessLevel: camera.accessLevel,
      status: camera.status,
      lastOnlineAt: camera.lastOnlineAt,
    }));
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
    const camera = await this.prisma.camera.create({
      data: {
        communityId: input.auth.currentCommunityId,
        name: input.camera.name,
        location: input.camera.location ?? null,
        accessLevel: input.camera.accessLevel,
        status: "ONLINE",
        lastOnlineAt: input.now,
      },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "camera.created",
      entityType: "Camera",
      entityId: camera.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return {
      id: camera.id,
      name: camera.name,
      location: camera.location,
      accessLevel: camera.accessLevel,
      status: camera.status,
      lastOnlineAt: camera.lastOnlineAt,
    };
  }

  async updateCamera(input: {
    auth: AuthSessionRecord;
    cameraId: string;
    changes: UpdateCameraInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CameraMutationResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const existing = await this.prisma.camera.findFirst({
      where: { id: input.cameraId, communityId: input.auth.currentCommunityId, archivedAt: null },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    const camera = await this.prisma.camera.update({
      where: { id: existing.id },
      data: {
        ...(input.changes.name === undefined ? {} : { name: input.changes.name }),
        ...(input.changes.location === undefined ? {} : { location: input.changes.location }),
        ...(input.changes.accessLevel === undefined
          ? {}
          : { accessLevel: input.changes.accessLevel }),
        ...(input.changes.status === undefined
          ? {}
          : {
              status: input.changes.status,
              lastOnlineAt: input.changes.status === "ONLINE" ? input.now : existing.lastOnlineAt,
            }),
      },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "camera.updated",
      entityType: "Camera",
      entityId: camera.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { changedFields: Object.keys(input.changes).sort().join(",") },
    });
    return {
      outcome: "OK",
      camera: {
        id: camera.id,
        name: camera.name,
        location: camera.location,
        accessLevel: camera.accessLevel,
        status: camera.status,
        lastOnlineAt: camera.lastOnlineAt,
      },
    };
  }

  async issueStreamTicket(input: {
    auth: AuthSessionRecord;
    cameraId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<StreamTicketResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const camera = await this.prisma.camera.findFirst({
      where: { id: input.cameraId, communityId: input.auth.currentCommunityId, archivedAt: null },
    });
    if (!camera) return { outcome: "NOT_FOUND" };
    if (!cameraCanSee(camera.accessLevel, input.auth.permissions)) return { outcome: "FORBIDDEN" };

    const user = await this.prisma.user.findUnique({ where: { id: input.auth.userId } });
    const viewerName = user ? displayNameOf(user) : "Warga";

    await this.recordAudit({
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

    // Only mock playback is implemented; a real MediaMTX/RTSP ticket issuer is
    // future work (see docs/CCTV.md). Mock stays behind the same interface so
    // switching later does not require UI changes.
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

  private async resolveHouseLabel(auth: AuthSessionRecord): Promise<string> {
    if (!auth.currentCommunityId || !auth.currentHouseholdId) return "Rumah tidak diketahui";
    const household = await this.prisma.household.findFirst({
      where: { id: auth.currentHouseholdId, communityId: auth.currentCommunityId },
      include: { house: true },
    });
    return household
      ? addressLabel(household.house.block, household.house.number)
      : "Rumah tidak diketahui";
  }

  private mapEmergency(emergency: {
    id: string;
    kind: EmergencyRecord["kind"];
    status: EmergencyRecord["status"];
    houseLabel: string;
    note: string | null;
    sentAt: Date;
    acknowledgedAt: Date | null;
    respondingAt: Date | null;
    resolvedAt: Date | null;
    sender: { displayName: string | null; phoneE164: string };
  }): EmergencyRecord {
    return {
      id: emergency.id,
      kind: emergency.kind,
      status: emergency.status,
      houseLabel: emergency.houseLabel,
      senderName: displayNameOf(emergency.sender),
      note: emergency.note,
      sentAt: emergency.sentAt,
      acknowledgedAt: emergency.acknowledgedAt,
      respondingAt: emergency.respondingAt,
      resolvedAt: emergency.resolvedAt,
    };
  }

  async createEmergency(input: {
    auth: AuthSessionRecord;
    kind: EmergencyRecord["kind"];
    note?: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<EmergencyRecord> {
    if (!input.auth.currentCommunityId) {
      throw new Error("Community context is required to send an emergency alert.");
    }
    const houseLabel = await this.resolveHouseLabel(input.auth);
    const emergency = await this.prisma.emergency.create({
      data: {
        communityId: input.auth.currentCommunityId,
        senderUserId: input.auth.userId,
        kind: input.kind,
        houseLabel,
        note: input.note ?? null,
        sentAt: input.now,
      },
      include: { sender: true },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "emergency.sent",
      entityType: "Emergency",
      entityId: emergency.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { kind: input.kind },
    });
    return this.mapEmergency(emergency);
  }

  async listEmergencies(auth: AuthSessionRecord, limit: number): Promise<EmergencyRecord[]> {
    if (!auth.currentCommunityId) return [];
    const emergencies = await this.prisma.emergency.findMany({
      where: { communityId: auth.currentCommunityId },
      include: { sender: true },
      orderBy: { sentAt: "desc" },
      take: limit,
    });
    return emergencies.map((emergency) => this.mapEmergency(emergency));
  }

  private async transitionEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
    allowedFrom: EmergencyRecord["status"][];
    action: string;
    data: Prisma.EmergencyUncheckedUpdateInput;
  }): Promise<EmergencyTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const existing = await this.prisma.emergency.findFirst({
      where: { id: input.emergencyId, communityId: input.auth.currentCommunityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (!input.allowedFrom.includes(existing.status)) return { outcome: "INVALID_TRANSITION" };
    const emergency = await this.prisma.emergency.update({
      where: { id: existing.id },
      data: input.data,
      include: { sender: true },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: input.action,
      entityType: "Emergency",
      entityId: emergency.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", emergency: this.mapEmergency(emergency) };
  }

  async acknowledgeEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<EmergencyTransitionResult> {
    return this.transitionEmergency({
      ...input,
      allowedFrom: ["SENT"],
      action: "emergency.acknowledged",
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: input.now,
        acknowledgedByUserId: input.auth.userId,
      },
    });
  }

  async respondToEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<EmergencyTransitionResult> {
    return this.transitionEmergency({
      ...input,
      allowedFrom: ["SENT", "ACKNOWLEDGED"],
      action: "emergency.responding",
      data: { status: "RESPONDING", respondingAt: input.now },
    });
  }

  async resolveEmergency(input: {
    auth: AuthSessionRecord;
    emergencyId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<EmergencyTransitionResult> {
    return this.transitionEmergency({
      ...input,
      allowedFrom: ["SENT", "ACKNOWLEDGED", "RESPONDING"],
      action: "emergency.resolved",
      data: { status: "RESOLVED", resolvedAt: input.now, resolvedByUserId: input.auth.userId },
    });
  }

  private mapVisitor(visitor: {
    id: string;
    guestName: string;
    guestPhone: string | null;
    visitDate: Date;
    expectedTime: Date | null;
    vehicleInfo: string | null;
    plate: string | null;
    purpose: string | null;
    notes: string | null;
    status: VisitorRecord["status"];
    isWalkIn: boolean;
    qrToken: string;
    checkedInAt: Date | null;
    checkedOutAt: Date | null;
    createdAt: Date;
    household: { displayName: string; house: { code: string } };
  }): VisitorRecord {
    return {
      id: visitor.id,
      guestName: visitor.guestName,
      guestPhone: visitor.guestPhone,
      visitDate: formatAgendaDate(visitor.visitDate),
      expectedTime: visitor.expectedTime ? formatAgendaTime(visitor.expectedTime) : null,
      vehicleInfo: visitor.vehicleInfo,
      plate: visitor.plate,
      purpose: visitor.purpose,
      notes: visitor.notes,
      status: visitor.status,
      isWalkIn: visitor.isWalkIn,
      houseCode: visitor.household.house.code,
      householdDisplayName: visitor.household.displayName,
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
    const visitor = await this.prisma.visitor.create({
      data: {
        communityId: input.auth.currentCommunityId,
        householdId: input.auth.currentHouseholdId,
        createdByUserId: input.auth.userId,
        guestName: input.visitor.guestName,
        guestPhone: input.visitor.guestPhone ?? null,
        visitDate: parseAgendaDate(input.visitor.visitDate),
        expectedTime: input.visitor.expectedTime
          ? parseAgendaTime(input.visitor.expectedTime)
          : null,
        vehicleInfo: input.visitor.vehicleInfo ?? null,
        plate: input.visitor.plate ?? null,
        purpose: input.visitor.purpose ?? null,
        notes: input.visitor.notes ?? null,
        qrToken: randomUUID(),
      },
      include: { household: { include: { house: true } } },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "visitor.created",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", visitor: this.mapVisitor(visitor) };
  }

  async createWalkInVisitor(input: {
    auth: AuthSessionRecord;
    visitor: CreateWalkInVisitorInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateVisitorResult> {
    if (!input.auth.currentCommunityId) return { outcome: "HOUSE_NOT_FOUND" };
    const house = await this.prisma.house.findFirst({
      where: {
        communityId: input.auth.currentCommunityId,
        code: input.visitor.houseCode,
        deletedAt: null,
      },
      include: { household: true },
    });
    if (!house) return { outcome: "HOUSE_NOT_FOUND" };
    if (!house.household) return { outcome: "HOUSEHOLD_NOT_FOUND" };

    const visitor = await this.prisma.visitor.create({
      data: {
        communityId: input.auth.currentCommunityId,
        householdId: house.household.id,
        createdByUserId: input.auth.userId,
        guestName: input.visitor.guestName,
        guestPhone: input.visitor.guestPhone ?? null,
        visitDate: parseAgendaDate(formatAgendaDate(input.now)),
        vehicleInfo: input.visitor.vehicleInfo ?? null,
        plate: input.visitor.plate ?? null,
        purpose: input.visitor.purpose ?? null,
        isWalkIn: true,
        status: "CHECKED_IN",
        checkedInAt: input.now,
        checkedInByUserId: input.auth.userId,
        qrToken: randomUUID(),
      },
      include: { household: { include: { house: true } } },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "visitor.walk_in.checked_in",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", visitor: this.mapVisitor(visitor) };
  }

  async listVisitors(input: { auth: AuthSessionRecord; limit: number }): Promise<VisitorRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("visitor.checkin");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    const visitors = await this.prisma.visitor.findMany({
      where: {
        communityId: input.auth.currentCommunityId,
        ...(canSeeAll ? {} : { householdId: input.auth.currentHouseholdId! }),
      },
      include: { household: { include: { house: true } } },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
      take: input.limit,
    });
    return visitors.map((visitor) => this.mapVisitor(visitor));
  }

  async findVisitorByQrToken(
    auth: AuthSessionRecord,
    qrToken: string,
  ): Promise<VisitorRecord | null> {
    if (!auth.currentCommunityId) return null;
    const visitor = await this.prisma.visitor.findFirst({
      where: { qrToken, communityId: auth.currentCommunityId },
      include: { household: { include: { house: true } } },
    });
    return visitor ? this.mapVisitor(visitor) : null;
  }

  async checkInVisitor(input: {
    auth: AuthSessionRecord;
    qrToken: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<VisitorCheckResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const existing = await this.prisma.visitor.findFirst({
      where: { qrToken: input.qrToken, communityId: input.auth.currentCommunityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (existing.status !== "PENDING") return { outcome: "INVALID_TRANSITION" };
    const visitor = await this.prisma.visitor.update({
      where: { id: existing.id },
      data: { status: "CHECKED_IN", checkedInAt: input.now, checkedInByUserId: input.auth.userId },
      include: { household: { include: { house: true } } },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "visitor.checked_in",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", visitor: this.mapVisitor(visitor) };
  }

  async checkOutVisitor(input: {
    auth: AuthSessionRecord;
    visitorId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<VisitorCheckResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const existing = await this.prisma.visitor.findFirst({
      where: { id: input.visitorId, communityId: input.auth.currentCommunityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (existing.status !== "CHECKED_IN") return { outcome: "INVALID_TRANSITION" };
    const visitor = await this.prisma.visitor.update({
      where: { id: existing.id },
      data: {
        status: "CHECKED_OUT",
        checkedOutAt: input.now,
        checkedOutByUserId: input.auth.userId,
      },
      include: { household: { include: { house: true } } },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "visitor.checked_out",
      entityType: "Visitor",
      entityId: visitor.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", visitor: this.mapVisitor(visitor) };
  }

  private mapPackage(pkg: {
    id: string;
    recipientName: string;
    courier: string;
    trackingNumber: string | null;
    status: PackageRecord["status"];
    receivedAt: Date;
    collectedAt: Date | null;
    collectedByName: string | null;
    household: { displayName: string; house: { code: string } };
  }): PackageRecord {
    return {
      id: pkg.id,
      recipientName: pkg.recipientName,
      courier: pkg.courier,
      trackingNumber: pkg.trackingNumber,
      status: pkg.status,
      houseCode: pkg.household.house.code,
      householdDisplayName: pkg.household.displayName,
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
    const house = await this.prisma.house.findFirst({
      where: {
        communityId: input.auth.currentCommunityId,
        code: input.package.houseCode,
        deletedAt: null,
      },
      include: { household: true },
    });
    if (!house?.household) return { outcome: "HOUSE_NOT_FOUND" };

    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.package.create({
        data: {
          communityId: input.auth.currentCommunityId!,
          householdId: house.household!.id,
          recipientName: input.package.recipientName,
          courier: input.package.courier,
          trackingNumber: input.package.trackingNumber ?? null,
          receivedByUserId: input.auth.userId,
          receivedAt: input.now,
          status: "NOTIFIED",
        },
        include: { household: { include: { house: true } } },
      });

      const members = await transaction.householdMember.findMany({
        where: {
          householdId: house.household!.id,
          communityId: input.auth.currentCommunityId!,
          endedAt: null,
        },
        include: { resident: true },
      });
      for (const member of members) {
        await transaction.notification.create({
          data: {
            communityId: input.auth.currentCommunityId!,
            userId: member.resident.userId,
            title: "Paket baru",
            message: "Paketmu sudah tiba di pos security.",
            entityType: "PACKAGE",
            entityId: created.id,
            priority: "NORMAL",
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          communityId: input.auth.currentCommunityId,
          actorUserId: input.auth.userId,
          action: "package.received",
          entityType: "Package",
          entityId: created.id,
          ipAddress: input.audit.ipAddress,
          userAgent: input.audit.userAgent,
        },
      });

      return { outcome: "OK" as const, package: this.mapPackage(created) };
    });
  }

  async listPackages(input: { auth: AuthSessionRecord; limit: number }): Promise<PackageRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("package.manage");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    const packages = await this.prisma.package.findMany({
      where: {
        communityId: input.auth.currentCommunityId,
        ...(canSeeAll ? {} : { householdId: input.auth.currentHouseholdId! }),
      },
      include: { household: { include: { house: true } } },
      orderBy: { receivedAt: "desc" },
      take: input.limit,
    });
    return packages.map((pkg) => this.mapPackage(pkg));
  }

  async collectPackage(input: {
    auth: AuthSessionRecord;
    packageId: string;
    collectedByName: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CollectPackageResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const existing = await this.prisma.package.findFirst({
      where: { id: input.packageId, communityId: input.auth.currentCommunityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (existing.status === "COLLECTED") return { outcome: "ALREADY_COLLECTED" };
    const pkg = await this.prisma.package.update({
      where: { id: existing.id },
      data: {
        status: "COLLECTED",
        collectedAt: input.now,
        collectedByName: input.collectedByName,
        collectedByUserId: input.auth.userId,
      },
      include: { household: { include: { house: true } } },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "package.collected",
      entityType: "Package",
      entityId: pkg.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", package: this.mapPackage(pkg) };
  }

  private mapSecurityShift(shift: {
    id: string;
    status: SecurityShiftRecord["status"];
    startedAt: Date;
    endedAt: Date | null;
    notes: string | null;
    officer: { displayName: string | null; phoneE164: string };
  }): SecurityShiftRecord {
    return {
      id: shift.id,
      officerName: displayNameOf(shift.officer),
      status: shift.status,
      startedAt: shift.startedAt,
      endedAt: shift.endedAt,
      notes: shift.notes,
    };
  }

  async getActiveSecurityShift(auth: AuthSessionRecord): Promise<SecurityShiftRecord | null> {
    if (!auth.currentCommunityId) return null;
    const shift = await this.prisma.securityShift.findFirst({
      where: { communityId: auth.currentCommunityId, officerUserId: auth.userId, status: "ACTIVE" },
      include: { officer: true },
    });
    return shift ? this.mapSecurityShift(shift) : null;
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
    const shift = await this.prisma.securityShift.create({
      data: {
        communityId: input.auth.currentCommunityId,
        officerUserId: input.auth.userId,
        startedAt: input.now,
      },
      include: { officer: true },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "security_shift.started",
      entityType: "SecurityShift",
      entityId: shift.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.mapSecurityShift(shift);
  }

  async endSecurityShift(input: {
    auth: AuthSessionRecord;
    notes?: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<SecurityShiftRecord | null> {
    if (!input.auth.currentCommunityId) return null;
    const existing = await this.prisma.securityShift.findFirst({
      where: {
        communityId: input.auth.currentCommunityId,
        officerUserId: input.auth.userId,
        status: "ACTIVE",
      },
    });
    if (!existing) return null;
    const shift = await this.prisma.securityShift.update({
      where: { id: existing.id },
      data: { status: "COMPLETED", endedAt: input.now, notes: input.notes ?? existing.notes },
      include: { officer: true },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "security_shift.ended",
      entityType: "SecurityShift",
      entityId: shift.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.mapSecurityShift(shift);
  }

  async listPatrolCheckpoints(auth: AuthSessionRecord): Promise<PatrolCheckpointRecord[]> {
    if (!auth.currentCommunityId) return [];
    const checkpoints = await this.prisma.patrolCheckpoint.findMany({
      where: { communityId: auth.currentCommunityId, archivedAt: null },
      orderBy: { displayOrder: "asc" },
    });
    return checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      name: checkpoint.name,
      displayOrder: checkpoint.displayOrder,
    }));
  }

  private mapPatrolSession(session: {
    id: string;
    status: PatrolSessionRecord["status"];
    startedAt: Date;
    endedAt: Date | null;
    officer: { displayName: string | null; phoneE164: string };
    scans: { scannedAt: Date; note: string | null; checkpoint: { id: string; name: string } }[];
  }): PatrolSessionRecord {
    return {
      id: session.id,
      officerName: displayNameOf(session.officer),
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      totalCheckpoints: 0,
      scans: session.scans.map((scan) => ({
        checkpointId: scan.checkpoint.id,
        checkpointName: scan.checkpoint.name,
        scannedAt: scan.scannedAt,
        note: scan.note,
      })),
    };
  }

  async getActivePatrolSession(auth: AuthSessionRecord): Promise<PatrolSessionRecord | null> {
    if (!auth.currentCommunityId) return null;
    const session = await this.prisma.patrolSession.findFirst({
      where: {
        communityId: auth.currentCommunityId,
        officerUserId: auth.userId,
        status: "IN_PROGRESS",
      },
      include: {
        officer: true,
        scans: { include: { checkpoint: true }, orderBy: { scannedAt: "asc" } },
      },
    });
    if (!session) return null;
    const totalCheckpoints = await this.prisma.patrolCheckpoint.count({
      where: { communityId: auth.currentCommunityId, archivedAt: null },
    });
    return { ...this.mapPatrolSession(session), totalCheckpoints };
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
    const session = await this.prisma.patrolSession.create({
      data: {
        communityId: input.auth.currentCommunityId,
        officerUserId: input.auth.userId,
        startedAt: input.now,
      },
      include: { officer: true, scans: { include: { checkpoint: true } } },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "patrol.started",
      entityType: "PatrolSession",
      entityId: session.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    const totalCheckpoints = await this.prisma.patrolCheckpoint.count({
      where: { communityId: input.auth.currentCommunityId, archivedAt: null },
    });
    return { ...this.mapPatrolSession(session), totalCheckpoints };
  }

  async scanPatrolCheckpoint(input: {
    auth: AuthSessionRecord;
    qrToken: string;
    note?: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<ScanCheckpointResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NO_ACTIVE_SESSION" };
    const session = await this.prisma.patrolSession.findFirst({
      where: {
        communityId: input.auth.currentCommunityId,
        officerUserId: input.auth.userId,
        status: "IN_PROGRESS",
      },
    });
    if (!session) return { outcome: "NO_ACTIVE_SESSION" };
    const checkpoint = await this.prisma.patrolCheckpoint.findFirst({
      where: {
        qrToken: input.qrToken,
        communityId: input.auth.currentCommunityId,
        archivedAt: null,
      },
    });
    if (!checkpoint) return { outcome: "CHECKPOINT_NOT_FOUND" };
    const alreadyScanned = await this.prisma.patrolScan.findFirst({
      where: { patrolSessionId: session.id, checkpointId: checkpoint.id },
    });
    if (alreadyScanned) return { outcome: "ALREADY_SCANNED" };

    await this.prisma.patrolScan.create({
      data: {
        communityId: input.auth.currentCommunityId,
        patrolSessionId: session.id,
        checkpointId: checkpoint.id,
        note: input.note ?? null,
        scannedAt: input.now,
      },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "patrol.checkpoint_scanned",
      entityType: "PatrolCheckpoint",
      entityId: checkpoint.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });

    const updated = await this.getActivePatrolSession(input.auth);
    if (!updated) return { outcome: "NO_ACTIVE_SESSION" };
    return { outcome: "OK", session: updated };
  }

  async endPatrolSession(input: {
    auth: AuthSessionRecord;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<PatrolSessionRecord | null> {
    if (!input.auth.currentCommunityId) return null;
    const existing = await this.prisma.patrolSession.findFirst({
      where: {
        communityId: input.auth.currentCommunityId,
        officerUserId: input.auth.userId,
        status: "IN_PROGRESS",
      },
    });
    if (!existing) return null;
    const session = await this.prisma.patrolSession.update({
      where: { id: existing.id },
      data: { status: "COMPLETED", endedAt: input.now },
      include: {
        officer: true,
        scans: { include: { checkpoint: true }, orderBy: { scannedAt: "asc" } },
      },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "patrol.completed",
      entityType: "PatrolSession",
      entityId: session.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    const totalCheckpoints = await this.prisma.patrolCheckpoint.count({
      where: { communityId: input.auth.currentCommunityId, archivedAt: null },
    });
    return { ...this.mapPatrolSession(session), totalCheckpoints };
  }

  async listPatrolHistory(auth: AuthSessionRecord, limit: number): Promise<PatrolSessionRecord[]> {
    if (!auth.currentCommunityId) return [];
    const totalCheckpoints = await this.prisma.patrolCheckpoint.count({
      where: { communityId: auth.currentCommunityId, archivedAt: null },
    });
    const sessions = await this.prisma.patrolSession.findMany({
      where: { communityId: auth.currentCommunityId },
      include: {
        officer: true,
        scans: { include: { checkpoint: true }, orderBy: { scannedAt: "asc" } },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return sessions.map((session) => ({ ...this.mapPatrolSession(session), totalCheckpoints }));
  }

  private mapIncident(incident: {
    id: string;
    category: IncidentRecord["category"];
    title: string;
    description: string;
    location: string | null;
    occurredAt: Date;
    peopleInvolved: string | null;
    actionTaken: string | null;
    status: IncidentStatus;
    createdAt: Date;
    reporter: { displayName: string | null; phoneE164: string };
  }): IncidentRecord {
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
      reporterName: displayNameOf(incident.reporter),
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
    const incident = await this.prisma.incident.create({
      data: {
        communityId: input.auth.currentCommunityId,
        reporterUserId: input.auth.userId,
        category: input.incident.category,
        title: input.incident.title,
        description: input.incident.description,
        location: input.incident.location ?? null,
        occurredAt: new Date(input.incident.occurredAt),
        peopleInvolved: input.incident.peopleInvolved ?? null,
      },
      include: { reporter: true },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "incident.created",
      entityType: "Incident",
      entityId: incident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { category: input.incident.category },
    });
    return this.mapIncident(incident);
  }

  async listIncidents(input: {
    auth: AuthSessionRecord;
    status?: IncidentStatus;
    limit: number;
  }): Promise<IncidentRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const incidents = await this.prisma.incident.findMany({
      where: {
        communityId: input.auth.currentCommunityId,
        ...(input.status ? { status: input.status } : {}),
      },
      include: { reporter: true },
      orderBy: { occurredAt: "desc" },
      take: input.limit,
    });
    return incidents.map((incident) => this.mapIncident(incident));
  }

  async getIncident(auth: AuthSessionRecord, id: string): Promise<IncidentRecord | null> {
    if (!auth.currentCommunityId) return null;
    const incident = await this.prisma.incident.findFirst({
      where: { id, communityId: auth.currentCommunityId },
      include: { reporter: true },
    });
    return incident ? this.mapIncident(incident) : null;
  }

  async updateIncident(input: {
    auth: AuthSessionRecord;
    incidentId: string;
    changes: UpdateIncidentInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<UpdateIncidentResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const existing = await this.prisma.incident.findFirst({
      where: { id: input.incidentId, communityId: input.auth.currentCommunityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    const incident = await this.prisma.incident.update({
      where: { id: existing.id },
      data: {
        ...(input.changes.status === undefined ? {} : { status: input.changes.status }),
        ...(input.changes.actionTaken === undefined
          ? {}
          : { actionTaken: input.changes.actionTaken }),
      },
      include: { reporter: true },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "incident.updated",
      entityType: "Incident",
      entityId: incident.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { changedFields: Object.keys(input.changes).sort().join(",") },
    });
    return { outcome: "OK", incident: this.mapIncident(incident) };
  }

  async getSecurityDashboard(auth: AuthSessionRecord, now: Date): Promise<SecurityDashboardRecord> {
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
    const [
      shift,
      activeVisitorCount,
      pendingPackageCount,
      camerasOnline,
      camerasTotal,
      openEmergencyCount,
      patrol,
    ] = await Promise.all([
      this.getActiveSecurityShift(auth),
      this.prisma.visitor.count({ where: { communityId, status: "CHECKED_IN" } }),
      this.prisma.package.count({ where: { communityId, status: { not: "COLLECTED" } } }),
      this.prisma.camera.count({ where: { communityId, archivedAt: null, status: "ONLINE" } }),
      this.prisma.camera.count({ where: { communityId, archivedAt: null } }),
      this.prisma.emergency.count({ where: { communityId, status: { not: "RESOLVED" } } }),
      this.getActivePatrolSession(auth),
    ]);
    void now;
    return {
      activeShift: shift ? { id: shift.id, startedAt: shift.startedAt } : null,
      activeVisitorCount,
      pendingPackageCount,
      camerasOnline,
      camerasTotal,
      openEmergencyCount,
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

  private mapReport(report: {
    id: string;
    category: ReportRecord["category"];
    description: string;
    location: string | null;
    status: ReportStatus;
    photos: string[];
    createdAt: Date;
    reporter: { displayName: string | null; phoneE164: string };
    household: { displayName: string; house: { code: string } };
    updates?: Array<{
      id: string;
      status: ReportStatus;
      note: string | null;
      createdAt: Date;
      actor: { displayName: string | null; phoneE164: string } | null;
    }>;
  }): ReportRecord {
    return {
      id: report.id,
      category: report.category,
      description: report.description,
      location: report.location,
      status: report.status,
      photos: report.photos,
      reporterName: displayNameOf(report.reporter),
      houseCode: report.household.house.code,
      householdDisplayName: report.household.displayName,
      createdAt: report.createdAt,
      updates: (report.updates ?? []).map((update) => ({
        id: update.id,
        status: update.status,
        note: update.note,
        actorName: update.actor ? displayNameOf(update.actor) : null,
        createdAt: update.createdAt,
      })),
    };
  }

  private readonly reportInclude = {
    reporter: true,
    household: { include: { house: true } },
    updates: { include: { actor: true }, orderBy: { createdAt: "asc" as const } },
  } satisfies Prisma.ReportInclude;

  async createReport(input: {
    auth: AuthSessionRecord;
    report: CreateReportInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreateReportResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "HOUSEHOLD_CONTEXT_REQUIRED" };
    }
    const communityId = input.auth.currentCommunityId;
    const created = await this.prisma.report.create({
      data: {
        communityId,
        householdId: input.auth.currentHouseholdId,
        reporterUserId: input.auth.userId,
        category: input.report.category,
        description: input.report.description,
        location: input.report.location ?? null,
        photos: input.report.photoUrls ?? [],
      },
    });
    await this.prisma.reportUpdate.create({
      data: {
        communityId,
        reportId: created.id,
        status: "SUBMITTED",
        actorUserId: input.auth.userId,
      },
    });
    const report = await this.prisma.report.findUniqueOrThrow({
      where: { id: created.id },
      include: this.reportInclude,
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "report.created",
      entityType: "Report",
      entityId: report.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { category: input.report.category },
    });
    return { outcome: "OK", report: this.mapReport(report) };
  }

  async listReports(input: {
    auth: AuthSessionRecord;
    status?: ReportStatus;
    limit: number;
  }): Promise<ReportRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("report.manage");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    const reports = await this.prisma.report.findMany({
      where: {
        communityId: input.auth.currentCommunityId,
        ...(canSeeAll ? {} : { householdId: input.auth.currentHouseholdId! }),
        ...(input.status ? { status: input.status } : {}),
      },
      include: { reporter: true, household: { include: { house: true } } },
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });
    return reports.map((report) => this.mapReport({ ...report, updates: [] }));
  }

  async getReport(auth: AuthSessionRecord, id: string): Promise<ReportRecord | null> {
    if (!auth.currentCommunityId) return null;
    const canSeeAll = auth.permissions.includes("report.manage");
    const report = await this.prisma.report.findFirst({
      where: {
        id,
        communityId: auth.currentCommunityId,
        ...(canSeeAll ? {} : { householdId: auth.currentHouseholdId ?? "__none__" }),
      },
      include: this.reportInclude,
    });
    return report ? this.mapReport(report) : null;
  }

  async addReportUpdate(input: {
    auth: AuthSessionRecord;
    reportId: string;
    update: AddReportUpdateInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<AddReportUpdateResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const communityId = input.auth.currentCommunityId;
    const existing = await this.prisma.report.findFirst({
      where: { id: input.reportId, communityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    await this.prisma.report.update({
      where: { id: existing.id },
      data: { status: input.update.status },
    });
    await this.prisma.reportUpdate.create({
      data: {
        communityId,
        reportId: existing.id,
        status: input.update.status,
        note: input.update.note ?? null,
        actorUserId: input.auth.userId,
      },
    });
    const report = await this.prisma.report.findUniqueOrThrow({
      where: { id: existing.id },
      include: this.reportInclude,
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "report.updated",
      entityType: "Report",
      entityId: report.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { status: input.update.status },
    });
    return { outcome: "OK", report: this.mapReport(report) };
  }

  private mapLetterType(type: {
    id: string;
    name: string;
    description: string | null;
  }): LetterTypeRecord {
    return { id: type.id, name: type.name, description: type.description };
  }

  private mapLetterRequest(request: {
    id: string;
    purpose: string;
    status: LetterRequestStatus;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    readyAt: Date | null;
    createdAt: Date;
    letterType: { id: string; name: string };
    requester: { displayName: string | null; phoneE164: string };
    household: { displayName: string; house: { code: string } };
    reviewedBy: { displayName: string | null; phoneE164: string } | null;
  }): LetterRequestRecord {
    return {
      id: request.id,
      letterTypeId: request.letterType.id,
      letterTypeName: request.letterType.name,
      purpose: request.purpose,
      status: request.status,
      requesterName: displayNameOf(request.requester),
      houseCode: request.household.house.code,
      householdDisplayName: request.household.displayName,
      reviewedByName: request.reviewedBy ? displayNameOf(request.reviewedBy) : null,
      reviewedAt: request.reviewedAt,
      rejectionReason: request.rejectionReason,
      readyAt: request.readyAt,
      createdAt: request.createdAt,
    };
  }

  private readonly letterRequestInclude = {
    letterType: true,
    requester: true,
    household: { include: { house: true } },
    reviewedBy: true,
  } satisfies Prisma.LetterRequestInclude;

  async listLetterTypes(auth: AuthSessionRecord): Promise<LetterTypeRecord[]> {
    if (!auth.currentCommunityId) return [];
    const types = await this.prisma.letterType.findMany({
      where: { communityId: auth.currentCommunityId, isActive: true },
      orderBy: { displayOrder: "asc" },
    });
    return types.map((type) => this.mapLetterType(type));
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
    const communityId = input.auth.currentCommunityId;
    const letterType = await this.prisma.letterType.findFirst({
      where: { id: input.request.letterTypeId, communityId, isActive: true },
    });
    if (!letterType) return { outcome: "LETTER_TYPE_NOT_FOUND" };
    const request = await this.prisma.letterRequest.create({
      data: {
        communityId,
        householdId: input.auth.currentHouseholdId,
        requesterUserId: input.auth.userId,
        letterTypeId: letterType.id,
        purpose: input.request.purpose,
      },
      include: this.letterRequestInclude,
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "letter_request.created",
      entityType: "LetterRequest",
      entityId: request.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { letterTypeId: letterType.id },
    });
    return { outcome: "OK", request: this.mapLetterRequest(request) };
  }

  async listLetterRequests(input: {
    auth: AuthSessionRecord;
    status?: LetterRequestStatus;
    limit: number;
  }): Promise<LetterRequestRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("letter.manage");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    const requests = await this.prisma.letterRequest.findMany({
      where: {
        communityId: input.auth.currentCommunityId,
        ...(canSeeAll ? {} : { householdId: input.auth.currentHouseholdId! }),
        ...(input.status ? { status: input.status } : {}),
      },
      include: this.letterRequestInclude,
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });
    return requests.map((request) => this.mapLetterRequest(request));
  }

  private async transitionLetterRequest(
    requestId: string,
    communityId: string,
    guard: (status: LetterRequestStatus) => boolean,
    data: Prisma.LetterRequestUncheckedUpdateInput,
  ): Promise<LetterRequestTransitionResult> {
    const existing = await this.prisma.letterRequest.findFirst({
      where: { id: requestId, communityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (!guard(existing.status)) return { outcome: "INVALID_TRANSITION" };
    const request = await this.prisma.letterRequest.update({
      where: { id: existing.id },
      data,
      include: this.letterRequestInclude,
    });
    return { outcome: "OK", request: this.mapLetterRequest(request) };
  }

  async approveLetterRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<LetterRequestTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const result = await this.transitionLetterRequest(
      input.requestId,
      input.auth.currentCommunityId,
      (status) => status === "SUBMITTED",
      { status: "APPROVED", reviewedByUserId: input.auth.userId, reviewedAt: input.now },
    );
    if (result.outcome === "OK") {
      await this.recordAudit({
        communityId: input.auth.currentCommunityId,
        actorUserId: input.auth.userId,
        action: "letter_request.approved",
        entityType: "LetterRequest",
        entityId: result.request.id,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }
    return result;
  }

  async rejectLetterRequest(input: {
    auth: AuthSessionRecord;
    requestId: string;
    reason: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<LetterRequestTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const result = await this.transitionLetterRequest(
      input.requestId,
      input.auth.currentCommunityId,
      (status) => status === "SUBMITTED",
      {
        status: "REJECTED",
        reviewedByUserId: input.auth.userId,
        reviewedAt: input.now,
        rejectionReason: input.reason,
      },
    );
    if (result.outcome === "OK") {
      await this.recordAudit({
        communityId: input.auth.currentCommunityId,
        actorUserId: input.auth.userId,
        action: "letter_request.rejected",
        entityType: "LetterRequest",
        entityId: result.request.id,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }
    return result;
  }

  async markLetterRequestReady(input: {
    auth: AuthSessionRecord;
    requestId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<LetterRequestTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const result = await this.transitionLetterRequest(
      input.requestId,
      input.auth.currentCommunityId,
      (status) => status === "APPROVED",
      { status: "READY", readyAt: input.now },
    );
    if (result.outcome === "OK") {
      await this.recordAudit({
        communityId: input.auth.currentCommunityId,
        actorUserId: input.auth.userId,
        action: "letter_request.ready",
        entityType: "LetterRequest",
        entityId: result.request.id,
        ipAddress: input.audit.ipAddress,
        userAgent: input.audit.userAgent,
      });
    }
    return result;
  }

  private mapFacility(facility: {
    id: string;
    name: string;
    openTime: string;
    closeTime: string;
    capacity: number | null;
    rules: string | null;
  }): FacilityRecord {
    return {
      id: facility.id,
      name: facility.name,
      openTime: facility.openTime,
      closeTime: facility.closeTime,
      capacity: facility.capacity,
      rules: facility.rules,
    };
  }

  private mapFacilityBooking(booking: {
    id: string;
    bookingDate: Date;
    startTime: string;
    endTime: string;
    purpose: string | null;
    status: FacilityBookingRecord["status"];
    createdAt: Date;
    facility: { id: string; name: string };
    bookedBy: { displayName: string | null; phoneE164: string };
    household: { displayName: string; house: { code: string } };
  }): FacilityBookingRecord {
    return {
      id: booking.id,
      facilityId: booking.facility.id,
      facilityName: booking.facility.name,
      bookingDate: formatAgendaDate(booking.bookingDate),
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
      status: booking.status,
      bookedByName: displayNameOf(booking.bookedBy),
      houseCode: booking.household.house.code,
      householdDisplayName: booking.household.displayName,
      createdAt: booking.createdAt,
    };
  }

  private readonly facilityBookingInclude = {
    facility: true,
    bookedBy: true,
    household: { include: { house: true } },
  } satisfies Prisma.FacilityBookingInclude;

  async listFacilities(auth: AuthSessionRecord): Promise<FacilityRecord[]> {
    if (!auth.currentCommunityId) return [];
    const facilities = await this.prisma.facility.findMany({
      where: { communityId: auth.currentCommunityId, isActive: true },
      orderBy: { name: "asc" },
    });
    return facilities.map((facility) => this.mapFacility(facility));
  }

  async listFacilityBookings(input: {
    auth: AuthSessionRecord;
    facilityId?: string;
    date?: string;
    limit: number;
  }): Promise<FacilityBookingRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const bookings = await this.prisma.facilityBooking.findMany({
      where: {
        communityId: input.auth.currentCommunityId,
        status: "CONFIRMED",
        ...(input.facilityId ? { facilityId: input.facilityId } : {}),
        ...(input.date ? { bookingDate: parseAgendaDate(input.date) } : {}),
      },
      include: this.facilityBookingInclude,
      orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
      take: input.limit,
    });
    return bookings.map((booking) => this.mapFacilityBooking(booking));
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
    const communityId = input.auth.currentCommunityId;
    const householdId = input.auth.currentHouseholdId;
    const facility = await this.prisma.facility.findFirst({
      where: { id: input.booking.facilityId, communityId, isActive: true },
    });
    if (!facility) return { outcome: "FACILITY_NOT_FOUND" };

    const bookingDate = parseAgendaDate(input.booking.bookingDate);
    const sameDayBookings = await this.prisma.facilityBooking.findMany({
      where: { communityId, facilityId: facility.id, bookingDate, status: "CONFIRMED" },
    });
    const overlaps = sameDayBookings.some(
      (row) => input.booking.startTime < row.endTime && input.booking.endTime > row.startTime,
    );
    if (overlaps) return { outcome: "SLOT_UNAVAILABLE" };

    const booking = await this.prisma.facilityBooking.create({
      data: {
        communityId,
        facilityId: facility.id,
        householdId,
        bookedByUserId: input.auth.userId,
        purpose: input.booking.purpose ?? null,
        bookingDate,
        startTime: input.booking.startTime,
        endTime: input.booking.endTime,
      },
      include: this.facilityBookingInclude,
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "facility_booking.created",
      entityType: "FacilityBooking",
      entityId: booking.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", booking: this.mapFacilityBooking(booking) };
  }

  async cancelFacilityBooking(input: {
    auth: AuthSessionRecord;
    bookingId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CancelFacilityBookingResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const communityId = input.auth.currentCommunityId;
    const canManage = input.auth.permissions.includes("facility.manage");
    const existing = await this.prisma.facilityBooking.findFirst({
      where: {
        id: input.bookingId,
        communityId,
        ...(canManage ? {} : { householdId: input.auth.currentHouseholdId ?? "__none__" }),
      },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (existing.status === "CANCELLED") return { outcome: "ALREADY_CANCELLED" };
    const booking = await this.prisma.facilityBooking.update({
      where: { id: existing.id },
      data: { status: "CANCELLED", cancelledAt: input.now },
      include: this.facilityBookingInclude,
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "facility_booking.cancelled",
      entityType: "FacilityBooking",
      entityId: booking.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", booking: this.mapFacilityBooking(booking) };
  }

  private mapDuesType(duesType: {
    id: string;
    name: string;
    description: string | null;
    defaultAmount: number;
    isActive: boolean;
  }): DuesTypeRecord {
    return {
      id: duesType.id,
      name: duesType.name,
      description: duesType.description,
      defaultAmount: duesType.defaultAmount,
      isActive: duesType.isActive,
    };
  }

  private readonly invoiceInclude = {
    duesType: true,
    household: { include: { house: true } },
    payments: {
      where: { status: "VERIFIED" },
      orderBy: { verifiedAt: "desc" },
      take: 1,
    },
  } satisfies Prisma.InvoiceInclude;

  private mapInvoice(
    invoice: {
      id: string;
      period: string;
      amount: number;
      dueDate: Date;
      status: InvoiceRecord["status"];
      waivedReason: string | null;
      paidAt: Date | null;
      createdAt: Date;
      duesType: { id: string; name: string };
      household: { displayName: string; house: { code: string } };
      payments: Array<{ receiptNumber: string | null }>;
    },
    now: Date,
  ): InvoiceRecord {
    const isOverdue = invoice.status === "UNPAID" && invoice.dueDate.getTime() < now.getTime();
    return {
      id: invoice.id,
      duesTypeId: invoice.duesType.id,
      duesTypeName: invoice.duesType.name,
      period: invoice.period,
      amount: invoice.amount,
      dueDate: formatAgendaDate(invoice.dueDate),
      status: isOverdue ? "OVERDUE" : invoice.status,
      houseCode: invoice.household.house.code,
      householdDisplayName: invoice.household.displayName,
      waivedReason: invoice.waivedReason,
      paidAt: invoice.paidAt,
      receiptNumber: invoice.payments[0]?.receiptNumber ?? null,
      createdAt: invoice.createdAt,
    };
  }

  async listDuesTypes(auth: AuthSessionRecord): Promise<DuesTypeRecord[]> {
    if (!auth.currentCommunityId) return [];
    const duesTypes = await this.prisma.duesType.findMany({
      where: { communityId: auth.currentCommunityId, isActive: true },
      orderBy: { name: "asc" },
    });
    return duesTypes.map((duesType) => this.mapDuesType(duesType));
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
    const communityId = input.auth.currentCommunityId;
    const duesType = await this.prisma.duesType.create({
      data: {
        communityId,
        name: input.duesType.name,
        description: input.duesType.description ?? null,
        defaultAmount: input.duesType.defaultAmount,
      },
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "dues_type.created",
      entityType: "DuesType",
      entityId: duesType.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return this.mapDuesType(duesType);
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
    const households = await this.prisma.household.findMany({
      where: { communityId, deletedAt: null },
      select: { id: true },
    });
    if (households.length === 0) return 0;
    const dueDate = parseAgendaDate(input.generate.dueDate);
    const result = await this.prisma.invoice.createMany({
      data: households.map((household) => ({
        communityId,
        householdId: household.id,
        duesTypeId: input.generate.duesTypeId,
        period: input.generate.period,
        amount: input.generate.amount,
        dueDate,
      })),
      skipDuplicates: true,
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "invoice.generated",
      entityType: "Invoice",
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: {
        duesTypeId: input.generate.duesTypeId,
        period: input.generate.period,
        createdCount: result.count,
      },
    });
    return result.count;
  }

  async listInvoices(input: {
    auth: AuthSessionRecord;
    status?: InvoiceStatus;
    limit: number;
  }): Promise<InvoiceRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const canSeeAll = input.auth.permissions.includes("dues.manage");
    if (!canSeeAll && !input.auth.currentHouseholdId) return [];
    const invoices = await this.prisma.invoice.findMany({
      where: {
        communityId: input.auth.currentCommunityId,
        ...(canSeeAll ? {} : { householdId: input.auth.currentHouseholdId! }),
        ...(input.status ? { status: input.status } : {}),
      },
      include: this.invoiceInclude,
      orderBy: { dueDate: "desc" },
      take: input.limit,
    });
    return invoices.map((invoice) => this.mapInvoice(invoice, new Date()));
  }

  async getInvoice(auth: AuthSessionRecord, id: string): Promise<InvoiceRecord | null> {
    if (!auth.currentCommunityId) return null;
    const canSeeAll = auth.permissions.includes("dues.manage");
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        communityId: auth.currentCommunityId,
        ...(canSeeAll ? {} : { householdId: auth.currentHouseholdId ?? "__none__" }),
      },
      include: this.invoiceInclude,
    });
    return invoice ? this.mapInvoice(invoice, new Date()) : null;
  }

  async waiveInvoice(input: {
    auth: AuthSessionRecord;
    invoiceId: string;
    reason: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<WaiveInvoiceResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const communityId = input.auth.currentCommunityId;
    const existing = await this.prisma.invoice.findFirst({
      where: { id: input.invoiceId, communityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (existing.status === "PAID" || existing.status === "WAIVED") {
      return { outcome: "INVALID_TRANSITION" };
    }
    const invoice = await this.prisma.invoice.update({
      where: { id: existing.id },
      data: {
        status: "WAIVED",
        waivedAt: input.now,
        waivedByUserId: input.auth.userId,
        waivedReason: input.reason,
      },
      include: this.invoiceInclude,
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "invoice.waived",
      entityType: "Invoice",
      entityId: invoice.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", invoice: this.mapInvoice(invoice, input.now) };
  }

  private mapPayment(payment: {
    id: string;
    invoiceId: string;
    amount: number;
    paidAt: Date;
    note: string;
    status: PaymentRecord["status"];
    verifiedAt: Date | null;
    rejectionReason: string | null;
    receiptNumber: string | null;
    createdAt: Date;
    invoice: {
      period: string;
      duesType: { name: string };
      household: { displayName: string; house: { code: string } };
    };
    submittedBy: { displayName: string | null; phoneE164: string };
    verifiedBy: { displayName: string | null; phoneE164: string } | null;
  }): PaymentRecord {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      duesTypeName: payment.invoice.duesType.name,
      period: payment.invoice.period,
      amount: payment.amount,
      paidAt: formatAgendaDate(payment.paidAt),
      note: payment.note,
      status: payment.status,
      submittedByName: displayNameOf(payment.submittedBy),
      houseCode: payment.invoice.household.house.code,
      householdDisplayName: payment.invoice.household.displayName,
      verifiedByName: payment.verifiedBy ? displayNameOf(payment.verifiedBy) : null,
      verifiedAt: payment.verifiedAt,
      rejectionReason: payment.rejectionReason,
      receiptNumber: payment.receiptNumber,
      createdAt: payment.createdAt,
    };
  }

  private readonly paymentInclude = {
    invoice: { include: { duesType: true, household: { include: { house: true } } } },
    submittedBy: true,
    verifiedBy: true,
  } satisfies Prisma.PaymentInclude;

  async createPayment(input: {
    auth: AuthSessionRecord;
    payment: CreatePaymentInput;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<CreatePaymentResult> {
    if (!input.auth.currentCommunityId || !input.auth.currentHouseholdId) {
      return { outcome: "INVOICE_NOT_FOUND" };
    }
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: input.payment.invoiceId,
        communityId: input.auth.currentCommunityId,
        householdId: input.auth.currentHouseholdId,
      },
    });
    if (!invoice) return { outcome: "INVOICE_NOT_FOUND" };
    if (invoice.status !== "UNPAID" && invoice.status !== "OVERDUE") {
      return { outcome: "INVALID_INVOICE_STATE" };
    }
    const payment = await this.prisma.payment.create({
      data: {
        communityId: input.auth.currentCommunityId,
        invoiceId: invoice.id,
        submittedByUserId: input.auth.userId,
        amount: input.payment.amount,
        paidAt: parseAgendaDate(input.payment.paidAt),
        note: input.payment.note,
      },
      include: this.paymentInclude,
    });
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PENDING_VERIFICATION" },
    });
    await this.recordAudit({
      communityId: input.auth.currentCommunityId,
      actorUserId: input.auth.userId,
      action: "payment.submitted",
      entityType: "Payment",
      entityId: payment.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", payment: this.mapPayment(payment) };
  }

  async listPayments(input: {
    auth: AuthSessionRecord;
    status?: PaymentStatus;
    limit: number;
  }): Promise<PaymentRecord[]> {
    if (!input.auth.currentCommunityId) return [];
    const payments = await this.prisma.payment.findMany({
      where: {
        communityId: input.auth.currentCommunityId,
        ...(input.status ? { status: input.status } : {}),
      },
      include: this.paymentInclude,
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });
    return payments.map((payment) => this.mapPayment(payment));
  }

  async verifyPayment(input: {
    auth: AuthSessionRecord;
    paymentId: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<PaymentTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const communityId = input.auth.currentCommunityId;
    const existing = await this.prisma.payment.findFirst({
      where: { id: input.paymentId, communityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (existing.status !== "PENDING") return { outcome: "INVALID_TRANSITION" };
    const receiptNumber = `KK${formatAgendaDate(input.now).replace(/-/g, "")}-${existing.id.slice(0, 8).toUpperCase()}`;
    const payment = await this.prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: "VERIFIED",
        verifiedByUserId: input.auth.userId,
        verifiedAt: input.now,
        receiptNumber,
      },
      include: this.paymentInclude,
    });
    await this.prisma.invoice.update({
      where: { id: existing.invoiceId },
      data: { status: "PAID", paidAt: input.now },
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "payment.verified",
      entityType: "Payment",
      entityId: payment.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", payment: this.mapPayment(payment) };
  }

  async rejectPayment(input: {
    auth: AuthSessionRecord;
    paymentId: string;
    reason: string;
    now: Date;
    audit: { ipAddress: string | null; userAgent: string | null };
  }): Promise<PaymentTransitionResult> {
    if (!input.auth.currentCommunityId) return { outcome: "NOT_FOUND" };
    const communityId = input.auth.currentCommunityId;
    const existing = await this.prisma.payment.findFirst({
      where: { id: input.paymentId, communityId },
    });
    if (!existing) return { outcome: "NOT_FOUND" };
    if (existing.status !== "PENDING") return { outcome: "INVALID_TRANSITION" };
    const payment = await this.prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: "REJECTED",
        verifiedByUserId: input.auth.userId,
        verifiedAt: input.now,
        rejectionReason: input.reason,
      },
      include: this.paymentInclude,
    });
    await this.prisma.invoice.update({
      where: { id: existing.invoiceId },
      data: { status: "UNPAID" },
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "payment.rejected",
      entityType: "Payment",
      entityId: payment.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
    });
    return { outcome: "OK", payment: this.mapPayment(payment) };
  }

  private mapCashTransaction(transaction: {
    id: string;
    date: Date;
    category: string;
    description: string;
    amount: number;
    type: CashTransactionRecord["type"];
    visibility: CashTransactionRecord["visibility"];
    createdAt: Date;
    recordedBy: { displayName: string | null; phoneE164: string };
  }): CashTransactionRecord {
    return {
      id: transaction.id,
      date: formatAgendaDate(transaction.date),
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      visibility: transaction.visibility,
      recordedByName: displayNameOf(transaction.recordedBy),
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
    const communityId = input.auth.currentCommunityId;
    const canSeeAll = input.auth.permissions.includes("cash.manage");
    const visibilityFilter = canSeeAll ? {} : { visibility: "PUBLIC_TO_RESIDENTS" as const };

    let periodStart: Date | undefined;
    if (input.period) {
      periodStart = parseAgendaDate(`${input.period}-01`);
    }

    const [items, priorTransactions, periodTransactions] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        where: {
          communityId,
          ...visibilityFilter,
          ...(periodStart ? { date: { gte: periodStart } } : {}),
        },
        include: { recordedBy: true },
        orderBy: { date: "desc" },
        take: input.limit,
      }),
      periodStart
        ? this.prisma.cashTransaction.findMany({
            where: { communityId, ...visibilityFilter, date: { lt: periodStart } },
            select: { amount: true, type: true },
          })
        : Promise.resolve([]),
      periodStart
        ? this.prisma.cashTransaction.findMany({
            where: { communityId, ...visibilityFilter, date: { gte: periodStart } },
            select: { amount: true, type: true },
          })
        : this.prisma.cashTransaction.findMany({
            where: { communityId, ...visibilityFilter },
            select: { amount: true, type: true },
          }),
    ]);

    const sumByType = (rows: Array<{ amount: number; type: string }>, type: string) =>
      rows.filter((row) => row.type === type).reduce((total, row) => total + row.amount, 0);

    const openingBalance = periodStart
      ? sumByType(priorTransactions, "INCOME") - sumByType(priorTransactions, "EXPENSE")
      : 0;
    const totalIncome = sumByType(periodTransactions, "INCOME");
    const totalExpense = sumByType(periodTransactions, "EXPENSE");

    return {
      items: items.map((item) => this.mapCashTransaction(item)),
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
    const communityId = input.auth.currentCommunityId;
    const transaction = await this.prisma.cashTransaction.create({
      data: {
        communityId,
        date: parseAgendaDate(input.transaction.date),
        category: input.transaction.category,
        description: input.transaction.description,
        amount: input.transaction.amount,
        type: input.transaction.type,
        visibility: input.transaction.visibility,
        recordedByUserId: input.auth.userId,
      },
      include: { recordedBy: true },
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "cash_transaction.recorded",
      entityType: "CashTransaction",
      entityId: transaction.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { type: input.transaction.type, amount: input.transaction.amount },
    });
    return this.mapCashTransaction(transaction);
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
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [outstandingInvoices, pendingVerificationCount, paidThisMonth, incomeRows, expenseRows] =
      await Promise.all([
        this.prisma.invoice.findMany({
          where: { communityId, status: { in: ["UNPAID", "OVERDUE", "PENDING_VERIFICATION"] } },
          select: { amount: true },
        }),
        this.prisma.payment.count({ where: { communityId, status: "PENDING" } }),
        this.prisma.invoice.findMany({
          where: { communityId, status: "PAID", paidAt: { gte: monthStart } },
          select: { amount: true },
        }),
        this.prisma.cashTransaction.aggregate({
          where: { communityId, type: "INCOME" },
          _sum: { amount: true },
        }),
        this.prisma.cashTransaction.aggregate({
          where: { communityId, type: "EXPENSE" },
          _sum: { amount: true },
        }),
      ]);
    return {
      outstandingInvoiceCount: outstandingInvoices.length,
      outstandingInvoiceAmount: outstandingInvoices.reduce(
        (total, invoice) => total + invoice.amount,
        0,
      ),
      pendingVerificationCount,
      collectedThisMonth: paidThisMonth.reduce((total, invoice) => total + invoice.amount, 0),
      cashBalance: (incomeRows._sum.amount ?? 0) - (expenseRows._sum.amount ?? 0),
    };
  }

  private mapHouse(house: {
    id: string;
    code: string;
    block: string;
    number: string;
    occupancyStatus: HouseRecord["occupancyStatus"];
    createdAt: Date;
    household: { id: string } | null;
  }): HouseRecord {
    return {
      id: house.id,
      code: house.code,
      block: house.block,
      number: house.number,
      occupancyStatus: house.occupancyStatus,
      addressLabel: addressLabel(house.block, house.number),
      hasHousehold: house.household !== null,
      createdAt: house.createdAt,
    };
  }

  async listHouses(auth: AuthSessionRecord): Promise<HouseRecord[]> {
    if (!auth.currentCommunityId) return [];
    const houses = await this.prisma.house.findMany({
      where: { communityId: auth.currentCommunityId, deletedAt: null },
      include: { household: { select: { id: true } } },
      orderBy: [{ block: "asc" }, { number: "asc" }],
    });
    return houses.map((house) => this.mapHouse(house));
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
    const existing = await this.prisma.house.findFirst({
      where: { communityId, code: input.house.code },
    });
    if (existing) return { outcome: "CODE_CONFLICT" };
    const house = await this.prisma.house.create({
      data: {
        communityId,
        code: input.house.code,
        block: input.house.block,
        number: input.house.number,
        occupancyStatus: input.house.occupancyStatus,
      },
      include: { household: { select: { id: true } } },
    });
    await this.recordAudit({
      communityId,
      actorUserId: input.auth.userId,
      action: "house.created",
      entityType: "House",
      entityId: house.id,
      ipAddress: input.audit.ipAddress,
      userAgent: input.audit.userAgent,
      metadata: { code: house.code },
    });
    return { outcome: "OK", house: this.mapHouse(house) };
  }

  async updateProfile(input: {
    auth: AuthSessionRecord;
    profile: UpdateProfileInput;
  }): Promise<{ displayName: string | null; allowResidentContact: boolean }> {
    const data: Prisma.UserUpdateInput = {};
    if (input.profile.displayName !== undefined) {
      data.displayName = input.profile.displayName;
    }
    if (input.profile.allowResidentContact !== undefined) {
      data.allowResidentContact = input.profile.allowResidentContact;
    }
    const updated = await this.prisma.user.update({
      where: { id: input.auth.userId },
      data,
    });
    if (input.profile.displayName !== undefined && input.auth.currentCommunityId) {
      await this.prisma.resident.updateMany({
        where: { userId: input.auth.userId, communityId: input.auth.currentCommunityId },
        data: { fullName: input.profile.displayName },
      });
    }
    return {
      displayName: updated.displayName,
      allowResidentContact: updated.allowResidentContact,
    };
  }

  async recordAudit(input: AuditInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        communityId: input.communityId ?? null,
        actorUserId: input.actorUserId ?? null,
        sessionId: input.sessionId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
