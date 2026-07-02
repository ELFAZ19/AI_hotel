const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

// All admin routes require authentication
router.use(authenticate);

// ======================== DASHBOARD ========================
router.get('/stats', authorize('admin', 'manager'), adminController.getDashboardStats);

// ======================== REPORTS ========================
router.get('/reports/revenue', authorize('admin', 'manager'), adminController.getRevenueReport);
router.get('/reports/occupancy', authorize('admin', 'manager'), adminController.getOccupancyReport);

// ======================== USER MANAGEMENT ========================
// Restrict user management to admins and managers
const userAuth = authorize('admin', 'manager');
router.get('/users', userAuth, adminController.getAllUsers);
router.get('/users/:id', userAuth, adminController.getUserById);
router.patch('/users/:id/role', userAuth, adminController.updateUserRole);
router.delete('/users/:id', userAuth, adminController.deleteUser);

// ======================== RESERVATION OVERRIDE ========================
// Allows admin to set any status regardless of normal transition rules
router.patch('/reservations/:id/status', authorize('admin', 'manager'), adminController.overrideReservationStatus);

module.exports = router;
