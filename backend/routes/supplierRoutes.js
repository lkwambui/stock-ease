const express = require('express');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getSuppliers).post(protect, createSupplier);

router
  .route('/:id')
  .get(protect, getSupplierById)
  .put(protect, updateSupplier)
  .delete(protect, adminOnly, deleteSupplier);

module.exports = router;
