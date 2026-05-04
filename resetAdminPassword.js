const bcrypt = require('bcrypt');
const { sequelize, User } = require('./models');

async function resetAdminPassword() {
  try {
    await sequelize.authenticate();

    const admin = await User.findOne({
      where: { login: 'admin' }
    });

    if (!admin) {
      console.log('Пользователь admin не найден');
      return;
    }

    const passwordHash = await bcrypt.hash('admin', 10);

    admin.passwordHash = passwordHash;
    admin.role = 'admin';

    await admin.save();

    console.log('Пароль admin успешно сброшен на: admin');
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword();