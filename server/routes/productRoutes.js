const router = require('express').Router();
const Product = require('../models/Product');
const jwtAuth = require('../middleware/jwtAuth');

// GET /api/products — public listing of all in-stock products
router.get('/', jwtAuth, async (req, res) => {
  try {
    const products = await Product.find({ inStock: true }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
});

module.exports = router;
