const Product = require('../models/Product');
const Order = require('../models/Order');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    const totalUsers = await User.countDocuments();

    // Low stock: products where quantity <= lowStockThreshold
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    })
      .select('name quantity lowStockThreshold category')
      .limit(10);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Revenue from completed orders
    const revenueResult = await Order.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name');

    // Top 5 products by quantity (well-stocked)
    const topProducts = await Product.find()
      .sort({ quantity: -1 })
      .limit(5)
      .select('name quantity category');

    res.json({
      totalProducts,
      totalOrders,
      totalSuppliers,
      totalUsers,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      ordersByStatus,
      totalRevenue,
      recentOrders,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
