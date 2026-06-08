const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerOrder = sequelize.define('CustomerOrder', {
  imagePath: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },

  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },

  orderDate: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },

  deliveryDate: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = CustomerOrder;