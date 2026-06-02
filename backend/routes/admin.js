const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Store, Rating } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['System Administrator']));

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStores = await Store.count();
    const totalRatings = await Rating.count();

    res.json({ totalUsers, totalStores, totalRatings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create User (Admin or Normal User from Admin Panel)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ error: 'Name must be between 20 and 60 characters.' });
    }
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (address && address.length > 400) {
      return res.status(400).json({ error: 'Address must be a maximum of 400 characters.' });
    }

    if (password.length < 8 || password.length > 16 || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'Password must be 8-16 chars, contain 1 uppercase and 1 special character.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      address,
      role: role || 'Normal User'
    });

    res.status(201).json({ message: 'User created successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'address', 'role']
    });
    // For Store Owners, we also need their Rating, but rating is per store. 
    // Wait, the requirements say: "If the user is a Store Owner, their Rating should also be displayed."
    // Since a store owner can have a store, and that store has an average rating, let's include stores with ratings.
    const usersWithRatings = await Promise.all(users.map(async (u) => {
      const userJSON = u.toJSON();
      if (userJSON.role === 'Store Owner') {
        const store = await Store.findOne({ where: { ownerId: userJSON.id }, include: [Rating] });
        if (store) {
          const ratings = store.Ratings;
          const avg = ratings.length ? ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length : 0;
          userJSON.storeRating = avg;
        }
      }
      return userJSON;
    }));

    res.json(usersWithRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Store
router.post('/stores', async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;
    
    // Check if owner exists and is Store Owner
    const owner = await User.findByPk(ownerId);
    if (!owner || owner.role !== 'Store Owner') {
      return res.status(400).json({ error: 'Invalid owner ID or user is not a Store Owner.' });
    }

    const store = await Store.create({ name, email, address, ownerId });
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
