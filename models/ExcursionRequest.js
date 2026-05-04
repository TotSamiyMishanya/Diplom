const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExcursionRequest = sequelize.define('ExcursionRequest', {
  fullName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  preferredDate: { type: DataTypes.STRING, allowNull: false }, 
  comment: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'new' } 
});

module.exports = ExcursionRequest;