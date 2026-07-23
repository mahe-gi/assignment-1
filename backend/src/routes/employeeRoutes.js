const express = require('express');
const employeeController = require('../controllers/employeeController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles('Manager'), employeeController.getEmployees);

module.exports = router;
