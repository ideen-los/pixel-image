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

    // Get the sum of all orders
    // equals the number of pixels to reveal
    const pixelsToReveal = await Order.sum('amount', {
      where: {
        status: 'completed',
      },
    });

    let cappedPixelsToReveal;
    if (pixelsToReveal > 1000000) {
      cappedPixelsToReveal = 1000000;
    } else {
      cappedPixelsToReveal = pixelsToReveal;
    }

    // Format name of the donor, date of the order and the amount
    const formattedOrders = orders.map((order) => {
      let formattedName;
      let formattedAmount;
      let formattedDate;

      // Add 1000 separator to the donation amount
      formattedAmount = order.amount.toLocaleString('de-DE');

      // Truncate the name of the donor
      if (order.name.length > 100) {
        let truncatedName = order.name.substring(0, 2);
        formattedName = truncatedName + '...';
      } else {
        formattedName = order.name;
      }

      // Format the date of the order
      formattedDate = new Intl.DateTimeFormat('de-DE').format(
        new Date(order.updatedAt)
      );

      return {
        ...order,
        formattedAmount,
        name: formattedName,
        formattedUpdatedAt: formattedDate,
      };
    });

    res.render('index', {
      cappedPixelsToReveal,
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
