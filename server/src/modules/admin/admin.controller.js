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

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getOccupancyReport
};
