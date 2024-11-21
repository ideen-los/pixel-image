import sequelize from '../db.js';
import Order from '../models/Order.js';

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced successfully!');

    // Generate dates ranging from today to 5 days ago
    const today = new Date();
    const generateDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      return date;
    };

    const orders = [
      {
        name: 'User 1',
        email: 'User1@email.com',
        amount: 120,
        paymentMethod: 'paypal',
        orderId: 'ORD001',
        status: 'completed',
        createdAt: generateDate(0),
        updatedAt: generateDate(0),
      },
      {
        name: 'User 2',
        email: 'User2@email.com',
        amount: 250,
        paymentMethod: 'stripe',
        orderId: 'ORD002',
        status: 'completed',
        createdAt: generateDate(1),
        updatedAt: generateDate(1),
      },
      {
        name: 'User 3',
        amount: 300,
        paymentMethod: 'paypal',
        orderId: 'ORD003',
        status: 'completed',
        createdAt: generateDate(2),
        updatedAt: generateDate(2),
      },
      {
        name: 'User 4',
        email: 'User4email.com',
        amount: 180,
        paymentMethod: 'stripe',
        orderId: 'ORD004',
        status: 'completed',
        createdAt: generateDate(3),
        updatedAt: generateDate(3),
      },
      {
        name: 'User 5',
        amount: 400,
        paymentMethod: 'paypal',
        orderId: 'ORD005',
        status: 'completed',
        createdAt: generateDate(4),
        updatedAt: generateDate(4),
      },
      {
        name: 'User 6',
        email: 'User6@email.com',
        amount: 450,
        paymentMethod: 'stripe',
        orderId: 'ORD006',
        status: 'completed',
        createdAt: generateDate(260),
        updatedAt: generateDate(260),
      },
      {
        name: 'User 7',
        email: 'User7@email.com',
        amount: 1000,
        paymentMethod: 'paypal',
        orderId: 'ORD007',
        status: 'completed',
        createdAt: generateDate(7),
        updatedAt: generateDate(7),
      },
    ];

    await Order.bulkCreate(orders);
    console.log('Dummy data inserted!');

    const allOrders = await Order.findAll();
    console.log(
      'Inserted Orders:',
      allOrders.map((order) => order.toJSON())
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
})();
