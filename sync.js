const { sequelize, initDb } = require('./models');

async function syncDatabase() {
  try {
    console.log('Проверка подключения к бд');
    await sequelize.authenticate();
    console.log('Подключение успешно');
    
    console.log('Создание таблиц');
    await initDb();
    console.log('Все таблицы успешно созданы');
    await sequelize.close();
  } catch (error) {
    console.error('Ошибка:', error);
  }
}
syncDatabase();