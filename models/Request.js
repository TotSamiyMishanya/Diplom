const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Request = sequelize.define('Request', {
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },

  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'excursion'
  },

  customType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '-'
  },

  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'new'
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Request;