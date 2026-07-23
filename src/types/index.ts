// ============================================================
// SIGEP — Tipos do Sistema
// ============================================================

// --- Enums ---

export type UserRole = 'RT' | 'EMPLOYEE';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export type RequestType = 'LEAVE' | 'SWAP';

export type NotificationType =
  | 'NEW_REQUEST'
  | 'NEW_SWAP'
  | 'REQUEST_APPROVED'
  | 'REQUEST_DENIED'
  | 'SCHEDULE_PUBLISHED'
  | 'SHIFT_CHANGED'
  | 'SWAP_APPROVED'
  | 'SWAP_DENIED';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_UPDATED'
  | 'EMPLOYEE_DELETED'
  | 'SHIFT_CREATED'
  | 'SHIFT_UPDATED'
  | 'SHIFT_DELETED'
  | 'SCHEDULE_GENERATED'
  | 'SCHEDULE_EDITED'
  | 'SCHEDULE_PUBLISHED'
  | 'SCHEDULE_UNPUBLISHED'
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_DENIED'
  | 'SWAP_CREATED'
  | 'SWAP_ACCEPTED'
  | 'SWAP_APPROVED'
  | 'SWAP_DENIED'
  | 'PASSWORD_CHANGED'
  | 'SETTINGS_UPDATED';

// --- Core Entities ---

export interface User {
  id: string;
  name: string;
  crm: string;
  phone: string;
  login: string;
  role: UserRole;
  isFirstAccess: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  minStaff: number;
  maxStaff: number;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEntry {
  id: string;
  scheduleId: string;
  userId: string;
  shiftId: string;
  date: string; // YYYY-MM-DD
  user?: User;
  shift?: Shift;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  month: number;
  year: number;
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
  entries?: ScheduleEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  scheduleEntryId?: string;
  date: string;
  reason: string;
  status: RequestStatus;
  rtComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  targetId: string;
  requesterEntryId: string;
  targetEntryId: string;
  status: RequestStatus;
  targetAccepted: boolean;
  rtComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  requester?: User;
  target?: User;
  requesterEntry?: ScheduleEntry;
  targetEntry?: ScheduleEntry;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  user?: Pick<User, 'id' | 'name' | 'login'>;
  createdAt: string;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export interface SystemSettings {
  id: string;
  hospitalName: string;
  hospitalSubtitle?: string;
  logoUrl?: string;
  minLeadTimeDays: number;
  minSwapLeadTimeDays: number;
  allowSelfSchedule: boolean;
  vapidPublicKey?: string;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  updatedAt: string;
}

// --- API Response Types ---

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Form Types ---

export interface LoginForm {
  login: string;
  password: string;
}

export interface FirstAccessForm {
  password: string;
  confirmPassword: string;
}

export interface EmployeeForm {
  name: string;
  crm: string;
  phone: string;
  login: string;
  initialPassword: string;
  role: UserRole;
}

export interface ShiftForm {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  minStaff: number;
  maxStaff: number;
  color: string;
}

export interface LeaveRequestForm {
  date: string;
  reason: string;
}

export interface SwapRequestForm {
  requesterEntryId: string;
  targetId: string;
  targetEntryId: string;
}

export interface ApprovalForm {
  status: 'APPROVED' | 'DENIED';
  comment?: string;
}

// --- Schedule Builder Types ---

export interface ScheduleConflict {
  type: 'MISSING_STAFF' | 'EXCESS_STAFF' | 'DUPLICATE' | 'PENDING_REQUEST' | 'OVERLAP';
  date: string;
  shiftId?: string;
  userId?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ScheduleGenerationConfig {
  month: number;
  year: number;
  shiftIds: string[];
  employeeIds: string[];
  respectLeaveRequests: boolean;
}

// --- Dashboard Types ---

export interface DashboardStats {
  todayShifts: ScheduleEntry[];
  pendingLeaves: number;
  pendingSwaps: number;
  recentChanges: AuditLog[];
  totalEmployees: number;
  publishedSchedules: number;
}

export interface EmployeeDashboard {
  nextShift?: ScheduleEntry;
  upcomingShifts: ScheduleEntry[];
  pendingRequests: (LeaveRequest | SwapRequest)[];
  unreadNotifications: number;
}

// --- Calendar Types ---

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  entries: ScheduleEntry[];
  conflicts?: ScheduleConflict[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarData {
  month: number;
  year: number;
  weeks: CalendarWeek[];
  isPublished: boolean;
  scheduleId?: string;
}

// --- Auth Types ---

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: string;
}

export interface JWTPayload {
  sub: string;
  role: UserRole;
  login: string;
  iat: number;
  exp: number;
}
