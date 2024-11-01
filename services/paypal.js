import axios from 'axios';

/* Creates a Paypal Access Token */
export const generateAccessToken = async () => {
  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
    method: 'post',
    data: 'grant_type=client_credentials',
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_CLIENT_SECRET,
    },
  });

  console.log(response.data);
  return response.data.access_token;
};

/* Creates a Paypal Order */
export const createOrder = async function (amount) {
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
                value: amount,
              },
            },
          ],

          amount: {
            currency_code: 'EUR',
            value: amount,
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: amount,
              },
            },
          },
        },
      ],

      application_context: {
        brand_name: 'PRO EQUIS e.V.',
        return_url: process.env.BASE_URL + '/complete',
        cancel_url: process.env.BASE_URL + '/cancel',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    },
  });

  console.log('CreateOrder data:', response.data);
  return {
    url: response.data.links.find((link) => link.rel === 'approve').href,
    id: response.data.id,
  };
};

/* Captures a created order (transfers payment to merchant account) */
export const capturePayment = async function (orderId) {
  try {
    const accessToken = await generateAccessToken();
    console.log('Access Token:', accessToken); // For debugging

    const response = await axios({
      url:
        process.env.PAYPAL_BASE_URL + `/v2/checkout/orders/${orderId}/capture`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error('Axios Error Response:', error.response.data);
      throw new Error(JSON.stringify(error.response.data));
    } else if (error.request) {
      // No response received
      console.error('Axios No Response:', error.request);
      throw new Error('No response received from PayPal API');
    } else {
      // Error setting up the request
      console.error('Axios Error:', error.message);
      throw new Error(error.message);
    }
  }
};
