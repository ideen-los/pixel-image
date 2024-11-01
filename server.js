import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import sequelize from './db.js';
import { capturePayment, createOrder } from './services/paypal.js';
import { error } from 'console';
import Order from './models/Order.js';

const __filename = fileURLToPath(import.meta.url);

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

/* ROUTES */
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/pay', async (req, res) => {
  try {
    const name = req.body.name; // name of the donor
    const amount = parseFloat(req.body.amount); // Convert the donation amount to a number
    const positiveAmount = Math.abs(amount); // If the value is negative, convert it to positive
    const truncatedAmount = Math.trunc(positiveAmount); // If the vlue is a decimal, truncate it
    console.log('req.body:', req.body);
    console.log(truncatedAmount);

    if (!truncatedAmount || truncatedAmount == 0 || truncatedAmount == '') {
      res.redirect('/');
      return;
    } else {
      const result = await createOrder(truncatedAmount);
      const url = result.url;
      const id = result.id;

      // Temporaily save donor data in the database
      const newOrder = await Order.create({
        name,
        amount: truncatedAmount,
        paypalOrderId: id,
        status: 'pending',
      });
      if (!url) {
        throw new Error('Approval URL not found');
      }
      res.redirect(url);
    }
  } catch (error) {
    console.error('Error in /pay route:', error);
    res
      .status(500)
      .send(
        'An error occurred while processing your payment. Please try again later.'
      );
  }
});

app.get('/complete', async (req, res) => {
  try {
    const paymentData = await capturePayment(req.query.token);
    console.log(paymentData);

    // Get the order id
    const id = paymentData.id;
    // Store the donation amount in a variable
    const donationAmount = Math.trunc(
      paymentData.purchase_units[0].payments.captures[0].amount.value
    );
    const donationCurrency =
      paymentData.purchase_units[0].payments.captures[0].amount.currency_code;

    // 1. Find the order (donation) in the database
    const order = await Order.findOne({
      where: { paypalOrderId: id },
    });

    if (!order) {
      console.log('Order not found!');
    } else {
      // 2. Update the order status from 'pending' to 'complete'
      order.status = 'completed';
      await order.save();
      console.log('Order updated!');
    }

    res.render('donationSuccess', { donationAmount, donationCurrency });
  } catch (error) {
    res.send('Error: ' + error);
  }
});

app.get('/cancel', (req, res) => {
  res.redirect('/');
});

// Sync the database
sequelize
  .sync()
  .then(() => {
    console.log('Database synchronized');
    app.listen(3000, () => console.log('Server started on port 3000'));
  })
  .catch((error) => {
    console.error('Failed to synchronize database: ', error);
  });
