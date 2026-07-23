export type UserRole = 'Employee' | 'Manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  annualLeaveBalance: number;
  remainingLeaveBalance: number;
}

export interface SimpleEmployee {
  _id: string;
  name: string;
  email: string;
  remainingLeaveBalance: number;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  _id: string;
  employee: SimpleEmployee | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Array<{ field?: string; message: string }>;
}

export interface EmployeeDashboardMetrics {
  annualLeaveBalance: number;
  remainingLeaveBalance: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  onLeaveToday: boolean;
}

export interface ManagerDashboardMetrics {
  headline: {
    totalEmployees: number;
    pendingRequests: number;
    approvedThisMonth: number;
    employeesCurrentlyOnLeave: number;
  };
  analytics: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    cancelledCount: number;
    onLeaveTodayCount: number;
  };
}

export interface FilterParams {
  search?: string;
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
