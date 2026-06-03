const router = require('express').Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
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

// PUT /api/products/:id/rate — rate a product (customers with delivered orders only)
router.put('/:id/rate', jwtAuth, async (req, res) => {
  const { rating } = req.body;
  const allowedRoles = ['customer', 'farmer', 'admin', 'user'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Only customers/farmers can rate products.' });
  }
  const ratingNum = parseFloat(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
  }
  try {
    // Verify user has a delivered order for this product
    const orderQuery = {
      userId: req.user.id,
      status: 'Delivered',
      $or: [
        { 'items.id': req.params.id }
      ]
    };

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const objId = new mongoose.Types.ObjectId(req.params.id);
      orderQuery.$or.push({ 'items.id': objId });
      orderQuery.$or.push({ 'items._id': objId });
      orderQuery.$or.push({ 'items._id': req.params.id });
    }

    const hasDeliveredOrder = await Order.findOne(orderQuery);

    if (!hasDeliveredOrder) {
      return res.status(403).json({ message: 'You can only rate products that have been successfully delivered to you.' });
    }

    const product = mongoose.Types.ObjectId.isValid(req.params.id) ? await Product.findById(req.params.id) : null;
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.reviews) {
      product.reviews = [];
    }

    const existingReviewIndex = product.reviews.findIndex(
      r => r.userId && r.userId.toString() === req.user.id.toString()
    );

    if (existingReviewIndex > -1) {
      product.reviews[existingReviewIndex].rating = ratingNum;
      product.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      product.reviews.push({
        userId: req.user.id,
        userName: req.user.username || 'Farmer Customer',
        rating: ratingNum,
        comment: ''
      });
    }

    const totalRatings = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = parseFloat((totalRatings / product.reviews.length).toFixed(1));

    await product.save();
    res.json({ message: 'Thank you for your rating!', rating: product.rating });
  } catch (err) {
    res.status(500).json({ message: 'Failed to rate product', error: err.message });
  }
});

// POST /api/products/:id/review — review and rate a product (customers with delivered orders only)
router.post('/:id/review', jwtAuth, async (req, res) => {
  const { rating, comment } = req.body;
  const allowedRoles = ['customer', 'farmer', 'admin', 'user'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Only customers/farmers can review products.' });
  }
  const ratingNum = parseFloat(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
  }
  try {
    // Verify user has a delivered order for this product
    const orderQuery = {
      userId: req.user.id,
      status: 'Delivered',
      $or: [
        { 'items.id': req.params.id }
      ]
    };

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const objId = new mongoose.Types.ObjectId(req.params.id);
      orderQuery.$or.push({ 'items.id': objId });
      orderQuery.$or.push({ 'items._id': objId });
      orderQuery.$or.push({ 'items._id': req.params.id });
    }

    const hasDeliveredOrder = await Order.findOne(orderQuery);

    if (!hasDeliveredOrder) {
      return res.status(403).json({ message: 'You can only review products that have been successfully delivered to you.' });
    }

    const product = mongoose.Types.ObjectId.isValid(req.params.id) ? await Product.findById(req.params.id) : null;
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.reviews) {
      product.reviews = [];
    }

    const existingReviewIndex = product.reviews.findIndex(
      r => r.userId && r.userId.toString() === req.user.id.toString()
    );

    if (existingReviewIndex > -1) {
      product.reviews[existingReviewIndex].rating = ratingNum;
      product.reviews[existingReviewIndex].comment = comment || '';
      product.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      product.reviews.push({
        userId: req.user.id,
        userName: req.user.username || 'Farmer Customer',
        rating: ratingNum,
        comment: comment || ''
      });
    }

    const totalRatings = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = parseFloat((totalRatings / product.reviews.length).toFixed(1));

    await product.save();
    res.json({ message: 'Review and rating submitted successfully!', rating: product.rating, reviews: product.reviews });
  } catch (err) {
    console.error('Error posting review:', err);
    res.status(500).json({ message: 'Failed to submit review', error: err.message });
  }
});

module.exports = router;
