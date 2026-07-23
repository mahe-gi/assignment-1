const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseFormatter');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return sendError(res, 400, 'Invalid request input', formattedErrors);
  }
  next();
};

module.exports = {
  handleValidationErrors
};
