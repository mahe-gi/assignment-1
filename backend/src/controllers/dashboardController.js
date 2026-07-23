const leaveService = require('../services/leaveService');
const { sendSuccess } = require('../utils/responseFormatter');

const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await leaveService.getDashboardData(req.user, req.query);
    return sendSuccess(res, 200, 'Dashboard data fetched successfully', dashboardData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard
};
