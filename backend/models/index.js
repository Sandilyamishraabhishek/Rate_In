const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite for simple development
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false
});

const User = require('./User')(sequelize, DataTypes);
const Store = require('./Store')(sequelize, DataTypes);
const Rating = require('./Rating')(sequelize, DataTypes);

// Associations
// A Store belongs to an Owner (User)
User.hasMany(Store, { foreignKey: 'ownerId' });
Store.belongsTo(User, { as: 'Owner', foreignKey: 'ownerId' });

// A User can submit many Ratings
User.hasMany(Rating, { foreignKey: 'userId' });
Rating.belongsTo(User, { foreignKey: 'userId' });

// A Store has many Ratings
Store.hasMany(Rating, { foreignKey: 'storeId' });
Rating.belongsTo(Store, { foreignKey: 'storeId' });

module.exports = {
  sequelize,
  User,
  Store,
  Rating
};
