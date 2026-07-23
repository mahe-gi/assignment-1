const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseFormatter');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 401, 'Authentication token missing');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return sendError(res, 401, 'Invalid or expired token');
    }
    req.user = decoded;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'Access forbidden: Insufficient role permissions');
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
