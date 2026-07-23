const leaveService = require('../services/leaveService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/responseFormatter');

const applyLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const leaveRequest = await leaveService.applyLeave(req.user.id, {
      startDate,
      endDate,
      reason
    });
    return sendSuccess(res, 201, 'Leave request created successfully', leaveRequest);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

const getLeaves = async (req, res, next) => {
  try {
    const result = await leaveService.getLeaves(req.user, req.query);
    if (result.activeOnly) {
      return sendSuccess(res, 200, 'Active leave requests fetched successfully', result.leaves);
    }
    return sendPaginated(res, 200, 'Leave requests fetched successfully', result.leaves, result.meta);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await leaveService.approveLeave(id);
    return sendSuccess(res, 200, 'Leave request approved successfully', leave);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await leaveService.rejectLeave(id);
    return sendSuccess(res, 200, 'Leave request rejected successfully', leave);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

const cancelLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await leaveService.cancelLeave(id, req.user.id);
    return sendSuccess(res, 200, 'Leave request cancelled successfully', leave);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }
    next(error);
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave
};
