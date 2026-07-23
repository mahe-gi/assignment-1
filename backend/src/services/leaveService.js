const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const { normalizeToUTCMidnight, calculateInclusiveDays } = require('../utils/dateUtils');

class LeaveService {
  /**
   * Apply for leave (Employee)
   */
  async applyLeave(userId, { startDate, endDate, reason }) {
    const normStart = normalizeToUTCMidnight(startDate);
    const normEnd = normalizeToUTCMidnight(endDate);

    if (normStart > normEnd) {
      const err = new Error('Start date must be less than or equal to end date');
      err.statusCode = 400;
      throw err;
    }

    const totalDays = calculateInclusiveDays(normStart, normEnd);

    // Fetch user to check remaining leave balance
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (totalDays > user.remainingLeaveBalance) {
      const err = new Error(`Requested duration (${totalDays} days) exceeds your remaining leave balance (${user.remainingLeaveBalance} days)`);
      err.statusCode = 400;
      throw err;
    }

    // Check for overlapping Pending or Approved requests for this employee
    const overlapping = await LeaveRequest.findOne({
      employee: userId,
      status: { $in: ['Pending', 'Approved'] },
      startDate: { $lte: normEnd },
      endDate: { $gte: normStart }
    });

    if (overlapping) {
      const err = new Error('Selected date range overlaps with an existing Pending or Approved leave request');
      err.statusCode = 409;
      throw err;
    }

    // Create Pending request without balance deduction
    const leaveRequest = await LeaveRequest.create({
      employee: userId,
      startDate: normStart,
      endDate: normEnd,
      totalDays,
      reason,
      status: 'Pending'
    });

    return leaveRequest;
  }

