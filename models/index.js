const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = require('./User');
const ExcursionRequest = require('./ExcursionRequest');
const Review = require('./Review');

const { DataTypes } = require('sequelize');

const Product = sequelize.define('Product', {
  name: DataTypes.STRING
});

const Order = sequelize.define('Order', {
  status: { type: DataTypes.STRING, defaultValue: 'new' }
});

const OrderItem = sequelize.define('OrderItem', {
  qty: { type: DataTypes.INTEGER, defaultValue: 1 }
});


User.hasMany(ExcursionRequest, { foreignKey: 'userId' });
ExcursionRequest.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

async function initDb() {
  await sequelize.sync();

  const adminLogin = 'admin';
  const adminPass = 'admin';

  const exists = await User.findOne({ where: { login: adminLogin } });
  if (!exists) {
    const passwordHash = await bcrypt.hash(adminPass, 10);
    await User.create({ login: adminLogin, passwordHash, role: 'admin' });
    console.log('Admin: admin/admin');
  }
}

module.exports = {
  sequelize,
  User,
  ExcursionRequest,
  Review,
  Product,
  Order,
  OrderItem,
  initDb
};