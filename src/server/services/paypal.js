import axios from 'axios';

export const generateAccessToken = async function generateAccessToken() {
  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
    method: 'post',
    data: 'grant_type=client_credentials',
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
  });

  return response.data.access_token;
};

export const createOrder = async function createOrder() {
  const accessToken = await generateAccessToken();

  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
    data: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: [
            {
              name: 'PRO EQUIS e.V. Spende',
              description: 'Spende für den Pferdeschutzverein PRO EQUIS',
              quantity: '1',
              unit_amount: {
                currency_code: 'EUR',
                value: '1',
              },
            },
          ],

          amount: {
            currency_code: 'EUR',
            value: '1',
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: '1',
              },
            },
          },
        },
      ],

      application_context: {
        brand_name: 'PRO EQUIS e.V.',
        return_url: process.env.BASE_URL + '/complete-order',
        cancel_url: process.env.BASE_URL + '/cancel-order',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    },
  });

  console.log(response.data);
  return response.data.links.find((link) => link.rel === 'approve').href;
};
