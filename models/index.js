const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = require('./User');
const Review = require('./Review');
const Request = require('./Request');
const CustomerOrder = require('./CustomerOrder');

User.hasOne(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Request, { foreignKey: 'userId' });
Request.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CustomerOrder, { foreignKey: 'userId' });
CustomerOrder.belongsTo(User, { foreignKey: 'userId' });

async function initDb() {
  await sequelize.sync();

  const adminLogin = 'admin';
  const adminPass = 'admin';

  const exists = await User.findOne({ where: { login: adminLogin } });

  if (!exists) {
    const passwordHash = await bcrypt.hash(adminPass, 10);

    await User.create({
      login: adminLogin,
      passwordHash,
      role: 'admin'
    });

    console.log('Admin: admin/admin');
  }
}

module.exports = {
  sequelize,
  User,
  Review,
  Request,
  CustomerOrder,
  initDb
};