import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY, {
  apiVersion: '2024-10-28.acacia',
});

export const createSession = async function (amount) {
  const amountInCents = amount * 100;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'sofort', 'giropay'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'PRO EQUIS e.V. Spende',
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    success_url:
      process.env.BASE_URL +
      '/complete-stripe?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: process.env.BASE_URL + '/cancel',
  });

  return session;
};
