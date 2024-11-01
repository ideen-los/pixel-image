import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

sequelize
  .authenticate()
  .then(() => console.log('Connected to SQLite database'))
  .catch((error) => console.error('Unable to connect:', error));

export default sequelize;
