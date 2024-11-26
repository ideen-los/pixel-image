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
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import lusca from 'lusca';
import { createRequire } from 'module';

/* IMPORT .ENV */
dotenv.config();

/* INITIALIZE EXPRESS APPLICATION */
const app = express();

/* TRUST FIRST PROXY */
app.set('trust proxy', 1);

/* SECURITY MIDDLEWARE */
// Disable 'X-Powered-By' header (gives away information about server config)
app.disable('x-powered-by');
// Use helmet to secure Express headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'form-action': [
          "'self'",
          'https://checkout.stripe.com',
          process.env.NODE_ENV === 'production'
            ? 'https://www.paypal.com'
            : 'https://www.sandbox.paypal.com',
        ],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'connect-src': ["'self'"],
      },
    },
  })
);

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

/* LOAD OTHER ESSENTIAL MIDDLEWARE */
// Parse JSON request bodies
app.use(express.json());
// ParsesURL-encoded request bodies (e.g. from form submissions)
app.use(express.urlencoded({ extended: true }));

/* SETUP COOKIE PARSER FOR CSRF */
app.use(cookieParser());

/* CREATE A REQUIRE FUNCTION TO IMPORT SQLITESTORE MODULE */
const require = createRequire(import.meta.url);
const SQLiteStore = require('connect-sqlite3')(session);

/* SETUP SESSION MANAGEMENT WITH SQLITE */
app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.sqlite', // Path to SQLite database file for sessions
      dir: './', // Directory where session DB will be stored
      // You can set additional options here
    }),
    secret: process.env.SESSION_SECRET, // Ensure this is set in your .env as a strong, unique string
    resave: false, // Prevents session from being saved back to the session store if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      httpOnly: true, // Mitigates risk of client side script accessing the protected cookie
      secure: false, // Ensures the browser only sends the cookie over HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);

/* SETUP CSRF PROTECTION */
app.use(
  lusca({
    csrf: {
      key: '_csrf',
      secret: process.env.CSRF_SECRET,
    },
    xframe: 'SAMEORIGIN',
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    xssProtection: true,
  })
);

/* CSFR Logging Middleware */
app.use((req, res, next) => {
  console.log('Incoming CSRF Token:', req.body._csrf);
  console.log('Session CSRF Token:', req.session.csrfToken);
  next();
});

/* SERVE STATIC ASSETS FROM THE 'public' DIRECTORY */
app.use(express.static('public', { index: false, dotfiles: 'ignore' }));

/* DEFINE EJS AS RENDER ENGINE */
app.set('view engine', 'ejs');

/* ROUTES */
// Pass CSRF token to views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

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

// Handle all unhandled errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    errorTitle: 'Server Error',
    errorText: 'Es ist ein unerwarteter Fehler aufgetreten.',
  });
});

/* SYNC THE DATABASE */
sequelize
  .sync()
  .then(() => {
    console.log('Database synchronized');
    app.listen(3000, () => console.log('Server started on port 3000'));
  })
  .catch((error) => {
    console.error('Failed to synchronize database: ', error);
  });