  /**
   * Get leaves with filtering and pagination
   */
  async getLeaves(user, queryParams) {
    const {
      page = 1,
      limit = 10,
      status,
      employeeId,
      startDate,
      endDate,
      search,
      sortOrder = 'desc',
      activeOnly
    } = queryParams;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // Role-based scoping
    if (user.role === 'Employee') {
      filter.employee = user.id;

      // Special mode for client-side overlap check
      if (activeOnly === 'true' || activeOnly === true) {
        filter.status = { $in: ['Pending', 'Approved'] };
        const activeLeaves = await LeaveRequest.find(filter).sort({ startDate: 1 });
        return { leaves: activeLeaves, activeOnly: true };
      }
    } else if (user.role === 'Manager') {
      if (employeeId) {
        filter.employee = employeeId;
      }
    }

    // Status filter
    if (status && ['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
      filter.status = status;
    }

    // Date range overlap filter: return requests overlapping [startDate, endDate]
    if (startDate || endDate) {
      filter.$and = filter.$and || [];
      if (startDate) {
        const normStart = normalizeToUTCMidnight(startDate);
        filter.$and.push({ endDate: { $gte: normStart } });
      }
      if (endDate) {
        const normEnd = normalizeToUTCMidnight(endDate);
        filter.$and.push({ startDate: { $lte: normEnd } });
      }
    }

    // Search filter (Manager only)
    if (user.role === 'Manager' && search && search.trim() !== '') {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      const matchingUsers = await User.find({
        role: 'Employee',
        $or: [{ name: searchRegex }, { email: searchRegex }]
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);
      filter.employee = { $in: userIds };
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const total = await LeaveRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const leaves = await LeaveRequest.find(filter)
      .populate('employee', 'name email remainingLeaveBalance')
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(limitNum);

    return {
      leaves,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };
  }

  /**
   * Approve leave request (Manager)
   */
  async approveLeave(leaveId) {
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      const err = new Error('Leave request not found');
      err.statusCode = 404;
      throw err;
    }

    if (leave.status !== 'Pending') {
      const err = new Error(`Cannot approve a leave request with status '${leave.status}'. Only Pending requests can be approved.`);
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(leave.employee);
    if (!user) {
      const err = new Error('Employee associated with leave request not found');
      err.statusCode = 404;
      throw err;
    }

    // Recheck balance at approval time
    if (leave.totalDays > user.remainingLeaveBalance) {
      const err = new Error(`Insufficient leave balance. Employee has ${user.remainingLeaveBalance} days remaining, but request requires ${leave.totalDays} days.`);
      err.statusCode = 400;
      throw err;
    }

    // Deduct balance & update leave status
    user.remainingLeaveBalance -= leave.totalDays;
    await user.save();

    leave.status = 'Approved';
    leave.approvedAt = new Date();
    await leave.save();

    await leave.populate('employee', 'name email remainingLeaveBalance');
    return leave;
  }

  /**
   * Reject leave request (Manager)
   */
  async rejectLeave(leaveId) {
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      const err = new Error('Leave request not found');
      err.statusCode = 404;
      throw err;
    }

    if (leave.status !== 'Pending') {
      const err = new Error(`Cannot reject a leave request with status '${leave.status}'. Only Pending requests can be rejected.`);
      err.statusCode = 400;
      throw err;
    }

    leave.status = 'Rejected';
    await leave.save();

    await leave.populate('employee', 'name email remainingLeaveBalance');
    return leave;
  }

  /**
   * Cancel leave request (Employee)
   */
  async cancelLeave(leaveId, userId) {
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      const err = new Error('Leave request not found');
      err.statusCode = 404;
      throw err;
    }

    if (leave.employee.toString() !== userId.toString()) {
      const err = new Error('Forbidden: You can only cancel your own leave requests');
      err.statusCode = 403;
      throw err;
    }

    if (['Rejected', 'Cancelled'].includes(leave.status)) {
      const err = new Error(`Cannot cancel a leave request that is already ${leave.status}`);
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(userId);

    if (leave.status === 'Approved') {
      // Restore totalDays up to annualLeaveBalance cap
      user.remainingLeaveBalance = Math.min(
        user.annualLeaveBalance,
        user.remainingLeaveBalance + leave.totalDays
      );
      await user.save();
    }

    leave.status = 'Cancelled';
    await leave.save();

    return leave;
  }

  /**
   * Get Dashboard Data
   */
  async getDashboardData(user, queryParams = {}) {
    const today = normalizeToUTCMidnight(new Date());

    if (user.role === 'Employee') {
      const empUser = await User.findById(user.id);
      
      const pendingCount = await LeaveRequest.countDocuments({ employee: user.id, status: 'Pending' });
      const approvedCount = await LeaveRequest.countDocuments({ employee: user.id, status: 'Approved' });
      const rejectedCount = await LeaveRequest.countDocuments({ employee: user.id, status: 'Rejected' });
      const cancelledCount = await LeaveRequest.countDocuments({ employee: user.id, status: 'Cancelled' });

      const currentlyOnLeave = await LeaveRequest.exists({
        employee: user.id,
        status: 'Approved',
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      return {
        annualLeaveBalance: empUser.annualLeaveBalance,
        remainingLeaveBalance: empUser.remainingLeaveBalance,
        pendingCount,
        approvedCount,
        rejectedCount,
        cancelledCount,
        onLeaveToday: !!currentlyOnLeave
      };
    }

    if (user.role === 'Manager') {
      // Headline global metrics
      const totalEmployees = await User.countDocuments({ role: 'Employee' });
      const pendingRequests = await LeaveRequest.countDocuments({ status: 'Pending' });

      // approvedThisMonth calculation
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

      const approvedThisMonth = await LeaveRequest.countDocuments({
        status: 'Approved',
        approvedAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const employeesCurrentlyOnLeave = await LeaveRequest.countDocuments({
        status: 'Approved',
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      // Filtered Analytics counts
      const filter = {};
      const { status, employeeId, startDate, endDate, search } = queryParams;

      if (employeeId) {
        filter.employee = employeeId;
      }

      if (startDate || endDate) {
        filter.$and = filter.$and || [];
        if (startDate) {
          filter.$and.push({ endDate: { $gte: normalizeToUTCMidnight(startDate) } });
        }
        if (endDate) {
          filter.$and.push({ startDate: { $lte: normalizeToUTCMidnight(endDate) } });
        }
      }

      if (search && search.trim() !== '') {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escaped, 'i');
        const matchingUsers = await User.find({
          role: 'Employee',
          $or: [{ name: searchRegex }, { email: searchRegex }]
        }).select('_id');
        filter.employee = { $in: matchingUsers.map((u) => u._id) };
      }

      const analyticsPending = await LeaveRequest.countDocuments({ ...filter, status: 'Pending' });
      const analyticsApproved = await LeaveRequest.countDocuments({ ...filter, status: 'Approved' });
      const analyticsRejected = await LeaveRequest.countDocuments({ ...filter, status: 'Rejected' });
      const analyticsCancelled = await LeaveRequest.countDocuments({ ...filter, status: 'Cancelled' });

      // On Leave Today within filter
      const analyticsOnLeaveToday = await LeaveRequest.countDocuments({
        ...filter,
        status: 'Approved',
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      return {
        // Global Headline Cards
        headline: {
          totalEmployees,
          pendingRequests,
          approvedThisMonth,
          employeesCurrentlyOnLeave
        },
        // Filtered Analytics Widget
        analytics: {
          pendingCount: analyticsPending,
          approvedCount: analyticsApproved,
          rejectedCount: analyticsRejected,
          cancelledCount: analyticsCancelled,
          onLeaveTodayCount: analyticsOnLeaveToday
        }
      };
    }
  }
}

module.exports = new LeaveService();
