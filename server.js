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
import { displayOrdersFromDatabase } from './controllers/homeController.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

/* ROUTES */
// Home
app.get('/', async (req, res) => {
  displayOrdersFromDatabase(req, res);
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

// Legal notice
app.get('/legal', (req, res) => {
  res.render('legal');
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
