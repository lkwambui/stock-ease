const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/categories', protect, getCategories);

router
  .route('/')
  .get(protect, getProducts)
  .post(
    protect,
    [
      body('name').notEmpty().withMessage('Product name is required'),
      body('category').notEmpty().withMessage('Category is required'),
      body('price').isNumeric().withMessage('Price must be a number'),
      body('quantity').isNumeric().withMessage('Quantity must be a number'),
    ],
    createProduct
  );

router
  .route('/:id')
  .get(protect, getProductById)
  .put(protect, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;
