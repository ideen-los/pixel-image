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
import { notFoundHandler } from './controllers/404Controller.js';

/* IMPORT .ENV */
dotenv.config();

/* INITIALIZE EXPRESS APPLICATION WITH ESSENTIAL MIDDLEWARE: */
// Parses JSON request bodies
// Parses URL-encoded request bodies (e.g. from form submissions)
// Serves static assets from the 'public' directory
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/* DEFINE EJS AS RENDER ENGINE */
app.set('view engine', 'ejs');

/* ROUTES */
// Home
app.get('/', async (req, res) => {
  displayOrdersFromDatabase(req, res);
});

// Donation route: redirect to PayPal or Stripe payment pages
app.post('/donate', async (req, res) => {
  if (req.body.paymentMethod === 'paypal') {
    await createPaypalOrder(req, res);
  } else if (req.body.paymentMethod === 'stripe') {
    await createStripeSession(req, res);
  } else {
    let errorTitle = 'Fehler';
    let errorText = 'Zahlungsart nicht erlaubt.';
    return res.render('error', { errorTitle, errorText });
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

// 404 Errors
app.use(notFoundHandler);

/* SYNC THE DATABASE */
sequelize
  .sync()
  .then(() => {
    console.log('Database synchronized');
    app.listen(3000, () => console.log('Server started on port 3300'));
  })
  .catch((error) => {
    console.error('Failed to synchronize database: ', error);
  });
