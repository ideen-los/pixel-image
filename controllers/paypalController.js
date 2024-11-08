import { capturePayment, createOrder } from '../services/paypal.js';
import Order from '../models/Order.js';
import dotenv from 'dotenv';

dotenv.config();

// Creates a PayPal order
export const createPaypalOrder = async (req, res) => {
  try {
    const name = req.body.name; // name of the donor
    const amount = parseFloat(req.body.amount); // Convert the donation amount to a number
    console.log('req.body.amount: ', amount);
    const positiveAmount = Math.abs(amount); // If the value is negative, convert it to positive
    const truncatedAmount = Math.trunc(positiveAmount); // If the value is a decimal, truncate it
    console.log('req.body:', req.body);

    if (!truncatedAmount || truncatedAmount == 0 || truncatedAmount == '') {
      res.redirect('/');
      return;
    } else {
      const result = await createOrder(truncatedAmount);
      const url = result.url;
      const id = result.id;

      // Save donor data in the database
      const newOrder = await Order.create({
        name,
        amount: truncatedAmount,
        paymentMethod: 'paypal',
        orderId: id,
        status: 'pending',
      });

      if (!url) {
        throw new Error('Approval URL not found');
      }
      res.redirect(url);
    }
  } catch (error) {
    console.error('Error in /donate route:', error);
    res
      .status(500)
      .send(
        'An error occurred while processing your payment. Please try again later.'
      );
  }
};

// Captures a PayPal order
export const capturePaypalPayment = async (req, res) => {
  try {
    const paymentData = await capturePayment(req.query.token);
    console.log('paypal payment data:', paymentData);

    // Get the order id
    const id = paymentData.id;
    // Store the donation amount in a variable
    const donationAmount = Math.trunc(
      paymentData.purchase_units[0].payments.captures[0].amount.value
    );
    const donationCurrency =
      paymentData.purchase_units[0].payments.captures[0].amount.currency_code;

    if (paymentData.status === 'COMPLETED') {
      // 1. Find the order (donation) in the database
      const order = await Order.findOne({
        where: { paymentMethod: 'paypal', orderId: id },
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
    res.send('Error: ' + error);
  }
};
