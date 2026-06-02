module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
      validate: {
        len: [20, 60]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(400),
      allowNull: true,
      validate: {
        len: [0, 400]
      }
    },
    role: {
      type: DataTypes.ENUM('System Administrator', 'Normal User', 'Store Owner'),
      allowNull: false,
      defaultValue: 'Normal User'
    }
  });

  return User;
};
