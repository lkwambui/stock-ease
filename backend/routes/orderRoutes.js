const express = require('express');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getOrders).post(protect, createOrder);

router.route('/:id').get(protect, getOrderById).delete(protect, adminOnly, deleteOrder);

router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
