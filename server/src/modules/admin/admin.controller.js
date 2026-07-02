const adminService = require('./admin.service');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getRevenueReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Query parameters "from" and "to" are required (YYYY-MM-DD)' });
    }
    const report = await adminService.getRevenueReport({ from, to });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const getOccupancyReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Query parameters "from" and "to" are required (YYYY-MM-DD)' });
    }
    const report = await adminService.getOccupancyReport({ from, to });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// ======================== USER MANAGEMENT ========================

const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page, limit } = req.query;
    const result = await adminService.getAllUsers({ role, search, page, limit });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'role is required' });
    const user = await adminService.updateUserRole(req.params.id, role);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    if (error.message.startsWith('role must be')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await adminService.deleteUser(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// ======================== RESERVATION OVERRIDE ========================

const overrideReservationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });
    const reservation = await adminService.overrideReservationStatus({
      id: req.params.id,
      status,
      note,
      staffId: req.user.id,
    });
    res.json({ success: true, data: reservation });
  } catch (error) {
    if (error.message.startsWith('Invalid status') || error.message === 'Reservation not found') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getOccupancyReport,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  overrideReservationStatus,
};
