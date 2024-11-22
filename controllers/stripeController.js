import Order from '../models/Order.js';
import { getAndSanitizeFormData } from '../services/getFormData.js';
import { createSession, stripe } from '../services/stripe.js';
import dotenv from 'dotenv';

dotenv.config();

// Creates a Stripe session
export const createStripeSession = async (req, res) => {
  try {
    const { donorName, donorEmail, donationAmount } = getAndSanitizeFormData(
      req,
      res
    );

    if (!donationAmount || donationAmount == 0 || donationAmount == '') {
      return res.redirect('/');
    } else {
      const session = await createSession(donationAmount);
      const url = session.url;
      const id = session.id;

      // Save donor data in the database
      const newOrder = await Order.create({
        name: donorName,
        email: donorEmail,
        amount: donationAmount,
        paymentMethod: 'stripe',
        orderId: id,
        status: 'pending',
      });

      if (!url) {
        throw new Error('Approval URL not found');
      }
      res.redirect(url);
    }
  } catch (error) {
    console.error('Error in /pay-stripe route:', error);

    return res
      .status(500)
      .send(
        'An error occurred while processing your payment. Please try again later.'
      );
  }
};

// Captures a Stripe payment
export const retrieveStripePayment = async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    console.error('Stripe session ID not found.');
    let errorTitle = '400 Bad Request';
    let errorText =
      'Diese Seite funktioniert nur, wenn Sie direkt nach der Zahlung von Stripe hierher weitergeleitet werden.';
    return res.status(400).render('error', { errorTitle, errorText });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Get the unique id from the session object
    const id = session.id;
    // Store the donation amount in a variable
    const donationAmount = Math.trunc(session.amount_total / 100);
    const donationCurrency = session.currency.toUpperCase();

    console.log('Session data: ', session);

    // Check the payment status
    if (session.payment_status === 'paid') {
      // 1. Find the order (donation) in the database
      const order = await Order.findOne({
        where: { paymentMethod: 'stripe', orderId: id },
      });

      if (!order) {
        console.log('Order not found!');
      } else {
        // 2. Update the order status from 'pending' to 'complete'
        order.status = 'completed';
        await order.save();
      }

      return res.render('donationSuccess', {
        order,
        donationAmount,
        donationCurrency,
      });
    } else {
      // Payment not completed
      return res.send('Payment not completed. Please try again.');
    }
  } catch (error) {
    console.error('Error while retrieving stripe seission ID: ', error);
    let errorTitle = '400 Bad Request';
    let errorText =
      'Diese Seite funktioniert nur, wenn Sie direkt nach der Zahlung von Stripe hierher weitergeleitet werden.';
    return res.status(400).render('error', { errorTitle, errorText });
  }
};
