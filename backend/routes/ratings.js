const express = require('express');
const { Rating, Store } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Submit a new rating
router.post('/', async (req, res) => {
  try {
    const { storeId, score } = req.body;

    if (score < 1 || score > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user already rated this store
    const existingRating = await Rating.findOne({ where: { userId: req.user.id, storeId } });
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this store. Please modify your existing rating.' });
    }

    const rating = await Rating.create({
      score,
      userId: req.user.id,
      storeId
    });

    res.status(201).json(rating);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Modify an existing rating
router.put('/:id', async (req, res) => {
  try {
    const { score } = req.body;
    
    if (score < 1 || score > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const rating = await Rating.findOne({ where: { id: req.params.id, userId: req.user.id } });
    
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found or you do not have permission to modify it.' });
    }

    rating.score = score;
    await rating.save();

    res.json(rating);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
