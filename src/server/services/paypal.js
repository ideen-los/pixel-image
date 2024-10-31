import axios from 'axios';

export const generateAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  try {
    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      data: 'grant_type=client_credentials',
    });

    const accessToken = response.data.access_token;
    console.log('Access Token Generated:', accessToken); // For debugging
    return accessToken;
  } catch (error) {
    if (error.response) {
      console.error('Error generating access token:', error.response.data);
    } else if (error.request) {
      console.error(
        'No response received while generating access token:',
        error.request
      );
    } else {
      console.error('Error setting up access token request:', error.message);
    }
    throw error;
  }
};

export const createOrder = async function () {
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

  return response.data.links.find((link) => link.rel === 'approve').href;
};

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

    console.log('Capture Payment Response:', response.data);
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
