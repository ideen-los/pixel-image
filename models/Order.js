import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Order = sequelize.define('Order', {
  name: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['paypal', 'stripe']], // Enforce allowed values
    },
  },
  orderId: { type: DataTypes.STRING, unique: true },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
});

export default Order;
