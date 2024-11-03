import Order from '../models/Order.js';
import { createSession, stripe } from '../services/stripe.js';
import dotenv from 'dotenv';

dotenv.config();

// Creates a Stripe session
export const createStripeSession = async (req, res) => {
  try {
    const name = req.body.name; // name of the donor
    const amount = parseFloat(req.body.amount); // Convert the donation amount to a number
    const positiveAmount = Math.abs(amount); // If the value is negative, convert it to positive
    const truncatedAmount = Math.trunc(positiveAmount); // If the value is a decimal, truncate it

    if (!truncatedAmount || truncatedAmount == 0 || truncatedAmount == '') {
      res.redirect('/');
      return;
    } else {
      const session = await createSession(truncatedAmount);
      const url = session.url;
      const id = session.id;

      // Save donor data in the database
      const newOrder = await Order.create({
        name,
        amount: truncatedAmount,
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
    res
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
    return res.status(400).send('Session ID is missing.');
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
        console.log('Order updated to "completed"!');
      }

      res.render('donationSuccess', { donationAmount, donationCurrency });
    } else {
      // Payment not completed
      res.send('Payment not completed. Please try again.');
    }
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    res.status(500).send('Internal Server Error');
  }
};
