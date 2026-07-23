const { sendError } = require('../utils/responseFormatter');

const notFoundHandler = (req, res, next) => {
  return sendError(res, 404, `Route not found: ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  return sendError(res, statusCode, message);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
