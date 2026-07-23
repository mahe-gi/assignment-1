const express = require('express');
const { body, param } = require('express-validator');
const leaveController = require('../controllers/leaveController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validatorMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Apply for leave (Employee only)
router.post(
  '/',
  authorizeRoles('Employee'),
  [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    handleValidationErrors
  ],
  leaveController.applyLeave
);

// Get leaves (Employee or Manager)
router.get('/', leaveController.getLeaves);

// Approve leave (Manager only)
router.patch(
  '/:id/approve',
  authorizeRoles('Manager'),
  [param('id').isMongoId().withMessage('Invalid leave request ID'), handleValidationErrors],
  leaveController.approveLeave
);

// Reject leave (Manager only)
router.patch(
  '/:id/reject',
  authorizeRoles('Manager'),
  [param('id').isMongoId().withMessage('Invalid leave request ID'), handleValidationErrors],
  leaveController.rejectLeave
);

// Cancel leave (Employee only)
router.patch(
  '/:id/cancel',
  authorizeRoles('Employee'),
  [param('id').isMongoId().withMessage('Invalid leave request ID'), handleValidationErrors],
  leaveController.cancelLeave
);

module.exports = router;
