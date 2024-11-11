import dotenv from 'dotenv';
import express from 'express';
import sequelize from './db.js';
import {
  capturePaypalPayment,
  createPaypalOrder,
} from './controllers/paypalController.js';
import {
  createStripeSession,
  retrieveStripePayment,
} from './controllers/stripeController.js';
import Order from './models/Order.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

/* ROUTES */
// Home
app.get('/', async (req, res) => {
  try {
    const orders = await Order.findAll({
      attributes: ['name', 'amount', 'updatedAt'],
      where: {
        status: 'completed', // Fetch only orders with the status 'completed'
      },
      order: [['amount', 'DESC']],
      raw: true,
    });

    // Get the number of completed orders
    const numberOfOrders = await Order.count({
      where: {
        status: 'completed',
      },
    });

    // Get the number of pixels that are already revealed
    const pixelsToReveal = await Order.sum('amount', {
      where: {
        status: 'completed',
      },
    });

    // Format the date
    const formattedOrders = orders.map((order) => {
      const formattedDate = new Intl.DateTimeFormat('de-DE').format(
        new Date(order.updatedAt)
      );

      let formattedName;

      if (order.name.length > 100) {
        let truncatedName = order.name.substring(0, 2);
        formattedName = truncatedName + '...';
      } else {
        formattedName = order.name;
      }

      return {
        ...order,
        name: formattedName,
        formattedUpdatedAt: formattedDate,
      };
    });

    res.render('index', {
      pixelsToReveal,
      numberOfOrders,
      orders: formattedOrders,
    });
  } catch (error) {
    console.log('Unable to load orders: ', error);
  }
});

app.post('/donate', async (req, res) => {
  if (req.body.paymentMethod === 'paypal') {
    await createPaypalOrder(req, res);
  } else if (req.body.paymentMethod === 'stripe') {
    await createStripeSession(req, res);
  } else {
    res.send('Fehler: Keine Zahlungsart ausgewählt.');
  }
});

// PayPal
app.post('/pay-paypal', createPaypalOrder);
app.get('/complete-paypal', capturePaypalPayment);

// Stripe
app.post('/pay-stripe', createStripeSession);
app.get('/complete-stripe', retrieveStripePayment);

// If any order is canceled
app.get('/cancel', (req, res) => {
  res.redirect('/');
});

/* Sync the database */
sequelize
  .sync()
  .then(() => {
    console.log('Database synchronized');
    app.listen(3000, () => console.log('Server started on port 3000'));
  })
  .catch((error) => {
    console.error('Failed to synchronize database: ', error);
  });
