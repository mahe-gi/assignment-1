const User = require('../models/User');
const { sendSuccess } = require('../utils/responseFormatter');

const getEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'Employee' })
      .select('_id name email remainingLeaveBalance')
      .sort({ name: 1 });

    return sendSuccess(res, 200, 'Employees fetched successfully', employees);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees
};
