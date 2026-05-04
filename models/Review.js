const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },

  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  }
});

module.exports = Review;