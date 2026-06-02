const express = require('express');
const { Op } = require('sequelize');
const { Store, Rating, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get all stores (Normal Users, Admins, Store Owners can view)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const stores = await Store.findAll({
      where: whereClause,
      include: [
        { model: Rating }
      ]
    });

    const storesWithRatings = stores.map(store => {
      const storeJSON = store.toJSON();
      const ratings = storeJSON.Ratings;
      const overallRating = ratings.length ? ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length : 0;
      
      // Find rating submitted by current user
      const userRating = ratings.find(r => r.userId === req.user.id);

      return {
        ...storeJSON,
        overallRating,
        userSubmittedRating: userRating ? userRating.score : null,
        userRatingId: userRating ? userRating.id : null
      };
    });

    res.json(storesWithRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Store Owner specific routes: View dashboard/users who rated their store
router.get('/my-store/ratings', async (req, res) => {
  if (req.user.role !== 'Store Owner') return res.status(403).json({ error: 'Forbidden' });

  try {
    const store = await Store.findOne({ where: { ownerId: req.user.id } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found for this owner.' });
    }

    const ratings = await Rating.findAll({
      where: { storeId: store.id },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    const averageRating = ratings.length ? ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length : 0;

    res.json({ averageRating, ratings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
